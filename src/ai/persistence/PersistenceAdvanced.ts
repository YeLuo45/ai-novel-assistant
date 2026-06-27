/**
 * ai/persistence/PersistenceAdvanced.ts (K16-K25) - 10 engines
 *
 * - K16 StreamingPersist: 流式持久化
 * - K17 BatchWriter: 批量写入
 * - K18 CloudStorage: 云存储抽象
 * - K19 IndexedDBAdapter: IDB 适配器
 * - K20 DexieSchema: Dexie schema
 * - K21 PersistenceHook: 持久化 hook
 * - K22 AutoRestore: 自动恢复
 * - K23 MultiDeviceSync: 多设备同步
 * - K24 CRDT: 无冲突复制
 * - K25 OperationalTransform: 操作转换
 */

import { Checksum } from './Persistence'

// =============================================================================
// K18: CloudStorage
// =============================================================================

export type StorageProvider = 'local' | 's3' | 'gcs' | 'azure' | 'github' | 'webdav'

export interface CloudFile {
  path: string
  content: string
  lastModified: number
  size: number
  checksum: string
}

export class CloudStorage {
  private _files: Map<string, CloudFile> = new Map()
  private _provider: StorageProvider
  private _checksum = new Checksum()

  constructor(provider: StorageProvider = 'local') {
    this._provider = provider
  }

  upload(path: string, content: string): CloudFile {
    const file: CloudFile = {
      path,
      content,
      lastModified: Date.now(),
      size: content.length,
      checksum: this._checksum.compute(content),
    }
    this._files.set(path, file)
    return file
  }

  download(path: string): CloudFile | null {
    return this._files.get(path) ?? null
  }

  delete(path: string): boolean {
    return this._files.delete(path)
  }

  list(prefix?: string): CloudFile[] {
    const all = Array.from(this._files.values())
    return prefix ? all.filter(f => f.path.startsWith(prefix)) : all
  }

  verify(path: string): boolean {
    const f = this._files.get(path)
    if (!f) return false
    return this._checksum.verify(f.content, f.checksum)
  }

  get provider(): StorageProvider {
    return this._provider
  }
}

// =============================================================================
// K19: IndexedDBAdapter
// =============================================================================

export interface IDBRecord {
  key: string
  value: unknown
  updatedAt: number
}

export class IndexedDBAdapter {
  private _store: Map<string, IDBRecord> = new Map()

  put(key: string, value: unknown): void {
    this._store.set(key, { key, value, updatedAt: Date.now() })
  }

  get(key: string): IDBRecord | null {
    return this._store.get(key) ?? null
  }

  delete(key: string): boolean {
    return this._store.delete(key)
  }

  list(): IDBRecord[] {
    return Array.from(this._store.values())
  }

  clear(): void {
    this._store.clear()
  }

  count(): number {
    return this._store.size
  }

  has(key: string): boolean {
    return this._store.has(key)
  }
}

// =============================================================================
// K20: DexieSchema
// =============================================================================

export interface DexieTableSpec {
  name: string
  primaryKey: string
  indexes: string[]
}

export class DexieSchema {
  private _tables: Map<string, DexieTableSpec> = new Map()
  private _version: number = 1

  addTable(spec: DexieTableSpec): void {
    this._tables.set(spec.name, spec)
  }

  removeTable(name: string): boolean {
    return this._tables.delete(name)
  }

  get(name: string): DexieTableSpec | undefined {
    return this._tables.get(name)
  }

  tables(): DexieTableSpec[] {
    return Array.from(this._tables.values())
  }

  bumpVersion(): void {
    this._version += 1
  }

  get version(): number {
    return this._version
  }

  /** 生成 Dexie schema 字符串 */
  toDexieString(): string {
    return `db.version(${this._version}).stores({\n` +
      this.tables().map(t => {
        const indexes = [t.primaryKey, ...t.indexes].join(', ')
        return `  ${t.name}: '${indexes}'`
      }).join(',\n') +
      '\n})'
  }
}

// =============================================================================
// K17: BatchWriter
// =============================================================================

export interface BatchWrite {
  id: string
  payload: unknown
  retries: number
}

export class BatchWriter {
  private _queue: BatchWrite[] = []
  private _flushed: BatchWrite[] = []
  private _batchSize: number
  private _flushIntervalMs: number
  private _onFlush: (batch: BatchWrite[]) => Promise<void> | void
  private _intervalId: ReturnType<typeof setInterval> | null = null

