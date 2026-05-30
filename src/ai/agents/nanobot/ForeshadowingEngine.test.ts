import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  plantForeshadowing,
  registerPayoff,
  analyzeForeshadowing,
  getForeshadowingForChapter,
  compareForeshadowingStrength,
} from './ForeshadowingEngine'

describe('createEmptyState', () => {
  it('should create empty foreshadowing state', () => {
    const s = createEmptyState()
    expect(s.plantings).toEqual([])
    expect(s.payoffs).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('plantForeshadowing', () => {
  it('should plant a foreshadowing', () => {
    let s = createEmptyState()
    s = plantForeshadowing(s, 'subtle', 'ch1', 20, 'The sky looked strange.', 'ominous storm coming', 40)
    expect(s.plantings.length).toBe(1)
    expect(s.plantings[0].plantedHint).toBe('ominous storm coming')
    expect(s.plantings[0].strength).toBe(40)
  })

  it('should classify foreshadowing type', () => {
    let s = createEmptyState()
    s = plantForeshadowing(s, 'dialogue', 'ch1', 10, '"Be careful," she whispered.', 'danger ahead', 50)
    expect(s.plantings[0].type).toBe('dialogue')
  })
})

describe('registerPayoff', () => {
  it('should register payoff and link to planting', () => {
    let s = createEmptyState()
    s = plantForeshadowing(s, 'subtle', 'ch1', 20, 'The sky looked strange.', 'ominous storm coming', 40)
    s = registerPayoff(s, 'ch5', 50, 'A storm hit the village.', 'The storm arrived.', 80)
    expect(s.payoffs.length).toBe(1)
    expect(s.plantings[0].payoffChapterId).toBe('ch5')
    expect(s.plantings[0].payoffStrength).toBe(80)
  })

  it('should not register payoff if no unpaired planting', () => {
    let s = createEmptyState()
    s = registerPayoff(s, 'ch5', 50, 'A storm hit.', 'Storm.', 80)
    expect(s.payoffs.length).toBe(0)
  })
})

describe('analyzeForeshadowing', () => {
  it('should return empty analysis for no foreshadowing', () => {
    const s = createEmptyState()
    const analysis = analyzeForeshadowing(s)
    expect(analysis.totalPlanted).toBe(0)
    expect(analysis.coverageRatio).toBe(0)
  })

  it('should analyze foreshadowing coverage', () => {
    let s = createEmptyState()
    s = plantForeshadowing(s, 'subtle', 'ch1', 20, 'Hint 1', 'hint', 40)
    s = plantForeshadowing(s, 'explicit', 'ch2', 20, 'Hint 2', 'hint2', 60)
    s = registerPayoff(s, 'ch5', 50, 'Payoff 1', 'payoff', 80)
    const analysis = analyzeForeshadowing(s)
    expect(analysis.totalPlanted).toBe(2)
    expect(analysis.totalPayoff).toBe(1)
    expect(analysis.danglingPlantings.length).toBe(1)
  })

  it('should suggest recommendations', () => {
    let s = createEmptyState()
    for (let i = 1; i <= 6; i++) {
      s = plantForeshadowing(s, 'subtle', `ch${i}`, 20, `Hint ${i}`, `hint${i}`, 40)
    }
    const analysis = analyzeForeshadowing(s)
    expect(analysis.recommendations.some(r => r.includes('unfulfilled'))).toBe(true)
  })
})

describe('getForeshadowingForChapter', () => {
  it('should return chapter foreshadowing', () => {
    let s = createEmptyState()
    s = plantForeshadowing(s, 'subtle', 'ch1', 20, 'Hint', 'hint', 40)
    const result = getForeshadowingForChapter(s, 'ch1')
    expect(result.plantings.length).toBe(1)
  })
})

describe('compareForeshadowingStrength', () => {
  it('should compare chapter effectiveness', () => {
    let s = createEmptyState()
    s = plantForeshadowing(s, 'subtle', 'ch1', 20, 'Hint 1', 'hint1', 70)
    s = plantForeshadowing(s, 'subtle', 'ch2', 20, 'Hint 2', 'hint2', 30)
    s = registerPayoff(s, 'ch5', 50, 'Payoff 1', 'payoff1', 80)
    const result = compareForeshadowingStrength(s, 'ch1', 'ch2')
    expect(result.moreEffective).toBe('ch1')
  })
})
