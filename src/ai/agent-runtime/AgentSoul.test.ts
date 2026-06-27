/**
 * AgentSoul.test.ts (V2327) — 30+ 断言
 *
 * 覆盖：createSoul / cloneSoul / deriveSoul / mergeSouls / fromTemplate /
 *       diffSouls / bumpVersion / 默认 shortcuts
 */

import { describe, it, expect } from 'vitest'
import {
  createSoul,
  cloneSoul,
  deriveSoul,
  mergeSouls,
  fromTemplate,
  diffSouls,
  checkSoul,
  bumpVersion,
  NEUTRAL_ASSISTANT_INPUT,
  CRITICAL_CRITIC_INPUT,
} from './AgentSoul'
import { AGENT_RUNTIME_VERSION, type SoulTemplate, type AgentSoul } from './types'

const baseInput = {
  agentId: 'a1',
  archetype: 'critic' as const,
  displayName: 'Test Critic',
  capabilities: ['plot', 'style'] as const,
  tone: { formality: 0.8, directness: 0.9 },
}

describe('AgentSoul — createSoul', () => {
  it('creates a valid soul with all required fields', () => {
    const s = createSoul(baseInput)
    expect(s.agentId).toBe('a1')
    expect(s.archetype).toBe('critic')
    expect(s.persona.displayName).toBe('Test Critic')
    expect(s.persona.tone.formality).toBe(0.8)
    expect(s.persona.decisionPolicy.riskTolerance).toBe(0.3) // default
    expect(s.version).toBe(1)
    expect(s.memoryReadScope).toBe('self') // default
  })

  it('dedupes capabilities', () => {
    const s = createSoul({ ...baseInput, capabilities: ['plot', 'plot', 'style', 'plot'] as never })
    expect(s.capabilities.length).toBe(2)
    expect(s.capabilities).toContain('plot')
    expect(s.capabilities).toContain('style')
  })

  it('returns frozen object', () => {
    const s = createSoul(baseInput)
    expect(Object.isFrozen(s)).toBe(true)
  })

  it('auto-generates tagline if not provided', () => {
    const s = createSoul(baseInput)
    expect(s.persona.tagline).toContain('Test Critic')
    expect(s.persona.tagline).toContain('critic')
  })

  it('respects explicit tagline', () => {
    const s = createSoul({ ...baseInput, tagline: 'My custom tagline' })
    expect(s.persona.tagline).toBe('My custom tagline')
  })

  it('records parentOf in metadata when derived', () => {
    const s = createSoul({ ...baseInput, parentOf: 'a0' })
    expect(s.metadata.parentOf).toBe('a0')
    expect(s.metadata.runtimeVersion).toBe(AGENT_RUNTIME_VERSION)
  })

  it('does not add runtimeVersion for non-derived', () => {
    const s = createSoul(baseInput)
    expect(s.metadata.runtimeVersion).toBeUndefined()
  })
})

describe('AgentSoul — cloneSoul', () => {
  it('clones with no overrides -> equal persona', () => {
    const a = createSoul(baseInput)
    const b = cloneSoul(a)
    expect(b.agentId).toBe(a.agentId)
    expect(b.persona.displayName).toBe(a.persona.displayName)
    expect(b.capabilities).toEqual(a.capabilities)
    expect(b.version).toBe(1)
  })

  it('overrides agentId in clone', () => {
    const a = createSoul(baseInput)
    const b = cloneSoul(a, { agentId: 'a2' })
    expect(b.agentId).toBe('a2')
  })

  it('mutating original array does not affect clone', () => {
    const a = createSoul(baseInput)
    const b = cloneSoul(a)
    expect(b.capabilities).not.toBe(a.capabilities) // different array reference
  })
})

describe('AgentSoul — deriveSoul', () => {
  it('records parent in derived', () => {
    const parent = createSoul(baseInput)
    const child = deriveSoul(parent, { agentId: 'a2' })
    expect(child.metadata.parentOf).toBe('a1')
    expect(child.agentId).toBe('a2')
  })

  it('preserves unspecified fields from parent', () => {
    const parent = createSoul(baseInput)
    const child = deriveSoul(parent, { agentId: 'a2', displayName: 'Child' })
    expect(child.archetype).toBe(parent.archetype)
    expect(child.persona.tone).toEqual(parent.persona.tone)
  })
})

