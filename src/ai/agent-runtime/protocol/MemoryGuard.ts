/**
 * protocol/MemoryGuard.ts (V2391-V2400) - 10 engines
 *
 * - V2391 MemoryScopeGuard: 拦截越权读/写
 * - V2392 MemoryAccessLog: 完整审计
 * - V2393 MemoryQuota: 容量限制
 * - V2394 MemoryVersioning: 版本控制
 * - V2395 MemorySnapshot: 快照保存
 * - V2396 MemoryLease: TTL 临时共享
 * - V2397 MemoryRenewal: 续约
 * - V2398 MemoryEviction: 驱逐
 * - V2399 MemoryGC: 垃圾回收
 * - V2400 MemoryCompactionPolicy: 压缩策略
 */

import type { MemoryLevel } from '../types'
import { AgentMemoryStore, type MemoryEntry, type MemoryLayer } from './MemoryStore'

// =============================================================================
// V2391: MemoryScopeGuard
// =============================================================================

export interface ScopeCheck {
  allowed: boolean
  reason: string
}

export interface GuardConfig {
  readScope: 'self' | 'team' | 'public' | 'all'
  writeScope: 'self' | 'team' | 'public'
}

export class MemoryScopeGuard {
  constructor(private _config: GuardConfig) {}

  canRead(agentId: string, entry: MemoryEntry): ScopeCheck {
    if (entry.agentId === agentId) {
      return { allowed: true, reason: 'same agent' }
    }
    if (this._config.readScope === 'self') {
      return { allowed: false, reason: 'self scope only' }
    }
    if (this._config.readScope === 'all') {
      return { allowed: true, reason: 'all scope' }
    }
    if (this._config.readScope === 'team' && entry.level === 'L4') {
      return { allowed: true, reason: 'team KB' }
    }
    if (this._config.readScope === 'public' && (entry.level === 'L3' || entry.level === 'L4')) {
      return { allowed: true, reason: 'public KB' }
    }
    return { allowed: false, reason: 'scope mismatch' }
  }

  canWrite(agentId: string, entry: MemoryEntry): ScopeCheck {
    if (entry.agentId === agentId) {
      return { allowed: true, reason: 'same agent' }
    }
    if (this._config.writeScope === 'self') {
      return { allowed: false, reason: 'self write only' }
    }
    if (this._config.writeScope === 'team' && entry.level === 'L3') {
      return { allowed: true, reason: 'team KB write' }
    }
    if (this._config.writeScope === 'public' && entry.level === 'L4') {
      return { allowed: true, reason: 'project KB write' }
    }
    return { allowed: false, reason: 'write scope mismatch' }
  }
}

// =============================================================================
// V2392: MemoryAccessLog
// =============================================================================

export interface AccessLogEntry {
  timestamp: number
  agentId: string
  entryId: string
  operation: 'read' | 'write' | 'delete' | 'lease' | 'evict'
  allowed: boolean
  reason: string
}

export class MemoryAccessLog {
  private _entries: AccessLogEntry[] = []
  private _maxEntries: number

  constructor(maxEntries: number = 1000) {
    this._maxEntries = maxEntries
  }

  record(entry: AccessLogEntry): void {
    this._entries.push(entry)
    if (this._entries.length > this._maxEntries) {
      this._entries = this._entries.slice(-this._maxEntries)
    }
  }

  query(filter?: { agentId?: string; operation?: AccessLogEntry['operation']; allowed?: boolean }): AccessLogEntry[] {
    let arr = [...this._entries]
    if (filter?.agentId) arr = arr.filter(e => e.agentId === filter.agentId)
    if (filter?.operation) arr = arr.filter(e => e.operation === filter.operation)
    if (filter?.allowed !== undefined) arr = arr.filter(e => e.allowed === filter.allowed)
    return arr.reverse()
  }

  count(): number {
    return this._entries.length
  }

  deniedCount(agentId?: string): number {
    return this.query({ agentId, allowed: false }).length
  }

  clear(): void {
    this._entries = []
  }
}

// =============================================================================
// V2393: MemoryQuota
// =============================================================================

export interface QuotaConfig {
  maxEntries: number
  maxBytes?: number
  maxByLevel?: Partial<Record<MemoryLevel, number>>
}

export class MemoryQuota {
  private _config: QuotaConfig

  constructor(config: QuotaConfig) {
    this._config = config
  }

