import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  plantForeshadow,
  linkPayoff,
  markPayoffFulfilled,
  generateForeshadowReport,
  getForeshadowsForChapter,
} from './NarrativeForeshadowingEngine'

describe('createEmptyState', () => {
  it('should create empty state', () => {
    const s = createEmptyState()
    expect(s.beats).toEqual([])
  })
})

describe('plantForeshadow', () => {
  it('should plant foreshadow', () => {
    let s = createEmptyState()
    s = plantForeshadow(s, 5, 'subtle', 40)
    expect(s.beats.length).toBe(1)
    expect(s.beats[0].foreshadowType).toBe('subtle')
    expect(s.beats[0].payoffFulfilled).toBe(false)
  })

  it('should plant multiple foreshadows', () => {
    let s = createEmptyState()
    s = plantForeshadow(s, 5, 'subtle', 40)
    s = plantForeshadow(s, 10, 'direct', 70)
    expect(s.beats.length).toBe(2)
  })
})

describe('linkPayoff', () => {
  it('should link payoff to foreshadow', () => {
    let s = createEmptyState()
    s = plantForeshadow(s, 5, 'subtle', 40)
    const foreId = s.beats[0].id
    s = linkPayoff(s, foreId, 25)
    expect(s.beats[0].targetChapter).toBe(25)
  })
})

describe('markPayoffFulfilled', () => {
  it('should mark payoff fulfilled', () => {
    let s = createEmptyState()
    s = plantForeshadow(s, 5, 'subtle', 40)
    const foreId = s.beats[0].id
    s = linkPayoff(s, foreId, 25)
    s = markPayoffFulfilled(s, 25)
    expect(s.beats[0].payoffFulfilled).toBe(true)
  })
})

describe('generateForeshadowReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateForeshadowReport(s)
    expect(report.totalForeshadows).toBe(0)
    expect(report.fulfillmentRate).toBe(0)
  })

  it('should calculate fulfillment rate', () => {
    let s = createEmptyState()
    s = plantForeshadow(s, 5, 'subtle', 40)
    s = plantForeshadow(s, 10, 'direct', 70)
    const id1 = s.beats[0].id
    s = linkPayoff(s, id1, 25)
    s = markPayoffFulfilled(s, 25)
    const report = generateForeshadowReport(s)
    expect(report.totalForeshadows).toBe(2)
    expect(report.fulfilledCount).toBe(1)
    expect(report.fulfillmentRate).toBe(50)
  })
})

describe('getForeshadowsForChapter', () => {
  it('should return chapter foreshadows', () => {
    let s = createEmptyState()
    s = plantForeshadow(s, 5, 'subtle', 40)
    s = plantForeshadow(s, 5, 'dialogue', 30)
    const chapter5 = getForeshadowsForChapter(s, 5)
    expect(chapter5.length).toBe(2)
  })
})
