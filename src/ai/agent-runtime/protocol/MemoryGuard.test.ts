/**
 * protocol/MemoryGuard.test.ts (V2391-V2400) — 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  MemoryScopeGuard,
  MemoryAccessLog,
  MemoryQuota,
  MemoryVersioning,
  snapshotMemory,
  MemoryLeaseManager,
  type MemoryEntry,
} from './MemoryGuard'
import { AgentMemoryStore, type MemoryEntry } from './MemoryStore'

const makeEntry = (overrides: Partial<MemoryEntry> = {}): MemoryEntry => ({
  id: `m_${Math.random().toString(36).slice(2, 8)}`,
  agentId: 'a1',
  level: 'L1',
  content: 'test',
  tags: [],
  createdAt: Date.now(),
  lastAccessed: Date.now(),
  accessCount: 0,
  importance: 50,
  metadata: {},
  ...overrides,
})

describe('MemoryScopeGuard', () => {
  it('same agent: always allowed', () => {
    const g = new MemoryScopeGuard({ readScope: 'self', writeScope: 'self' })
    expect(g.canRead('a1', makeEntry({ agentId: 'a1' })).allowed).toBe(true)
    expect(g.canWrite('a1', makeEntry({ agentId: 'a1' })).allowed).toBe(true)
  })

  it('self scope + other agent read = denied', () => {
    const g = new MemoryScopeGuard({ readScope: 'self', writeScope: 'self' })
    expect(g.canRead('a1', makeEntry({ agentId: 'a2' })).allowed).toBe(false)
  })

  it('team scope + L4 read = allowed', () => {
    const g = new MemoryScopeGuard({ readScope: 'team', writeScope: 'self' })
    expect(g.canRead('a1', makeEntry({ agentId: 'a2', level: 'L4' })).allowed).toBe(true)
  })

  it('all scope: allowed any', () => {
    const g = new MemoryScopeGuard({ readScope: 'all', writeScope: 'self' })
    expect(g.canRead('a1', makeEntry({ agentId: 'a2' })).allowed).toBe(true)
  })

  it('public scope + L3 read = allowed', () => {
    const g = new MemoryScopeGuard({ readScope: 'public', writeScope: 'self' })
    expect(g.canRead('a1', makeEntry({ agentId: 'a2', level: 'L3' })).allowed).toBe(true)
  })

  it('public scope + L1 read = denied', () => {
    const g = new MemoryScopeGuard({ readScope: 'public', writeScope: 'self' })
    expect(g.canRead('a1', makeEntry({ agentId: 'a2', level: 'L1' })).allowed).toBe(false)
  })
})

describe('MemoryAccessLog', () => {
  it('record + query', () => {
    const log = new MemoryAccessLog()
    log.record({ timestamp: 0, agentId: 'a', entryId: 'e1', operation: 'read', allowed: true, reason: 'ok' })
    log.record({ timestamp: 0, agentId: 'a', entryId: 'e1', operation: 'write', allowed: false, reason: 'denied' })
    expect(log.count()).toBe(2)
  })

  it('filter by allowed', () => {
    const log = new MemoryAccessLog()
    log.record({ timestamp: 0, agentId: 'a', entryId: 'e', operation: 'read', allowed: true, reason: 'ok' })
    log.record({ timestamp: 0, agentId: 'a', entryId: 'e', operation: 'read', allowed: false, reason: 'no' })
    expect(log.query({ allowed: false }).length).toBe(1)
  })

  it('deniedCount', () => {
    const log = new MemoryAccessLog()
    log.record({ timestamp: 0, agentId: 'a', entryId: 'e', operation: 'read', allowed: false, reason: 'no' })
    expect(log.deniedCount('a')).toBe(1)
  })

  it('trim to max', () => {
    const log = new MemoryAccessLog(2)
    log.record({ timestamp: 0, agentId: 'a', entryId: '1', operation: 'read', allowed: true, reason: 'ok' })
    log.record({ timestamp: 0, agentId: 'a', entryId: '2', operation: 'read', allowed: true, reason: 'ok' })
    log.record({ timestamp: 0, agentId: 'a', entryId: '3', operation: 'read', allowed: true, reason: 'ok' })
    expect(log.count()).toBe(2)
  })

  it('clear empties', () => {
    const log = new MemoryAccessLog()
    log.record({ timestamp: 0, agentId: 'a', entryId: '1', operation: 'read', allowed: true, reason: 'ok' })
    log.clear()
    expect(log.count()).toBe(0)
  })
})

describe('MemoryQuota', () => {
  it('check under limit: ok', () => {
    const s = new AgentMemoryStore()
    const q = new MemoryQuota({ maxEntries: 5 })
    s.add(makeEntry({ agentId: 'a' }))
    const r = q.check(s, 'a')
    expect(r.ok).toBe(true)
    expect(r.usage.entries).toBe(1)
  })

  it('check over limit: not ok', () => {
    const s = new AgentMemoryStore()
    const q = new MemoryQuota({ maxEntries: 2 })
    s.add(makeEntry({ agentId: 'a' }))
    s.add(makeEntry({ agentId: 'a' }))
    const r = q.check(s, 'a')
    expect(r.ok).toBe(false)
  })

  it('per-level quota', () => {
    const s = new AgentMemoryStore()
    const q = new MemoryQuota({ maxEntries: 100, maxByLevel: { L0: 1 } })
    s.add(makeEntry({ agentId: 'a', level: 'L0' }))
    s.add(makeEntry({ agentId: 'a', level: 'L0' }))
    const r = q.check(s, 'a')
    expect(r.ok).toBe(false)
  })
})

describe('MemoryVersioning', () => {
  it('upgrade creates new version', () => {
    const v = new MemoryVersioning()
    const old = makeEntry({ content: 'v1' })
    const next = v.upgrade(old, 'v2')
    expect(next.content).toBe('v2')
    expect(next.version).toBe(1)
    expect(next.previousVersionId).toBe(old.id)
  })
})

describe('snapshotMemory', () => {
  it('returns serializable snapshot', () => {
    const s = new AgentMemoryStore()
    s.add(makeEntry({ agentId: 'a', content: 'x' }))
    const snap = snapshotMemory(s, 'a')
    expect(snap.entries.length).toBe(1)
    expect(snap.totalSize).toBe(1)
  })

  it('totalSize sums content length', () => {
    const s = new AgentMemoryStore()
    s.add(makeEntry({ agentId: 'a', content: 'hello' }))
    s.add(makeEntry({ agentId: 'a', content: 'world' }))
    const snap = snapshotMemory(s, 'a')
    expect(snap.totalSize).toBe(10)
  })
})

describe('MemoryLeaseManager', () => {
  it('grant + canAccess', () => {
    const m = new MemoryLeaseManager()
    const lease = m.grant('entry-1', 'a1', 'a2', 1000)
    expect(m.canAccess(lease.leaseId, 'a2', 'read')).toBe(true)
  })

  it('expired lease denies', () => {
    const m = new MemoryLeaseManager()
    const lease = m.grant('e1', 'a1', 'a2', -1000) // already expired
    expect(m.canAccess(lease.leaseId, 'a2', 'read')).toBe(false)
  })

  it('wrong agent denies', () => {
    const m = new MemoryLeaseManager()
    const lease = m.grant('e1', 'a1', 'a2', 1000)
    expect(m.canAccess(lease.leaseId, 'a3', 'read')).toBe(false)
  })

  it('read-write requires scope=read-write', () => {
    const m = new MemoryLeaseManager()
    const lease = m.grant('e1', 'a1', 'a2', 1000, 'read')
    expect(m.canAccess(lease.leaseId, 'a2', 'read-write')).toBe(false)
  })

  it('renew extends', () => {
    const m = new MemoryLeaseManager()
    const lease = m.grant('e1', 'a1', 'a2', 1000)
    expect(m.renew(lease.leaseId, 5000)).toBe(true)
  })

  it('revoke removes', () => {
    const m = new MemoryLeaseManager()
    const lease = m.grant('e1', 'a1', 'a2', 1000)
    expect(m.revoke(lease.leaseId)).toBe(true)
    expect(m.canAccess(lease.leaseId, 'a2', 'read')).toBe(false)
  })

  it('evict removes expired', () => {
    const m = new MemoryLeaseManager()
    m.grant('e1', 'a1', 'a2', -1000)
    m.grant('e2', 'a1', 'a2', 10000)
    const n = m.evict()
    expect(n).toBe(1)
  })

  it('gc alias for evict', () => {
    const m = new MemoryLeaseManager()
    m.grant('e1', 'a1', 'a2', -1000)
    expect(m.gc()).toBe(1)
  })

  it('byEntry filters', () => {
    const m = new MemoryLeaseManager()
    m.grant('e1', 'a1', 'a2', 1000)
    m.grant('e2', 'a1', 'a2', 1000)
    expect(m.byEntry('e1').length).toBe(1)
  })

  it('compactionPolicy removes old expired', () => {
    const m = new MemoryLeaseManager()
    m.grant('e1', 'a1', 'a2', -10000)
    const n = m.compactionPolicy(5000)
    expect(n).toBe(1)
  })
})
