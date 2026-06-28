/**
 * realtime/SyncAdvanced.ts (N11-N20) - 10 engines
 *
 * - N11 PresenceBroadcaster: 在线状态广播
 * - N12 CursorShare: 光标共享
 * - N13 SelectionSync: 选择同步
 * - N14 AwarenessProtocol: 共享感知
 * - N15 LatencyOptimizer: 延迟优化
 * - N16 OfflineQueue: 离线队列
 * - N17 ReconnectReplay: 重连回放
 * - N18 WireConflictResolver: 冲突解决（over wire）
 * - N19 PartialSync: 局部同步
 * - N20 BandwidthThrottle: 带宽节流
 */

import { CRDTItem, OperationQueue } from '../../ai/persistence/PersistenceAdvanced'

// =============================================================================
// N11: PresenceBroadcaster
// =============================================================================

export interface PresenceState {
  userId: string
  status: 'online' | 'away' | 'offline'
  currentLocation?: string
  lastSeen: number
}

export class PresenceBroadcaster {
  private _presences: Map<string, PresenceState> = new Map()
  private _subscribers: Set<(p: PresenceState) => void> = new Set()

  broadcast(state: PresenceState): void {
    this._presences.set(state.userId, state)
    for (const s of this._subscribers) {
      try { s(state) } catch { /* swallow */ }
    }
  }

  get(userId: string): PresenceState | undefined {
    return this._presences.get(userId)
  }

  online(): PresenceState[] {
    return Array.from(this._presences.values()).filter(p => p.status === 'online')
  }

  subscribe(fn: (p: PresenceState) => void): () => void {
    this._subscribers.add(fn)
    return () => this._subscribers.delete(fn)
  }

  list(): PresenceState[] {
    return Array.from(this._presences.values())
  }
}

// =============================================================================
// N12: CursorShare
// =============================================================================

export interface CursorPosition {
  userId: string
  x: number
  y: number
  page?: string
  timestamp: number
}

export class CursorShare {
  private _cursors: Map<string, CursorPosition> = new Map()
  private _maxAgeMs: number
  private _subscribers: Set<(c: CursorPosition) => void> = new Set()

  constructor(maxAgeMs: number = 5000) {
    this._maxAgeMs = maxAgeMs
  }

  update(userId: string, x: number, y: number, page?: string): CursorPosition {
    const c: CursorPosition = { userId, x, y, page, timestamp: Date.now() }
    this._cursors.set(userId, c)
    for (const s of this._subscribers) {
      try { s(c) } catch { /* swallow */ }
    }
    return c
  }

  get(userId: string): CursorPosition | undefined {
    const c = this._cursors.get(userId)
    if (!c) return undefined
    if (Date.now() - c.timestamp > this._maxAgeMs) {
      return undefined  // stale
    }
    return c
  }

  remove(userId: string): boolean {
    return this._cursors.delete(userId)
  }

  active(): CursorPosition[] {
    const now = Date.now()
    return Array.from(this._cursors.values()).filter(c => now - c.timestamp <= this._maxAgeMs)
  }

  subscribe(fn: (c: CursorPosition) => void): () => void {
    this._subscribers.add(fn)
    return () => this._subscribers.delete(fn)
  }
}

// =============================================================================
// N13: SelectionSync
// =============================================================================

export interface Selection {
  userId: string
  resourceType: 'chapter' | 'scene' | 'character' | 'tool'
  resourceId: string
  start: number
  end: number
  timestamp: number
}

export class SelectionSync {
  private _selections: Map<string, Selection> = new Map()

  set(sel: Selection): void {
    this._selections.set(sel.userId, sel)
  }

  get(userId: string): Selection | undefined {
    return this._selections.get(userId)
  }

  /** 查找在某个 resource 上的所有选择 */
  forResource(resourceType: Selection['resourceType'], resourceId: string): Selection[] {
    return Array.from(this._selections.values()).filter(
      s => s.resourceType === resourceType && s.resourceId === resourceId
    )
  }

  clear(userId: string): boolean {
    return this._selections.delete(userId)
  }

  list(): Selection[] {
    return Array.from(this._selections.values())
  }
}

// =============================================================================
// N14: AwarenessProtocol
// =============================================================================

