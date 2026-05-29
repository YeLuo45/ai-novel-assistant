import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  assessDimensionSkill,
  adaptStrategy,
  generateSuggestion,
  recordSession,
  getLearningPath,
  getCoachingSummary,
  provideFeedback,
  selectNextPracticeTopic,
} from './PersonalizedWritingCoach'

describe('createEmptyState', () => {
  it('should create empty state', () => {
    const state = createEmptyState()
    expect(state.userModel.overallScore).toBe(50)
    expect(state.userModel.experienceLevel).toBe('novice')
    expect(state.currentStrategy.approach).toBe('encouraging')
    expect(state.sessionHistory.length).toBe(0)
    expect(state.typeAlias).toEqual({})
  })
})

describe('assessDimensionSkill', () => {
  it('should classify beginner level', () => {
    let state = createEmptyState()
    state = assessDimensionSkill(state, 'plot', 35)
    expect(state.userModel.dimensions.get('plot')!.level).toBe('beginner')
  })

  it('should classify intermediate level', () => {
    let state = createEmptyState()
    state = assessDimensionSkill(state, 'dialogue', 60)
    expect(state.userModel.dimensions.get('dialogue')!.level).toBe('intermediate')
  })

  it('should classify advanced level', () => {
    let state = createEmptyState()
    state = assessDimensionSkill(state, 'character', 78)
    expect(state.userModel.dimensions.get('character')!.level).toBe('advanced')
  })

  it('should classify expert level', () => {
    let state = createEmptyState()
    state = assessDimensionSkill(state, 'worldbuilding', 90)
    expect(state.userModel.dimensions.get('worldbuilding')!.level).toBe('expert')
  })

  it('should update overall score', () => {
    let state = createEmptyState()
    state = assessDimensionSkill(state, 'plot', 70)
    state = assessDimensionSkill(state, 'dialogue', 50)
    expect(state.userModel.overallScore).toBe(60)
  })
})

describe('adaptStrategy', () => {
  it('should become challenging after high positive score', () => {
    let state = createEmptyState()
    state = adaptStrategy(state, 80, 'positive')
    expect(state.currentStrategy.approach).toBe('challenging')
    expect(state.currentStrategy.pacingLevel).toBe('fast')
  })

  it('should become encouraging after low score', () => {
    let state = createEmptyState()
    state = adaptStrategy(state, 30, 'negative')
    expect(state.currentStrategy.approach).toBe('encouraging')
    expect(state.currentStrategy.pacingLevel).toBe('slow')
  })

  it('should adapt tone for novice users', () => {
    let state = createEmptyState()
    state = adaptStrategy(state, 60, 'neutral')
    expect(state.currentStrategy.tone).toBe('warm')
    expect(state.currentStrategy.examplesFrequency).toBe('high')
  })

  it('should adapt tone for master users', () => {
    let state = createEmptyState()
    state = { ...state, userModel: { ...state.userModel, experienceLevel: 'master' as const } }
    state = adaptStrategy(state, 60, 'neutral')
    expect(state.currentStrategy.tone).toBe('direct')
  })
})

describe('generateSuggestion', () => {
  it('should return default for unknown dimension', () => {
    const state = createEmptyState()
    const suggestion = generateSuggestion(state, 'plot')
    expect(suggestion).toContain('plot')
  })

  it('should give encouraging suggestion for beginner', () => {
    let state = createEmptyState()
    state = assessDimensionSkill(state, 'plot', 30, ['basic structure'], [])
    const suggestion = generateSuggestion(state, 'plot')
    expect(suggestion.length).toBeGreaterThan(0)
  })

  it('should give challenging suggestion when appropriate', () => {
    let state = createEmptyState()
    state = assessDimensionSkill(state, 'plot', 80, ['advanced arcs'], ['story flow'])
    state = adaptStrategy(state, 85, 'positive')
    const suggestion = generateSuggestion(state, 'plot')
    expect(suggestion).toContain('challenge')
  })
})

describe('recordSession', () => {
  it('should update recent growth', () => {
    let state = createEmptyState()
    state = recordSession(state, 65, ['focus on pacing'])
    expect(state.userModel.recentGrowth).toContain(65)
  })

  it('should calculate learning velocity', () => {
    let state = createEmptyState()
    for (const score of [50, 55, 58, 62, 65]) {
      state = recordSession(state, score, [])
    }
    expect(state.userModel.learningVelocity).toBeGreaterThan(0)
  })

  it('should archive suggestions', () => {
    let state = createEmptyState()
    state = recordSession(state, 60, ['improve dialogue', 'add description'])
    expect(state.suggestionArchive.length).toBeGreaterThanOrEqual(2)
  })

  it('should track session history', () => {
    let state = createEmptyState()
    state = recordSession(state, 70, ['good work'])
    expect(state.sessionHistory.length).toBe(1)
    expect(state.coachingLog.length).toBe(1)
  })
})

describe('getLearningPath', () => {
  it('should return path sorted by weakest dimension', () => {
    let state = createEmptyState()
    state = assessDimensionSkill(state, 'plot', 80)
    state = assessDimensionSkill(state, 'dialogue', 40)
    state = recordSession(state, 60, [])
    const path = getLearningPath(state, 2)
    expect(path.length).toBe(2)
    expect(path[0].dimension).toBe('dialogue') // weakest first
  })

  it('should show next level target', () => {
    let state = createEmptyState()
    state = assessDimensionSkill(state, 'style', 55, ['voice'], ['vocabulary'])
    state = recordSession(state, 55, [])
    const path = getLearningPath(state, 1)
    expect(path[0].targetLevel).toBe('advanced')
    expect(path[0].milestones.length).toBeGreaterThan(0)
  })
})

describe('getCoachingSummary', () => {
  it('should return coaching summary', () => {
    let state = createEmptyState()
    state = assessDimensionSkill(state, 'plot', 75, ['themes'], ['structure'])
    state = assessDimensionSkill(state, 'dialogue', 55, ['pacing'], ['voice'])
    state = recordSession(state, 65, [])
    const summary = getCoachingSummary(state)
    expect(summary.overallScore).toBe(65)
    expect(summary.strongestDimension).toBe('plot')
    expect(summary.weakestDimension).toBe('dialogue')
  })

  it('should detect improving trend', () => {
    let state = createEmptyState()
    for (const score of [40, 42, 45, 50, 55, 60]) {
      state = recordSession(state, score, [])
    }
    const summary = getCoachingSummary(state)
    expect(summary.recentTrend).toBe('improving')
  })
})

describe('provideFeedback', () => {
  it('should provide overall and dimension feedback', () => {
    const state = createEmptyState()
    const scores = new Map([['plot', 75], ['dialogue', 55]])
    const feedback = provideFeedback(state, scores)
    expect(feedback.overall.length).toBeGreaterThan(0)
    expect(feedback.dimensionFeedback.size).toBe(2)
  })
})

describe('selectNextPracticeTopic', () => {
  it('should pick weakest dimension with most growth potential', () => {
    let state = createEmptyState()
    state = assessDimensionSkill(state, 'plot', 90)
    state = assessDimensionSkill(state, 'dialogue', 30)
    state = recordSession(state, 60, [])
    const topic = selectNextPracticeTopic(state)
    expect(topic.topic).toBe('dialogue')
    expect(topic.difficulty).toBe('beginner')
  })

  it('should default to fundamentals for empty model', () => {
    const state = createEmptyState()
    const topic = selectNextPracticeTopic(state)
    expect(topic.topic).toBe('writing fundamentals')
  })
})
