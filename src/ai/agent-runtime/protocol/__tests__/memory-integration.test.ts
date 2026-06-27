/**
 * protocol/__tests__/memory-integration.test.ts (V2412)
 * Memory 三层隔离端到端集成测试
 */

import { describe, it, expect } from 'vitest'
import {
  AgentMemoryStore,
  MemoryIndexer,
  compactMemory,
  layerToScope,
  MemoryScopeGuard,
  MemoryAccessLog,
  MemoryQuota,
  MemoryVersioning,
  snapshotMemory,
  MemoryLeaseManager,
  MemoryEventLog,
  MemoryReplayEngine,
  MemoryAuction,
  DEFAULT_RETENTION_POLICY,
  shouldRetain,
  MemoryGCScheduler,
} from '../index'
import type { MemoryEntry } from '../MemoryStore'

const makeEntry = (overrides: Partial<MemoryEntry> = {}): MemoryEntry => ({
  id: `m_${Math.random().toString(36).slice(2, 8)}`,
  agentId: 'a1',
  level: 'L1',
  content: 'test',
  tags: ['demo'],
  createdAt: Date.now(),
  lastAccessed: Date.now(),
  accessCount: 0,
  importance: 50,
  metadata: {},
  ...overrides,
})

describe('Memory — end-to-end isolation', () => {
  it('each agent has independent store', () => {
    const a1 = new AgentMemoryStore()
    const a2 = new AgentMemoryStore()
    a1.add(makeEntry({ agentId: 'a1' }))
    a2.add(makeEntry({ agentId: 'a2' }))
    expect(a1.count()).toBe(1)
    expect(a2.count()).toBe(1)
  })

  it('Layer → scope mapping', () => {
    expect(layerToScope('sensory').isPrivate).toBe(true)
    expect(layerToScope('team').isPrivate).toBe(false)
  })

  it('Guard enforces scope', () => {
    const g = new MemoryScopeGuard({ readScope: 'self', writeScope: 'self' })
    const e = makeEntry({ agentId: 'a2' })
    expect(g.canRead('a1', e).allowed).toBe(false)
  })

  it('Audit log records all access', () => {
    const log = new MemoryAccessLog()
    log.record({ timestamp: 0, agentId: 'a', entryId: 'e', operation: 'read', allowed: false, reason: 'denied' })
    expect(log.deniedCount()).toBe(1)
  })

  it('Quota enforces max', () => {
    const s = new AgentMemoryStore()
    s.add(makeEntry())
    const q = new MemoryQuota({ maxEntries: 0 })
    expect(q.check(s, 'a1').ok).toBe(false)
  })

  it('Versioning creates new version', () => {
    const v = new MemoryVersioning()
    const old = makeEntry()
    const next = v.upgrade(old, 'v2')
    expect(next.version).toBe(1)
  })

  it('Snapshot serializable', () => {
    const s = new AgentMemoryStore()
    s.add(makeEntry({ content: 'x'.repeat(100) }))
    const snap = snapshotMemory(s, 'a1')
    expect(snap.totalSize).toBe(100)
  })

  it('Lease TTL expires', () => {
    const m = new MemoryLeaseManager()
    const l = m.grant('e1', 'a1', 'a2', -1)
    expect(m.canAccess(l.leaseId, 'a2', 'read')).toBe(false)
  })

  it('Event log replay reconstructs', () => {
    const s = new AgentMemoryStore()
    const log = new MemoryEventLog()
    const e = makeEntry()
    s.add(e)
    log.record({ timestamp: Date.now(), type: 'add', entryId: e.id, agentId: e.agentId, payload: {} })
    const engine = new MemoryReplayEngine(s, log)
    expect(engine.rebuild(Date.now() + 1000).length).toBe(1)
  })

  it('Auction flow: request → bid → approve', () => {
    const a = new MemoryAuction()
    const r = a.request('e1', 'a1', '*', 'public reference', 'read')
    a.bid(r.requestId, 'b1', 'me')
    expect(a.approve(r.requestId)).toBe(true)
  })

  it('Retention policy: L4 always retained', () => {
    expect(shouldRetain(makeEntry({ level: 'L4', createdAt: 0 }), DEFAULT_RETENTION_POLICY)).toBe(true)
  })

  it('GC scheduler fires after interval', () => {
    const s = new MemoryGCScheduler(100)
    expect(s.tick(Date.now() + 200)).toBe(true)
  })

  it('Compaction removes low importance', () => {
    const s = new AgentMemoryStore()
    s.add(makeEntry({ importance: 5 }))
    const r = compactMemory(s, { minImportance: 50 })
    expect(r.removed).toBe(1)
  })

  it('Indexer filters by tags AND', () => {
    const s = new AgentMemoryStore()
    s.add(makeEntry({ tags: ['a', 'b'] }))
    s.add(makeEntry({ tags: ['a'] }))
    const idx = new MemoryIndexer(s)
    expect(idx.query({ tags: ['a', 'b'] }).length).toBe(1)
  })
})