export interface AwarenessState {
  userId: string
  cursor?: { x: number; y: number; page?: string }
  selection?: { resourceType: string; resourceId: string; range?: [number, number] }
  status: 'idle' | 'typing' | 'reviewing' | 'editing'
  customData?: Record<string, unknown>
  lastUpdate: number
}

export class AwarenessProtocol {
  private _states: Map<string, AwarenessState> = new Map()
  private _maxAgeMs: number
  private _subscribers: Set<(s: AwarenessState) => void> = new Set()

  constructor(maxAgeMs: number = 30_000) {
    this._maxAgeMs = maxAgeMs
  }

  update(state: AwarenessState): void {
    state.lastUpdate = Date.now()
    this._states.set(state.userId, state)
    for (const s of this._subscribers) {
      try { s(state) } catch { /* swallow */ }
    }
  }

  get(userId: string): AwarenessState | undefined {
    const s = this._states.get(userId)
    if (!s) return undefined
    if (Date.now() - s.lastUpdate > this._maxAgeMs) return undefined
    return s
  }

  active(): AwarenessState[] {
    return this.list().filter(s => !!this.get(s.userId))
  }

  list(): AwarenessState[] {
    return Array.from(this._states.values())
  }

  subscribe(fn: (s: AwarenessState) => void): () => void {
    this._subscribers.add(fn)
    return () => this._subscribers.delete(fn)
  }
}

// =============================================================================
// N15: LatencyOptimizer
// =============================================================================

export class LatencyOptimizer {
  private _samples: number[] = []
  private _maxSamples: number

  constructor(maxSamples: number = 100) {
    this._maxSamples = maxSamples
  }

  record(latencyMs: number): void {
    this._samples.push(latencyMs)
    if (this._samples.length > this._maxSamples) this._samples.shift()
  }

  average(): number {
    if (this._samples.length === 0) return 0
    return this._samples.reduce((a, b) => a + b, 0) / this._samples.length
  }

  p50(): number {
    if (this._samples.length === 0) return 0
    const sorted = [...this._samples].sort((a, b) => a - b)
    return sorted[Math.floor(sorted.length / 2)]
  }

  /** 建议 batch 大小（基于延迟） */
  recommendBatchSize(): number {
    const avg = this.average()
    if (avg < 50) return 100
    if (avg < 200) return 50
    if (avg < 500) return 20
    return 5
  }

  /** 建议 send interval（ms） */
  recommendSendIntervalMs(): number {
    const avg = this.average()
    if (avg < 50) return 16   // 60fps
    if (avg < 200) return 50
    return 100
  }

  count(): number {
    return this._samples.length
  }
}

// =============================================================================
// N16: OfflineQueue
// =============================================================================

export class OfflineQueue {
  private _items: CRDTItem<unknown>[] = []
  private _flushHook: (() => Promise<void>) | null = null
  private _isOnline: boolean = true

  enqueue(item: CRDTItem<unknown>): void {
    this._items.push(item)
  }

  setOnline(online: boolean): void {
    this._isOnline = online
  }

  isOnline(): boolean {
    return this._isOnline
  }

  setFlushHook(hook: () => Promise<void>): void {
    this._flushHook = hook
  }

  async flush(): Promise<{ flushed: number }> {
    if (!this._isOnline) return { flushed: 0 }
    if (this._flushHook) await this._flushHook()
    const n = this._items.length
    this._items = []
    return { flushed: n }
  }

  size(): number {
    return this._items.length
  }

  drain(): CRDTItem<unknown>[] {
    const all = [...this._items]
    this._items = []
    return all
  }
}

// =============================================================================
// N17: ReconnectReplay
// =============================================================================

export interface ReplayItem {
  itemId: string
  item: CRDTItem<unknown>
  enqueuedAt: number
}

export class ReconnectReplay {
  private _pending: ReplayItem[] = []
  private _nextId: number = 0

  enqueue(item: CRDTItem<unknown>): ReplayItem {
    const r: ReplayItem = { itemId: `replay_${++this._nextId}`, item, enqueuedAt: Date.now() }
    this._pending.push(r)
    return r
  }

