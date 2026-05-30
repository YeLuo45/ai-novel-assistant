/**
 * ReaderExperienceSimulator Tests - V82
 * Tests for Reader Emotional Journey and Engagement Prediction
 */

import { describe, it, expect } from 'vitest'
import {
  type EmotionalState,
  type StorySegment,
  type ReaderProfile,
  type EngagementPrediction,
  type PacingAnalysis,
  type FatigueReport,
  calculateOverallEngagement,
  createBaselineEmotionalState,
  simulateEmotionalResponse,
  analyzePacingFromSegments,
  detectReadingFatigue,
  predictEngagement,
  analyzeHook,
  createDefaultReaderProfile,
  formatEngagementPrediction,
  generateSimResultSummary
} from './ReaderExperienceSimulator'

// ===============================================================================
// Helper - Create test segments
// =============================================================================

function makeSegment(chapter: number, type: StorySegment['type'], tension: number, startPos: number, endPos: number): StorySegment {
  return {
    id: `seg_${chapter}_${type}`,
    type,
    chapter,
    startPosition: startPos,
    endPosition: endPos,
    content: `${type} content`,
    emotionalTags: [],
    tensionLevel: tension,
    engagementValue: 60
  }
}

function makeBaseState(): EmotionalState {
  return {
    curiosity: 50, tension: 30, excitement: 40, satisfaction: 50,
    confusion: 10, boredom: 20, anticipation: 40, surprise: 20,
    delight: 30, frustration: 10
  }
}

// ===============================================================================
// calculateOverallEngagement Tests
// ===============================================================================

describe('calculateOverallEngagement', () => {
  it('should return higher for positive than negative baseline', () => {
    const state = makeBaseState()
    const result = calculateOverallEngagement(state)
    expect(result).toBeGreaterThan(50)
  })

  it('should clamp to 0-100 range', () => {
    const extreme: EmotionalState = {
      curiosity: 100, tension: 100, excitement: 100, satisfaction: 100,
      confusion: 100, boredom: 100, anticipation: 100, surprise: 100,
      delight: 100, frustration: 100
    }
    const engagement = calculateOverallEngagement(extreme)
    expect(engagement).toBeLessThanOrEqual(100)
    expect(engagement).toBeGreaterThanOrEqual(0)
  })
})

// ===============================================================================
// createBaselineEmotionalState Tests
// ===============================================================================

describe('createBaselineEmotionalState', () => {
  it('should create non-zero state for any genre', () => {
    const state = createBaselineEmotionalState('fantasy', 'neutral')
    expect(state.curiosity).toBe(50)
    expect(Object.values(state).every(v => v >= 0 && v <= 100)).toBe(true)
  })

  it('should have all values in valid range for dark tone', () => {
    const state = createBaselineEmotionalState('fantasy', 'dark')
    expect(state.tension).toBeGreaterThan(0)
    expect(Object.values(state).every(v => v >= 0 && v <= 100)).toBe(true)
  })

  it('should have all values in valid range for light tone', () => {
    const state = createBaselineEmotionalState('romance', 'light')
    expect(Object.values(state).every(v => v >= 0 && v <= 100)).toBe(true)
  })
})

// ===============================================================================
// simulateEmotionalResponse Tests
// ===============================================================================

describe('simulateEmotionalResponse', () => {
  it('should increase excitement for action scene', () => {
    const state = makeBaseState()
    const result = simulateEmotionalResponse(state, 'action_scene', 0.8)
    expect(result.excitement).toBeGreaterThan(state.excitement)
  })

  it('should increase satisfaction for resolution', () => {
    const state = makeBaseState()
    const result = simulateEmotionalResponse(state, 'resolution', 0.7)
    expect(result.satisfaction).toBeGreaterThan(state.satisfaction)
    expect(result.tension).toBeLessThan(state.tension)
  })

  it('should increase curiosity for complication', () => {
    const state = makeBaseState()
    const result = simulateEmotionalResponse(state, 'complication', 0.6)
    expect(result.curiosity).toBeGreaterThan(state.curiosity)
    expect(result.frustration).toBeGreaterThan(state.frustration)
  })

  it('should reduce tension after quiet moment', () => {
    const state = makeBaseState()
    const result = simulateEmotionalResponse(state, 'quiet_moment', 0.5)
    expect(result.tension).toBeLessThan(state.tension)
  })

  it('should increase confusion from plot twist', () => {
    const state = makeBaseState()
    const result = simulateEmotionalResponse(state, 'plot_twist', 0.9)
    expect(result.confusion).toBeGreaterThan(state.confusion)
    expect(result.surprise).toBeGreaterThan(state.surprise)
  })

  it('should respect intensity parameter', () => {
    const state = makeBaseState()
    const lowIntensity = simulateEmotionalResponse(state, 'action_scene', 0.1)
    const highIntensity = simulateEmotionalResponse(state, 'action_scene', 1.0)
    expect(highIntensity.excitement).toBeGreaterThan(lowIntensity.excitement)
  })

  it('should keep all values within 0-100', () => {
    const state = makeBaseState()
    const result = simulateEmotionalResponse(state, 'action_scene', 1.0)
    for (const key of Object.keys(result) as (keyof EmotionalState)[]) {
      expect(result[key]).toBeLessThanOrEqual(100)
      expect(result[key]).toBeGreaterThanOrEqual(0)
    }
  })
})

