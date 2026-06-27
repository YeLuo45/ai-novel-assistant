/**
 * protocol/MemoryReplayAndAuction.ts (V2401-V2410) - 10 engines
 *
 * - V2401 MemoryReplay: 回放 agent memory 演变
 * - V2402 MemoryEventStream: 事件流
 * - V2403 MemoryEventLog: append-only 事件日志
 * - V2404 MemoryChangeDetector: 检测变化
 * - V2405 MemoryDiff: 差异比较
 * - V2406 MemoryAuction: 共享 memory 申请/批准
 * - V2407 MemoryAuctionBid: 投标
 * - V2408 MemoryShareRequest: 共享请求
 * - V2409 MemoryRetentionPolicy: 留存策略
 * - V2410 MemoryGCScheduler: GC 调度
 */

import type { MemoryLevel } from '../types'
import { AgentMemoryStore, type MemoryEntry } from './MemoryStore'

// =============================================================================
// V2402: MemoryEventStream
// =============================================================================

export type MemoryEventType = 'add' | 'delete' | 'update' | 'lease' | 'evict' | 'compact'

export interface MemoryEvent {
  timestamp: number
  type: MemoryEventType
  entryId: string
  agentId: string
  payload: Record<string, unknown>
}

// =============================================================================
// V2403: MemoryEventLog
// =============================================================================

export class MemoryEventLog {
  private _events: MemoryEvent[] = []
  private _maxEvents: number
  private _subscribers: Array<(e: MemoryEvent) => void> = []

  constructor(maxEvents: number = 5000) {
    this._maxEvents = maxEvents
  }

  record(event: MemoryEvent): void {
    this._events.push(event)
    if (this._events.length > this._maxEvents) {
      this._events = this._events.slice(-this._maxEvents)
    }
    for (const sub of this._subscribers) {
      try { sub(event) } catch { /* swallow */ }
    }
  }

  subscribe(fn: (e: MemoryEvent) => void): () => void {
    this._subscribers.push(fn)
    return () => {
      this._subscribers = this._subscribers.filter(s => s !== fn)
    }
  }

  events(filter?: { type?: MemoryEventType; agentId?: string; since?: number }): MemoryEvent[] {
    let arr = [...this._events]
    if (filter?.type) arr = arr.filter(e => e.type === filter.type)
    if (filter?.agentId) arr = arr.filter(e => e.agentId === filter.agentId)
    if (filter?.since) arr = arr.filter(e => e.timestamp >= filter.since!)
    return arr.reverse()
  }

  count(): number {
    return this._events.length
  }

  clear(): void {
    this._events = []
  }
}

// =============================================================================
// V2401: MemoryReplay
// =============================================================================

export interface ReplayStep {
  timestamp: number
  event: MemoryEvent
  /** 该 step 后的 memory 状态 */
  stateAfter: MemoryEntry[]
}

export class MemoryReplayEngine {
  constructor(private _store: AgentMemoryStore, private _log: MemoryEventLog) {}

  /** 重建指定时间点的 memory 状态 */
  rebuild(atTimestamp: number): MemoryEntry[] {
    const relevantEvents = this._log.events().filter(e => e.timestamp <= atTimestamp).reverse()
    const tempStore = new AgentMemoryStore()
    for (const ev of relevantEvents) {
      if (ev.type === 'add') {
        const entry = this._store.get(ev.entryId)
        if (entry) tempStore.add({ ...entry, createdAt: ev.timestamp })
      } else if (ev.type === 'delete') {
        tempStore.delete(ev.entryId)
      }
    }
    return tempStore.all()
  }

  /** 回放 step 列表（用于 UI 时间线） */
  steps(agentId?: string): ReplayStep[] {
    const events = this._log.events({ agentId }).reverse()
    const tempStore = new AgentMemoryStore()
    const result: ReplayStep[] = []
    for (const ev of events) {
      if (ev.type === 'add') {
        const entry = this._store.get(ev.entryId)
        if (entry) tempStore.add(entry)
      } else if (ev.type === 'delete') {
        tempStore.delete(ev.entryId)
      }
      result.push({ timestamp: ev.timestamp, event: ev, stateAfter: tempStore.all() })
    }
    return result
  }
}

// =============================================================================
// V2404: MemoryChangeDetector
// =============================================================================

export interface ChangeReport {
  hasChanges: boolean
  added: MemoryEntry[]
  removed: string[]
  modified: Array<{ before: MemoryEntry; after: MemoryEntry }>
}

export function detectChanges(
  before: MemoryEntry[],
  after: MemoryEntry[],
): ChangeReport {
  const beforeMap = new Map(before.map(e => [e.id, e]))
  const afterMap = new Map(after.map(e => [e.id, e]))
  const added: MemoryEntry[] = []
  const removed: string[] = []
  const modified: ChangeReport['modified'] = []
  for (const [id, e] of afterMap) {
    if (!beforeMap.has(id)) added.push(e)
    else {
      const b = beforeMap.get(id)!
      if (b.content !== e.content || b.importance !== e.importance) {
        modified.push({ before: b, after: e })
      }
    }
  }
  for (const id of beforeMap.keys()) {
    if (!afterMap.has(id)) removed.push(id)
  }
  return { hasChanges: added.length > 0 || removed.length > 0 || modified.length > 0, added, removed, modified }
}

