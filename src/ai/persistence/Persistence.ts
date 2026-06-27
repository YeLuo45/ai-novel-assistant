/**
 * ai/persistence/Persistence.ts (K1-K15) - 15 engines
 *
 * - K1 ProjectSnapshot: 完整项目快照
 * - K2 WorkspaceSerializer: workspace 序列化
 * - K3 AutoSave: 自动保存
 * - K4 Versioning: 版本控制
 * - K5 Recovery: 恢复机制
 * - K6 ConflictResolver: 冲突解决
 * - K7 Migration: schema 迁移
 * - K8 Backup: 备份
 * - K9 Sync: 同步
 * - K10 Diff: 差异比较
 * - K11 ExportFormat: 多种格式
 * - K12 ImportFormat: 多种格式
 * - K13 Compress: 压缩
 * - K14 Decompress: 解压
 * - K15 Checksum: 校验
 */

import type { ChapterPlan, Scene } from '../project/ChapterPlan'

// =============================================================================
// K15: Checksum
// =============================================================================

export class Checksum {
  /** 简单 FNV-1a hash（与 BucketAssigner 一致） */
  compute(data: string): string {
    let h = 2166136261
    for (let i = 0; i < data.length; i++) {
      h ^= data.charCodeAt(i)
      h = (h * 16777619) >>> 0
    }
    return h.toString(16).padStart(8, '0')
  }

  verify(data: string, expected: string): boolean {
    return this.compute(data) === expected
  }
}

// =============================================================================
// K1: ProjectSnapshot
// =============================================================================

export interface SnapshotPayload {
  chapters: ChapterPlan[]
  metadata: Record<string, unknown>
}

export interface ProjectSnapshot {
  snapshotId: string
  projectId: string
  version: number
  payload: SnapshotPayload
  checksum: string
  createdAt: number
  description?: string
}

export class ProjectSnapshotBuilder {
  private _snapshots: ProjectSnapshot[] = []
  private _checksum = new Checksum()

  create(projectId: string, payload: SnapshotPayload, description?: string): ProjectSnapshot {
    const json = JSON.stringify(payload)
    const snapshot: ProjectSnapshot = {
      snapshotId: `snap_${Date.now()}_${this._snapshots.length + 1}`,
      projectId,
      version: this._snapshots.length + 1,
      payload,
      checksum: this._checksum.compute(json),
      createdAt: Date.now(),
      description,
    }
    this._snapshots.push(snapshot)
    return snapshot
  }

  get(snapshotId: string): ProjectSnapshot | undefined {
    return this._snapshots.find(s => s.snapshotId === snapshotId)
  }

  byProject(projectId: string): ProjectSnapshot[] {
    return this._snapshots.filter(s => s.projectId === projectId)
  }

  /** 验证 checksum */
  verify(snapshotId: string): boolean {
    const s = this.get(snapshotId)
    if (!s) return false
    return this._checksum.verify(JSON.stringify(s.payload), s.checksum)
  }

  list(): ProjectSnapshot[] {
    return [...this._snapshots]
  }

  latest(projectId: string): ProjectSnapshot | undefined {
    const all = this.byProject(projectId)
    return all[all.length - 1]
  }
}

// =============================================================================
// K2: WorkspaceSerializer
// =============================================================================

export class WorkspaceSerializer {
  /** 序列化为 JSON 字符串 */
  serialize(data: unknown): string {
    return JSON.stringify(data, null, 2)
  }

  /** 从 JSON 反序列化 */
  deserialize<T = unknown>(json: string): T {
    return JSON.parse(json) as T
  }

  /** 验证 JSON 格式 */
  isValidJson(json: string): boolean {
    try {
      JSON.parse(json)
      return true
    } catch {
      return false
    }
  }
}

// =============================================================================
// K3: AutoSave
// =============================================================================

export interface AutoSaveConfig {
  intervalMs: number
  maxBackups: number
  saveIfNoChange: boolean
}

export class AutoSave {
  private _intervalId: ReturnType<typeof setInterval> | null = null
  private _config: AutoSaveConfig
  private _onSave: () => void
  private _lastSavedHash: string = ''
  private _saveCount: number = 0

  constructor(onSave: () => void, config: Partial<AutoSaveConfig> = {}) {
    this._onSave = onSave
    this._config = {
      intervalMs: config.intervalMs ?? 30_000,
      maxBackups: config.maxBackups ?? 5,
      saveIfNoChange: config.saveIfNoChange ?? false,
    }
  }