  /** 重连后批量重放 */
  replay(handler: (item: CRDTItem<unknown>) => Promise<boolean>): Promise<{ replayed: number; failed: number }> {
    return new Promise(async (resolve) => {
      let replayed = 0
      let failed = 0
      for (const r of this._pending) {
        try {
          if (await handler(r.item)) {
            replayed += 1
            this._pending = this._pending.filter(p => p.itemId !== r.itemId)
          } else {
            failed += 1
          }
        } catch {
          failed += 1
        }
      }
      resolve({ replayed, failed })
    })
  }

  count(): number {
    return this._pending.length
  }

  clear(): void {
    this._pending = []
  }
}

// =============================================================================
// N18: WireConflictResolver
// =============================================================================

export type ConflictResolutionStrategy = 'local-wins' | 'remote-wins' | 'newer-wins' | 'merge' | 'reject'

export class WireConflictResolver {
  /** 解决单个冲突 */
  resolve<T>(local: T, remote: T, remoteTimestamp: number, localTimestamp: number = Date.now(), strategy: ConflictResolutionStrategy = 'newer-wins'): { resolved: T; winner: 'local' | 'remote' } {
    switch (strategy) {
      case 'local-wins':
        return { resolved: local, winner: 'local' }
      case 'remote-wins':
        return { resolved: remote, winner: 'remote' }
      case 'newer-wins':
        return remoteTimestamp > localTimestamp
          ? { resolved: remote, winner: 'remote' }
          : { resolved: local, winner: 'local' }
      case 'merge':
        return { resolved: this._mergeObjects(local, remote), winner: 'local' }
      case 'reject':
        return { resolved: local, winner: 'local' }  // keep local, ignore remote
    }
  }

  /** 批量解决（按时间顺序） */
  resolveBatch<T>(conflicts: Array<{ local: T; remote: T; ts: number; localTs?: number }>, strategy: ConflictResolutionStrategy = 'newer-wins'): T[] {
    return conflicts.map(c => this.resolve(c.local, c.remote, c.ts, c.localTs, strategy).resolved)
  }

  private _mergeObjects<T>(local: T, remote: T): T {
    if (typeof local === 'object' && typeof remote === 'object' && local && remote) {
      return { ...(local as object), ...(remote as object) } as T
    }
    return local
  }
}

// =============================================================================
// N19: PartialSync
// =============================================================================

export interface PartialSyncRequest {
  resourceType: string
  resourceId: string
  fromVersion: number
  toVersion: number
  fields?: string[]
}

export class PartialSync {
  private _versions: Map<string, number> = new Map()

  /** 记录 version */
  setVersion(resourceKey: string, version: number): void {
    this._versions.set(resourceKey, version)
  }

  getVersion(resourceKey: string): number {
    return this._versions.get(resourceKey) ?? 0
  }

  /** 计算需要同步的字段（基于 version） */
  computeDiff(req: PartialSyncRequest, currentVersion: number): { needsFullSync: boolean; changedFields: string[] } {
    if (req.fromVersion >= currentVersion) {
      return { needsFullSync: false, changedFields: [] }
    }
    return {
      needsFullSync: req.fields === undefined,
      changedFields: req.fields ?? [],
    }
  }

  /** 合并 partial 更新 */
  mergePartial<T>(local: T, partial: Partial<T>): T {
    return { ...(local as object), ...(partial as object) } as T
  }
}

// =============================================================================
// N20: BandwidthThrottle
// =============================================================================

export class BandwidthThrottle {
  private _bytesSent: number = 0
  private _windowStart: number = Date.now()
  private _maxBytesPerSec: number
  private _windowMs: number = 1000

  constructor(maxBytesPerSec: number) {
    this._maxBytesPerSec = maxBytesPerSec
  }

  /** 记录发送 bytes，返回是否允许（true=允许） */
  record(bytes: number): boolean {
    const now = Date.now()
    if (now - this._windowStart >= this._windowMs) {
      this._bytesSent = 0
      this._windowStart = now
    }
    if (this._bytesSent + bytes > this._maxBytesPerSec) {
      return false  // throttled
    }
    this._bytesSent += bytes
    return true
  }

  /** 估计 payload 字节数 */
  static estimateBytes(payload: unknown): number {
    return new Blob([JSON.stringify(payload)]).size
  }

  currentLoad(): number {
    return this._bytesSent
  }

  reset(): void {
    this._bytesSent = 0
    this._windowStart = Date.now()
  }
}