  constructor(options: { batchSize: number; flushIntervalMs: number; onFlush: (batch: BatchWrite[]) => Promise<void> | void }) {
    this._batchSize = options.batchSize
    this._flushIntervalMs = options.flushIntervalMs
    this._onFlush = options.onFlush
  }

  enqueue(payload: unknown): string {
    const id = `bw_${this._queue.length + 1}`
    this._queue.push({ id, payload, retries: 0 })
    return id
  }

  async startAutoFlush(): Promise<void> {
    if (this._intervalId !== null) return
    this._intervalId = setInterval(() => {
      if (this._queue.length >= this._batchSize) {
        void this.flush()
      }
    }, this._flushIntervalMs)
  }

  stopAutoFlush(): void {
    if (this._intervalId !== null) {
      clearInterval(this._intervalId)
      this._intervalId = null
    }
  }

  async flush(): Promise<{ flushed: number }> {
    if (this._queue.length === 0) return { flushed: 0 }
    const batch = this._queue.splice(0, this._batchSize)
    try {
      await this._onFlush(batch)
      this._flushed.push(...batch)
      return { flushed: batch.length }
    } catch {
      for (const b of batch) b.retries += 1
      this._queue.unshift(...batch)
      return { flushed: 0 }
    }
  }

  queueSize(): number {
    return this._queue.length
  }

  flushedCount(): number {
    return this._flushed.length
  }
}

// =============================================================================
// K16: StreamingPersist
// =============================================================================

export interface StreamChunk {
  index: number
  data: string
  isLast: boolean
}

export class StreamingPersist {
  private _chunks: StreamChunk[] = []
  private _buffer: string = ''

  push(data: string, isLast: boolean = false): StreamChunk {
    const c: StreamChunk = { index: this._chunks.length, data, isLast }
    this._chunks.push(c)
    this._buffer += data
    return c
  }

  assemble(): string {
    return this._buffer
  }

  chunks(): StreamChunk[] {
    return [...this._chunks]
  }

  reset(): void {
    this._chunks = []
    this._buffer = ''
  }

  size(): number {
    return this._chunks.length
  }
}

// =============================================================================
// K21: PersistenceHook
// =============================================================================

export type PersistenceHookEvent = 'before-save' | 'after-save' | 'before-load' | 'after-load' | 'before-delete' | 'after-delete' | 'error'

export interface PersistenceHookData {
  path: string
  size?: number
  durationMs?: number
  error?: string
}

export class PersistenceHookEmitter {
  private _hooks: Map<PersistenceHookEvent, Array<(data: PersistenceHookData) => void>> = new Map()

  on(event: PersistenceHookEvent, handler: (data: PersistenceHookData) => void): () => void {
    if (!this._hooks.has(event)) this._hooks.set(event, [])
    this._hooks.get(event)!.push(handler)
    return () => {
      const handlers = this._hooks.get(event)
      if (handlers) this._hooks.set(event, handlers.filter(h => h !== handler))
    }
  }

  emit(event: PersistenceHookEvent, data: PersistenceHookData): void {
    for (const h of this._hooks.get(event) ?? []) {
      try { h(data) } catch { /* swallow */ }
    }
  }
}

// =============================================================================
// K22: AutoRestore
// =============================================================================

export interface AutoRestoreConfig {
  checkIntervalMs: number
  maxAge: number
  onRestore: (data: unknown) => void
}

export class AutoRestore {
  private _config: AutoRestoreConfig
  private _lastCheck: number = 0
  private _intervalId: ReturnType<typeof setInterval> | null = null
  private _getCheckpoints: () => Array<{ timestamp: number; data: unknown }>

  constructor(config: AutoRestoreConfig, getCheckpoints: () => Array<{ timestamp: number; data: unknown }>) {
    this._config = config
    this._getCheckpoints = getCheckpoints
  }

  start(): void {
    if (this._intervalId !== null) return
    this._intervalId = setInterval(() => this._check(), this._config.checkIntervalMs)
  }

  stop(): void {
    if (this._intervalId !== null) {
      clearInterval(this._intervalId)
      this._intervalId = null
    }
  }