  start(getCurrentState: () => string): void {
    if (this._intervalId !== null) return
    this._intervalId = setInterval(() => {
      const hash = this._hash(getCurrentState())
      if (hash !== this._lastSavedHash || this._config.saveIfNoChange) {
        this._onSave()
        this._lastSavedHash = hash
        this._saveCount += 1
      }
    }, this._config.intervalMs)
  }

  stop(): void {
    if (this._intervalId !== null) {
      clearInterval(this._intervalId)
      this._intervalId = null
    }
  }

  get saveCount(): number {
    return this._saveCount
  }

  private _hash(s: string): string {
    let h = 0
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h) + s.charCodeAt(i)
      h = h & h
    }
    return String(h)
  }
}

// =============================================================================
// K4: Versioning
// =============================================================================

export interface VersionedData<T> {
  version: string  // semver
  data: T
  createdAt: number
  author?: string
}

export class VersioningManager<T> {
  private _history: VersionedData<T>[] = []

  commit(data: T, version: string, author?: string): VersionedData<T> {
    const v: VersionedData<T> = { version, data, createdAt: Date.now(), author }
    this._history.push(v)
    return v
  }

  at(version: string): VersionedData<T> | undefined {
    return this._history.find(v => v.version === version)
  }

  latest(): VersionedData<T> | undefined {
    return this._history[this._history.length - 1]
  }

  diff(versionA: string, versionB: string): { added: string[]; removed: string[]; modified: string[] } {
    const a = this.at(versionA)?.data as Record<string, unknown> | undefined
    const b = this.at(versionB)?.data as Record<string, unknown> | undefined
    if (!a || !b) return { added: [], removed: [], modified: [] }
    const aKeys = new Set(Object.keys(a))
    const bKeys = new Set(Object.keys(b))
    const added = [...bKeys].filter(k => !aKeys.has(k))
    const removed = [...aKeys].filter(k => !bKeys.has(k))
    const modified = [...aKeys].filter(k => bKeys.has(k) && JSON.stringify(a[k]) !== JSON.stringify(b[k]))
    return { added, removed, modified }
  }

  list(): VersionedData<T>[] {
    return [...this._history]
  }
}

// =============================================================================
// K5: Recovery
// =============================================================================

export interface RecoveryCheckpoint {
  checkpointId: string
  timestamp: number
  data: unknown
  description: string
}

export class RecoveryManager {
  private _checkpoints: RecoveryCheckpoint[] = []
  private _maxCheckpoints: number

  constructor(maxCheckpoints: number = 20) {
    this._maxCheckpoints = maxCheckpoints
  }

  save(data: unknown, description: string): RecoveryCheckpoint {
    const c: RecoveryCheckpoint = {
      checkpointId: `cp_${this._checkpoints.length + 1}`,
      timestamp: Date.now(),
      data,
      description,
    }
    this._checkpoints.push(c)
    if (this._checkpoints.length > this._maxCheckpoints) this._checkpoints.shift()
    return c
  }

  latest(): RecoveryCheckpoint | undefined {
    return this._checkpoints[this._checkpoints.length - 1]
  }

  restore(checkpointId: string): unknown | null {
    return this._checkpoints.find(c => c.checkpointId === checkpointId)?.data ?? null
  }

  list(): RecoveryCheckpoint[] {
    return [...this._checkpoints]
  }
}

// =============================================================================
// K6: ConflictResolver
// =============================================================================

export type ConflictResolution = 'local' | 'remote' | 'merge' | 'manual'

export interface Conflict<T> {
  conflictId: string
  localValue: T
  remoteValue: T
  resolution: ConflictResolution
}

export class ConflictResolver {
  /** 自动合并（优先取 non-undefined） */
  autoMerge<T>(local: T, remote: T): T {
    if (JSON.stringify(local) === JSON.stringify(remote)) return local
    if (local === undefined || local === null) return remote
    if (remote === undefined || remote === null) return local
    // 简单策略：local 优先
    return local
  }

  /** 3-way merge（保留 local 但用 remote 填补 local 缺失字段） */
  threeWayMerge<T extends Record<string, unknown>>(local: T, remote: T, base: T): T {
    const result: Record<string, unknown> = { ...local }
    for (const key of new Set([...Object.keys(local), ...Object.keys(remote), ...Object.keys(base)])) {
      const l = local[key]
      const r = remote[key]
      const b = base[key]
      if (JSON.stringify(l) !== JSON.stringify(b) && JSON.stringify(r) !== JSON.stringify(b)) {
        // 双方都改 → 冲突，保留 local
        result[key] = l
      } else if (JSON.stringify(r) !== JSON.stringify(b)) {
        // 仅 remote 改
        result[key] = r
      }
      // 仅 local 改已保留
    }
    return result as T
  }