// ===============================================================================
// analyzePacingFromSegments Tests
// ===============================================================================

describe('analyzePacingFromSegments', () => {
  it('should return default analysis for empty segments', () => {
    const result = analyzePacingFromSegments([])
    expect(result.rating).toBe('optimal')
    expect(result.sceneCount).toBe(0)
  })

  it('should detect info dump from excessive description', () => {
    const segments = [
      makeSegment(1, 'description', 20, 0, 500),
      makeSegment(1, 'description', 20, 500, 1000),
      makeSegment(1, 'description', 20, 1000, 1500),
      makeSegment(1, 'description', 20, 1500, 2000)
    ]
    const result = analyzePacingFromSegments(segments)
    expect(result.rating).toBe('info_dump')
    expect(result.descriptionDensity).toBe(1.0)
  })

  it('should rate action-heavy segments differently from info dump', () => {
    // Pure action: 100% actionDensity, 0% dialogueDensity
    const segments = [
      makeSegment(1, 'action', 80, 0, 200),
      makeSegment(1, 'action', 80, 200, 400),
      makeSegment(1, 'action', 80, 400, 600),
      makeSegment(1, 'action', 80, 600, 800)
    ]
    const result = analyzePacingFromSegments(segments)
    // Should NOT be info_dump (that's excessive_description)
    expect(result.rating).not.toBe('info_dump')
    // actionDensity should be 1.0
    expect(result.actionDensity).toBe(1.0)
  })

  it('should return optimal for balanced segments', () => {
    const segments = [
      makeSegment(1, 'action', 60, 0, 200),
      makeSegment(1, 'dialogue', 40, 200, 400),
      makeSegment(1, 'description', 30, 400, 600),
      makeSegment(1, 'action', 70, 600, 800)
    ]
    const result = analyzePacingFromSegments(segments)
    expect(result.rating).toBe('optimal')
    expect(result.pacingScore).toBeGreaterThan(0)
  })

  it('should list issues when pacing is problematic', () => {
    const segments = Array(6).fill(null).map((_, i) => makeSegment(1, 'description', 20, i * 300, (i + 1) * 300))
    const result = analyzePacingFromSegments(segments)
    expect(result.issues.length).toBeGreaterThan(0)
  })
})

// ===============================================================================
// detectReadingFatigue Tests
// ===============================================================================

describe('detectReadingFatigue', () => {
  it('should return false for insufficient data', () => {
    const segments = [makeSegment(1, 'action', 50, 0, 200)]
    const result = detectReadingFatigue(segments, [60])
    expect(result.detected).toBe(false)
  })

  it('should detect repetitive structure fatigue', () => {
    const segments = Array(10).fill(null).map((_, i) => makeSegment(i + 1, 'description', 30, i * 300, (i + 1) * 300))
    const engagementHistory = Array(10).fill(50)
    const result = detectReadingFatigue(segments, engagementHistory)
    expect(result.detected).toBe(true)
    expect(result.indicators).toContain('excessive_description')
  })

  it('should detect action-heavy fatigue', () => {
    const segments = Array(8).fill(null).map((_, i) => makeSegment(i + 1, 'action', 70, i * 200, (i + 1) * 200))
    const engagementHistory = Array(15).fill(40)
    const result = detectReadingFatigue(segments, engagementHistory)
    expect(result.detected).toBe(true)
    expect(result.indicators).toContain('action_heavy')
  })

  it('should detect monotone tension fatigue', () => {
    const segments = Array(10).fill(null).map((_, i) => makeSegment(i + 1, 'action', 50, i * 200, (i + 1) * 200))  // Same tension
    const engagementHistory = Array(20).fill(45)  // Flat engagement
    const result = detectReadingFatigue(segments, engagementHistory)
    expect(result.detected).toBe(true)
    expect(result.indicators).toContain('monotone_tension')
  })

  it('should return severity based on indicator count', () => {
    // Create many description-heavy segments with consistent tension to trigger multiple indicators
    const segments = Array(12).fill(null).map((_, i) => makeSegment(i + 1, 'description', 50, i * 300, (i + 1) * 300))
    const engagementHistory = Array(20).fill(45)
    const result = detectReadingFatigue(segments, engagementHistory)
    expect(result.severity).toBe('major')
  })
})

