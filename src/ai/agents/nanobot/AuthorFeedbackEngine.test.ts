import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  captureExplicitFeedback,
  captureImplicitFeedback,
  detectFeedbackPattern,
  extractImprovementSignals,
  getImprovementRecommendations,
  getSessionFeedbackSummary,
  calculateFeedbackQuality,
  updatePatterns,
  mergeSessionFeedback,
} from './AuthorFeedbackEngine'

describe('createEmptyState', () => {
  it('should create empty state', () => {
    const state = createEmptyState()
    expect(state.feedbackHistory).toEqual([])
    expect(state.patterns.size).toBe(0)
    expect(state.improvementSignals.size).toBe(0)
    expect(state.typeAlias).toEqual({})
  })
})

describe('captureExplicitFeedback', () => {
  it('should capture rating feedback', () => {
    let state = createEmptyState()
    state = captureExplicitFeedback(state, 'rating', 4.5, 'chapter-1', 'session-1')
    expect(state.feedbackHistory.length).toBe(1)
    expect(state.feedbackHistory[0].type).toBe('rating')
    expect(state.feedbackHistory[0].value).toBe(4.5)
    expect(state.feedbackHistory[0].context).toBe('chapter-1')
  })

  it('should capture correction feedback', () => {
    let state = createEmptyState()
    state = captureExplicitFeedback(state, 'correction', 2.0, 'scene-1')
    expect(state.feedbackHistory[0].type).toBe('correction')
  })

  it('should accumulate session feedback', () => {
    let state = createEmptyState()
    state = captureExplicitFeedback(state, 'rating', 5, 'ch1', 's1')
    state = captureExplicitFeedback(state, 'revision', 3, 'ch2', 's1')
    expect(state.sessionFeedback.get('s1')?.length).toBe(2)
  })
})

describe('captureImplicitFeedback', () => {
  it('should assign neutral value 0.5', () => {
    let state = createEmptyState()
    state = captureImplicitFeedback(state, 'skip', 'paragraph-1', 's1')
    expect(state.feedbackHistory[0].value).toBe(0.5)
    expect(state.feedbackHistory[0].type).toBe('skip')
  })
})

describe('detectFeedbackPattern', () => {
  it('should return null for insufficient data', () => {
    let state = createEmptyState()
    expect(detectFeedbackPattern(state, 'rating')).toBeNull()
    state = captureExplicitFeedback(state, 'rating', 4, 'c', 's')
    expect(detectFeedbackPattern(state, 'rating')).toBeNull()
  })

  it('should detect improving pattern', () => {
    let state = createEmptyState()
    for (let i = 1; i <= 10; i++) {
      state = captureExplicitFeedback(state, 'rating', 2 + i * 0.3, 'c')
    }
    const pattern = detectFeedbackPattern(state, 'rating')
    expect(pattern).not.toBeNull()
    expect(pattern!.patternType).toBe('improving')
    expect(pattern!.trend).toBeGreaterThan(0)
  })

  it('should detect declining pattern', () => {
    let state = createEmptyState()
    for (let i = 1; i <= 10; i++) {
      state = captureExplicitFeedback(state, 'rating', 5 - i * 0.25, 'c')
    }
    const pattern = detectFeedbackPattern(state, 'rating')
    expect(pattern).not.toBeNull()
    expect(pattern!.patternType).toBe('declining')
  })

  it('should detect stable pattern', () => {
    let state = createEmptyState()
    for (let i = 0; i < 10; i++) {
      state = captureExplicitFeedback(state, 'rating', 3.5, 'c')
    }
    const pattern = detectFeedbackPattern(state, 'rating')
    expect(pattern).not.toBeNull()
    expect(pattern!.patternType).toBe('stable')
  })

  it('should detect oscillating pattern', () => {
    let state = createEmptyState()
    // alternating high/low values
    const values = [1, 5, 1, 5, 1, 5, 1, 5]
    for (const v of values) {
      state = captureExplicitFeedback(state, 'rating', v, 'c')
    }
    const pattern = detectFeedbackPattern(state, 'rating')
    expect(pattern).not.toBeNull()
    expect(pattern!.patternType).toBe('oscillating')
  })
})

