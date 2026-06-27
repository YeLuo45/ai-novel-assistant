/**
 * collab/v3/StudioPanels2.smoke.test.ts (H11-H15) - 5 engines store-level 测试
 */

import { describe, it, expect } from 'vitest'
import {
  SoulMarketplace, SoulTemplateRegistry, SoulAuthor,
  composeSoul, type SoulListing,
} from '../../ai/agent-runtime/protocol/SoulMarketplace'
import {
  buildPreview, validateForStudio, DEFAULT_SOUL_STUDIO_CONFIG, buildSections,
} from '../../ai/agent-runtime/protocol/SoulStudio'
import {
  ExperimentRunner, validateExperiment, zTestProportions,
  type Experiment, type Variant,
} from '../../ai/agent-runtime/protocol/ABTesting'
import {
  HealthCheckRunner, AlertManager, RecoveryPlan,
} from '../../ai/agent-runtime/protocol/AdaptationAndHealth'
import type { SoulTemplate } from '../../ai/agent-runtime/types'

const T: SoulTemplate = {
  templateId: 't1', displayName: 'Plot Advisor', archetype: 'specialist',
  basePersona: {
    displayName: 'Plot Advisor', tagline: 'expert',
    principles: ['show-dont-tell', 'hook-first'],
    tone: { formality: 0.5, warmth: 0.6, intensity: 0.7, humor: 0.3, directness: 0.8 },
    decisionPolicy: { conservative: 0.5, creative: 0.7, reviewThreshold: 0.5, riskTolerance: 0.4 },
  },
  baseCapabilities: ['plot', 'pacing', 'hook'],
  defaultMemoryScopes: { read: 'team', write: 'self' },
  description: 'A test soul template',
}

const CONTROL: Variant = { variantId: 'control', name: 'C', weight: 50, payload: {} }
const VARIANT_A: Variant = { variantId: 'a', name: 'A', weight: 50, payload: {} }

describe('H11: SoulStudioEditor logic', () => {
  it('buildPreview generates correct snapshot', () => {
    const p = buildPreview(T)
    expect(p.displayName).toBe('Plot Advisor')
    expect(p.capabilities).toEqual(['plot', 'pacing', 'hook'])
    expect(p.archetype).toBe('specialist')
  })

  it('validateForStudio returns 0 issues for valid', () => {
    const issues = validateForStudio(T)
    expect(issues.length).toBe(0)
  })

  it('validateForStudio flags short display name', () => {
    const issues = validateForStudio({ ...T, displayName: 'X' })
    expect(issues.length).toBeGreaterThan(0)
  })
})

describe('H12: MarketPanel logic', () => {
  it('lists all when no query', () => {
    const m = new SoulMarketplace(new SoulTemplateRegistry())
    m.publish(T, { authorId: 'a', displayName: 'A' }, { description: 'test', tags: ['plot'] })
    expect(m.list().length).toBe(1)
  })

  it('search by query', () => {
    const m = new SoulMarketplace(new SoulTemplateRegistry())
    m.publish(T, { authorId: 'a', displayName: 'A' })
    expect(m.search('Plot').length).toBe(1)
    expect(m.search('nonexistent').length).toBe(0)
  })

  it('install + downloads increment', () => {
    const m = new SoulMarketplace(new SoulTemplateRegistry())
    m.publish(T, { authorId: 'a', displayName: 'A' })
    m.install('t1')
    expect(m.get('t1')?.downloads).toBe(1)
  })
})

describe('H13: ExperimentPanel logic', () => {
  it('runner.results() returns 2 variants', () => {
    const exp: Experiment = {
      experimentId: 'e1', name: 'X', description: 'd',
      variants: [CONTROL, VARIANT_A], startTime: 0, status: 'running', significanceLevel: 0.05, minSampleSize: 50,
    }
    const r = new ExperimentRunner(exp)
    expect(r.results().length).toBe(2)
  })

  it('validateExperiment accepts valid', () => {
    const exp: Experiment = {
      experimentId: 'e1', name: 'X', description: 'd',
      variants: [CONTROL, VARIANT_A], startTime: 0, status: 'running', significanceLevel: 0.05, minSampleSize: 50,
    }
    expect(validateExperiment(exp).valid).toBe(true)
  })

  it('zTestProportions works', () => {
    const r = zTestProportions(100, 50, 100, 60, 0.05)
    expect(r.pValue).toBeGreaterThan(0)
    expect(r.winner).toBe('variant')
  })
})

describe('H14: HealthDashboard logic', () => {
  it('overall is healthy when all healthy', () => {
    const runner = new HealthCheckRunner()
    runner.register({ name: 'db', check: () => ({ name: 'db', status: 'healthy' as const, durationMs: 5, checkedAt: 0 }) })
    const results = [
      { name: 'db', status: 'healthy' as const, durationMs: 5, checkedAt: 0 },
    ]
    expect(runner.overall(results)).toBe('healthy')
  })

  it('overall is degraded when one degraded', () => {
    const runner = new HealthCheckRunner()
    const results = [{ name: 'x', status: 'degraded' as const, durationMs: 0, checkedAt: 0 }]
    expect(runner.overall(results)).toBe('degraded')
  })

  it('overall is unhealthy when one unhealthy', () => {
    const runner = new HealthCheckRunner()
    const results = [{ name: 'x', status: 'unhealthy' as const, durationMs: 0, checkedAt: 0 }]
    expect(runner.overall(results)).toBe('unhealthy')
  })
})

describe('H15: AlertCenter logic', () => {
  it('active alerts count', () => {
    const m = new AlertManager()
    m.addRule({ ruleId: 'r1', name: 'r', condition: () => true, severity: 'warning', cooldownMs: 0, message: 'x' })
    m.evaluate({})
    expect(m.active().length).toBe(1)
  })

  it('no active when not triggered', () => {
    const m = new AlertManager()
    m.addRule({ ruleId: 'r1', name: 'r', condition: () => false, severity: 'warning', cooldownMs: 0, message: 'x' })
    expect(m.active().length).toBe(0)
  })

  it('history records all triggers', () => {
    const m = new AlertManager()
    m.addRule({ ruleId: 'r1', name: 'r', condition: () => true, severity: 'info', cooldownMs: 0, message: 'x' })
    m.evaluate({})
    m.evaluate({})
    expect(m.history().length).toBe(2)
  })
})