// ===============================================================================
// predictEngagement Tests
// ===============================================================================

describe('predictEngagement', () => {
  const readerProfile = createDefaultReaderProfile('test_reader')

  it('should return hooked for high engagement', () => {
    const prediction = predictEngagement(85, [80, 82, 85], readerProfile, 3)
    expect(prediction.currentEngagement).toBe('hooked')
    expect(prediction.engagementScore).toBe(85)
  })

  it('should return lost for very low engagement', () => {
    const prediction = predictEngagement(15, [20, 18, 15], readerProfile, 5)
    expect(prediction.currentEngagement).toBe('lost')
    expect(prediction.predictedFinishProbability).toBeLessThan(0.3)
  })

  it('should predict likely drop chapter for low engagement', () => {
    const prediction = predictEngagement(25, [30, 28, 25], readerProfile, 3)
    expect(prediction.likelyDropChapter).not.toBeNull()
    expect(prediction.likelyDropChapter).toBeGreaterThan(3)
  })

  it('should return null drop chapter for high engagement', () => {
    const prediction = predictEngagement(75, [70, 72, 75], readerProfile, 3)
    expect(prediction.likelyDropChapter).toBeNull()
    expect(prediction.recommendedFix).toContain('engaged')
  })

  it('should decrease finish probability for declining trend', () => {
    const decliningPrediction = predictEngagement(60, [70, 65, 60], readerProfile, 4)
    const stablePrediction = predictEngagement(60, [60, 60, 60], readerProfile, 4)
    expect(decliningPrediction.predictedFinishProbability).toBeLessThan(stablePrediction.predictedFinishProbability)
  })

  it('should account for reader patience', () => {
    const patientProfile = { ...readerProfile, patienceForSlowStart: 10 }
    const impatientProfile = { ...readerProfile, patienceForSlowStart: 2 }
    
    const patientPred = predictEngagement(40, [45, 42, 40], patientProfile, 5)
    const impatientPred = predictEngagement(40, [45, 42, 40], impatientProfile, 5)
    
    expect(patientPred.predictedFinishProbability).toBeGreaterThan(impatientPred.predictedFinishProbability)
  })
})

// ===============================================================================
// analyzeHook Tests
// ===============================================================================

describe('analyzeHook', () => {
  const readerProfile = createDefaultReaderProfile('test')

  it('should detect mystery hook from question', () => {
    const result = analyzeHook('How could this happen?', readerProfile)
    expect(result.type).toBe('mystery')
    expect(result.strength).toBeGreaterThan(60)
  })

  it('should detect conflict hook from contrast words', () => {
    const result = analyzeHook('He was strong, but his sister was stronger.', readerProfile)
    expect(result.type).toBe('conflict')
    expect(result.strength).toBeGreaterThan(55)
  })

  it('should boost mystery hook for plot_lover', () => {
    const plotLover = { ...readerProfile, personality: 'plot_lover' as const }
    const result = analyzeHook('What happened that night?', plotLover)
    expect(result.strength).toBeGreaterThan(85)
  })

  it('should detect character hook from pronoun', () => {
    const result = analyzeHook('She walked into the darkness.', readerProfile)
    expect(result.type).toBe('character')
    expect(result.strength).toBeGreaterThan(50)
  })

  it('should return effective false when no hook is detected', () => {
    // Numbers/symbols won't trigger any hook type detection
    const result = analyzeHook('12345', readerProfile)
    expect(result.effective).toBe(false)
    expect(result.type).toBeNull()
  })

  it('should include reader question in response', () => {
    const result = analyzeHook('How could this happen?', readerProfile)
    expect(result.readerQuestion).toContain('happened')
  })
})

// ===============================================================================
// createDefaultReaderProfile Tests
// ===============================================================================

describe('createDefaultReaderProfile', () => {
  it('should create profile with balanced personality', () => {
    const profile = createDefaultReaderProfile('r1')
    expect(profile.personality).toBe('balanced')
    expect(profile.id).toBe('r1')
  })

  it('should have reasonable default values', () => {
    const profile = createDefaultReaderProfile('r2')
    expect(profile.patienceForSlowStart).toBe(3)
    expect(profile.attentionSpan).toBe(30)
    expect(profile.preferredPace).toBe('medium')
  })

  it('should have favorite genres', () => {
    const profile = createDefaultReaderProfile('r3')
    expect(profile.favoriteGenres.length).toBeGreaterThan(0)
  })
})

