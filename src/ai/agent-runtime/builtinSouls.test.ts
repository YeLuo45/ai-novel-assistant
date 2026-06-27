/**
 * builtinSouls.test.ts (V2336-V2340) — 35+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  PLOT_ADVISOR_TEMPLATE,
  STYLE_COACH_TEMPLATE,
  DIALOGUE_MASTER_TEMPLATE,
  CRITIC_MASTER_TEMPLATE,
  CONTINUITY_GUARD_TEMPLATE,
  ALL_BUILTIN_TEMPLATES,
  BUILTIN_TEMPLATE_IDS,
  BUILTIN_ARCHETYPE_COVERAGE,
  getBuiltinTemplate,
  createBuiltinTeamIds,
  builtinTemplateByIndex,
} from './builtinSouls'
import { AgentFactory, AgentRegistry, validateSoul } from './index'
import { fromTemplate } from './AgentSoul'

describe('builtinSouls — template completeness', () => {
  it('PLOT_ADVISOR has correct archetype', () => {
    expect(PLOT_ADVISOR_TEMPLATE.archetype).toBe('specialist')
    expect(PLOT_ADVISOR_TEMPLATE.baseCapabilities).toContain('plot')
  })

  it('STYLE_COACH has correct archetype', () => {
    expect(STYLE_COACH_TEMPLATE.archetype).toBe('instructor')
    expect(STYLE_COACH_TEMPLATE.baseCapabilities).toContain('style')
  })

  it('DIALOGUE_MASTER has correct archetype', () => {
    expect(DIALOGUE_MASTER_TEMPLATE.archetype).toBe('specialist')
    expect(DIALOGUE_MASTER_TEMPLATE.baseCapabilities).toContain('dialogue')
  })

  it('CRITIC_MASTER has correct archetype and broad capabilities', () => {
    expect(CRITIC_MASTER_TEMPLATE.archetype).toBe('critic')
    expect(CRITIC_MASTER_TEMPLATE.baseCapabilities.length).toBeGreaterThanOrEqual(4)
  })

  it('CONTINUITY_GUARD has correct archetype', () => {
    expect(CONTINUITY_GUARD_TEMPLATE.archetype).toBe('reviewer')
    expect(CONTINUITY_GUARD_TEMPLATE.baseCapabilities).toContain('continuity')
  })

  it('all 5 templates have unique templateId', () => {
    const ids = ALL_BUILTIN_TEMPLATES.map(t => t.templateId)
    expect(new Set(ids).size).toBe(5)
  })

  it('all templates pass validateSoul', () => {
    for (const t of ALL_BUILTIN_TEMPLATES) {
      const soul = fromTemplate(t, { agentId: 'test-' + t.templateId })
      const r = validateSoul(soul)
      expect(r.valid).toBe(true)
    }
  })
})

describe('builtinSouls — collection helpers', () => {
  it('BUILTIN_TEMPLATE_IDS has 5 entries', () => {
    expect(BUILTIN_TEMPLATE_IDS.length).toBe(5)
  })

  it('BUILTIN_ARCHETYPE_COVERAGE covers all 4 archetypes used', () => {
    expect(BUILTIN_ARCHETYPE_COVERAGE.specialist.length).toBe(2)
    expect(BUILTIN_ARCHETYPE_COVERAGE.instructor.length).toBe(1)
    expect(BUILTIN_ARCHETYPE_COVERAGE.critic.length).toBe(1)
    expect(BUILTIN_ARCHETYPE_COVERAGE.reviewer.length).toBe(1)
  })

  it('getBuiltinTemplate returns correct template', () => {
    expect(getBuiltinTemplate('plot-advisor').templateId).toBe('plot-advisor')
    expect(getBuiltinTemplate('critic-master').templateId).toBe('critic-master')
  })

  it('getBuiltinTemplate throws on unknown', () => {
    // @ts-expect-error
    expect(() => getBuiltinTemplate('unknown')).toThrow()
  })

  it('createBuiltinTeamIds returns 5 ids', () => {
    const ids = createBuiltinTeamIds()
    expect(ids.length).toBe(5)
    expect(new Set(ids).size).toBe(5) // unique
  })

  it('builtinTemplateByIndex returns by position', () => {
    expect(builtinTemplateByIndex(0).templateId).toBe('plot-advisor')
    expect(builtinTemplateByIndex(4).templateId).toBe('continuity-guard')
  })

  it('builtinTemplateByIndex throws on bad index', () => {
    expect(() => builtinTemplateByIndex(99)).toThrow()
    expect(() => builtinTemplateByIndex(-1)).toThrow()
  })
})

describe('builtinSouls — integration with factory', () => {
  it('spawn 5 agent team with templates', () => {
    const registry = new AgentRegistry()
    const factory = new AgentFactory(registry)
    const ids = createBuiltinTeamIds()
    const agents = ids.map(id => factory.spawn({
      template: builtinTemplateByIndex(ids.indexOf(id)),
      agentId: id,
    }))
    expect(agents.length).toBe(5)
    expect(registry.count()).toBe(5)
  })

  it('each agent has different archetype', () => {
    const registry = new AgentRegistry()
    const factory = new AgentFactory(registry)
    const agents = ALL_BUILTIN_TEMPLATES.map((t, i) =>
      factory.spawn({ template: t, agentId: `agent-${i}` }),
    )
    const archetypes = agents.map(a => a.soul.archetype)
    expect(new Set(archetypes).size).toBeGreaterThanOrEqual(4)
  })

  it('PlotAdvisor has at least 2 capabilities', () => {
    expect(PLOT_ADVISOR_TEMPLATE.baseCapabilities.length).toBeGreaterThanOrEqual(2)
  })

  it('CriticMaster is most conservative (high reviewThreshold)', () => {
    expect(CRITIC_MASTER_TEMPLATE.basePersona.decisionPolicy.reviewThreshold).toBeGreaterThan(0.7)
  })

  it('PlotAdvisor is most creative (high creative)', () => {
    expect(PLOT_ADVISOR_TEMPLATE.basePersona.decisionPolicy.creative).toBeGreaterThan(0.6)
  })
})

describe('builtinSouls — quality checks', () => {
  it('all templates have non-empty displayName', () => {
    for (const t of ALL_BUILTIN_TEMPLATES) {
      expect(t.displayName.length).toBeGreaterThan(0)
    }
  })

  it('all templates have non-empty description', () => {
    for (const t of ALL_BUILTIN_TEMPLATES) {
      expect(t.description.length).toBeGreaterThan(0)
    }
  })

  it('all templates have at least 2 principles', () => {
    for (const t of ALL_BUILTIN_TEMPLATES) {
      expect(t.basePersona.principles.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('tone values in valid 0-1 range', () => {
    for (const t of ALL_BUILTIN_TEMPLATES) {
      const tone = t.basePersona.tone
      for (const k of ['formality', 'warmth', 'intensity', 'humor', 'directness'] as const) {
        expect(tone[k]).toBeGreaterThanOrEqual(0)
        expect(tone[k]).toBeLessThanOrEqual(1)
      }
    }
  })

  it('decision policy values in valid 0-1 range', () => {
    for (const t of ALL_BUILTIN_TEMPLATES) {
      const p = t.basePersona.decisionPolicy
      for (const k of ['conservative', 'creative', 'reviewThreshold', 'riskTolerance'] as const) {
        expect(p[k]).toBeGreaterThanOrEqual(0)
        expect(p[k]).toBeLessThanOrEqual(1)
      }
    }
  })
})
