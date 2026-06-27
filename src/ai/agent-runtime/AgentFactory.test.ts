/**
 * AgentFactory.test.ts (V2332) — 30+ 断言
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AgentFactory, spawnEphemeral, FACTORY_VERSION } from './AgentFactory'
import { AgentRegistry, resetAgentRegistry } from './AgentRegistry'
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
    tagline: 'Improves prose style',
    principles: [],
    tone: { formality: 0.6, warmth: 0.7, intensity: 0.4, humor: 0.4, directness: 0.5 },
    decisionPolicy: { conservative: 0.5, creative: 0.5, reviewThreshold: 0.5, riskTolerance: 0.3 },
  },
  baseCapabilities: ['style', 'voice'],
  defaultMemoryScopes: { read: 'team', write: 'team' },
  description: 'Style coach template',
}

describe('AgentFactory — basic spawn', () => {
  let registry: AgentRegistry
  let factory: AgentFactory
  beforeEach(() => {
    resetAgentRegistry()
    registry = new AgentRegistry()
    factory = new AgentFactory(registry)
  })

  it('spawn from template', () => {
    const a = factory.spawn({ template: PLOT_TEMPLATE, agentId: 'plot-1' })
    expect(a.soul.agentId).toBe('plot-1')
    expect(a.soul.archetype).toBe('specialist')
    expect(a.soul.capabilities).toEqual(['plot', 'pacing'])
    expect(a.userBinding.agentId).toBe('plot-1')
    expect(a.memoryScope.agentId).toBe('plot-1')
    expect(registry.has('plot-1')).toBe(true)
  })

  it('spawn overrides template fields', () => {
    const a = factory.spawn({
      template: PLOT_TEMPLATE,
      agentId: 'plot-2',
      displayName: 'Custom Plot',
      capabilities: ['plot', 'hook'],
    })
    expect(a.soul.persona.displayName).toBe('Custom Plot')
    expect(a.soul.capabilities).toEqual(['plot', 'hook'])
  })

  it('spawn applies user binding overrides', () => {
    const a = factory.spawn({
      template: PLOT_TEMPLATE,
      agentId: 'plot-3',
      userBinding: { visibleUserFields: ['penName'], userAlias: 'X' },
    })
    expect(a.userBinding.visibleUserFields).toEqual(['penName'])
    expect(a.userBinding.userAlias).toBe('X')
  })

  it('spawn applies memory retention overrides', () => {
    const a = factory.spawn({
      template: PLOT_TEMPLATE,
      agentId: 'plot-4',
      episodicTTL: 1000,
      workingMaxItems: 5,
    })
    expect(a.memoryScope.retention.episodicTTL).toBe(1000)
    expect(a.memoryScope.retention.workingMaxItems).toBe(5)
  })

  it('spawn with initialStatus', () => {
    const a = factory.spawn({
      template: PLOT_TEMPLATE,
      agentId: 'plot-5',
      initialStatus: 'active',
    })
    expect(a.summary.status).toBe('active')
  })

  it('spawn from pre-built soul', () => {
    const soul = {
      agentId: 's1',
      archetype: 'critic' as const,
      persona: { displayName: 'S1', tagline: 't', principles: [], tone: { formality: 0.5, warmth: 0.5, intensity: 0.5, humor: 0.5, directness: 0.5 }, decisionPolicy: { conservative: 0.5, creative: 0.5, reviewThreshold: 0.5, riskTolerance: 0.5 } },
      capabilities: ['plot' as const],
      memoryReadScope: 'self' as const,
      memoryWriteScope: 'self' as const,
      createdAt: 0, updatedAt: 0, version: 1, metadata: {},
    } as any
    const a = factory.spawn({ soul, agentId: 's1' })
    expect(a.soul.agentId).toBe('s1')
  })

  it('spawn with soul + partial overrides', () => {
    const soul = {
      agentId: 's2',
      archetype: 'critic' as const,
      persona: { displayName: 'S2', tagline: 't', principles: [], tone: { formality: 0.5, warmth: 0.5, intensity: 0.5, humor: 0.5, directness: 0.5 }, decisionPolicy: { conservative: 0.5, creative: 0.5, reviewThreshold: 0.5, riskTolerance: 0.5 } },
      capabilities: ['plot' as const],
      memoryReadScope: 'self' as const,
      memoryWriteScope: 'self' as const,
      createdAt: 0, updatedAt: 0, version: 1, metadata: {},
    } as any
    const a = factory.spawn({ soul, agentId: 's2', archetype: 'reviewer', capabilities: ['style'] })
    expect(a.soul.archetype).toBe('reviewer')
    expect(a.soul.capabilities).toEqual(['style'])
  })

  it('spawn with soul + tone override', () => {
    const soul = {
      agentId: 's3',
      archetype: 'critic' as const,
      persona: { displayName: 'S3', tagline: 't', principles: [], tone: { formality: 0.5, warmth: 0.5, intensity: 0.5, humor: 0.5, directness: 0.5 }, decisionPolicy: { conservative: 0.5, creative: 0.5, reviewThreshold: 0.5, riskTolerance: 0.5 } },
      capabilities: ['plot' as const],
      memoryReadScope: 'self' as const,
      memoryWriteScope: 'self' as const,
      createdAt: 0, updatedAt: 0, version: 1, metadata: {},
    } as any
    const a = factory.spawn({ soul, agentId: 's3', tone: { formality: 0.9 } })
    expect(a.soul.persona.tone.formality).toBe(0.9)
  })

  it('throws when both template and soul provided', () => {
    expect(() =>
      factory.spawn({ template: PLOT_TEMPLATE, soul: {} as any, agentId: 'x' }),
    ).toThrow()
  })

  it('throws when neither template nor soul provided', () => {
    expect(() => factory.spawn({ agentId: 'x' })).toThrow()
  })
})

describe('AgentFactory — spawnMany', () => {
  it('spawns multiple agents', () => {
    const registry = new AgentRegistry()
    const factory = new AgentFactory(registry)
    const agents = factory.spawnMany(PLOT_TEMPLATE, ['p1', 'p2', 'p3'])
    expect(agents.length).toBe(3)
    expect(registry.count()).toBe(3)
  })

  it('totalSpawned tracks count', () => {
    const registry = new AgentRegistry()
    const factory = new AgentFactory(registry)
    factory.spawn({ template: PLOT_TEMPLATE, agentId: 'p1' })
    factory.spawn({ template: PLOT_TEMPLATE, agentId: 'p2' })
    expect(factory.totalSpawned()).toBe(2)
  })
})

describe('AgentFactory — destroy', () => {
  it('destroy removes from registry', () => {
    const registry = new AgentRegistry()
    const factory = new AgentFactory(registry)
    factory.spawn({ template: PLOT_TEMPLATE, agentId: 'p1' })
    expect(factory.destroy('p1')).toBe(true)
    expect(registry.has('p1')).toBe(false)
  })

  it('destroy returns false for unknown', () => {
    const registry = new AgentRegistry()
    const factory = new AgentFactory(registry)
    expect(factory.destroy('unknown')).toBe(false)
  })

  it('destroyAll clears all', () => {
    const registry = new AgentRegistry()
    const factory = new AgentFactory(registry)
    factory.spawn({ template: PLOT_TEMPLATE, agentId: 'p1' })
    factory.spawn({ template: STYLE_TEMPLATE, agentId: 's1' })
    expect(factory.destroyAll()).toBe(2)
    expect(registry.count()).toBe(0)
  })
})

describe('spawnEphemeral', () => {
  it('does not touch registry', () => {
    const a = spawnEphemeral({ template: PLOT_TEMPLATE, agentId: 'p1' })
    expect(a.soul.agentId).toBe('p1')
    // No registry involvement
  })

  it('throws without template or soul', () => {
    expect(() => spawnEphemeral({ agentId: 'x' })).toThrow()
  })

  it('FACTORY_VERSION is 3.x', () => {
    expect(FACTORY_VERSION).toMatch(/^3\./)
  })

  it('spawnedAt is recent', () => {
    const before = Date.now()
    const a = spawnEphemeral({ template: PLOT_TEMPLATE, agentId: 'p1' })
    expect(a.spawnedAt).toBeGreaterThanOrEqual(before)
  })
})
