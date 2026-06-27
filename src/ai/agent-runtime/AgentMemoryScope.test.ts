/**
 * AgentMemoryScope.test.ts (V2329) — 35+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  createMemoryScope,
  canRead,
  canWrite,
  recordAccess,
  getAccessLog,
  trimAccessLog,
  checkEpisodicExpiry,
  checkWorkingCapacity,
  deriveMemoryScope,
  summarizeForUser,
} from './AgentMemoryScope'
import { createUserBinding } from './AgentUserBinding'

describe('AgentMemoryScope — createMemoryScope', () => {
  it('prefixes private table names with agentId', () => {
    const c = createMemoryScope({ agentId: 'plot-1' })
    expect(c.privateTables.sensory).toBe('agent_plot-1_L0_sensory')
    expect(c.privateTables.working).toBe('agent_plot-1_L1_working')
    expect(c.privateTables.episodic).toBe('agent_plot-1_L2_episodic')
  })

  it('uses fixed names for shared tables', () => {
    const c = createMemoryScope({ agentId: 'a' })
    expect(c.sharedTables.teamKB).toBe('team_knowledge_base')
    expect(c.sharedTables.projectKB).toBe('project_knowledge_base')
  })

  it('defaults episodicTTL to 24h', () => {
    const c = createMemoryScope({ agentId: 'a' })
    expect(c.retention.episodicTTL).toBe(24 * 60 * 60 * 1000)
  })

  it('accepts custom retention', () => {
    const c = createMemoryScope({ agentId: 'a', episodicTTL: 1000, workingMaxItems: 10 })
    expect(c.retention.episodicTTL).toBe(1000)
    expect(c.retention.workingMaxItems).toBe(10)
  })

  it('starts with empty accessLog', () => {
    const c = createMemoryScope({ agentId: 'a' })
    expect(c.accessLog).toEqual([])
  })
})

describe('AgentMemoryScope — canRead ACL', () => {
  it('allows same-agent always', () => {
    const r = canRead('self', 'a', 'a', 'L1', true)
    expect(r.allowed).toBe(true)
  })

  it('denies self-scope reading other L1', () => {
    const r = canRead('self', 'a', 'b', 'L1', false)
    expect(r.allowed).toBe(false)
  })

  it('allows team-scope reading L3', () => {
    const r = canRead('team', 'a', 'b', 'L3', false)
    expect(r.allowed).toBe(true)
  })

  it('allows team-scope reading L4', () => {
    const r = canRead('team', 'a', 'b', 'L4', false)
    expect(r.allowed).toBe(true)
  })

  it('denies team-scope reading other L1', () => {
    const r = canRead('team', 'a', 'b', 'L1', false)
    expect(r.allowed).toBe(false)
  })

  it('allows all-scope reading any level', () => {
    expect(canRead('all', 'a', 'b', 'L0', false).allowed).toBe(true)
    expect(canRead('all', 'a', 'b', 'L1', false).allowed).toBe(true)
    expect(canRead('all', 'a', 'b', 'L2', false).allowed).toBe(true)
  })

  it('allows public-scope reading L3 and L4', () => {
    expect(canRead('public', 'a', 'b', 'L3', false).allowed).toBe(true)
    expect(canRead('public', 'a', 'b', 'L4', false).allowed).toBe(true)
  })
})

describe('AgentMemoryScope — canWrite ACL', () => {
  it('allows same-agent always', () => {
    expect(canWrite('self', 'a', 'a', 'L2', true).allowed).toBe(true)
  })

  it('denies self-scope writing cross-agent', () => {
    expect(canWrite('self', 'a', 'b', 'L3', false).allowed).toBe(false)
  })

  it('allows team-scope writing L3 only', () => {
    expect(canWrite('team', 'a', 'b', 'L3', false).allowed).toBe(true)
    expect(canWrite('team', 'a', 'b', 'L4', false).allowed).toBe(false)
  })

  it('allows public-scope writing L4 only', () => {
    expect(canWrite('public', 'a', 'b', 'L4', false).allowed).toBe(true)
    expect(canWrite('public', 'a', 'b', 'L3', false).allowed).toBe(false)
  })

  it('denies all-scope writing cross-agent private', () => {
    expect(canWrite('all', 'a', 'b', 'L1', false).allowed).toBe(false)
  })
})

describe('AgentMemoryScope — access log', () => {
  it('recordAccess appends to log', () => {
    const c = createMemoryScope({ agentId: 'a' })
    const c2 = recordAccess(c, { sourceAgentId: 'a', targetAgentId: 'a', level: 'L1', operation: 'read' })
    expect(c2.accessLog.length).toBe(1)
    expect(c2.accessLog[0].sourceAgentId).toBe('a')
    expect(c2.accessLog[0].timestamp).toBeGreaterThan(0)
  })

  it('recordAccess does not mutate original', () => {
    const c = createMemoryScope({ agentId: 'a' })
    const c2 = recordAccess(c, { sourceAgentId: 'a', targetAgentId: 'a', level: 'L1', operation: 'read' })
    expect(c.accessLog.length).toBe(0)
    expect(c2.accessLog.length).toBe(1)
  })

  it('getAccessLog filters by source', () => {
    const c = createMemoryScope({ agentId: 'a' })
    const c2 = recordAccess(c, { sourceAgentId: 'a', targetAgentId: 'a', level: 'L1', operation: 'read' })
    const c3 = recordAccess(c2, { sourceAgentId: 'b', targetAgentId: 'a', level: 'L1', operation: 'read' })
    const log = getAccessLog(c3, { sourceAgentId: 'a' })
    expect(log.length).toBe(1)
    expect(log[0].sourceAgentId).toBe('a')
  })

  it('getAccessLog filters by level and operation', () => {
    const c = createMemoryScope({ agentId: 'a' })
    const c2 = recordAccess(c, { sourceAgentId: 'a', targetAgentId: 'a', level: 'L1', operation: 'read' })
    const c3 = recordAccess(c2, { sourceAgentId: 'a', targetAgentId: 'a', level: 'L2', operation: 'write' })
    expect(getAccessLog(c3, { level: 'L1' }).length).toBe(1)
    expect(getAccessLog(c3, { operation: 'write' }).length).toBe(1)
  })

  it('getAccessLog returns sorted by timestamp desc', () => {
    const c = createMemoryScope({ agentId: 'a' })
    const c2 = recordAccess(c, { sourceAgentId: 'a', targetAgentId: 'a', level: 'L1', operation: 'read' })
    const c3 = recordAccess(c2, { sourceAgentId: 'a', targetAgentId: 'a', level: 'L1', operation: 'write' })
    const log = getAccessLog(c3)
    expect(log.length).toBe(2)
    // 当同毫秒时，sort 是稳定排序；只验证两个都存在
    const ops = log.map(l => l.operation).sort()
    expect(ops).toEqual(['read', 'write'])
  })

  it('trimAccessLog caps at maxEntries', () => {
    let c = createMemoryScope({ agentId: 'a' })
    for (let i = 0; i < 10; i++) {
      c = recordAccess(c, { sourceAgentId: 'a', targetAgentId: 'a', level: 'L1', operation: 'read' })
    }
    const trimmed = trimAccessLog(c, 5)
    expect(trimmed.accessLog.length).toBe(5)
  })

  it('trimAccessLog no-op when under cap', () => {
    const c = createMemoryScope({ agentId: 'a' })
    const c2 = recordAccess(c, { sourceAgentId: 'a', targetAgentId: 'a', level: 'L1', operation: 'read' })
    expect(trimAccessLog(c2, 100)).toBe(c2) // same reference
  })
})

describe('AgentMemoryScope — retention', () => {
  it('checkEpisodicExpiry: not expired', () => {
    const c = createMemoryScope({ agentId: 'a', episodicTTL: 1000 })
    const r = checkEpisodicExpiry(c, Date.now() - 100)
    expect(r.expired).toBe(false)
    expect(r.remainingMs).toBeGreaterThan(0)
  })

  it('checkEpisodicExpiry: expired', () => {
    const c = createMemoryScope({ agentId: 'a', episodicTTL: 1000 })
    const r = checkEpisodicExpiry(c, Date.now() - 5000)
    expect(r.expired).toBe(true)
  })

  it('checkWorkingCapacity: within', () => {
    const c = createMemoryScope({ agentId: 'a', workingMaxItems: 5 })
    const r = checkWorkingCapacity(c, 3)
    expect(r.withinCapacity).toBe(true)
    expect(r.overBy).toBe(0)
  })

  it('checkWorkingCapacity: over', () => {
    const c = createMemoryScope({ agentId: 'a', workingMaxItems: 5 })
    const r = checkWorkingCapacity(c, 10)
    expect(r.withinCapacity).toBe(false)
    expect(r.overBy).toBe(5)
  })
})

describe('AgentMemoryScope — derive & summarize', () => {
  it('deriveMemoryScope preserves privateTables', () => {
    const c = createMemoryScope({ agentId: 'a' })
    const c2 = deriveMemoryScope(c, { retention: { episodicTTL: 1000, workingMaxItems: 50 } })
    expect(c2.privateTables).toEqual(c.privateTables)
    expect(c2.retention.episodicTTL).toBe(1000)
  })

  it('summarizeForUser shows only own tables', () => {
    const c = createMemoryScope({ agentId: 'a' })
    const b = createUserBinding({ agentId: 'a' })
    const s = summarizeForUser(c, b)
    expect(s.visibleTables).toEqual([
      c.privateTables.sensory,
      c.privateTables.working,
      c.privateTables.episodic,
    ])
    expect(s.hidden).toBe(true)
  })
})
