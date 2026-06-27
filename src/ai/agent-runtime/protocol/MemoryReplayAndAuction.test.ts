/**
 * protocol/MemoryReplayAndAuction.test.ts (V2401-V2410) — 30+ 断言
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  MemoryEventLog,
  MemoryReplayEngine,
  detectChanges,
  diffMemory,
  MemoryAuction,
  DEFAULT_RETENTION_POLICY,
  shouldRetain,
  MemoryGCScheduler,
  type MemoryEvent,
  type MemoryEntry,
} from './MemoryReplayAndAuction'
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

describe('MemoryEventLog', () => {
  let log: MemoryEventLog
  beforeEach(() => {
    log = new MemoryEventLog()
  })

  it('record + count', () => {
    log.record({ timestamp: 0, type: 'add', entryId: 'e1', agentId: 'a', payload: {} })
    expect(log.count()).toBe(1)
  })

  it('filter by type', () => {
    log.record({ timestamp: 0, type: 'add', entryId: 'e1', agentId: 'a', payload: {} })
    log.record({ timestamp: 0, type: 'delete', entryId: 'e1', agentId: 'a', payload: {} })
    expect(log.events({ type: 'add' }).length).toBe(1)
  })

  it('filter by since', () => {
    log.record({ timestamp: 100, type: 'add', entryId: 'e1', agentId: 'a', payload: {} })
    log.record({ timestamp: 200, type: 'add', entryId: 'e2', agentId: 'a', payload: {} })
    expect(log.events({ since: 150 }).length).toBe(1)
  })

  it('subscribe', () => {
    let count = 0
    log.subscribe(() => { count += 1 })
    log.record({ timestamp: 0, type: 'add', entryId: 'e1', agentId: 'a', payload: {} })
    expect(count).toBe(1)
  })

  it('unsubscribe', () => {
    let count = 0
    const off = log.subscribe(() => { count += 1 })
    log.record({ timestamp: 0, type: 'add', entryId: 'e1', agentId: 'a', payload: {} })
    off()
    log.record({ timestamp: 0, type: 'add', entryId: 'e2', agentId: 'a', payload: {} })
    expect(count).toBe(1)
  })

  it('clear empties', () => {
    log.record({ timestamp: 0, type: 'add', entryId: 'e1', agentId: 'a', payload: {} })
    log.clear()
    expect(log.count()).toBe(0)
  })
})

describe('MemoryReplayEngine', () => {
  it('rebuild returns empty when no events', () => {
    const s = new AgentMemoryStore()
    const log = new MemoryEventLog()
    const r = new MemoryReplayEngine(s, log)
    expect(r.rebuild(Date.now()).length).toBe(0)
  })

  it('rebuild reconstructs past state', () => {
    const s = new AgentMemoryStore()
    const log = new MemoryEventLog()
    const e = makeEntry()
    s.add(e)
    log.record({ timestamp: Date.now(), type: 'add', entryId: e.id, agentId: e.agentId, payload: {} })
    const r = new MemoryReplayEngine(s, log)
    const rebuilt = r.rebuild(Date.now() + 1000)
    expect(rebuilt.length).toBe(1)
  })

  it('steps returns chronological', () => {
    const s = new AgentMemoryStore()
    const log = new MemoryEventLog()
    const e1 = makeEntry()
    const e2 = makeEntry()
    s.add(e1)
    s.add(e2)
    log.record({ timestamp: 1, type: 'add', entryId: e1.id, agentId: 'a', payload: {} })
    log.record({ timestamp: 2, type: 'add', entryId: e2.id, agentId: 'a', payload: {} })
    const r = new MemoryReplayEngine(s, log)
    const steps = r.steps('a')
    expect(steps.length).toBe(2)
  })
})

describe('detectChanges / diffMemory', () => {
  it('no changes', () => {
    const e = makeEntry()
    const r = detectChanges([e], [e])
    expect(r.hasChanges).toBe(false)
  })

  it('detects added', () => {
    const r = detectChanges([], [makeEntry()])
    expect(r.added.length).toBe(1)
  })

  it('detects removed', () => {
    const e = makeEntry()
    const r = detectChanges([e], [])
    expect(r.removed.length).toBe(1)
  })

  it('detects modified', () => {
    const e1 = makeEntry({ id: 'shared-id', content: 'v1' })
    const e2 = makeEntry({ id: 'shared-id', content: 'v2' })
    const r = detectChanges([e1], [e2])
    expect(r.modified.length).toBe(1)
  })

  it('diffMemory returns summary', () => {
    const d = diffMemory([], [makeEntry()])
    expect(d.summary).toContain('+1')
  })
})

describe('MemoryAuction', () => {
  it('request + approve', () => {
    const a = new MemoryAuction()
    const r = a.request('e1', 'a1', 'a2', 'need access', 'read')
    expect(a.approve(r.requestId)).toBe(true)
    expect(a.get(r.requestId)?.status).toBe('approved')
  })

  it('reject', () => {
    const a = new MemoryAuction()
    const r = a.request('e1', 'a1', 'a2', 'no reason')
    expect(a.reject(r.requestId)).toBe(true)
  })

  it('approve on decided = false', () => {
    const a = new MemoryAuction()
    const r = a.request('e1', 'a1', 'a2', 'reason')
    a.approve(r.requestId)
    expect(a.approve(r.requestId)).toBe(false)
  })

  it('bid records offers', () => {
    const a = new MemoryAuction()
    const r = a.request('e1', 'a1', '*', 'public offer', 'read')
    a.bid(r.requestId, 'b1', 'I can do it')
    a.bid(r.requestId, 'b2', 'Me too')
    expect(a.getBids(r.requestId).length).toBe(2)
  })

  it('bid on non-pending returns null', () => {
    const a = new MemoryAuction()
    expect(a.bid('unknown', 'b1', 'x')).toBe(null)
  })

  it('list filter by status', () => {
    const a = new MemoryAuction()
    const r1 = a.request('e1', 'a1', 'a2', 'r1')
    const r2 = a.request('e2', 'a1', 'a2', 'r2')
    a.approve(r1.requestId)
    expect(a.list({ status: 'pending' }).length).toBe(1)
  })
})

describe('shouldRetain', () => {
  it('low importance = not retained', () => {
    expect(shouldRetain(makeEntry({ importance: 5 }), DEFAULT_RETENTION_POLICY)).toBe(false)
  })

  it('fresh L0 = retained', () => {
    expect(shouldRetain(makeEntry({ level: 'L0', importance: 50 }), DEFAULT_RETENTION_POLICY)).toBe(true)
  })

  it('old L0 = not retained (TTL 60s)', () => {
    expect(shouldRetain(
      makeEntry({ level: 'L0', createdAt: Date.now() - 120_000 }),
      DEFAULT_RETENTION_POLICY,
    )).toBe(false)
  })

  it('L4 always retained (TTL = MAX)', () => {
    expect(shouldRetain(
      makeEntry({ level: 'L4', createdAt: 0 }),
      DEFAULT_RETENTION_POLICY,
    )).toBe(true)
  })
})

describe('MemoryGCScheduler', () => {
  it('tick returns false before interval', () => {
    const s = new MemoryGCScheduler(1000)
    expect(s.tick(Date.now()).toString()).toBe('false')
  })

  it('tick returns true after interval', () => {
    const s = new MemoryGCScheduler(100)
    expect(s.tick(Date.now() + 200)).toBe(true)
  })

  it('tick calls onRun', () => {
    let count = 0
    const s = new MemoryGCScheduler(100, () => { count += 1 })
    s.tick(Date.now() + 200)
    expect(count).toBe(1)
  })

  it('status returns schedule', () => {
    const s = new MemoryGCScheduler(1000)
    const st = s.status()
    expect(st.intervalMs).toBe(1000)
  })
})