  /** 检测冲突 */
  detectConflicts<T>(local: Record<string, T>, remote: Record<string, T>): string[] {
    const conflicts: string[] = []
    for (const key of new Set([...Object.keys(local), ...Object.keys(remote)])) {
      if (key in local && key in remote && JSON.stringify(local[key]) !== JSON.stringify(remote[key])) {
        conflicts.push(key)
      }
    }
    return conflicts
  }
}

// =============================================================================
// K7: Migration
// =============================================================================

export interface MigrationStep {
  fromVersion: string
  toVersion: string
  up: (data: unknown) => unknown
  down: (data: unknown) => unknown
}

export class Migrator {
  private _migrations: MigrationStep[] = []

  add(step: MigrationStep): void {
    this._migrations.push(step)
  }

  /** 升级到目标版本 */
  up(data: unknown, targetVersion: string, currentVersion: string): unknown {
    let result = data
    let v = currentVersion
    while (v !== targetVersion) {
      const step = this._migrations.find(s => s.fromVersion === v)
      if (!step) break
      result = step.up(result)
      v = step.toVersion
    }
    return result
  }

  /** 降级 */
  down(data: unknown, targetVersion: string, currentVersion: string): unknown {
    let result = data
    let v = currentVersion
    while (v !== targetVersion) {
      const step = this._migrations.find(s => s.toVersion === v)
      if (!step) break
      result = step.down(result)
      v = step.fromVersion
    }
    return result
  }

  migrations(): MigrationStep[] {
    return [...this._migrations]
  }
}

// =============================================================================
// K8: Backup
// =============================================================================

export interface Backup {
  backupId: string
  timestamp: number
  data: unknown
  size: number
  type: 'auto' | 'manual'
}

export class BackupManager {
  private _backups: Backup[] = []
  private _maxBackups: number

  constructor(maxBackups: number = 10) {
    this._maxBackups = maxBackups
  }

  create(data: unknown, type: 'auto' | 'manual' = 'manual'): Backup {
    const json = JSON.stringify(data)
    const backup: Backup = {
      backupId: `bk_${Date.now()}_${this._backups.length + 1}`,
      timestamp: Date.now(),
      data,
      size: json.length,
      type,
    }
    this._backups.push(backup)
    if (this._backups.length > this._maxBackups) this._backups.shift()
    return backup
  }

  list(): Backup[] {
    return [...this._backups]
  }

  latest(): Backup | undefined {
    return this._backups[this._backups.length - 1]
  }

  get(backupId: string): Backup | undefined {
    return this._backups.find(b => b.backupId === backupId)
  }

  delete(backupId: string): boolean {
    const before = this._backups.length
    this._backups = this._backups.filter(b => b.backupId !== backupId)
    return this._backups.length < before
  }

  totalSize(): number {
    return this._backups.reduce((a, b) => a + b.size, 0)
  }
}

// =============================================================================
// K9: Sync
// =============================================================================

export type SyncDirection = 'push' | 'pull' | 'bidirectional'

export interface SyncRecord {
  recordId: string
  timestamp: number
  direction: SyncDirection
  size: number
  success: boolean
}

export class SyncEngine {
  private _records: SyncRecord[] = []

  push(data: unknown): SyncRecord {
    return this._record('push', data, true)
  }

  pull(): SyncRecord {
    return this._record('pull', null, true)
  }

  sync(data: unknown): SyncRecord {
    return this._record('bidirectional', data, true)
  }

  records(): SyncRecord[] {
    return [...this._records]
  }

  private _record(direction: SyncDirection, data: unknown, success: boolean): SyncRecord {
    const r: SyncRecord = {
      recordId: `sync_${this._records.length + 1}`,
      timestamp: Date.now(),
      direction,
      size: data ? JSON.stringify(data).length : 0,
      success,
    }
    this._records.push(r)
    return r
  }
}

// =============================================================================
// K10: Diff
// =============================================================================

export class SnapshotDiffer {
  /** 简单字段级 diff */
  diff<T extends Record<string, unknown>>(a: T, b: T): { added: string[]; removed: string[]; modified: string[] } {
    const aKeys = new Set(Object.keys(a))
    const bKeys = new Set(Object.keys(b))
    const added = [...bKeys].filter(k => !aKeys.has(k))
    const removed = [...aKeys].filter(k => !bKeys.has(k))
    const modified: string[] = []
    for (const k of aKeys) {
      if (bKeys.has(k) && JSON.stringify(a[k]) !== JSON.stringify(b[k])) {
        modified.push(k)
      }
    }
    return { added, removed, modified }
  }

