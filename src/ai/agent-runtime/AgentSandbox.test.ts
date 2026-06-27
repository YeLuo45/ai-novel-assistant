/**
 * AgentSandbox.test.ts (V2333) — 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  AgentSandbox,
  createDefaultSandbox,
  createStrictSandbox,
  applySanctionToScope,
  type SandboxOp,
} from './AgentSandbox'
import { createSoul } from './AgentSoul'
import { createMemoryScope } from './AgentMemoryScope'

const makeActor = (agentId: string) => {
  const soul = createSoul({
    agentId,
    archetype: 'critic',
    displayName: agentId,
    capabilities: ['plot'],
    memoryReadScope: 'team',
    memoryWriteScope: 'self',
    toolWhitelist: ['plot_tool', 'style_tool'],
  })
  const memoryScope = createMemoryScope({ agentId })
  return { soul, memoryScope, agentId }
}

describe('AgentSandbox — memory read/write', () => {
  it('allows same-agent memory read', () => {
    const sb = createDefaultSandbox()
    const a = makeActor('a1')
    const r = sb.intercept({ kind: 'memory.read', target: 'a1', level: 'L1' }, a)
    expect(r.allowed).toBe(true)
    expect(r.violation).toBe(false)
  })

  it('denies self-scope reading other L1', () => {
    const sb = createDefaultSandbox()
    const a = makeActor('a1')
    a.soul = createSoul({ ...{}, agentId: 'a1', archetype: 'critic', displayName: 'a1', capabilities: ['plot'], memoryReadScope: 'self' })
    const r = sb.intercept({ kind: 'memory.read', target: 'a2', level: 'L1' }, a)
    expect(r.allowed).toBe(false)
    expect(r.violation).toBe(true)
  })

  it('allows team-scope reading L3', () => {
    const sb = createDefaultSandbox()
    const a = makeActor('a1')
    const r = sb.intercept({ kind: 'memory.read', target: 'a2', level: 'L3' }, a)
    expect(r.allowed).toBe(true)
  })

  it('denies team-scope writing cross-agent L3 if write scope is self', () => {
    const sb = createDefaultSandbox()
    const a = makeActor('a1')
    a.soul = createSoul({ ...{}, agentId: 'a1', archetype: 'critic', displayName: 'a1', capabilities: ['plot'], memoryReadScope: 'team', memoryWriteScope: 'self' })
    const r = sb.intercept({ kind: 'memory.write', target: 'a2', level: 'L3' }, a)
    expect(r.allowed).toBe(false)
  })

  it('allows team-scope writing L3 if write scope is team', () => {
    const sb = createDefaultSandbox()
    const a = makeActor('a1')
    a.soul = createSoul({ ...{}, agentId: 'a1', archetype: 'critic', displayName: 'a1', capabilities: ['plot'], memoryReadScope: 'team', memoryWriteScope: 'team' })
    const r = sb.intercept({ kind: 'memory.write', target: 'a2', level: 'L3' }, a)
    expect(r.allowed).toBe(true)
  })
})

describe('AgentSandbox — tool call', () => {
  it('allows whitelisted tool', () => {
    const sb = createDefaultSandbox()
    const a = makeActor('a1')
    const r = sb.intercept({ kind: 'tool.call', tool: 'plot_tool' }, a)
    expect(r.allowed).toBe(true)
  })

  it('denies non-whitelisted tool', () => {
    const sb = createDefaultSandbox()
    const a = makeActor('a1')
    const r = sb.intercept({ kind: 'tool.call', tool: 'evil_tool' }, a)
    expect(r.allowed).toBe(false)
    expect(r.violation).toBe(true)
  })

  it('allows any tool when whitelist is empty (no restriction)', () => {
    const sb = createDefaultSandbox()
    const a = makeActor('a1')
    a.soul = createSoul({ ...{}, agentId: 'a1', archetype: 'critic', displayName: 'a1', capabilities: ['plot'], toolWhitelist: undefined })
    const r = sb.intercept({ kind: 'tool.call', tool: 'any_tool' }, a)
    expect(r.allowed).toBe(true)
  })

  it('allows * wildcard', () => {
    const sb = createDefaultSandbox()
    const a = makeActor('a1')
    a.soul = createSoul({ ...{}, agentId: 'a1', archetype: 'critic', displayName: 'a1', capabilities: ['plot'], toolWhitelist: ['*'] })
    const r = sb.intercept({ kind: 'tool.call', tool: 'whatever' }, a)
    expect(r.allowed).toBe(true)
  })
})

describe('AgentSandbox — agent message', () => {
  it('allows same-agent message', () => {
    const sb = createDefaultSandbox()
    const a = makeActor('a1')
    const r = sb.intercept({ kind: 'agent.message', from: 'a1', to: 'a1' }, a)
    expect(r.allowed).toBe(true)
  })

  it('allows cross-team message when scope is team', () => {
    const sb = createDefaultSandbox()
    const a = makeActor('a1')
    const r = sb.intercept({ kind: 'agent.message', from: 'a1', to: 'a2' }, a)
    expect(r.allowed).toBe(true)
  })

  it('denies cross-team message when scope is self', () => {
    const sb = createDefaultSandbox()
    const a = makeActor('a1')
    a.soul = createSoul({ ...{}, agentId: 'a1', archetype: 'critic', displayName: 'a1', capabilities: ['plot'], memoryReadScope: 'self' })
    const r = sb.intercept({ kind: 'agent.message', from: 'a1', to: 'a2' }, a)
    expect(r.allowed).toBe(false)
  })
})

describe('AgentSandbox — agent inspect', () => {
  it('allows same-agent inspect', () => {
    const sb = createDefaultSandbox()
    const a = makeActor('a1')
    const r = sb.intercept({ kind: 'agent.inspect', target: 'a1' }, a)
    expect(r.allowed).toBe(true)
  })

  it('allows cross-agent inspect when scope is team', () => {
    const sb = createDefaultSandbox()
    const a = makeActor('a1')
    const r = sb.intercept({ kind: 'agent.inspect', target: 'a2' }, a)
    expect(r.allowed).toBe(true)
  })
})

describe('AgentSandbox — strict mode', () => {
  it('strictSandbox denies cross-agent L1 read', () => {
    const sb = createStrictSandbox()
    const a = makeActor('a1')
    const r = sb.intercept({ kind: 'memory.read', target: 'a2', level: 'L1' }, a)
    expect(r.allowed).toBe(false)
    expect(r.reason).toContain('custom deny')
  })

  it('strictSandbox allows cross-agent L3 read', () => {
    const sb = createStrictSandbox()
    const a = makeActor('a1')
    const r = sb.intercept({ kind: 'memory.read', target: 'a2', level: 'L3' }, a)
    expect(r.allowed).toBe(true)
  })
})

describe('AgentSandbox — batch & apply', () => {
  it('interceptBatch processes multiple ops', () => {
    const sb = createDefaultSandbox()
    const a = makeActor('a1')
    const ops: SandboxOp[] = [
      { kind: 'memory.read', target: 'a1', level: 'L1' },
      { kind: 'tool.call', tool: 'plot_tool' },
      { kind: 'tool.call', tool: 'evil_tool' },
    ]
    const sanctions = sb.interceptBatch(ops, a)
    expect(sanctions.length).toBe(3)
    expect(sanctions[0].allowed).toBe(true)
    expect(sanctions[1].allowed).toBe(true)
    expect(sanctions[2].allowed).toBe(false)
  })

  it('applySanctionToScope appends to access log', () => {
    const sb = createDefaultSandbox()
    const a = makeActor('a1')
    const s = sb.intercept({ kind: 'memory.read', target: 'a1', level: 'L1' }, a)
    const c2 = applySanctionToScope(a.memoryScope, s)
    expect(c2.accessLog.length).toBe(1)
    expect(c2.accessLog[0].sourceAgentId).toBe('a1')
  })

  it('applySanctionToScope does not mutate original', () => {
    const sb = createDefaultSandbox()
    const a = makeActor('a1')
    const s = sb.intercept({ kind: 'memory.read', target: 'a1', level: 'L1' }, a)
    const c2 = applySanctionToScope(a.memoryScope, s)
    expect(a.memoryScope.accessLog.length).toBe(0)
    expect(c2.accessLog.length).toBe(1)
  })
})