// ===============================================================================
// formatEngagementPrediction Tests
// ===============================================================================

describe('formatEngagementPrediction', () => {
  it('should format prediction with finish info', () => {
    const prediction: EngagementPrediction = {
      currentEngagement: 'engaged',
      engagementScore: 75,
      predictedFinishProbability: 0.85,
      likelyDropChapter: null,
      recommendedFix: 'Keep going',
      confidence: 0.8
    }
    const formatted = formatEngagementPrediction(prediction)
    expect(formatted).toContain('75')
    expect(formatted).toContain('85%')
    expect(formatted).toContain('Likely to finish')
  })

  it('should format prediction with drop chapter', () => {
    const prediction: EngagementPrediction = {
      currentEngagement: 'drifting',
      engagementScore: 25,
      predictedFinishProbability: 0.2,
      likelyDropChapter: 8,
      recommendedFix: 'Add hook',
      confidence: 0.7
    }
    const formatted = formatEngagementPrediction(prediction)
    expect(formatted).toContain('25')
    expect(formatted).toContain('Likely drop at chapter 8')
  })
})

// ===============================================================================
// generateSimResultSummary Tests
// ===============================================================================

describe('generateSimResultSummary', () => {
  it('should format summary with engagement and completion', () => {
    const result = {
      overallEngagementScore: 72,
      predictedCompletionRate: 0.78,
      criticalMoments: [{ chapter: 5, type: 'hook' as const, severity: 'major' as const, description: 'Strong hook', engagementImpact: 10 }],
      recommendations: ['Add more action', 'Reduce description'],
      fatigueReports: [{ detected: true, indicators: ['excessive_description' as any], severity: 'moderate' as const, affectedChapters: [3, 4], description: 'Too much description', suggestedRecovery: 'Add action' }],
      readerProfile: null as any,
      emotionalArc: [] as any,
      pacingAnalysis: [] as any,
      engagementPredictions: [] as any,
      hookAnalyses: [] as any
    } as any
    const summary = generateSimResultSummary(result)
    expect(summary).toContain('72%')
    expect(summary).toContain('78%')
    expect(summary).toContain('1')
    expect(summary).toContain('Fatigue Detected: 1')
  })

  it('should list recommendations', () => {
    const result = {
      overallEngagementScore: 50,
      predictedCompletionRate: 0.5,
      criticalMoments: [],
      recommendations: ['Test recommendation 1', 'Test recommendation 2'],
      fatigueReports: [],
      readerProfile: null as any,
      emotionalArc: [] as any,
      pacingAnalysis: [] as any,
      engagementPredictions: [] as any,
      hookAnalyses: [] as any
    } as any
    const summary = generateSimResultSummary(result)
    expect(summary).toContain('Test recommendation 1')
    expect(summary).toContain('Test recommendation 2')
  })
})

// ===============================================================================
// Edge Cases
// ===============================================================================

describe('Edge Cases', () => {
  it('should return non-extreme value for all zeros', () => {
    const zeroState: EmotionalState = {
      curiosity: 0, tension: 0, excitement: 0, satisfaction: 0,
      confusion: 0, boredom: 0, anticipation: 0, surprise: 0,
      delight: 0, frustration: 0
    }
    const engagement = calculateOverallEngagement(zeroState)
    expect(engagement).toBeGreaterThan(0)  // Returns 50 (baseline)
  })

  it('should handle negative trend correctly', () => {
    const profile = createDefaultReaderProfile('p1')
    const prediction = predictEngagement(50, [60, 50, 40], profile, 3)
    expect(prediction.predictedFinishProbability).toBeLessThan(0.5)
  })

  it('should handle very long engagement history', () => {
    const segments = Array(20).fill(null).map((_, i) => makeSegment(i + 1, 'action', 50 + (i % 10), i * 200, (i + 1) * 200))
    const engagementHistory = Array(50).fill(0).map((_, i) => 50 + Math.sin(i / 5) * 20)
    const result = detectReadingFatigue(segments, engagementHistory)
    expect(result.detected).toBe(true)  // Should find some indicators
  })

  it('should handle empty recommendations list', () => {
    const result = {
      overallEngagementScore: 60,
      predictedCompletionRate: 0.7,
      criticalMoments: [],
      recommendations: [],
      fatigueReports: [],
      readerProfile: null as any,
      emotionalArc: [] as any,
      pacingAnalysis: [] as any,
      engagementPredictions: [] as any,
      hookAnalyses: [] as any
    } as any
    const summary = generateSimResultSummary(result)
    expect(summary).toContain('Overall Engagement: 60%')
  })
})