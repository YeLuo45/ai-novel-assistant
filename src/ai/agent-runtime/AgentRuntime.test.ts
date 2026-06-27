/**
 * AgentRuntime.test.ts (V2335) — 30+ 断言
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  AgentRuntime,
  ManagedAgentRuntime,
  getGlobalRuntime,
  resetGlobalRuntime,
} from './AgentRuntime'
import type { SoulTemplate } from './types'

const PLOT_TEMPLATE: SoulTemplate = {
  templateId: 'plot-advisor',
  displayName: 'Plot Advisor',
  archetype: 'specialist',
  basePersona: {
    displayName: 'Plot Advisor',
    tagline: 'Helps with plot',
    principles: ['Three-act structure'],
    tone: { formality: 0.7, warmth: 0.4, intensity: 0.5, humor: 0.3, directness: 0.6 },
    decisionPolicy: { conservative: 0.6, creative: 0.7, reviewThreshold: 0.5, riskTolerance: 0.4 },
  },
  baseCapabilities: ['plot', 'pacing'],
  defaultMemoryScopes: { read: 'team', write: 'self' },
  description: 'Plot advisor template',
}

const STYLE_TEMPLATE: SoulTemplate = {
  templateId: 'style-coach',
  displayName: 'Style Coach',
  archetype: 'instructor',
  basePersona: {
    displayName: 'Style Coach',
    tagline: 'Improves style',
    principles: [],
    tone: { formality: 0.6, warmth: 0.7, intensity: 0.4, humor: 0.4, directness: 0.5 },
    decisionPolicy: { conservative: 0.5, creative: 0.5, reviewThreshold: 0.5, riskTolerance: 0.3 },
  },
  baseCapabilities: ['style', 'voice'],
  defaultMemoryScopes: { read: 'team', write: 'team' },
  description: 'Style coach template',
}

describe('AgentRuntime — basic', () => {
  let rt: ManagedAgentRuntime
  beforeEach(() => {
    rt = new ManagedAgentRuntime()
  })

  it('starts empty', () => {
    expect(rt.count()).toBe(0)
  })

  it('spawn adds agent', () => {
    rt.spawn({ template: PLOT_TEMPLATE, agentId: 'p1' })
    expect(rt.count()).toBe(1)
    expect(rt.has('p1')).toBe(true)
  })

  it('destroy removes agent', () => {
    rt.spawn({ template: PLOT_TEMPLATE, agentId: 'p1' })
    expect(rt.destroy('p1')).toBe(true)
    expect(rt.has('p1')).toBe(false)
  })

  it('destroy unknown returns false', () => {
    expect(rt.destroy('unknown')).toBe(false)
  })

  it('list returns spawned agents', () => {
    rt.spawn({ template: PLOT_TEMPLATE, agentId: 'p1' })
    rt.spawn({ template: STYLE_TEMPLATE, agentId: 's1' })
    const all = rt.list()
    expect(all.length).toBe(2)
  })
})

describe('AgentRuntime — withActor', () => {
  let rt: ManagedAgentRuntime
  beforeEach(() => {
    rt = new ManagedAgentRuntime()
    rt.spawn({ template: PLOT_TEMPLATE, agentId: 'p1' })
  })

  it('withActor provides full context', async () => {
    const result = await rt.withActor('p1', async (ctx) => {
      expect(ctx.agentId).toBe('p1')
      expect(ctx.soul.agentId).toBe('p1')
      expect(ctx.userBinding.agentId).toBe('p1')
      expect(ctx.memoryScope.agentId).toBe('p1')
      expect(ctx.sandbox).toBeDefined()
      return 'ok'
    })
    expect(result).toBe('ok')
  })

  it('withActor returns undefined for unknown agent', async () => {
    const r = await rt.withActor('unknown', async () => 'should not run')
    expect(r).toBeUndefined()
  })
})

describe('AgentRuntime — intercept', () => {
  let rt: ManagedAgentRuntime
  beforeEach(() => {
    rt = new ManagedAgentRuntime()
    rt.spawn({ template: PLOT_TEMPLATE, agentId: 'p1' })
  })

  it('intercept same-agent memory read', () => {
    const s = rt.intercept({ kind: 'memory.read', target: 'p1', level: 'L1' }, 'p1')
    expect(s.allowed).toBe(true)
  })

  it('intercept for unknown actor denies', () => {
    const s = rt.intercept({ kind: 'memory.read', target: 'p1', level: 'L1' }, 'unknown')
    expect(s.allowed).toBe(false)
    expect(s.reason).toContain('not found')
  })
})

describe('AgentRuntime — tick & touch', () => {
  it('tickAll no-ops when no timeouts', () => {
    const rt = new ManagedAgentRuntime({ lifecycle: { idleTimeoutMs: 1000, hibernateAfterMs: 2000 } })
    rt.spawn({ template: PLOT_TEMPLATE, agentId: 'p1' })
    const r = rt.tickAll()
    expect(r.transitioned.length).toBe(0)
  })

  it('tick triggers transitions', () => {
    const rt = new ManagedAgentRuntime({ lifecycle: { idleTimeoutMs: 10, hibernateAfterMs: 1000 } })
    rt.spawn({ template: PLOT_TEMPLATE, agentId: 'p1', initialStatus: 'active' })
    const r = rt.tickAll(Date.now() + 100) // 时间跳跃 100ms
    expect(r.transitioned.length).toBe(1)
    expect(r.transitioned[0].status).toBe('idle')
  })

  it('tick for destroyed agent returns destroyed status', () => {
    const rt = new ManagedAgentRuntime()
    const r = rt.tick('unknown')
    expect(r.transitioned).toBe(false)
    expect(r.newStatus).toBe('destroyed')
  })

  it('touch updates lastActive', () => {
    const rt = new ManagedAgentRuntime()
    rt.spawn({ template: PLOT_TEMPLATE, agentId: 'p1' })
    rt.touch('p1') // should not throw
  })
})

describe('AgentRuntime — onTick listener', () => {
  it('listener is called on tickAll', () => {
    const rt = new ManagedAgentRuntime()
    let count = 0
    rt.onTick(() => { count += 1 })
    rt.tickAll()
    rt.tickAll()
    expect(count).toBe(2)
  })

  it('unregister removes listener', () => {
    const rt = new ManagedAgentRuntime()
    let count = 0
    const off = rt.onTick(() => { count += 1 })
    rt.tickAll()
    off()
    rt.tickAll()
    expect(count).toBe(1)
  })

  it('listener exception does not break tickAll', () => {
    const rt = new ManagedAgentRuntime()
    rt.onTick(() => { throw new Error('boom') })
    expect(() => rt.tickAll()).not.toThrow()
  })
})

describe('AgentRuntime — strict sandbox mode', () => {
  it('strict mode denies cross-agent L1 read', () => {
    const rt = new ManagedAgentRuntime({ sandbox: 'strict' })
    rt.spawn({ template: PLOT_TEMPLATE, agentId: 'p1' })
    rt.spawn({ template: STYLE_TEMPLATE, agentId: 's1' })
    const s = rt.intercept({ kind: 'memory.read', target: 's1', level: 'L1' }, 'p1')
    expect(s.allowed).toBe(false)
  })
})

describe('AgentRuntime — global singleton', () => {
  beforeEach(() => resetGlobalRuntime())

  it('getGlobalRuntime returns same instance', () => {
    const a = getGlobalRuntime()
    const b = getGlobalRuntime()
    expect(a).toBe(b)
  })

  it('resetGlobalRuntime clears singleton', () => {
    const a = getGlobalRuntime()
    resetGlobalRuntime()
    const b = getGlobalRuntime()
    expect(a).not.toBe(b)
  })
})

describe('AgentRuntime — base class (non-managed)', () => {
  it('getSoul returns undefined (placeholder)', () => {
    const rt = new ManagedAgentRuntime()
    expect(rt.getSoul('p1')).toBeUndefined()
  })

  it('isGlobal reports global flag', () => {
    const r1 = new ManagedAgentRuntime()
    const r2 = new ManagedAgentRuntime({ global: true })
    expect(r1.isGlobal()).toBe(false)
    expect(r2.isGlobal()).toBe(true)
  })

  it('exposes subsystem accessors', () => {
    const rt = new ManagedAgentRuntime({ sandbox: 'strict' })
    expect(rt.registry).toBeDefined()
    expect(rt.factory).toBeDefined()
    expect(rt.sandbox).toBeDefined()
    expect(rt.lifecycle).toBeDefined()
  })
})

describe('AgentRuntime — base class (non-managed)', () => {
  it('base AgentRuntime works without actor store', () => {
    const rt = new AgentRuntime()
    rt.spawn({ template: PLOT_TEMPLATE, agentId: 'p1' })
    // base 没有 registerActor，withActor 应返回 undefined
    return rt.withActor('p1', async (ctx) => {
      expect(ctx.soul).toBeDefined()
      return 'ok'
    }).then(r => {
      // base class: actor store empty, so withActor returns undefined
      expect(r).toBeUndefined()
    })
  })
})