// =============================================================================
// V2405: MemoryDiff
// =============================================================================

export interface MemoryDiff {
  summary: string
  changes: ChangeReport
}

export function diffMemory(before: MemoryEntry[], after: MemoryEntry[]): MemoryDiff {
  const c = detectChanges(before, after)
  return {
    summary: `+${c.added.length} -${c.removed.length} ~${c.modified.length}`,
    changes: c,
  }
}

// =============================================================================
// V2406-V2408: MemoryAuction
// =============================================================================

export interface ShareRequest {
  requestId: string
  entryId: string
  fromAgent: string
  toAgent: string
  reason: string
  proposedScope: 'read' | 'read-write'
  status: 'pending' | 'approved' | 'rejected'
  createdAt: number
  decidedAt?: number
}

export interface AuctionBid {
  bidId: string
  requestId: string
  bidder: string
  offer: string
  rank: number
}

export class MemoryAuction {
  private _requests: Map<string, ShareRequest> = new Map()
  private _bids: Map<string, AuctionBid[]> = new Map()
  private _nextId: number = 0

  request(entryId: string, from: string, to: string, reason: string, scope: 'read' | 'read-write' = 'read'): ShareRequest {
    const id = `share_${++this._nextId}`
    const r: ShareRequest = {
      requestId: id,
      entryId,
      fromAgent: from,
      toAgent: to,
      reason,
      proposedScope: scope,
      status: 'pending',
      createdAt: Date.now(),
    }
    this._requests.set(id, r)
    return r
  }

  approve(requestId: string): boolean {
    const r = this._requests.get(requestId)
    if (!r || r.status !== 'pending') return false
    r.status = 'approved'
    r.decidedAt = Date.now()
    return true
  }

  reject(requestId: string): boolean {
    const r = this._requests.get(requestId)
    if (!r || r.status !== 'pending') return false
    r.status = 'rejected'
    r.decidedAt = Date.now()
    return true
  }

  /** 投标（多 agent 竞争时用） */
  bid(requestId: string, bidder: string, offer: string): AuctionBid | null {
    const r = this._requests.get(requestId)
    if (!r || r.status !== 'pending') return null
    const id = `bid_${++this._nextId}`
    const existing = this._bids.get(requestId) ?? []
    const newBid: AuctionBid = {
      bidId: id,
      requestId,
      bidder,
      offer,
      rank: existing.length + 1,
    }
    existing.push(newBid)
    this._bids.set(requestId, existing)
    return newBid
  }

  getBids(requestId: string): AuctionBid[] {
    return this._bids.get(requestId) ?? []
  }

  get(requestId: string): ShareRequest | undefined {
    return this._requests.get(requestId)
  }

  list(filter?: { status?: ShareRequest['status']; fromAgent?: string }): ShareRequest[] {
    let arr = Array.from(this._requests.values())
    if (filter?.status) arr = arr.filter(r => r.status === filter.status)
    if (filter?.fromAgent) arr = arr.filter(r => r.fromAgent === filter.fromAgent)
    return arr
  }
}

// =============================================================================
// V2409: MemoryRetentionPolicy
// =============================================================================

export interface RetentionPolicy {
  /** 每个 level 的 TTL（ms） */
  ttlByLevel: Partial<Record<MemoryLevel, number>>
  /** 最大 importance 阈值（低于此值可被驱逐） */
  minImportance: number
  /** 多久压缩一次 */
  compactIntervalMs: number
}

export const DEFAULT_RETENTION_POLICY: RetentionPolicy = {
  ttlByLevel: {
    L0: 60_000,        // sensory: 1 min
    L1: 5 * 60_000,    // working: 5 min
    L2: 24 * 60 * 60_000, // episodic: 24h
    L3: 7 * 24 * 60 * 60_000, // project: 7 days
    L4: Number.MAX_SAFE_INTEGER, // team: 永久（直到显式删除）
  },
  minImportance: 10,
  compactIntervalMs: 60_000, // 1 min
}

export function shouldRetain(
  entry: MemoryEntry,
  policy: RetentionPolicy,
  now: number = Date.now(),
): boolean {
  if (entry.importance < policy.minImportance) return false
  const ttl = policy.ttlByLevel[entry.level]
  if (ttl && (now - entry.createdAt) > ttl) return false
  return true
}

// =============================================================================
// V2410: MemoryGCScheduler
// =============================================================================

export interface GCSchedule {
  lastRun: number
  nextRun: number
  intervalMs: number
}

export class MemoryGCScheduler {
  private _schedule: GCSchedule
  private _onRun?: () => void

  constructor(intervalMs: number, onRun?: () => void) {
    this._schedule = {
      lastRun: 0,
      nextRun: Date.now() + intervalMs,
      intervalMs,
    }
    this._onRun = onRun
  }

  /** 检查是否需要执行 GC */
  tick(now: number = Date.now()): boolean {
    if (now >= this._schedule.nextRun) {
      this._schedule.lastRun = now
      this._schedule.nextRun = now + this._schedule.intervalMs
      if (this._onRun) {
        try { this._onRun() } catch { /* swallow */ }
      }
      return true
    }
    return false
  }

  status(): GCSchedule {
    return { ...this._schedule }
  }
}