describe('extractImprovementSignals', () => {
  it('should extract signals from patterns', () => {
    let state = createEmptyState()
    for (let i = 0; i < 10; i++) {
      state = captureExplicitFeedback(state, 'rating', 2 + i * 0.3, 'c')
    }
    state = updatePatterns(state)
    const signals = extractImprovementSignals(state)
    expect(signals.size).toBeGreaterThan(0)
  })
})

describe('getImprovementRecommendations', () => {
  it('should return recommendations sorted by lowest signal', () => {
    let state = createEmptyState()
    // Add low-signal patterns
    state = {
      ...state,
      improvementSignals: new Map([
        ['general.rating', 0.3],
        ['general.correction', 0.5],
        ['general.highlight', 0.8],
      ]),
    }
    const recs = getImprovementRecommendations(state, 2)
    expect(recs.length).toBe(2)
    expect(recs[0]).toBe('general.rating')
  })
})

describe('getSessionFeedbackSummary', () => {
  it('should return zero summary for unknown session', () => {
    const state = createEmptyState()
    const summary = getSessionFeedbackSummary(state, 'unknown')
    expect(summary.totalEvents).toBe(0)
    expect(summary.dominantType).toBeNull()
  })

  it('should summarize session correctly', () => {
    let state = createEmptyState()
    state = captureExplicitFeedback(state, 'rating', 4, 'c', 's1')
    state = captureExplicitFeedback(state, 'rating', 5, 'c', 's1')
    state = captureExplicitFeedback(state, 'correction', 3, 'c', 's1')
    const summary = getSessionFeedbackSummary(state, 's1')
    expect(summary.totalEvents).toBe(3)
    expect(summary.averageValue).toBeCloseTo(4)
    expect(summary.dominantType).toBe('rating')
  })
})

describe('calculateFeedbackQuality', () => {
  it('should return 0 for empty state', () => {
    const state = createEmptyState()
    expect(calculateFeedbackQuality(state)).toBe(0)
  })

  it('should score based on diversity, consistency, recency', () => {
    let state = createEmptyState()
    const now = Date.now()
    // Add diverse feedback types
    const types = ['rating', 'correction', 'revision', 'highlight'] as const
    for (const t of types) {
      state = captureExplicitFeedback(state, t, 3.5, 'c')
    }
    const quality = calculateFeedbackQuality(state)
    expect(quality).toBeGreaterThan(0)
    expect(quality).toBeLessThanOrEqual(100)
  })
})

describe('updatePatterns', () => {
  it('should update patterns for all feedback types', () => {
    let state = createEmptyState()
    for (let i = 0; i < 10; i++) {
      state = captureExplicitFeedback(state, 'rating', 3 + i * 0.1, 'c')
      state = captureExplicitFeedback(state, 'correction', 2.5 + i * 0.05, 'c')
    }
    state = updatePatterns(state)
    expect(state.patterns.has('rating')).toBe(true)
    expect(state.patterns.has('correction')).toBe(true)
  })
})

describe('mergeSessionFeedback', () => {
  it('should merge multiple session states', () => {
    let s1 = createEmptyState()
    s1 = captureExplicitFeedback(s1, 'rating', 4, 'c', 's1')
    let s2 = createEmptyState()
    s2 = captureExplicitFeedback(s2, 'rating', 5, 'c', 's2')
    const merged = mergeSessionFeedback(s1, [s2])
    expect(merged.feedbackHistory.length).toBe(2)
    expect(merged.sessionFeedback.get('s1')?.length).toBe(1)
    expect(merged.sessionFeedback.get('s2')?.length).toBe(1)
  })
})