  private _check(): void {
    this._lastCheck = Date.now()
    const checkpoints = this._getCheckpoints()
    if (checkpoints.length === 0) return
    const latest = checkpoints[checkpoints.length - 1]
    if (Date.now() - latest.timestamp > this._config.maxAge) {
      this._config.onRestore(latest.data)
    }
  }
}

// =============================================================================
// K23: MultiDeviceSync
// =============================================================================

export interface DeviceInfo {
  deviceId: string
  deviceName: string
  lastSync: number
  pendingChanges: number
}

export class MultiDeviceSync {
  private _devices: Map<string, DeviceInfo> = new Map()
  private _syncedAt: number = 0

  registerDevice(info: DeviceInfo): void {
    this._devices.set(info.deviceId, info)
  }

  unregister(deviceId: string): boolean {
    return this._devices.delete(deviceId)
  }

  getDevice(deviceId: string): DeviceInfo | undefined {
    return this._devices.get(deviceId)
  }

  list(): DeviceInfo[] {
    return Array.from(this._devices.values())
  }

  /** 同步到 device（更新 lastSync） */
  syncToDevice(deviceId: string, changeCount: number): boolean {
    const d = this._devices.get(deviceId)
    if (!d) return false
    d.lastSync = Date.now()
    d.pendingChanges = changeCount
    this._syncedAt = Date.now()
    return true
  }

  get totalPending(): number {
    return Array.from(this._devices.values()).reduce((a, d) => a + d.pendingChanges, 0)
  }
}

// =============================================================================
// K24: CRDT (LWW - Last Write Wins)
// =============================================================================

export interface CRDTItem<T> {
  key: string
  value: T
  timestamp: number
  deviceId: string
}

export class CRDT<T = unknown> {
  private _items: Map<string, CRDTItem<T>> = new Map()
  private _deviceId: string

  constructor(deviceId: string) {
    this._deviceId = deviceId
  }

  set(key: string, value: T): void {
    this._items.set(key, { key, value, timestamp: Date.now(), deviceId: this._deviceId })
  }

  get(key: string): T | undefined {
    return this._items.get(key)?.value
  }

  /** 远程同步 — LWW 策略 */
  mergeRemote(remote: CRDTItem<T>): void {
    const local = this._items.get(remote.key)
    if (!local || remote.timestamp > local.timestamp) {
      this._items.set(remote.key, remote)
    }
  }

  /** 获取所有 items */
  items(): CRDTItem<T>[] {
    return Array.from(this._items.values())
  }

  /** 导出为可序列化 */
  export(): CRDTItem<T>[] {
    return this.items()
  }

  /** 从序列化恢复 */
  import(items: CRDTItem<T>[]): void {
    for (const item of items) this._items.set(item.key, item)
  }
}

// =============================================================================
// K25: OperationalTransform
// =============================================================================

export interface TextOp {
  type: 'insert' | 'delete' | 'retain'
  position: number
  chars?: string
  count?: number
}

export class OperationalTransform {
  /** 应用单个 op 到文本 */
  apply(text: string, op: TextOp): string {
    if (op.type === 'insert' && op.chars) {
      const pos = Math.min(op.position, text.length)
      return text.slice(0, pos) + op.chars + text.slice(pos)
    }
    if (op.type === 'delete' && op.count !== undefined) {
      const start = Math.min(op.position, text.length)
      const end = Math.min(start + op.count, text.length)
      return text.slice(0, start) + text.slice(end)
    }
    return text
  }

  /** 应用多个 ops */
  applyAll(text: string, ops: TextOp[]): string {
    let result = text
    for (const op of ops) result = this.apply(result, op)
    return result
  }

  /** 转换两个并发 op（让 op2 在 op1 应用后也能应用） */
  transform(op1: TextOp, op2: TextOp): TextOp {
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position <= op2.position) {
        return { ...op2, position: op2.position + (op1.chars?.length ?? 0) }
      }
    }
    if (op1.type === 'insert' && op2.type === 'delete') {
      if (op1.position <= op2.position) {
        return { ...op2, position: op2.position + (op1.chars?.length ?? 0) }
      }
    }
    if (op1.type === 'delete' && op2.type === 'insert') {
      if (op1.position < op2.position) {
        return { ...op2, position: op2.position - (op1.count ?? 0) }
      }
    }
    if (op1.type === 'delete' && op2.type === 'delete') {
      // 简化：不处理重叠
    }
    return op2
  }
}