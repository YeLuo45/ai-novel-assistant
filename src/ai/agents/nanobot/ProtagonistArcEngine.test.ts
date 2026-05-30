import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  initProtagonist,
  updateBelief,
  addWant,
  advanceGrowthStage,
  addArcPhase,
  generateGrowthReport,
  measureBeliefShift,
} from './ProtagonistArcEngine'

describe('createEmptyState', () => {
  it('should create empty protagonist state', () => {
    const s = createEmptyState()
    expect(s.protagonist).toBeNull()
    expect(s.arcPhases).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('initProtagonist', () => {
  it('should initialize protagonist', () => {
    let s = createEmptyState()
    s = initProtagonist(s, 'Hero', [{ description: 'World is safe', polarity: 'positive', strength: 80 }], [{ description: 'Find treasure', urgency: 70, obstacleLevel: 40 }], 'Arrogance')
    expect(s.protagonist).not.toBeNull()
    expect(s.protagonist!.name).toBe('Hero')
    expect(s.protagonist!.beliefs.length).toBe(1)
    expect(s.protagonist!.growthStage).toBe('ordinary_world')
  })

  it('should initialize with multiple beliefs and wants', () => {
    let s = createEmptyState()
    s = initProtagonist(s, 'Hero',
      [
        { description: 'Trust no one', polarity: 'negative', strength: 60 },
        { description: 'Justice matters', polarity: 'positive', strength: 70 },
      ],
      [
        { description: 'Save the kingdom', urgency: 80, obstacleLevel: 50 },
        { description: 'Win the tournament', urgency: 60, obstacleLevel: 30 },
      ],
      'Arrogance'
    )
    expect(s.protagonist!.beliefs.length).toBe(2)
    expect(s.protagonist!.wants.length).toBe(2)
  })
})

describe('updateBelief', () => {
  it('should update belief strength', () => {
    let s = createEmptyState()
    s = initProtagonist(s, 'Hero', [{ description: 'Trust no one', polarity: 'negative', strength: 60 }], [], 'Paranoia')
    const beliefId = s.protagonist!.beliefs[0].id
    s = updateBelief(s, beliefId, 30)
    expect(s.protagonist!.beliefs[0].strength).toBe(30)
  })
})

describe('addWant', () => {
  it('should add a new want', () => {
    let s = createEmptyState()
    s = initProtagonist(s, 'Hero', [], [], 'Flaw')
    s = addWant(s, 'New want', 70, 40)
    expect(s.protagonist!.wants.length).toBe(1)
    expect(s.protagonist!.wants[0].urgency).toBe(70)
  })
})

describe('advanceGrowthStage', () => {
  it('should advance growth stage', () => {
    let s = createEmptyState()
    s = initProtagonist(s, 'Hero', [], [], 'Flaw')
    s = advanceGrowthStage(s, 'call_to_adventure', 15)
    expect(s.protagonist!.growthStage).toBe('call_to_adventure')
    expect(s.protagonist!.arcProgress).toBe(15)
  })
})

describe('addArcPhase', () => {
  it('should add arc phase', () => {
    let s = createEmptyState()
    s = addArcPhase(s, 'trials', 40, 70, 'Learned teamwork', 'External enemy')
    expect(s.arcPhases.length).toBe(1)
    expect(s.arcPhases[0].stage).toBe('trials')
  })
})

describe('generateGrowthReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateGrowthReport(s)
    expect(report.totalBeliefs).toBe(0)
    expect(report.growthAchieved).toBe(0)
  })

  it('should report protagonist growth', () => {
    let s = createEmptyState()
    s = initProtagonist(s, 'Hero',
      [{ description: 'Belief 1', polarity: 'positive', strength: 70 }],
      [{ description: 'Want 1', urgency: 60, obstacleLevel: 40 }],
      'Flaw'
    )
    s = advanceGrowthStage(s, 'trials', 55)
    const report = generateGrowthReport(s)
    expect(report.totalBeliefs).toBe(1)
    expect(report.growthAchieved).toBe(55)
    expect(report.currentStage).toBe('trials')
  })

  it('should suggest next milestone', () => {
    let s = createEmptyState()
    s = initProtagonist(s, 'Hero', [], [], 'Flaw')
    s = advanceGrowthStage(s, 'acceptance', 35)
    const report = generateGrowthReport(s)
    expect(report.nextMilestone).toBe('trials')
  })
})

describe('measureBeliefShift', () => {
  it('should return unchanged for no arc phases', () => {
    let s = createEmptyState()
    s = initProtagonist(s, 'Hero', [{ description: 'Belief', polarity: 'positive', strength: 50 }], [], 'Flaw')
    const beliefId = s.protagonist!.beliefs[0].id
    expect(measureBeliefShift(s, beliefId)).toBe('unchanged')
  })
})