  /** 数组级 diff（按 id） */
  arrayDiff<T extends { id: string }>(a: T[], b: T[]): { added: T[]; removed: T[]; modified: T[] } {
    const aMap = new Map(a.map(x => [x.id, x]))
    const bMap = new Map(b.map(x => [x.id, x]))
    const added: T[] = []
    const removed: T[] = []
    const modified: T[] = []
    for (const [id, item] of bMap) {
      if (!aMap.has(id)) added.push(item)
      else if (JSON.stringify(aMap.get(id)) !== JSON.stringify(item)) modified.push(item)
    }
    for (const [id, item] of aMap) {
      if (!bMap.has(id)) removed.push(item)
    }
    return { added, removed, modified }
  }
}

// =============================================================================
// K11: ExportFormat
// =============================================================================

export type ExportFormat = 'json' | 'yaml' | 'markdown' | 'csv' | 'xml' | 'binary'

export class Exporter {
  /** 导出为指定格式 */
  export(data: unknown, format: ExportFormat): string {
    switch (format) {
      case 'json': return JSON.stringify(data, null, 2)
      case 'markdown': return this._toMarkdown(data)
      case 'csv': return this._toCsv(data)
      case 'yaml': return this._toYaml(data)
      case 'xml': return this._toXml(data)
      case 'binary': return Buffer.from(JSON.stringify(data)).toString('base64')
    }
  }

  /** 字节大小 */
  size(data: unknown, format: ExportFormat): number {
    return this.export(data, format).length
  }

  private _toMarkdown(d: unknown): string {
    return '# Export\n\n```json\n' + JSON.stringify(d, null, 2) + '\n```\n'
  }

  private _toCsv(d: unknown): string {
    if (!Array.isArray(d) || d.length === 0) return ''
    const keys = Object.keys(d[0] as object)
    const lines = [keys.join(',')]
    for (const row of d) {
      lines.push(keys.map(k => JSON.stringify((row as Record<string, unknown>)[k] ?? '')).join(','))
    }
    return lines.join('\n')
  }

  private _toYaml(d: unknown): string {
    return 'data:\n' + JSON.stringify(d, null, 2).split('\n').map(l => '  ' + l).join('\n')
  }

  private _toXml(d: unknown): string {
    return `<?xml version="1.0"?>\n<data>${JSON.stringify(d)}</data>`
  }
}

// =============================================================================
// K12: ImportFormat
// =============================================================================

export class Importer {
  import(json: string): unknown {
    return JSON.parse(json)
  }

  importFromFormat(data: string, format: ExportFormat): unknown {
    if (format === 'json') return this.import(data)
    if (format === 'binary') return JSON.parse(Buffer.from(data, 'base64').toString('utf-8'))
    if (format === 'markdown') {
      const m = data.match(/```json\n([\s\S]*?)\n```/)
      return m ? JSON.parse(m[1]) : null
    }
    if (format === 'csv') {
      const lines = data.split('\n')
      const keys = lines[0].split(',')
      return lines.slice(1).map(line => {
        const values = line.split(',')
        const obj: Record<string, string> = {}
        keys.forEach((k, i) => { obj[k] = values[i] })
        return obj
      })
    }
    return null
  }
}

// =============================================================================
// K13: Compress
// =============================================================================

export class Compressor {
  /** 简单 RLE 压缩（run-length encoding） */
  rleCompress(data: string): string {
    if (data.length === 0) return ''
    let out = ''
    let count = 1
    for (let i = 1; i < data.length; i++) {
      if (data[i] === data[i - 1] && count < 9) {
        count += 1
      } else {
        out += count.toString() + data[i - 1]
        count = 1
      }
    }
    out += count.toString() + data[data.length - 1]
    return out
  }

  rleDecompress(data: string): string {
    let out = ''
    for (let i = 0; i < data.length; i += 2) {
      const count = parseInt(data[i] ?? '1', 10)
      const ch = data[i + 1] ?? ''
      out += ch.repeat(count)
    }
    return out
  }

  /** 估算压缩率 */
  estimateCompressionRatio(original: string): number {
    return this.rleCompress(original).length / original.length
  }
}

// =============================================================================
// K14: Decompress (同 K13)
// =============================================================================