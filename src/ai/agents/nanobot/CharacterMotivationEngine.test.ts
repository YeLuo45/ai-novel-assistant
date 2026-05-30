import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  registerMotivation,
  registerGoal,
  updateMotivationStrength,
  achieveGoal,
  generateAnalysis,
  getCharacterGoals,
  compareMotivation,
} from './CharacterMotivationEngine'

describe('createEmptyState', () => {
  it('should create empty motivation state', () => {
    const s = createEmptyState()
    expect(s.motivations).toEqual([])
    expect(s.goals).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('registerMotivation', () => {
  it('should register a motivation', () => {
    let s = createEmptyState()
    s = registerMotivation(s, 'hero', 'power', 'Wants to rule kingdom', 80, 70)
    expect(s.motivations.length).toBe(1)
    expect(s.motivations[0].type).toBe('power')
    expect(s.motivations[0].strength).toBe(80)
  })
})

describe('registerGoal', () => {
  it('should register a goal', () => {
    let s = createEmptyState()
    s = registerGoal(s, 'hero', 'Become king', null, 70, 50)
    expect(s.goals.length).toBe(1)
    expect(s.goals[0].achieved).toBe(false)
  })
})

describe('updateMotivationStrength', () => {
  it('should update motivation strength', () => {
    let s = createEmptyState()
    s = registerMotivation(s, 'hero', 'love', 'Loves princess', 50)
    const motId = s.motivations[0].id
    s = updateMotivationStrength(s, motId, 85)
    expect(s.motivations[0].strength).toBe(85)
  })
})

describe('achieveGoal', () => {
  it('should mark goal as achieved', () => {
    let s = createEmptyState()
    s = registerGoal(s, 'hero', 'Find treasure', null, 60, 70)
    const goalId = s.goals[0].id
    s = achieveGoal(s, goalId, 15)
    expect(s.goals[0].achieved).toBe(true)
    expect(s.goals[0].chapterAchieved).toBe(15)
  })
})

describe('generateAnalysis', () => {
  it('should return empty analysis', () => {
    const s = createEmptyState()
    const analysis = generateAnalysis(s)
    expect(analysis.totalMotivations).toBe(0)
    expect(analysis.dominantMotivation).toBeNull()
  })

  it('should identify dominant motivation', () => {
    let s = createEmptyState()
    s = registerMotivation(s, 'hero', 'power', 'Wants power', 80)
    s = registerMotivation(s, 'hero', 'power', 'More power', 70)
    s = registerMotivation(s, 'villain', 'love', 'Loves someone', 60)
    const analysis = generateAnalysis(s)
    expect(analysis.dominantMotivation).toBe('power')
  })
})

describe('getCharacterGoals', () => {
  it('should return character goals', () => {
    let s = createEmptyState()
    s = registerGoal(s, 'hero', 'Goal 1', null, 50, 60)
    s = registerGoal(s, 'villain', 'Goal 2', null, 40, 30)
    const heroGoals = getCharacterGoals(s, 'hero')
    expect(heroGoals.length).toBe(1)
  })
})

describe('compareMotivation', () => {
  it('should return first for unknown', () => {
    const s = createEmptyState()
    const result = compareMotivation(s, 'unknown', 'also_unknown')
    expect(result.stronger).toBe('unknown')
  })

  it('should compare motivations', () => {
    let s = createEmptyState()
    s = registerMotivation(s, 'hero', 'power', 'Strong', 80)
    s = registerMotivation(s, 'hero', 'love', 'Weak', 40)
    const result = compareMotivation(s, s.motivations[0].id, s.motivations[1].id)
    expect(result.stronger).toBe(s.motivations[0].id)
    expect(result.strengthDiff).toBe(40)
  })
})
