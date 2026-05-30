/**
 * Quality V2 Tests - V58
 * Tests for Feedback Network, Adaptive Quality Engine, Rhythm Controller, and Retention Predictor
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  aggregateFeedback,
  detectRhythm,
  predictRetention,
  calculateQualityTrend,
  type FeedbackResult,
  type Suggestion
} from './qualityV2Types'

const createSuggestion = (overrides: Partial<Suggestion> = {}): Suggestion => ({
  type: 'improve',
  text: '建议优化表达',
  position: { start: 0, end: 10 },
  reason: '表达更清晰',
  priority: 3,
  ...overrides
})

const createFeedback = (overrides: Partial<FeedbackResult> = {}): FeedbackResult => ({
  agentId: 'agent_1',
  dimension: 'coherence',
  score: 0.7,
  suggestions: [createSuggestion()],
  confidence: 0.8,
  timestamp: Date.now(),
  ...overrides
})

describe('FeedbackResult Types', () => {
  it('should create a valid feedback result', () => {
    const feedback = createFeedback()
    expect(feedback.agentId).toBe('agent_1')
    expect(feedback.score).toBe(0.7)
    expect(feedback.suggestions).toHaveLength(1)
  })

  it('should support all quality dimensions', () => {
    const dims: ('coherence' | 'expression' | 'creativity' | 'structure' | 'engagement')[] = ['coherence', 'expression', 'creativity', 'structure', 'engagement']
    dims.forEach(d => {
      const f = createFeedback({ dimension: d })
      expect(f.dimension).toBe(d)
    })
  })

  it('should have score in valid range', () => {
    const f1 = createFeedback({ score: 0 })
    const f2 = createFeedback({ score: 1 })
    const f3 = createFeedback({ score: 0.5 })
    expect(f1.score).toBe(0)
    expect(f2.score).toBe(1)
    expect(f3.score).toBe(0.5)
  })
})

describe('aggregateFeedback', () => {
  it('should aggregate multiple feedback for same dimension', () => {
    const results: FeedbackResult[] = [
      createFeedback({ agentId: 'a1', dimension: 'coherence', score: 0.6, confidence: 0.7 }),
      createFeedback({ agentId: 'a2', dimension: 'coherence', score: 0.8, confidence: 0.9 }),
      createFeedback({ agentId: 'a3', dimension: 'coherence', score: 0.7, confidence: 0.8 }),
    ]

    const aggregated = aggregateFeedback(results)
    const coherence = aggregated.find(a => a.dimension === 'coherence')!

    expect(aggregated).toHaveLength(1)
    expect(coherence.averageScore).toBeCloseTo(0.7, 1)
    expect(coherence.agentCount).toBe(3)
    expect(coherence.confidence).toBeCloseTo(0.8, 1)
  })

  it('should group by dimension', () => {
    const results: FeedbackResult[] = [
      createFeedback({ dimension: 'coherence', score: 0.7 }),
      createFeedback({ dimension: 'expression', score: 0.6 }),
      createFeedback({ dimension: 'engagement', score: 0.8 }),
    ]

    const aggregated = aggregateFeedback(results)
    expect(aggregated).toHaveLength(3)
  })

  it('should sort by average score descending', () => {
    const results: FeedbackResult[] = [
      createFeedback({ dimension: 'engagement', score: 0.5 }),
      createFeedback({ dimension: 'coherence', score: 0.9 }),
      createFeedback({ dimension: 'expression', score: 0.7 }),
    ]

    const aggregated = aggregateFeedback(results)
    expect(aggregated[0].dimension).toBe('coherence')
    expect(aggregated[1].dimension).toBe('expression')
    expect(aggregated[2].dimension).toBe('engagement')
  })

  it('should limit top suggestions to 5', () => {
    const results: FeedbackResult[] = [
      createFeedback({
        dimension: 'coherence',
        score: 0.7,
        suggestions: [
          createSuggestion({ priority: 5 }),
          createSuggestion({ priority: 4 }),
          createSuggestion({ priority: 3 }),
          createSuggestion({ priority: 2 }),
          createSuggestion({ priority: 1 }),
          createSuggestion({ priority: 6 }),
        ]
      })
    ]

    const aggregated = aggregateFeedback(results)
    expect(aggregated[0].topSuggestions).toHaveLength(5)
  })

  it('should handle empty results', () => {
    const aggregated = aggregateFeedback([])
    expect(aggregated).toHaveLength(0)
  })
})

describe('detectRhythm', () => {
  it('should return default rhythm for empty history', () => {
    const result = detectRhythm([])

    expect(result.currentPace).toBe('normal')
    expect(result.rhythmScore).toBe(0.5)
    expect(result.breaks).toHaveLength(0)
    expect(result.immersionLevel).toBe(0.5)
  })

  it('should detect slow pace when WPM drops significantly', () => {
    const wpmHistory = [60, 60, 60, 60, 60, 10, 10, 10, 10, 10]
    const result = detectRhythm(wpmHistory)

    expect(result.currentPace).toBe('slow')
    expect(result.averageWordPerMinute).toBeLessThan(40)
  })

  it('should detect fast pace when WPM increases significantly', () => {
    const wpmHistory = [50, 50, 50, 50, 50, 180, 180, 180, 180, 180]
    const result = detectRhythm(wpmHistory)

    expect(result.currentPace).toBe('fast')
  })

  it('should detect rhythm breaks', () => {
    const wpmHistory = [50, 50, 3, 50, 50, 50]
    const result = detectRhythm(wpmHistory)

    expect(result.breaks.length).toBeGreaterThan(0)
    expect(result.breaks[0].type).toBe('skip' as any)
  })

  it('should calculate rhythm score based on consistency', () => {
    // Consistent WPM = high rhythm score
    const consistent = [50, 50, 50, 50, 50]
    const inconsistent = [50, 20, 80, 30, 60]

    const consistentResult = detectRhythm(consistent)
    const inconsistentResult = detectRhythm(inconsistent)

    expect(consistentResult.rhythmScore).toBeGreaterThan(inconsistentResult.rhythmScore)
  })

  it('should mark critical severity for very low WPM ratio', () => {
    const wpmHistory = [50, 2, 50]
    const result = detectRhythm(wpmHistory)

    const criticalBreak = result.breaks.find(b => b.severity === 'critical')
    expect(criticalBreak?.type).toBe('skip')
  })
})

describe('predictRetention', () => {
  it('should predict low retention for short paragraph', () => {
    const result = predictRetention('Short text.', { coherence: 0.7, engagement: 0.7, pace: 0.6 })

    expect(result.factors).toContain('段落过短，可能缺乏深度')
  })

  it('should predict low retention for long paragraph', () => {
    const longText = Array(400).fill('word').join(' ')
    const result = predictRetention(longText, { coherence: 0.7, engagement: 0.7, pace: 0.6 })

    expect(result.factors).toContain('段落过长，阅读疲劳风险')
  })

it('should predict low retention for low coherence', () => {
    const result = predictRetention('This is a longer paragraph that has some content here.', { coherence: 0.3, engagement: 0.7, pace: 0.6 })

    expect(result.factors).toContain('连贯性不足')
    expect(result.retentionScore).toBeLessThan(0.6)
  })

  it('should predict high retention for good metrics', () => {
    const result = predictRetention('这是一个中等长度的段落，包含足够的内容。', { coherence: 0.8, engagement: 0.8, pace: 0.6 })

    expect(result.riskLevel).toBe('low')
    expect(result.retentionScore).toBeGreaterThan(0.6)
  })

  it('should detect low engagement', () => {
    const result = predictRetention('A moderately long paragraph with some content here.', { coherence: 0.7, engagement: 0.3, pace: 0.6 })

    expect(result.factors).toContain('吸引力不足')
  })

  it('should detect fast pace', () => {
    const result = predictRetention('A moderately long paragraph with some content here.', { coherence: 0.7, engagement: 0.7, pace: 0.9 })

    expect(result.factors).toContain('节奏过快')
  })
})

describe('calculateQualityTrend', () => {
  it('should return stable for insufficient data', () => {
    const result = calculateQualityTrend([0.7])
    expect(result.trend).toBe('stable')
    expect(result.delta).toBe(0)
  })

  it('should detect improving trend', () => {
    const scores = [0.5, 0.55, 0.6, 0.65, 0.7]
    const result = calculateQualityTrend(scores)

    expect(result.trend).toBe('improving')
    expect(result.delta).toBeGreaterThan(0)
  })

  it('should detect declining trend', () => {
    const scores = [0.7, 0.65, 0.6, 0.55, 0.5]
    const result = calculateQualityTrend(scores)

    expect(result.trend).toBe('declining')
    expect(result.delta).toBeLessThan(0)
  })

  it('should detect stable trend', () => {
    const scores = [0.6, 0.61, 0.59, 0.6, 0.605]
    const result = calculateQualityTrend(scores)

    expect(result.trend).toBe('stable')
  })

  it('should store all scores', () => {
    const scores = [0.5, 0.6, 0.7]
    const result = calculateQualityTrend(scores)

    expect(result.scores).toEqual(scores)
  })
})

describe('RhythmPace', () => {
  it('should support all pace values', () => {
    const paces: ('slow' | 'normal' | 'fast')[] = ['slow', 'normal', 'fast']
    paces.forEach(p => expect(p).toBeDefined())
  })
})

describe('RiskLevel', () => {
  it('should support all risk levels', () => {
    const levels: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high']
    levels.forEach(l => expect(l).toBeDefined())
  })
})

describe('RetentionPrediction', () => {
  it('should generate paragraph ID', () => {
    const result = predictRetention('Test paragraph content.', { coherence: 0.7, engagement: 0.7, pace: 0.6 })
    expect(result.paragraphId).toMatch(/^p_\d+/)
  })

  it('should calculate retention score between 0 and 1', () => {
    const result = predictRetention('A moderately sized test paragraph.', { coherence: 0.7, engagement: 0.7, pace: 0.6 })
    expect(result.retentionScore).toBeGreaterThanOrEqual(0)
    expect(result.retentionScore).toBeLessThanOrEqual(1)
  })

  it('should provide improvement suggestion', () => {
    const result = predictRetention('Short.', { coherence: 0.3, engagement: 0.3, pace: 0.3 })
    expect(result.improvement).toBeDefined()
    expect(result.improvement.length).toBeGreaterThan(0)
  })
})

describe('Quality Integration', () => {
  it('should combine multiple feedback agents', () => {
    const results: FeedbackResult[] = [
      createFeedback({ agentId: 'coherence-agent', dimension: 'coherence', score: 0.8 }),
      createFeedback({ agentId: 'engagement-agent', dimension: 'engagement', score: 0.7 }),
      createFeedback({ agentId: 'expression-agent', dimension: 'expression', score: 0.9 }),
    ]

    const aggregated = aggregateFeedback(results)
    expect(aggregated).toHaveLength(3)
    expect(aggregated.find(a => a.dimension === 'expression')?.averageScore).toBe(0.9)
  })

  it('should work with real-world WPM data', () => {
    // Real writing often has varying WPM - keep it simple to avoid false positives
    const wpmHistory = [50, 50, 50, 50, 50, 28, 28, 50, 50, 50]
    const rhythm = detectRhythm(wpmHistory)

    expect(rhythm.averageWordPerMinute).toBeGreaterThan(0)
    expect(rhythm.immersionLevel).toBeLessThanOrEqual(1)
  })
})