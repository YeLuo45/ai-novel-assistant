import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  recordFeedback,
  recordCorrection,
  computeRatingPattern,
  trackImprovement,
  analyzeWritingBehavior,
  getImprovementSummary,
  detectQualityAnomalies,
  generateFeedbackRecommendations,
} from './AuthorFeedbackEngine'

describe('createEmptyState', () => {
  it('should create empty state', () => {
    const state = createEmptyState()
    expect(state.entries).toEqual([])
    expect(state.ratingPattern).toBeNull()
    expect(state.improvements).toEqual([])
    expect(state.behavior).toBeNull()
    expect(state.typeAlias).toEqual({})
  })
})

describe('recordFeedback', () => {
  it('should record explicit feedback', () => {
    let state = createEmptyState()
    state = recordFeedback(state, 'explicit', 'chapter_completion', 85, 'Finished chapter 3')
    expect(state.entries.length).toBe(1)
    expect(state.entries[0].type).toBe('explicit')
    expect(state.entries[0].quality).toBe(85)
    expect(state.entries[0].delta).toBe(0)
    expect(state.entries[0].trigger).toBe('chapter_completion')
  })

  it('should compute delta from previous', () => {
    let state = createEmptyState()
    state = recordFeedback(state, 'explicit', 'first', 70)
    state = recordFeedback(state, 'implicit', 'second', 75)
    expect(state.entries[1].delta).toBe(5)
  })

  it('should record correction type', () => {
    let state = createEmptyState()
    state = recordFeedback(state, 'correction', 'grammar_fix', 90)
    expect(state.entries[0].type).toBe('correction')
  })

  it('should track recent corrections', () => {
    let state = createEmptyState()
    for (let i = 0; i < 25; i++) {
      state = recordCorrection(state, `correction_${i}`)
    }
    expect(state.recentCorrections.length).toBe(20)
    expect(state.recentCorrections[19]).toBe('correction_24')
  })
})

describe('computeRatingPattern', () => {
  it('should return same state if no entries', () => {
    const state = createEmptyState()
    const result = computeRatingPattern(state)
    expect(result.ratingPattern).toBeNull()
  })

  it('should compute average quality', () => {
    let state = createEmptyState()
    state = recordFeedback(state, 'explicit', 'q1', 60)
    state = recordFeedback(state, 'explicit', 'q2', 70)
    state = recordFeedback(state, 'explicit', 'q3', 80)
    state = computeRatingPattern(state)
    expect(state.ratingPattern!.averageQuality).toBeGreaterThan(0)
  })

  it('should detect improving trend', () => {
    let state = createEmptyState()
    for (let i = 0; i < 10; i++) {
      state = recordFeedback(state, 'explicit', `q${i}`, 50 + i * 3)
    }
    state = computeRatingPattern(state)
    expect(state.ratingPattern!.trend).toBe('improving')
  })

  it('should detect declining trend', () => {
    let state = createEmptyState()
    for (let i = 0; i < 10; i++) {
      state = recordFeedback(state, 'explicit', `q${i}`, 90 - i * 4)
    }
    state = computeRatingPattern(state)
    expect(state.ratingPattern!.trend).toBe('declining')
  })

  it('should calculate variance', () => {
    let state = createEmptyState()
    state = recordFeedback(state, 'explicit', 'a', 50)
    state = recordFeedback(state, 'explicit', 'b', 70)
    state = recordFeedback(state, 'explicit', 'c', 90)
    state = computeRatingPattern(state)
    expect(state.ratingPattern!.variance).toBeGreaterThan(0)
  })

  it('should compute recent window', () => {
    let state = createEmptyState()
    for (let i = 0; i < 10; i++) {
      state = recordFeedback(state, 'explicit', `q${i}`, 60 + i * 2)
    }
    state = computeRatingPattern(state)
    expect(state.ratingPattern!.recentWindow).toBeGreaterThan(state.ratingPattern!.averageQuality)
  })

  it('should track peak and low', () => {
    let state = createEmptyState()
    const qualities = [40, 75, 90, 55, 85]
    for (const q of qualities) {
      state = recordFeedback(state, 'explicit', 'test', q)
    }
    state = computeRatingPattern(state)
    expect(state.ratingPattern!.peakQuality).toBe(90)
    expect(state.ratingPattern!.lowQuality).toBe(40)
  })
})

describe('trackImprovement', () => {
  it('should track new dimension', () => {
    let state = createEmptyState()
    state = trackImprovement(state, 'dialogue_quality', 60, 75)
    expect(state.improvements.length).toBe(1)
    expect(state.improvements[0].progress).toBe(25)
  })

  it('should update existing dimension', () => {
    let state = createEmptyState()
    state = trackImprovement(state, 'pacing', 50, 60)
    state = trackImprovement(state, 'pacing', 60, 72)
    expect(state.improvements.length).toBe(1)
    expect(state.improvements[0].sessionsUsed).toBe(2)
  })

  it('should handle zero before score', () => {
    let state = createEmptyState()
    state = trackImprovement(state, 'new_metric', 0, 50)
    expect(state.improvements[0].progress).toBe(0)
  })
})

