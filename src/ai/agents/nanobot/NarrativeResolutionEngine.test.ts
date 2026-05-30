import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  registerPayoff,
  deliverPayoff,
  markRushedPayoff,
  generateResolutionMetrics,
  getPayoffStatus,
  comparePayoffSatisfaction,
} from './NarrativeResolutionEngine'

describe('createEmptyState', () => {
  it('should create empty resolution state', () => {
    const s = createEmptyState()
    expect(s.payoffs).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('registerPayoff', () => {
  it('should register a payoff', () => {
    let s = createEmptyState()
    s = registerPayoff(s, 'plot', 5, 'Weapon appears', 80)
    expect(s.payoffs.length).toBe(1)
    expect(s.payoffs[0].delivered).toBe(false)
    expect(s.payoffs[0].importance).toBe(80)
  })
})

describe('deliverPayoff', () => {
  it('should deliver payoff', () => {
    let s = createEmptyState()
    s = registerPayoff(s, 'character', 3, 'Backstory revealed', 70)
    const payoffId = s.payoffs[0].id
    s = deliverPayoff(s, payoffId, 20, 85)
    expect(s.payoffs[0].delivered).toBe(true)
    expect(s.payoffs[0].payoffChapter).toBe(20)
    expect(s.payoffs[0].satisfactionScore).toBe(85)
  })
})

describe('markRushedPayoff', () => {
  it('should reduce satisfaction for rushed payoff', () => {
    let s = createEmptyState()
    s = registerPayoff(s, 'mystery', 2, 'Clue planted', 60)
    const payoffId = s.payoffs[0].id
    s = deliverPayoff(s, payoffId, 25, 50)
    s = markRushedPayoff(s, payoffId)
    expect(s.payoffs[0].satisfactionScore).toBe(20)
  })
})

describe('generateResolutionMetrics', () => {
  it('should return empty metrics', () => {
    const s = createEmptyState()
    const metrics = generateResolutionMetrics(s)
    expect(metrics.totalPayoffs).toBe(0)
    expect(metrics.avgSatisfaction).toBe(0)
  })

it('should calculate average satisfaction', () => {
    let s = createEmptyState()
    s = registerPayoff(s, 'plot', 1, 'Set up 1', 80)
    const p1Id = s.payoffs[0].id
    s = registerPayoff(s, 'character', 2, 'Set up 2', 60)
    const p2Id = s.payoffs[1].id
    s = deliverPayoff(s, p1Id, 20, 80)
    s = deliverPayoff(s, p2Id, 22, 60)
    const metrics = generateResolutionMetrics(s)
    expect(metrics.deliveredPayoffs).toBe(2)
    expect(metrics.avgSatisfaction).toBe(70)
  })

  it('should count unresolved payoffs', () => {
    let s = createEmptyState()
    s = registerPayoff(s, 'plot', 1, 'Set up 1', 70)
    s = registerPayoff(s, 'plot', 2, 'Set up 2', 60)
    const metrics = generateResolutionMetrics(s)
    expect(metrics.unresolvedCount).toBe(2)
  })
})

describe('getPayoffStatus', () => {
  it('should separate pending and delivered', () => {
    let s = createEmptyState()
    s = registerPayoff(s, 'plot', 1, 'Payoff 1', 70)
    const p1 = s.payoffs[0].id
    s = registerPayoff(s, 'emotional', 2, 'Payoff 2', 50)
    s = deliverPayoff(s, p1, 20, 80)
    const status = getPayoffStatus(s)
    expect(status.pending.length).toBe(1)
    expect(status.delivered.length).toBe(1)
    expect(status.byType['emotional']).toBe(1)
  })
})

describe('comparePayoffSatisfaction', () => {
  it('should compare satisfaction scores', () => {
    let s = createEmptyState()
    s = registerPayoff(s, 'plot', 1, 'Payoff 1', 80)
    s = registerPayoff(s, 'character', 2, 'Payoff 2', 70)
    const p1 = s.payoffs[0].id
    const p2 = s.payoffs[1].id
    s = deliverPayoff(s, p1, 20, 85)
    s = deliverPayoff(s, p2, 22, 55)
    const result = comparePayoffSatisfaction(s, p1, p2)
    expect(result.moreSatisfying).toBe(p1)
    expect(result.scoreDiff).toBe(30)
  })
})