describe('AgentSoul — mergeSouls', () => {
  it('returns single soul when given one', () => {
    const s = createSoul(baseInput)
    expect(mergeSouls(s)).toBe(s)
  })

  it('throws on empty input', () => {
    expect(() => mergeSouls()).toThrow()
  })

  it('unions capabilities', () => {
    const a = createSoul({ ...baseInput, agentId: 'a', capabilities: ['plot'] })
    const b = createSoul({ ...baseInput, agentId: 'b', capabilities: ['style', 'pacing'] })
    const merged = mergeSouls(a, b)
    expect(merged.capabilities.sort()).toEqual(['pacing', 'plot', 'style'])
  })

  it('takes latest persona', () => {
    const a = createSoul({ ...baseInput, agentId: 'a', displayName: 'First' })
    const b = createSoul({ ...baseInput, agentId: 'b', displayName: 'Second' })
    const merged = mergeSouls(a, b)
    expect(merged.persona.displayName).toBe('Second')
  })
})

describe('AgentSoul — fromTemplate', () => {
  const tmpl: SoulTemplate = {
    templateId: 'plot-advisor',
    displayName: 'Plot Advisor',
    archetype: 'specialist',
    basePersona: {
      displayName: 'Plot Advisor',
      tagline: 'Helps with plot',
      principles: ['Think in three-act structure'],
      tone: { formality: 0.7, warmth: 0.4, intensity: 0.5, humor: 0.3, directness: 0.6 },
      decisionPolicy: { conservative: 0.6, creative: 0.7, reviewThreshold: 0.5, riskTolerance: 0.4 },
    },
    baseCapabilities: ['plot', 'pacing'],
    defaultMemoryScopes: { read: 'team', write: 'self' },
    description: 'Template for plot advisors',
  }

  it('creates soul from template with overrides', () => {
    const s = fromTemplate(tmpl, { agentId: 'plot-1' })
    expect(s.agentId).toBe('plot-1')
    expect(s.archetype).toBe('specialist')
    expect(s.capabilities).toEqual(['plot', 'pacing'])
    expect(s.memoryReadScope).toBe('team')
  })

  it('overrides capabilities', () => {
    const s = fromTemplate(tmpl, { agentId: 'plot-2', capabilities: ['plot', 'hook'] })
    expect(s.capabilities).toEqual(['plot', 'hook'])
  })
})

describe('AgentSoul — diffSouls', () => {
  it('detects no changes when identical', () => {
    const a = createSoul(baseInput)
    const b = createSoul(baseInput)
    const d = diffSouls(a, b)
    expect(d.hasChanges).toBe(false)
    expect(d.addedCapabilities).toEqual([])
    expect(d.removedCapabilities).toEqual([])
  })

  it('detects added capabilities', () => {
    const a = createSoul({ ...baseInput, capabilities: ['plot'] })
    const b = createSoul({ ...baseInput, capabilities: ['plot', 'style'] })
    const d = diffSouls(a, b)
    expect(d.addedCapabilities).toEqual(['style'])
    expect(d.removedCapabilities).toEqual([])
  })

  it('detects removed capabilities', () => {
    const a = createSoul({ ...baseInput, capabilities: ['plot', 'style'] })
    const b = createSoul({ ...baseInput, capabilities: ['plot'] })
    const d = diffSouls(a, b)
    expect(d.addedCapabilities).toEqual([])
    expect(d.removedCapabilities).toEqual(['style'])
  })

  it('detects archetype change', () => {
    const a = createSoul(baseInput)
    const b = createSoul({ ...baseInput, archetype: 'reviewer' })
    const d = diffSouls(a, b)
    expect(d.changedFields).toContain('archetype')
  })

  it('detects memory scope change', () => {
    const a = createSoul(baseInput)
    const b = createSoul({ ...baseInput, memoryReadScope: 'team' })
    const d = diffSouls(a, b)
    expect(d.changedFields).toContain('memoryReadScope')
  })
})

describe('AgentSoul — checkSoul & bumpVersion', () => {
  it('checkSoul delegates to validateSoul', () => {
    const s = createSoul(baseInput)
    const r = checkSoul(s)
    expect(r.valid).toBe(true)
  })

  it('bumpVersion increments version by 1', () => {
    const a = createSoul(baseInput)
    const b = bumpVersion(a)
    expect(b.version).toBe(a.version + 1)
  })

  it('bumpVersion applies patch', () => {
    const a = createSoul(baseInput)
    const b = bumpVersion(a, { displayName: 'Bumped' })
    expect(b.persona.displayName).toBe('Bumped')
    expect(b.version).toBe(2)
  })
})

describe('AgentSoul — preset inputs', () => {
  it('NEUTRAL_ASSISTANT_INPUT has assistant archetype', () => {
    expect(NEUTRAL_ASSISTANT_INPUT.archetype).toBe('assistant')
  })

  it('CRITICAL_CRITIC_INPUT is highly conservative and direct', () => {
    expect(CRITICAL_CRITIC_INPUT.archetype).toBe('critic')
    expect(CRITICAL_CRITIC_INPUT.tone?.directness).toBeGreaterThan(0.8)
    expect(CRITICAL_CRITIC_INPUT.decisionPolicy?.conservative).toBeGreaterThan(0.7)
  })
})
