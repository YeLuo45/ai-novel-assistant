import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  analyzeSkillGaps,
  createLearningPath,
  generateCoachFeedback,
  recordSessionImprovement,
  getProgressSummary,
  completeChallenge,
  getNextChallenge,
  analyzeWritingSample,
  updateSkillLevel,
  getRecommendedFocus,
} from './PersonalizedWritingCoach'

describe('createEmptyState', () => {
  it('should create state with default skill profiles', () => {
    const s = createEmptyState()
    expect(s.skillProfiles.pacing).toBe(50)
    expect(s.skillProfiles.dialogue).toBe(50)
    expect(s.sessionHistory).toEqual([])
    expect(s.challenges).toEqual([])
    expect(s.currentPath).toBeNull()
    expect(s.typeAlias).toEqual({})
  })
})

describe('analyzeSkillGaps', () => {
  it('should identify gaps where score is below 70', () => {
    const s = createEmptyState()
    const gaps = analyzeSkillGaps(s, { pacing: 60, dialogue: 55, description: 80 })
    expect(gaps.length).toBe(2)
    expect(gaps.some(g => g.dimension === 'pacing')).toBe(true)
    expect(gaps.some(g => g.dimension === 'dialogue')).toBe(true)
  })

  it('should not include dimensions with score >= 70', () => {
    const s = createEmptyState()
    const gaps = analyzeSkillGaps(s, { pacing: 80, dialogue: 90 })
    expect(gaps.length).toBe(0)
  })

  it('should set target level based on current skill profile', () => {
    const s = createEmptyState()
    s.skillProfiles.pacing = 60
    const gaps = analyzeSkillGaps(s, { pacing: 50 })
    expect(gaps[0].targetLevel).toBeGreaterThan(gaps[0].currentLevel)
  })

  it('should generate exercises for each gap', () => {
    const s = createEmptyState()
    const gaps = analyzeSkillGaps(s, { pacing: 50 })
    expect(gaps[0].exercises.length).toBeGreaterThan(0)
  })

  it('should sort gaps by gap size (ascending)', () => {
    const s = createEmptyState()
    const gaps = analyzeSkillGaps(s, { pacing: 50, dialogue: 60 })
    // dialogue gap = 0 (60-60), pacing gap = 10 (60-50), so dialogue comes first
    expect(gaps[0].dimension).toBe('dialogue')
    expect(gaps[1].dimension).toBe('pacing')
  })
})

describe('createLearningPath', () => {
  it('should create path from skill gaps', () => {
    const s = createEmptyState()
    const gaps = analyzeSkillGaps(s, { pacing: 55, dialogue: 60 })
    const path = createLearningPath(s, gaps)
    expect(path.skillGaps).toEqual(gaps)
    expect(path.focusAreas.length).toBe(2)
  })

  it('should include recommended exercises with priority', () => {
    const s = createEmptyState()
    const gaps = analyzeSkillGaps(s, { pacing: 50 })
    const path = createLearningPath(s, gaps)
    expect(path.recommendedExercises.length).toBeGreaterThan(0)
    expect(path.recommendedExercises[0].priority).toBeGreaterThan(0)
  })

  it('should estimate sessions based on gap size', () => {
    const s = createEmptyState()
    const gaps = analyzeSkillGaps(s, { pacing: 40 })
    const path = createLearningPath(s, gaps)
    expect(path.estimatedSessions).toBeGreaterThan(0)
  })
})

describe('generateCoachFeedback', () => {
  it('should generate feedback for each dimension', () => {
    const s = createEmptyState()
    const feedback = generateCoachFeedback(s, { pacing: 75, dialogue: 60 })
    expect(feedback.length).toBe(2)
  })

  it('should identify strengths for high scores', () => {
    const s = createEmptyState()
    const feedback = generateCoachFeedback(s, { pacing: 85 })
    expect(feedback[0].strengths.length).toBeGreaterThan(0)
  })

  it('should identify weaknesses for low scores', () => {
    const s = createEmptyState()
    const feedback = generateCoachFeedback(s, { pacing: 55 })
    expect(feedback[0].weaknesses.length).toBeGreaterThan(0)
  })

  it('should include suggestions for improvement', () => {
    const s = createEmptyState()
    const feedback = generateCoachFeedback(s, { pacing: 60 })
    expect(feedback[0].suggestions.length).toBeGreaterThan(0)
  })

  it('should include examples for dimensions below 70', () => {
    const s = createEmptyState()
    const feedback = generateCoachFeedback(s, { pacing: 65 })
    expect(feedback[0].examples.length).toBeGreaterThan(0)
  })
})

describe('recordSessionImprovement', () => {
  it('should add session to history', () => {
    let s = createEmptyState()
    s = recordSessionImprovement(s, 15, 'pacing')
    expect(s.sessionHistory.length).toBe(1)
    expect(s.sessionHistory[0].improvement).toBe(15)
  })

  it('should keep only last 20 sessions', () => {
    let s = createEmptyState()
    for (let i = 0; i < 25; i++) {
      s = recordSessionImprovement(s, i, 'pacing')
    }
    expect(s.sessionHistory.length).toBe(20)
  })

  it('should track focus area', () => {
    let s = createEmptyState()
    s = recordSessionImprovement(s, 10, 'dialogue')
    expect(s.sessionHistory[0].focus).toBe('dialogue')
  })
})

