/**
 * protocol/__tests__/observability-integration.test.ts (V2532)
 */

import { describe, it, expect } from 'vitest'
import {
  MetricsRegistry, SoulEvolutionEngine, EvolutionLog, UserFeedbackStore, FeedbackAggregator,
  ExperimentRunner, zTestProportions, validateExperiment,
  HealthCheckRunner, AlertManager, IncidentLog, RecoveryPlan,
  LearningRate, AdaptationPolicy, ExplorationExploitation, Curriculum, TransferLearning,
  type Experiment, type Variant,
} from '../index'
import { createSoul } from '../../AgentSoul'

const CONTROL: Variant = { variantId: 'control', name: 'C', weight: 50, payload: {} }
const VARIANT: Variant = { variantId: 'a', name: 'A', weight: 50, payload: {} }
const makeExp = (): Experiment => ({
  experimentId: 'e1', name: 'X', description: 'd', variants: [CONTROL, VARIANT],
  startTime: 0, status: 'running', significanceLevel: 0.05, minSampleSize: 50,
})

describe('Observability — end-to-end', () => {
  it('metrics + evolution cycle', () => {
    const reg = new MetricsRegistry()
    reg.counter('requests').inc(100)
    reg.counter('rejected').inc(50)
    reg.gauge('avg-creative').set(0.3)

    const log = new EvolutionLog()
    const engine = new SoulEvolutionEngine(log)
    const soul = createSoul({
      agentId: 'a1', archetype: 'critic', displayName: 'A', capabilities: ['plot'],
      decisionPolicy: { conservative: 0.5, creative: 0.3, reviewThreshold: 0.5, riskTolerance: 0.3 },
    })
    const r = engine.evolve(soul, reg.snapshot())
    expect(r).not.toBeNull()
    expect(log.count()).toBe(1)
  })

  it('A/B test statistical significance', () => {
    const exp = makeExp()
    validateExperiment(exp)
    const runner = new ExperimentRunner(exp)
    for (let i = 0; i < 100; i++) {
      const u = `u${i}`
      runner.assign(u)
      runner.recordExposure(u)
      if (i < 50) runner.recordConversion(u)
    }
    const results = runner.results()
    expect(results.length).toBe(2)
    const r = zTestProportions(50, 25, 50, 25)
    expect(r.pValue).toBeGreaterThan(0)
  })

  it('alert + recovery cycle', async () => {
    const alerts = new AlertManager()
    alerts.addRule({ ruleId: 'r1', name: 'high', condition: (m: unknown) => (m as { v: number }).v > 10, severity: 'critical', cooldownMs: 0, message: 'too high' })
    const triggered = alerts.evaluate({ v: 20 })
    expect(triggered.length).toBe(1)

    const incidents = new IncidentLog()
    const inc = incidents.record({ severity: 'critical', message: 'high error rate' })

    const recovery = new RecoveryPlan()
    recovery.addStep({ order: 1, action: 'notify', description: 'a', timeoutMs: 100, execute: () => true })
    const r = await recovery.execute()
    expect(r.success).toBe(true)
    expect(incidents.resolve(inc.incidentId, 'handled')).toBe(true)
  })

  it('feedback + aggregation', () => {
    const fb = new UserFeedbackStore()
    fb.record({ userId: 'u1', target: 'soul', targetId: 's1', type: 'positive', score: 0.9 })
    fb.record({ userId: 'u2', target: 'soul', targetId: 's1', type: 'negative', score: -0.5 })
    const a = new FeedbackAggregator()
    expect(a.averageScore(fb, 'soul', 's1')).toBeCloseTo(0.2)
  })

  it('health check + status', async () => {
    const h = new HealthCheckRunner()
    h.register({ name: 'db', check: () => ({ name: 'db', status: 'healthy' as const, durationMs: 5, checkedAt: 0 }) })
    const r = await h.runAll()
    expect(h.overall(r)).toBe('healthy')
  })

  it('learning rate decay + cyclic policy', () => {
    const lr = new LearningRate({ initial: 0.1, decay: 0.5, minRate: 0.001 })
    expect(lr.current()).toBe(0.1)
    lr.step()
    expect(lr.current()).toBeCloseTo(0.05)
    const p = new AdaptationPolicy({ strategy: 'cyclic', initialRate: 0.1, minRate: 0.01, decayRate: 0.9, cycleLength: 10 })
    expect(p.rate()).toBeGreaterThan(0)
  })

  it('exploration-exploitation greedy pick', () => {
    const ee = new ExplorationExploitation('epsilon-greedy', { epsilon: 0 })
    ee.update('a', 1.0)
    ee.update('a', 1.0)
    ee.update('b', 0.0)
    expect(ee.selectArm(['a', 'b'])).toBe('a')
  })

  it('curriculum + transfer learning', () => {
    const c = new Curriculum([
      { stageId: 's1', name: 'Easy', difficulty: 0.2, requiredSamples: 5 },
      { stageId: 's2', name: 'Hard', difficulty: 0.8, requiredSamples: 5 },
    ])
    c.addSamples('s1', 5)
    expect(c.current().stageId).toBe('s2')
    const tl = new TransferLearning()
    const best = tl.bestSource({ soulId: 't1', features: { a: 1, b: 0 } }, [
      { soulId: 's1', features: { a: 0, b: 1 }, accuracy: 0.5 },
      { soulId: 's2', features: { a: 1, b: 0 }, accuracy: 0.8 },
    ])
    expect(best?.soulId).toBe('s2')
  })
})
