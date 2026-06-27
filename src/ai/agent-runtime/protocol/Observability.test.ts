/**
 * protocol/Observability.test.ts (V2506-V2515) — 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  Counter, Gauge, Histogram, Timer, MetricsRegistry,
  SoulEvolutionEngine, EvolutionLog, DEFAULT_EVOLUTION_RULES,
  UserFeedbackStore, FeedbackAggregator,
  type MetricSnapshot,
} from './Observability'
import { createSoul } from '../AgentSoul'

describe('Counter', () => {
  it('inc + value', () => {
    const c = new Counter()
    c.inc(3)
    c.inc(2)
    expect(c.value).toBe(5)
  })

  it('labels', () => {
    const c = new Counter()
    c.inc(1, { kind: 'a' })
    c.inc(2, { kind: 'a' })
    c.inc(3, { kind: 'b' })
    expect(c.labels().size).toBe(2)
  })

  it('reset', () => {
    const c = new Counter()
    c.inc(10)
    c.reset()
    expect(c.value).toBe(0)
  })
})

describe('Gauge', () => {
  it('set + inc + dec', () => {
    const g = new Gauge()
    g.set(10)
    g.inc(5)
    expect(g.value).toBe(15)
    g.dec(3)
    expect(g.value).toBe(12)
  })
})

describe('Histogram', () => {
  it('observe + mean', () => {
    const h = new Histogram()
    h.observe(10)
    h.observe(20)
    h.observe(30)
    expect(h.mean()).toBe(20)
  })

  it('percentiles', () => {
    const h = new Histogram()
    for (let i = 1; i <= 100; i++) h.observe(i)
    // sorted[i-1] = i, so sorted[50] = 51 (1-indexed)
    expect(h.p50()).toBe(51)
    expect(h.p95()).toBe(96)
  })

  it('count + sum on empty', () => {
    const h = new Histogram()
    expect(h.count()).toBe(0)
    expect(h.sum()).toBe(0)
  })
})

describe('Timer', () => {
  it('start + stop records duration', () => {
    const t = new Timer()
    t.start('op')
    const d = t.stop('op')
    expect(d).toBeGreaterThanOrEqual(0)
  })

  it('stop without start returns 0', () => {
    const t = new Timer()
    expect(t.stop('op')).toBe(0)
  })
})

describe('MetricsRegistry', () => {
  it('counter + gauge + histogram + timer accessors', () => {
    const r = new MetricsRegistry()
    r.counter('c1').inc()
    r.gauge('g1').set(5)
    r.histogram('h1').observe(10)
    r.timer('t1')
    const s = r.snapshot()
    expect(s.counters['c1']).toBe(1)
    expect(s.gauges['g1']).toBe(5)
    expect(s.histograms['h1'].count).toBe(1)
  })

  it('reset clears all', () => {
    const r = new MetricsRegistry()
    r.counter('c1').inc()
    r.reset()
    expect(r.snapshot().counters['c1']).toBeUndefined()
  })
})

describe('SoulEvolutionEngine', () => {
  it('no-op when no rule matches', () => {
    const e = new SoulEvolutionEngine()
    const soul = createSoul({ agentId: 'a1', archetype: 'critic', displayName: 'A', capabilities: ['plot'] })
    const r = e.evolve(soul, { counters: {}, gauges: {}, histograms: {} })
    expect(r).toBeNull()
  })

  it('applies low-creative rule', () => {
    const e = new SoulEvolutionEngine()
    const soul = createSoul({
      agentId: 'a1', archetype: 'critic', displayName: 'A', capabilities: ['plot'],
      decisionPolicy: { creative: 0.3, conservative: 0.5, reviewThreshold: 0.5, riskTolerance: 0.3 },
    })
    const metrics: MetricSnapshot = {
      counters: {},
      gauges: { 'avg-creative': 0.3 },
      histograms: {},
    }
    const r = e.evolve(soul, metrics)
    expect(r).not.toBeNull()
    expect(r!.appliedRule.ruleId).toBe('low-creative')
    expect(r!.soulAfter.persona.decisionPolicy.creative).toBe(0.4)
  })

  it('logs evolution events', () => {
    const log = new EvolutionLog()
    const e = new SoulEvolutionEngine(log)
    const soul = createSoul({
      agentId: 'a1', archetype: 'critic', displayName: 'A', capabilities: ['plot'],
      decisionPolicy: { creative: 0.3, conservative: 0.5, reviewThreshold: 0.5, riskTolerance: 0.3 },
    })
    const metrics: MetricSnapshot = { counters: {}, gauges: { 'avg-creative': 0.3 }, histograms: {} }
    e.evolve(soul, metrics)
    expect(log.forSoul('a1').length).toBe(1)
  })
})

describe('EvolutionLog', () => {
  it('record + forSoul', () => {
    const log = new EvolutionLog()
    log.record({ soulId: 'a1', ruleId: 'r1', action: 'no-op' })
    log.record({ soulId: 'a2', ruleId: 'r1', action: 'no-op' })
    expect(log.forSoul('a1').length).toBe(1)
  })

  it('maxEntries cap', () => {
    const log = new EvolutionLog(2)
    log.record({ soulId: 'a1', ruleId: 'r1', action: 'no-op' })
    log.record({ soulId: 'a1', ruleId: 'r1', action: 'no-op' })
    log.record({ soulId: 'a1', ruleId: 'r1', action: 'no-op' })
    expect(log.count()).toBe(2)
  })
})

describe('DEFAULT_EVOLUTION_RULES', () => {
  it('has 3 rules', () => {
    expect(DEFAULT_EVOLUTION_RULES.length).toBe(3)
  })
})

describe('UserFeedbackStore + FeedbackAggregator', () => {
  it('record + forTarget', () => {
    const s = new UserFeedbackStore()
    s.record({ userId: 'u1', target: 'soul', targetId: 's1', type: 'positive', score: 0.8 })
    s.record({ userId: 'u1', target: 'soul', targetId: 's2', type: 'negative', score: -0.5 })
    expect(s.forTarget('soul', 's1').length).toBe(1)
  })

  it('byUser', () => {
    const s = new UserFeedbackStore()
    s.record({ userId: 'u1', target: 'soul', targetId: 's1', type: 'positive', score: 0.8 })
    s.record({ userId: 'u2', target: 'soul', targetId: 's2', type: 'negative', score: -0.5 })
    expect(s.byUser('u1').length).toBe(1)
  })

  it('averageScore', () => {
    const s = new UserFeedbackStore()
    s.record({ userId: 'u1', target: 'soul', targetId: 's1', type: 'positive', score: 0.8 })
    s.record({ userId: 'u2', target: 'soul', targetId: 's1', type: 'positive', score: 0.6 })
    const a = new FeedbackAggregator()
    expect(a.averageScore(s, 'soul', 's1')).toBeCloseTo(0.7)
  })

  it('distribution', () => {
    const s = new UserFeedbackStore()
    s.record({ userId: 'u1', target: 'soul', targetId: 's1', type: 'positive', score: 0.8 })
    s.record({ userId: 'u1', target: 'soul', targetId: 's1', type: 'positive', score: 0.6 })
    s.record({ userId: 'u1', target: 'soul', targetId: 's1', type: 'negative', score: -0.3 })
    const a = new FeedbackAggregator()
    const d = a.distribution(s, 'soul', 's1')
    expect(d.get('positive')).toBe(2)
    expect(d.get('negative')).toBe(1)
  })

  it('mostCriticized', () => {
    const s = new UserFeedbackStore()
    s.record({ userId: 'u', target: 'soul', targetId: 's1', type: 'negative', score: -0.8 })
    s.record({ userId: 'u', target: 'soul', targetId: 's2', type: 'positive', score: 0.5 })
    const a = new FeedbackAggregator()
    const m = a.mostCriticized(s)
    expect(m?.targetId).toBe('soul:s1')
  })
})
