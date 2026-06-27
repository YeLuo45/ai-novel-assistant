/**
 * integration.test.ts (V2352)
 *
 * Agent Runtime 端到端集成测试：spawn + tick + ACL + hooks + bridge
 * 验证整个系统的协作能力
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  ManagedAgentRuntime,
  AgentHookEmitter,
  MetricsHook,
  AuditLogHook,
  createSoul,
  createUserBinding,
  createMemoryScope,
  createDefaultSandbox,
  spawnEphemeral,
  type SoulTemplate,
} from '../index'

const PLOT_TEMPLATE: SoulTemplate = {
  templateId: 'plot',
  displayName: 'Plot',
  archetype: 'specialist',
  basePersona: {
    displayName: 'Plot', tagline: 't', principles: [],
    tone: { formality: 0.5, warmth: 0.5, intensity: 0.5, humor: 0.5, directness: 0.5 },
    decisionPolicy: { conservative: 0.5, creative: 0.5, reviewThreshold: 0.5, riskTolerance: 0.5 },
  },
  baseCapabilities: ['plot'],
  defaultMemoryScopes: { read: 'team', write: 'self' },
  description: 'plot template',
}

const STYLE_TEMPLATE: SoulTemplate = {
  templateId: 'style',
  displayName: 'Style',
  archetype: 'instructor',
  basePersona: {
    displayName: 'Style', tagline: 't', principles: [],
    tone: { formality: 0.5, warmth: 0.5, intensity: 0.5, humor: 0.5, directness: 0.5 },
    decisionPolicy: { conservative: 0.5, creative: 0.5, reviewThreshold: 0.5, riskTolerance: 0.5 },
  },
  baseCapabilities: ['style'],
  defaultMemoryScopes: { read: 'team', write: 'team' },
  description: 'style template',
}

describe('Agent Runtime — end-to-end', () => {
  it('spawn 2 agents from templates + ACL check + tick + destroy', async () => {
    const rt = new ManagedAgentRuntime()

    // spawn
    const plot = rt.spawn({ template: PLOT_TEMPLATE, agentId: 'plot-1' })
    const style = rt.spawn({ template: STYLE_TEMPLATE, agentId: 'style-1' })
    expect(rt.count()).toBe(2)

    // ACL: cross-agent memory read with team scope = allowed for L3+
    const readL3 = rt.intercept({ kind: 'memory.read', target: 'style-1', level: 'L3' }, 'plot-1')
    expect(readL3.allowed).toBe(true)

    // ACL: cross-agent memory read with team scope = denied for L1
    const readL1 = rt.intercept({ kind: 'memory.read', target: 'style-1', level: 'L1' }, 'plot-1')
    expect(readL1.allowed).toBe(false)

    // touch + tick
    rt.touch('plot-1')
    rt.touch('style-1')
    const tick = rt.tickAll()
    expect(tick.transitioned.length).toBe(0) // 没有超时

    // destroy
    expect(rt.destroy('plot-1')).toBe(true)
    expect(rt.destroy('style-1')).toBe(true)
    expect(rt.count()).toBe(0)
  })

  it('withActor provides full context', async () => {
    const rt = new ManagedAgentRuntime()
    rt.spawn({ template: PLOT_TEMPLATE, agentId: 'plot-1' })
    const result = await rt.withActor('plot-1', async (ctx) => {
      expect(ctx.soul.agentId).toBe('plot-1')
      expect(ctx.userBinding.agentId).toBe('plot-1')
      expect(ctx.memoryScope.agentId).toBe('plot-1')
      expect(ctx.sandbox).toBeDefined()
      return 'ok'
    })
    expect(result).toBe('ok')
  })

  it('withActor returns undefined for unknown agent', async () => {
    const rt = new ManagedAgentRuntime()
    const result = await rt.withActor('unknown', async () => 'should not run')
    expect(result).toBeUndefined()
  })

  it('strict sandbox mode denies cross-agent L1 read', () => {
    const rt = new ManagedAgentRuntime({ sandbox: 'strict' })
    rt.spawn({ template: PLOT_TEMPLATE, agentId: 'p1' })
    rt.spawn({ template: STYLE_TEMPLATE, agentId: 's1' })
    const s = rt.intercept({ kind: 'memory.read', target: 's1', level: 'L1' }, 'p1')
    expect(s.allowed).toBe(false)
  })
})

describe('Agent Runtime — hook integration', () => {
  it('metrics hook records spawn events', () => {
    const rt = new ManagedAgentRuntime()
    const emitter = new AgentHookEmitter()
    const metrics = new MetricsHook()
    metrics.attach(emitter)

    rt.spawn({ template: PLOT_TEMPLATE, agentId: 'p1' })
    rt.spawn({ template: STYLE_TEMPLATE, agentId: 's1' })

    // 手动 emit
    emitter.emitSync('agent.spawn.after', { kind: 'agent.spawn.after', agentId: 'p1', timestamp: Date.now(), archetype: 'specialist', displayName: 'Plot' })
    emitter.emitSync('agent.spawn.after', { kind: 'agent.spawn.after', agentId: 's1', timestamp: Date.now(), archetype: 'instructor', displayName: 'Style' })

    const s = metrics.snapshot()
    expect(s.totalEvents).toBe(2)
    expect(s.byEvent['agent.spawn.after']).toBe(2)
    expect(s.byAgent['p1']).toBe(1)
    expect(s.byAgent['s1']).toBe(1)
  })

  it('audit log records multiple events', () => {
    const emitter = new AgentHookEmitter()
    const audit = new AuditLogHook(10)
    audit.attach(emitter)
    for (let i = 0; i < 5; i++) {
      emitter.emitSync('agent.spawn.after', { kind: 'agent.spawn.after', agentId: `a${i}`, timestamp: Date.now(), archetype: 'specialist', displayName: 'X' })
    }
    expect(audit.count()).toBe(5)
    expect(audit.entriesFor('a2').length).toBe(1)
  })
})

describe('Agent Runtime — bridge integration', () => {
  it('spawn from pre-built soul + bridge verify', () => {
    const soul = createSoul({
      agentId: 'b1',
      archetype: 'critic',
      displayName: 'Bridge Test',
      capabilities: ['plot'],
    })
    const a = spawnEphemeral({ soul, agentId: 'b1' })
    expect(a.soul.persona.displayName).toBe('Bridge Test')
    expect(a.soul.capabilities).toEqual(['plot'])
  })

  it('end-to-end: spawn → ACL → audit', () => {
    const rt = new ManagedAgentRuntime()
    const emitter = new AgentHookEmitter()
    const audit = new AuditLogHook(50)
    audit.attach(emitter)

    rt.spawn({ template: PLOT_TEMPLATE, agentId: 'p1' })
    rt.spawn({ template: STYLE_TEMPLATE, agentId: 's1' })

    // 5 cross-agent ACL checks
    for (let i = 0; i < 5; i++) {
      const s = rt.intercept({ kind: 'memory.read', target: 's1', level: 'L3' }, 'p1')
      emitter.emitSync(s.allowed ? 'sandbox.allowed' : 'sandbox.denied', {
        kind: s.allowed ? 'sandbox.allowed' : 'sandbox.denied',
        agentId: 'p1',
        timestamp: Date.now(),
        opKind: 'memory.read',
        reason: s.reason,
      })
    }
    expect(audit.count()).toBe(5)
    expect(audit.entriesByEvent('sandbox.allowed').length).toBe(5)
  })
})

describe('Agent Runtime — lifecycle integration', () => {
  it('auto-idle after timeout', () => {
    const rt = new ManagedAgentRuntime({
      lifecycle: { idleTimeoutMs: 10, hibernateAfterMs: 100 },
    })
    rt.spawn({ template: PLOT_TEMPLATE, agentId: 'p1', initialStatus: 'active' })
    const r = rt.tickAll(Date.now() + 50)
    expect(r.transitioned.length).toBe(1)
    expect(r.transitioned[0].status).toBe('idle')
  })

  it('auto-destroy after hibernate timeout', () => {
    const rt = new ManagedAgentRuntime({
      lifecycle: { idleTimeoutMs: 10, hibernateAfterMs: 20, destroyAfterMs: 30 },
    })
    rt.spawn({ template: PLOT_TEMPLATE, agentId: 'p1', initialStatus: 'active' })
    rt.tickAll(Date.now() + 15) // -> idle
    rt.tickAll(Date.now() + 25) // -> hibernating
    const r = rt.tickAll(Date.now() + 50) // -> destroyed
    expect(r.transitioned.length).toBe(1)
    expect(r.transitioned[0].status).toBe('destroyed')
    expect(rt.has('p1')).toBe(false)
  })
})