describe('analyzeWritingBehavior', () => {
  it('should return same state if no entries', () => {
    const state = createEmptyState()
    const result = analyzeWritingBehavior(state)
    expect(result.behavior).toBeNull()
  })

  it('should compute session frequency', () => {
    let state = createEmptyState()
    const now = Date.now()
    for (let i = 0; i < 7; i++) {
      state.entries.push({
        timestamp: now - (7 - i) * 86400000,
        type: 'explicit',
        trigger: 'test',
        quality: 75,
        delta: 0,
        context: '',
      })
    }
    state = analyzeWritingBehavior(state)
    expect(state.behavior!.sessionFrequency).toBe(1.0)
  })

  it('should find preferred time slot', () => {
    let state = createEmptyState()
    const base = new Date()
    base.setHours(9, 0, 0, 0)
    for (let i = 0; i < 5; i++) {
      state.entries.push({
        timestamp: base.getTime() + i * 86400000,
        type: 'explicit',
        trigger: 'morning',
        quality: 85,
        delta: 0,
        context: '',
      })
    }
    state = analyzeWritingBehavior(state)
    expect(state.behavior!.preferredTimeSlot).toBeTruthy()
  })

  it('should calculate revision rate', () => {
    let state = createEmptyState()
    state = recordFeedback(state, 'explicit', 'e1', 70)
    state = recordFeedback(state, 'revision', 'r1', 75)
    state = recordFeedback(state, 'explicit', 'e2', 80)
    state = recordFeedback(state, 'revision', 'r2', 82)
    state = analyzeWritingBehavior(state)
    expect(state.behavior!.revisionRate).toBeGreaterThan(0)
  })
})

describe('getImprovementSummary', () => {
  it('should return zero values for empty', () => {
    const state = createEmptyState()
    const summary = getImprovementSummary(state)
    expect(summary.totalDimensions).toBe(0)
    expect(summary.improving).toBe(0)
    expect(summary.bestDimension).toBeNull()
  })

  it('should count improving vs declining', () => {
    let state = createEmptyState()
    state = trackImprovement(state, 'd1', 50, 60)
    state = trackImprovement(state, 'd2', 70, 65)
    state = trackImprovement(state, 'd3', 60, 72)
    const summary = getImprovementSummary(state)
    expect(summary.improving).toBe(2)
    expect(summary.declining).toBe(1)
    expect(['d1', 'd3']).toContain(summary.bestDimension)
    expect(summary.worstDimension).toBe('d2')
  })
})

describe('detectQualityAnomalies', () => {
  it('should detect sudden drop', () => {
    let state = createEmptyState()
    for (let i = 0; i < 5; i++) {
      state = recordFeedback(state, 'explicit', 'q', 80)
    }
    state = recordFeedback(state, 'explicit', 'drop', 55)
    const anomalies = detectQualityAnomalies(state)
    expect(anomalies.suddenDrop).toBe(true)
  })

  it('should detect sudden rise', () => {
    let state = createEmptyState()
    for (let i = 0; i < 5; i++) {
      state = recordFeedback(state, 'explicit', 'q', 60)
    }
    state = recordFeedback(state, 'explicit', 'rise', 82)
    const anomalies = detectQualityAnomalies(state)
    expect(anomalies.suddenRise).toBe(true)
  })

  it('should detect persistent decline', () => {
    let state = createEmptyState()
    for (let i = 0; i < 10; i++) {
      state = recordFeedback(state, 'explicit', 'q', 85 - i * 2)
    }
    const anomalies = detectQualityAnomalies(state)
    expect(anomalies.persistentDecline).toBe(false)
  })
})

describe('generateFeedbackRecommendations', () => {
  it('should return empty for insufficient data', () => {
    const state = createEmptyState()
    const recs = generateFeedbackRecommendations(state)
    expect(recs).toEqual([])
  })

  it('should recommend for declining trend', () => {
    let state = createEmptyState()
    for (let i = 0; i < 10; i++) {
      state = recordFeedback(state, 'explicit', 'q', 90 - i * 4)
    }
    state = computeRatingPattern(state)
    const recs = generateFeedbackRecommendations(state)
    expect(recs.some(r => r.toLowerCase().includes('declining'))).toBe(true)
  })

  it('should recommend for high variance', () => {
    let state = createEmptyState()
    const qualities = [40, 85, 30, 90, 50, 80, 35, 88]
    for (const q of qualities) {
      state = recordFeedback(state, 'explicit', 'test', q)
    }
    state = computeRatingPattern(state)
    const recs = generateFeedbackRecommendations(state)
    expect(recs.some(r => r.toLowerCase().includes('consistency'))).toBe(true)
  })

  it('should suggest focusing on worst dimension', () => {
    let state = createEmptyState()
    // Add some entries so ratingPattern is computed
    for (let i = 0; i < 8; i++) {
      state = recordFeedback(state, 'explicit', 'q', 60 + i)
    }
    state = computeRatingPattern(state)
    state = trackImprovement(state, 'pacing', 50, 45)
    state = trackImprovement(state, 'dialogue', 60, 75)
    const recs = generateFeedbackRecommendations(state)
    expect(recs.length).toBeGreaterThan(0)
  })
})