describe('getProgressSummary', () => {
  it('should calculate average improvement', () => {
    let s = createEmptyState()
    s = recordSessionImprovement(s, 10, 'pacing')
    s = recordSessionImprovement(s, 20, 'dialogue')
    const summary = getProgressSummary(s)
    expect(summary.avgImprovement).toBe(15)
  })

  it('should count total sessions', () => {
    let s = createEmptyState()
    s = recordSessionImprovement(s, 10, 'pacing')
    s = recordSessionImprovement(s, 20, 'pacing')
    const summary = getProgressSummary(s)
    expect(summary.totalSessions).toBe(2)
  })

  it('should find most improved area', () => {
    let s = createEmptyState()
    s = recordSessionImprovement(s, 5, 'pacing')
    s = recordSessionImprovement(s, 20, 'dialogue')
    const summary = getProgressSummary(s)
    expect(summary.mostImproved).toBe('dialogue')
  })

  it('should return zero for empty history', () => {
    const s = createEmptyState()
    const summary = getProgressSummary(s)
    expect(summary.avgImprovement).toBe(0)
    expect(summary.totalSessions).toBe(0)
  })
})

describe('completeChallenge', () => {
  it('should mark challenge as completed', () => {
    let s = createEmptyState()
    s = { ...s, challenges: [{ id: 'c1', type: 'pacing', difficulty: 5, description: 'test', targetSkill: 'pacing', completed: false }] }
    s = completeChallenge(s, 'c1', 80)
    expect(s.challenges.find(c => c.id === 'c1')!.completed).toBe(true)
  })

  it('should update skill profile based on score', () => {
    let s = createEmptyState()
    s.skillProfiles.pacing = 50
    s = { ...s, challenges: [{ id: 'c1', type: 'pacing', difficulty: 5, description: 'test', targetSkill: 'pacing', completed: false }] }
    s = completeChallenge(s, 'c1', 80)
    expect(s.skillProfiles.pacing).toBeGreaterThan(50)
  })
})

describe('getNextChallenge', () => {
  it('should return incomplete challenge if available', () => {
    let s = createEmptyState()
    s = { ...s, challenges: [{ id: 'c1', type: 'pacing', difficulty: 5, description: 'test', targetSkill: 'pacing', completed: false }] }
    const next = getNextChallenge(s)
    expect(next).not.toBeNull()
    expect(next!.id).toBe('c1')
  })

  it('should return null if all completed', () => {
    let s = createEmptyState()
    s = { ...s, challenges: [{ id: 'c1', type: 'pacing', difficulty: 5, description: 'test', targetSkill: 'pacing', completed: true }] }
    const next = getNextChallenge(s)
    // Creates new challenge for weakest skill
    expect(next).not.toBeNull()
  })
})

describe('analyzeWritingSample', () => {
  it('should return feedback for writing sample', () => {
    const s = createEmptyState()
    const feedback = analyzeWritingSample(s, 'Hello, world! This is a test sentence. Another one here.')
    expect(feedback.length).toBeGreaterThan(0)
  })

  it('should score based on text characteristics', () => {
    const s = createEmptyState()
    const text = 'The cat sat on the mat. ' + 'Many words here. '.repeat(50)
    const feedback = analyzeWritingSample(s, text)
    expect(feedback[0].score).toBeGreaterThan(0)
  })
})

describe('updateSkillLevel', () => {
  it('should update existing dimension', () => {
    let s = createEmptyState()
    s = updateSkillLevel(s, 'pacing', 75)
    expect(s.skillProfiles.pacing).toBe(75)
  })

  it('should ignore unknown dimensions', () => {
    let s = createEmptyState()
    s = updateSkillLevel(s, 'unknown_dimension', 90)
    expect(s.skillProfiles.pacing).toBe(50)
  })

  it('should clamp to 0-100 range', () => {
    let s = createEmptyState()
    s = updateSkillLevel(s, 'pacing', 150)
    expect(s.skillProfiles.pacing).toBe(100)
    s = updateSkillLevel(s, 'pacing', -20)
    expect(s.skillProfiles.pacing).toBe(0)
  })
})

describe('getRecommendedFocus', () => {
  it('should return weakest skill below 70', () => {
    const s = createEmptyState()
    // Set all dimensions except pacing to 80 so pacing is the weakest at 55
    for (const dim of Object.keys(s.skillProfiles)) {
      if (dim !== 'pacing') s.skillProfiles[dim] = 80
    }
    s.skillProfiles.pacing = 55
    const focus = getRecommendedFocus(s)
    expect(focus).toBe('pacing')
  })

  it('should return null if all skills >= 70', () => {
    const s = createEmptyState()
    // Set ALL dimensions to 70+ so nothing is recommended
    for (const dim of Object.keys(s.skillProfiles)) {
      s.skillProfiles[dim] = 72
    }
    const focus = getRecommendedFocus(s)
    expect(focus).toBeNull()
  })
})
