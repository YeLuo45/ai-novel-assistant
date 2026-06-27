/**
 * protocol/AdaptationAndHealth.test.ts (V2521-V2530) — 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  LearningRate, AdaptationPolicy, ExplorationExploitation, Curriculum, TransferLearning,
  HealthCheckRunner, AlertManager, IncidentLog, RecoveryPlan,
} from './AdaptationAndHealth'

describe('LearningRate', () => {
  it('initial value', () => {
    const lr = new LearningRate({ initial: 0.1, decay: 0.9, minRate: 0.001 })
    expect(lr.current()).toBe(0.1)
  })

  it('decay after step', () => {
    const lr = new LearningRate({ initial: 0.1, decay: 0.5, minRate: 0.001 })
    lr.step()
    expect(lr.current()).toBe(0.05)
  })

  it('min rate floor', () => {
    const lr = new LearningRate({ initial: 0.01, decay: 0.1, minRate: 0.005 })
    for (let i = 0; i < 10; i++) lr.step()
    expect(lr.current()).toBe(0.005)
  })

  it('reset', () => {
    const lr = new LearningRate({ initial: 0.1, decay: 0.5, minRate: 0.001 })
    lr.step()
    lr.reset()
    expect(lr.current()).toBe(0.1)
  })
})

describe('AdaptationPolicy', () => {
  it('annealing strategy', () => {
    const p = new AdaptationPolicy({ strategy: 'annealing', initialRate: 0.1, minRate: 0.01, decayRate: 0.5 })
    expect(p.rate()).toBe(0.1)
    p.step()
    expect(p.rate()).toBeCloseTo(0.05)
  })

  it('cyclic strategy', () => {
    const p = new AdaptationPolicy({ strategy: 'cyclic', initialRate: 0.1, minRate: 0.01, decayRate: 0.9, cycleLength: 10 })
    expect(p.rate()).toBeGreaterThan(0)
  })
})

describe('ExplorationExploitation', () => {
  it('epsilon-greedy explores', () => {
    const ee = new ExplorationExploitation('epsilon-greedy', { epsilon: 1.0 })  // always explore
    const arms = ['a', 'b', 'c']
    const seen = new Set<string>()
    for (let i = 0; i < 50; i++) seen.add(ee.selectArm(arms))
    expect(seen.size).toBeGreaterThan(1)
  })

  it('update records rewards', () => {
    const ee = new ExplorationExploitation('epsilon-greedy', { epsilon: 0 })
    ee.update('a', 1.0)
    ee.update('a', 1.0)
    expect(ee.averageReward('a')).toBe(1.0)
  })

  it('pullCount', () => {
    const ee = new ExplorationExploitation()
    ee.update('a', 1)
    ee.update('a', 1)
    expect(ee.pullCount('a')).toBe(2)
  })

  it('softmax picks arms', () => {
    const ee = new ExplorationExploitation('softmax', { temperature: 1 })
    expect(['a', 'b']).toContain(ee.selectArm(['a', 'b']))
  })
})

describe('Curriculum', () => {
  it('progresses through stages', () => {
    const c = new Curriculum([
      { stageId: 's1', name: 'Easy', difficulty: 0.2, requiredSamples: 10 },
      { stageId: 's2', name: 'Hard', difficulty: 0.8, requiredSamples: 5 },
    ])
    expect(c.current().stageId).toBe('s1')
    c.addSamples('s1', 10)
    expect(c.current().stageId).toBe('s2')
  })

  it('progress and isComplete', () => {
    const c = new Curriculum([
      { stageId: 's1', name: 'A', difficulty: 0.5, requiredSamples: 1 },
    ])
    expect(c.isComplete()).toBe(true)
  })
})

describe('TransferLearning', () => {
  it('similarity computes correctly', () => {
    const tl = new TransferLearning()
    const sim = tl.similarity(
      { soulId: 's1', features: { a: 1, b: 0 }, accuracy: 0.9 },
      { soulId: 't1', features: { a: 1, b: 0 } },
    )
    expect(sim).toBe(1)
  })

  it('bestSource returns most similar', () => {
    const tl = new TransferLearning()
    const target: { soulId: string; features: Record<string, number> } = { soulId: 't1', features: { a: 1, b: 0 } }
    const best = tl.bestSource(target, [
      { soulId: 's1', features: { a: 0, b: 1 }, accuracy: 0.5 },
      { soulId: 's2', features: { a: 1, b: 0 }, accuracy: 0.8 },
    ])
    expect(best?.soulId).toBe('s2')
  })

  it('bestSource returns null on empty', () => {
    expect(new TransferLearning().bestSource({ soulId: 't', features: {} }, [])).toBeNull()
  })
})

describe('HealthCheckRunner', () => {
  it('runAll executes checks', async () => {
    const r = new HealthCheckRunner()
    r.register({ name: 'c1', check: () => ({ name: 'c1', status: 'healthy', durationMs: 0, checkedAt: 0 }) })
    const results = await r.runAll()
    expect(results.length).toBe(1)
  })

  it('overall: all healthy', () => {
    const r = new HealthCheckRunner()
    const results = [{ name: 'a', status: 'healthy' as const, durationMs: 0, checkedAt: 0 }]
    expect(r.overall(results)).toBe('healthy')
  })

  it('overall: one unhealthy', () => {
    const r = new HealthCheckRunner()
    const results = [
      { name: 'a', status: 'healthy' as const, durationMs: 0, checkedAt: 0 },
      { name: 'b', status: 'unhealthy' as const, durationMs: 0, checkedAt: 0 },
    ]
    expect(r.overall(results)).toBe('unhealthy')
  })

  it('overall: one degraded', () => {
    const r = new HealthCheckRunner()
    const results = [
      { name: 'a', status: 'degraded' as const, durationMs: 0, checkedAt: 0 },
    ]
    expect(r.overall(results)).toBe('degraded')
  })
})

describe('AlertManager', () => {
  it('addRule + evaluate', () => {
    const m = new AlertManager()
    m.addRule({ ruleId: 'r1', name: 'high', condition: (x) => (x as { v: number }).v > 10, severity: 'warning', cooldownMs: 0, message: 'too high' })
    const triggered = m.evaluate({ v: 20 })
    expect(triggered.length).toBe(1)
  })

  it('cooldown blocks', () => {
    const m = new AlertManager()
    m.addRule({ ruleId: 'r1', name: 'r', condition: () => true, severity: 'warning', cooldownMs: 60000, message: 'x' })
    m.evaluate({})
    expect(m.evaluate({}).length).toBe(0)
  })

  it('resolve', () => {
    const m = new AlertManager()
    m.addRule({ ruleId: 'r1', name: 'r', condition: () => true, severity: 'warning', cooldownMs: 0, message: 'x' })
    m.evaluate({})
    expect(m.resolve('r1')).toBe(true)
  })

  it('resolve unknown returns false', () => {
    expect(new AlertManager().resolve('unknown')).toBe(false)
  })

  it('active + history', () => {
    const m = new AlertManager()
    m.addRule({ ruleId: 'r1', name: 'r', condition: () => true, severity: 'warning', cooldownMs: 0, message: 'x' })
    m.evaluate({})
    expect(m.active().length).toBe(1)
    expect(m.history().length).toBe(1)
  })
})

describe('IncidentLog', () => {
  it('record + resolve', () => {
    const log = new IncidentLog()
    const inc = log.record({ severity: 'warning', message: 'something' })
    expect(log.resolve(inc.incidentId, 'fixed')).toBe(true)
  })

  it('resolve unknown returns false', () => {
    expect(new IncidentLog().resolve('x', 'y')).toBe(false)
  })

  it('open filters resolved', () => {
    const log = new IncidentLog()
    const inc = log.record({ severity: 'warning', message: 'x' })
    log.resolve(inc.incidentId, 'y')
    expect(log.open().length).toBe(0)
  })
})

describe('RecoveryPlan', () => {
  it('addStep + execute', async () => {
    const p = new RecoveryPlan()
    p.addStep({ order: 1, action: 'notify', description: 'a', timeoutMs: 100, execute: () => true })
    p.addStep({ order: 2, action: 'restart', description: 'b', timeoutMs: 100, execute: () => true })
    const r = await p.execute()
    expect(r.success).toBe(true)
  })

  it('execute twice fails', async () => {
    const p = new RecoveryPlan()
    p.addStep({ order: 1, action: 'notify', description: 'a', timeoutMs: 100, execute: () => true })
    await p.execute()
    const r2 = await p.execute()
    expect(r2.success).toBe(false)
  })

  it('step failure marks as failed', async () => {
    const p = new RecoveryPlan()
    p.addStep({ order: 1, action: 'notify', description: 'a', timeoutMs: 100, execute: () => false })
    const r = await p.execute()
    expect(r.success).toBe(false)
  })
})
