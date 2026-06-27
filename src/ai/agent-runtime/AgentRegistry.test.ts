/**
 * AgentRegistry.test.ts (V2331) — 35+ 断言
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  AgentRegistry,
  getAgentRegistry,
  resetAgentRegistry,
  type AgentSummary,
} from './AgentRegistry'
import { createSoul } from './AgentSoul'

const baseSoul = (agentId: string) => createSoul({
  agentId,
  archetype: 'critic',
  displayName: `Test-${agentId}`,
  capabilities: ['plot', 'style'],
})

describe('AgentRegistry — register/unregister', () => {
  let r: AgentRegistry
  beforeEach(() => {
    r = new AgentRegistry()
  })

  it('register adds a summary', () => {
    const s = r.register({ soul: baseSoul('a1') })
    expect(s.agentId).toBe('a1')
    expect(r.count()).toBe(1)
  })

  it('register in strict mode throws on duplicate', () => {
    r.register({ soul: baseSoul('a1') })
    expect(() => r.register({ soul: baseSoul('a1') })).toThrow()
  })

  it('register in non-strict mode overrides on duplicate', () => {
    r.setStrict(false)
    r.register({ soul: baseSoul('a1') })
    const s = r.register({ soul: baseSoul('a1') })
    expect(s.agentId).toBe('a1')
    expect(r.count()).toBe(1)
  })

  it('unregister removes agent', () => {
    r.register({ soul: baseSoul('a1') })
    expect(r.unregister('a1')).toBe(true)
    expect(r.has('a1')).toBe(false)
  })

  it('unregister returns false for unknown', () => {
    expect(r.unregister('unknown')).toBe(false)
  })

  it('has returns correct boolean', () => {
    r.register({ soul: baseSoul('a1') })
    expect(r.has('a1')).toBe(true)
    expect(r.has('a2')).toBe(false)
  })

  it('get returns undefined for unknown', () => {
    expect(r.get('unknown')).toBeUndefined()
  })

  it('mustGet throws for unknown', () => {
    expect(() => r.mustGet('unknown')).toThrow()
  })

  it('clear removes all', () => {
    r.register({ soul: baseSoul('a1') })
    r.register({ soul: baseSoul('a2') })
    const n = r.clear()
    expect(n).toBe(2)
    expect(r.count()).toBe(0)
  })
})

describe('AgentRegistry — query', () => {
  let r: AgentRegistry
  beforeEach(() => {
    r = new AgentRegistry()
    r.register({ soul: createSoul({ agentId: 'a1', archetype: 'critic', displayName: 'A1', capabilities: ['plot'] }) })
    r.register({ soul: createSoul({ agentId: 'a2', archetype: 'reviewer', displayName: 'A2', capabilities: ['style'] }) })
    r.register({ soul: createSoul({ agentId: 'a3', archetype: 'critic', displayName: 'A3', capabilities: ['plot', 'pacing'] }) })
    r.register({ soul: createSoul({ agentId: 'a4', archetype: 'assistant', displayName: 'A4', capabilities: ['style'] }), tags: ['beta'] })
  })

  it('list returns all sorted by spawnedAt', () => {
    const all = r.list()
    expect(all.length).toBe(4)
  })

  it('findByArchetype filters correctly', () => {
    const critics = r.findByArchetype('critic')
    expect(critics.length).toBe(2)
    expect(critics.map(c => c.agentId).sort()).toEqual(['a1', 'a3'])
  })

  it('findByCapability filters correctly', () => {
    const plotAgents = r.findByCapability('plot')
    expect(plotAgents.length).toBe(2)
  })

  it('findByAllCapabilities requires all caps', () => {
    const both = r.findByAllCapabilities(['plot', 'pacing'])
    expect(both.map(b => b.agentId)).toEqual(['a3'])
  })

  it('findByTag filters by tag', () => {
    const beta = r.findByTag('beta')
    expect(beta.length).toBe(1)
    expect(beta[0].agentId).toBe('a4')
  })

  it('findByStatus filters by lifecycle status', () => {
    r.updateStatus('a1', 'active')
    expect(r.findByStatus('active').length).toBe(1)
    expect(r.findByStatus('spawning').length).toBe(3)
  })
})

describe('AgentRegistry — update / touch', () => {
  let r: AgentRegistry
  beforeEach(() => {
    r = new AgentRegistry()
  })

  it('updateStatus changes status and touches lastActiveAt', async () => {
    r.register({ soul: baseSoul('a1') })
    const before = r.get('a1')!.lastActiveAt
    await new Promise(r => setTimeout(r, 5))
    const updated = r.updateStatus('a1', 'active')
    expect(updated.status).toBe('active')
    expect(updated.lastActiveAt).toBeGreaterThan(before)
  })

  it('updateStatus throws for unknown agent', () => {
    expect(() => r.updateStatus('unknown', 'active')).toThrow()
  })

  it('touch updates lastActiveAt without changing status', () => {
    r.register({ soul: baseSoul('a1') })
    const before = r.get('a1')!.status
    r.touch('a1')
    expect(r.get('a1')!.status).toBe(before)
  })

  it('touch is no-op for unknown agent', () => {
    r.touch('unknown') // should not throw
  })
})

describe('AgentRegistry — snapshot/restore', () => {
  it('snapshot returns deep copy', () => {
    const r = new AgentRegistry()
    r.register({ soul: baseSoul('a1'), tags: ['a', 'b'] })
    const snap = r.snapshot()
    expect(snap.length).toBe(1)
    snap[0].tags.push('c') // mutate snapshot
    expect(r.get('a1')!.tags).toEqual(['a', 'b']) // original not affected
  })

  it('restore replaces contents', () => {
    const r = new AgentRegistry()
    r.register({ soul: baseSoul('a1') })
    const newR = new AgentRegistry()
    newR.restore(r.snapshot())
    expect(newR.has('a1')).toBe(true)
    expect(newR.count()).toBe(1)
  })
})

describe('AgentRegistry — singleton', () => {
  beforeEach(() => resetAgentRegistry())

  it('getAgentRegistry returns same instance', () => {
    const a = getAgentRegistry()
    const b = getAgentRegistry()
    expect(a).toBe(b)
  })

  it('resetAgentRegistry clears singleton', () => {
    const a = getAgentRegistry()
    resetAgentRegistry()
    const b = getAgentRegistry()
    expect(a).not.toBe(b)
  })
})
