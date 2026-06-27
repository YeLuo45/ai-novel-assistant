/**
 * MemoryBridge.test.ts (V2344) — 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  mapLevelToTable,
  logLegacyAccess,
  projectLegacyItems,
  namespaceKey,
  planMigration,
  applyMigration,
  snapshotMemoryScope,
  belongsToAgent,
  getRetentionStats,
  type LegacyMemoryItemLike,
} from './MemoryBridge'
import { createMemoryScope } from './AgentMemoryScope'

const makeItem = (overrides: Partial<LegacyMemoryItemLike> = {}): LegacyMemoryItemLike => ({
  id: 'm1',
  level: 'L1',
  content: 'test content',
  createdAt: Date.now(),
  importance: 50,
  ...overrides,
})

describe('mapLevelToTable', () => {
  it('L0 maps to private sensory', () => {
    const scope = createMemoryScope({ agentId: 'a1' })
    const r = mapLevelToTable(scope, 'L0')
    expect(r.isPrivate).toBe(true)
    expect(r.table).toBe(scope.privateTables.sensory)
  })

  it('L1 maps to private working', () => {
    const scope = createMemoryScope({ agentId: 'a1' })
    expect(mapLevelToTable(scope, 'L1').table).toBe(scope.privateTables.working)
  })

  it('L2 maps to private episodic', () => {
    const scope = createMemoryScope({ agentId: 'a1' })
    expect(mapLevelToTable(scope, 'L2').table).toBe(scope.privateTables.episodic)
  })

  it('L3 maps to shared projectKB', () => {
    const scope = createMemoryScope({ agentId: 'a1' })
    const r = mapLevelToTable(scope, 'L3')
    expect(r.isPrivate).toBe(false)
    expect(r.table).toBe(scope.sharedTables.projectKB)
  })

  it('L4 maps to shared teamKB', () => {
    const scope = createMemoryScope({ agentId: 'a1' })
    const r = mapLevelToTable(scope, 'L4')
    expect(r.isPrivate).toBe(false)
    expect(r.table).toBe(scope.sharedTables.teamKB)
  })
})

describe('logLegacyAccess', () => {
  it('appends access entry', () => {
    const scope = createMemoryScope({ agentId: 'a1' })
    const s2 = logLegacyAccess(scope, makeItem({ id: 'm1', level: 'L1' }), 'read')
    expect(s2.accessLog.length).toBe(1)
    expect(s2.accessLog[0].itemId).toBe('m1')
  })

  it('does not mutate original', () => {
    const scope = createMemoryScope({ agentId: 'a1' })
    const s2 = logLegacyAccess(scope, makeItem(), 'read')
    expect(scope.accessLog.length).toBe(0)
    expect(s2.accessLog.length).toBe(1)
  })

  it('respects operation type', () => {
    const scope = createMemoryScope({ agentId: 'a1' })
    const s2 = logLegacyAccess(scope, makeItem(), 'write')
    expect(s2.accessLog[0].operation).toBe('write')
  })
})

describe('projectLegacyItems', () => {
  const items = [
    makeItem({ id: '1', level: 'L0' }),
    makeItem({ id: '2', level: 'L1' }),
    makeItem({ id: '3', level: 'L3' }),
    makeItem({ id: '4', level: 'L2', importance: 80 }),
    makeItem({ id: '5', level: 'L1', importance: 30 }),
  ]

  it('returns all when no filter', () => {
    const scope = createMemoryScope({ agentId: 'a1' })
    const v = projectLegacyItems(scope, items)
    expect(v.length).toBe(5)
  })

  it('filter by level', () => {
    const scope = createMemoryScope({ agentId: 'a1' })
    const v = projectLegacyItems(scope, items, { level: 'L1' })
    expect(v.length).toBe(2)
  })

  it('filter by isPrivate', () => {
    const scope = createMemoryScope({ agentId: 'a1' })
    const priv = projectLegacyItems(scope, items, { isPrivate: true })
    expect(priv.length).toBe(4)
  })

  it('filter by minImportance', () => {
    const scope = createMemoryScope({ agentId: 'a1' })
    const important = projectLegacyItems(scope, items, { minImportance: 50 })
    expect(important.length).toBeGreaterThanOrEqual(2)
  })

  it('view item has tableName', () => {
    const scope = createMemoryScope({ agentId: 'a1' })
    const v = projectLegacyItems(scope, items, { level: 'L0' })
    expect(v[0].tableName).toBe(scope.privateTables.sensory)
  })
})

describe('namespaceKey', () => {
  it('prefixes with agentId', () => {
    const scope = createMemoryScope({ agentId: 'a1' })
    expect(namespaceKey(scope, 'foo')).toBe('agent:a1:foo')
  })
})

describe('belongsToAgent', () => {
  it('returns true for matching prefix', () => {
    const scope = createMemoryScope({ agentId: 'a1' })
    expect(belongsToAgent(scope, 'agent:a1:foo')).toBe(true)
  })

  it('returns false for different agent', () => {
    const scope = createMemoryScope({ agentId: 'a1' })
    expect(belongsToAgent(scope, 'agent:a2:foo')).toBe(false)
  })

  it('returns false for unprefixed key', () => {
    const scope = createMemoryScope({ agentId: 'a1' })
    expect(belongsToAgent(scope, 'foo')).toBe(false)
  })
})

describe('planMigration & applyMigration', () => {
  it('plan computes itemCount and tablesMapped', () => {
    const items = [
      makeItem({ id: '1', level: 'L0' }),
      makeItem({ id: '2', level: 'L1' }),
      makeItem({ id: '3', level: 'L3' }),
    ]
    const plan = planMigration('a1', items)
    expect(plan.itemCount).toBe(3)
    expect(plan.tablesMapped).toBe(3) // L0, L1, L3 → 3 different tables
  })

  it('applyMigration logs all items as writes', () => {
    const items = [
      makeItem({ id: '1', level: 'L0' }),
      makeItem({ id: '2', level: 'L1' }),
    ]
    const plan = planMigration('a1', items)
    const after = applyMigration(plan, items)
    expect(after.accessLog.length).toBe(2)
    expect(after.accessLog[0].operation).toBe('write')
  })
})

describe('snapshotMemoryScope', () => {
  it('returns serializable snapshot', () => {
    const scope = createMemoryScope({ agentId: 'a1' })
    const s2 = logLegacyAccess(scope, makeItem(), 'read')
    const snap = snapshotMemoryScope(s2)
    expect(snap.agentId).toBe('a1')
    expect(snap.accessLogCount).toBe(1)
    expect(snap.privateTables).toEqual(scope.privateTables)
  })
})

describe('getRetentionStats', () => {
  it('counts by level', () => {
    const items = [
      makeItem({ id: '1', level: 'L0' }),
      makeItem({ id: '2', level: 'L1' }),
      makeItem({ id: '3', level: 'L1' }),
      makeItem({ id: '4', level: 'L3' }),
    ]
    const scope = createMemoryScope({ agentId: 'a1' })
    const stats = getRetentionStats(scope, items)
    expect(stats.total).toBe(4)
    expect(stats.byLevel.L0).toBe(1)
    expect(stats.byLevel.L1).toBe(2)
    expect(stats.byLevel.L3).toBe(1)
  })

  it('counts expired L2 items', () => {
    const old = Date.now() - 100000
    const items = [
      makeItem({ id: '1', level: 'L2', createdAt: old }),
      makeItem({ id: '2', level: 'L2', createdAt: Date.now() }),
    ]
    const scope = createMemoryScope({ agentId: 'a1', episodicTTL: 1000 })
    const stats = getRetentionStats(scope, items)
    expect(stats.expired).toBe(1)
  })
})