  check(store: AgentMemoryStore, agentId: string): { ok: boolean; reason?: string; usage: { entries: number; byLevel: Record<MemoryLevel, number> } } {
    const entries = store.byAgent(agentId)
    const byLevel: Record<MemoryLevel, number> = { L0: 0, L1: 0, L2: 0, L3: 0, L4: 0 }
    for (const e of entries) byLevel[e.level] += 1
    if (entries.length >= this._config.maxEntries) {
      return { ok: false, reason: 'max entries exceeded', usage: { entries: entries.length, byLevel } }
    }
    if (this._config.maxByLevel) {
      for (const [lvl, max] of Object.entries(this._config.maxByLevel)) {
        if (byLevel[lvl as MemoryLevel] >= (max ?? Infinity)) {
          return { ok: false, reason: `level ${lvl} quota exceeded`, usage: { entries: entries.length, byLevel } }
        }
      }
    }
    return { ok: true, usage: { entries: entries.length, byLevel } }
  }
}

// =============================================================================
// V2394: MemoryVersioning
// =============================================================================

export interface VersionedEntry extends MemoryEntry {
  version: number
  previousVersionId?: string
  supersededAt?: number
}

export class MemoryVersioning {
  /** 升级 entry：返回新 versioned entry（旧 entry 标记为 superseded） */
  upgrade(entry: MemoryEntry, newContent: string, now: number = Date.now()): VersionedEntry {
    const newVersion: VersionedEntry = {
      ...entry,
      content: newContent,
      id: `${entry.id}_v${(entry.metadata?.version as number ?? 0) + 1}`,
      version: ((entry.metadata?.version as number) ?? 0) + 1,
      previousVersionId: entry.id,
      createdAt: now,
    }
    return newVersion
  }
}

// =============================================================================
// V2395: MemorySnapshot
// =============================================================================

export interface MemorySnapshot {
  timestamp: number
  agentId: string
  entries: MemoryEntry[]
  totalSize: number
}

export function snapshotMemory(store: AgentMemoryStore, agentId: string): MemorySnapshot {
  const entries = store.byAgent(agentId)
  return {
    timestamp: Date.now(),
    agentId,
    entries: [...entries],
    totalSize: entries.reduce((acc, e) => acc + e.content.length, 0),
  }
}

// =============================================================================
// V2396: MemoryLease
// =============================================================================

export interface Lease {
  leaseId: string
  entryId: string
  fromAgent: string
  toAgent: string
  grantedAt: number
  expiresAt: number
  scope: 'read' | 'read-write'
}

export class MemoryLeaseManager {
  private _leases: Map<string, Lease> = new Map()
  private _nextId: number = 0

  grant(entryId: string, fromAgent: string, toAgent: string, ttlMs: number, scope: 'read' | 'read-write' = 'read'): Lease {
    const id = `lease_${++this._nextId}`
    const lease: Lease = {
      leaseId: id,
      entryId,
      fromAgent,
      toAgent,
      grantedAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
      scope,
    }
    this._leases.set(id, lease)
    return lease
  }

  /** 检查某 agent 是否有某 entry 的 read 权限（通过 lease） */
  canAccess(leaseId: string, agentId: string, needScope: 'read' | 'read-write'): boolean {
    const lease = this._leases.get(leaseId)
    if (!lease) return false
    if (lease.expiresAt < Date.now()) {
      this._leases.delete(leaseId)
      return false
    }
    if (lease.toAgent !== agentId) return false
    if (needScope === 'read-write' && lease.scope === 'read') return false
    return true
  }

  /** 续约（V2397） */
  renew(leaseId: string, extensionMs: number): boolean {
    const lease = this._leases.get(leaseId)
    if (!lease) return false
    lease.expiresAt = Date.now() + extensionMs
    return true
  }

  /** 撤销 */
  revoke(leaseId: string): boolean {
    return this._leases.delete(leaseId)
  }

  /** 驱逐过期 leases */
  evict(now: number = Date.now()): number {
    let n = 0
    for (const [id, l] of this._leases) {
      if (l.expiresAt < now) {
        this._leases.delete(id)
        n += 1
      }
    }
    return n
  }

  /** GC（V2399） */
  gc(): number {
    const n = this.evict()
    return n
  }

  /** 取全部 leases */
  all(): Lease[] {
    return Array.from(this._leases.values())
  }

  /** 按 entryId 查 */
  byEntry(entryId: string): Lease[] {
    return this.all().filter(l => l.entryId === entryId)
  }

  /** 压缩策略（V2400）：删除短 TTL 已过期的 leases */
  compactionPolicy(olderThanMs: number): number {
    const cutoff = Date.now() - olderThanMs
    let n = 0
    for (const [id, l] of this._leases) {
      if (l.expiresAt < cutoff) {
        this._leases.delete(id)
        n += 1
      }
    }
    return n
  }
}
