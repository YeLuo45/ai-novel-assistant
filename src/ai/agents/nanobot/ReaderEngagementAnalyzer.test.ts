import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  updateEngagementMetrics,
  recordAttentionSegment,
  detectDropOff,
  recordDropOff,
  analyzeAttentionTrend,
  compareWithBaseline,
  getEngagementSummary,
  detectEngagementAnomaly,
  getAttentionHeatmapData,
} from './ReaderEngagementAnalyzer'

describe('createEmptyState', () => {
  it('should create empty state', () => {
    const state = createEmptyState()
    expect(state.currentMetrics.attentionScore).toBe(70)
    expect(state.engagementBaseline).toBe(70)
    expect(state.typeAlias).toEqual({})
  })
})

describe('updateEngagementMetrics', () => {
  it('should update metrics from reader behavior', () => {
    let state = createEmptyState()
    state = updateEngagementMetrics(state, 0.8, 3, 0.5, 45)
    expect(state.currentMetrics.scrollDepth).toBe(0.8)
    expect(state.currentMetrics.interactionRate).toBe(3)
  })

  it('should calculate retention rate based on attention', () => {
    let state = createEmptyState()
    state = updateEngagementMetrics(state, 0.9, 5, 0.8, 60)
    expect(state.currentMetrics.retentionRate).toBe(0.9)
  })

  it('should track attention history', () => {
    let state = createEmptyState()
    state = updateEngagementMetrics(state, 0.5, 2, 0, 20)
    expect(state.attentionHistory.length).toBe(1)
  })
})

describe('recordAttentionSegment', () => {
  it('should record attention segment', () => {
    let state = createEmptyState()
    state = recordAttentionSegment(state, 'ch1:0.5', 0.5, 0.7, 85, 2)
    expect(state.attentionSegments.get('ch1:0.5')!.peakAttention).toBe(85)
    expect(state.attentionSegments.get('ch1:0.5')!.reReadCount).toBe(2)
  })
})

describe('detectDropOff', () => {
  it('should return null when attention is high', () => {
    let state = createEmptyState()
    state = updateEngagementMetrics(state, 0.8, 5, 0.8, 60)
    const dropOff = detectDropOff(state, 'ch1', 0.5)
    expect(dropOff).toBeNull()
  })

  it('should detect moderate drop-off', () => {
    let state = createEmptyState()
    for (let i = 0; i < 5; i++) {
      state = updateEngagementMetrics(state, 0.3, 1, -0.3, 15)
    }
    const dropOff = detectDropOff(state, 'ch1', 0.5)
    expect(dropOff).not.toBeNull()
    expect(dropOff!.severity).toBe('moderate')
  })

  it('should detect severe drop-off', () => {
    let state = createEmptyState()
    for (let i = 0; i < 5; i++) {
      state = updateEngagementMetrics(state, 0.1, 0, -0.8, 5)
    }
    const dropOff = detectDropOff(state, 'ch1', 0.5)
    expect(dropOff!.severity).toBe('severe')
  })
})

describe('recordDropOff', () => {
  it('should record drop-off pattern', () => {
    let state = createEmptyState()
    const pattern = { chapterId: 'ch1', position: 0.5, severity: 'moderate' as const, likelyCause: 'Test', suggestions: ['Fix'] }
    state = recordDropOff(state, pattern)
    expect(state.dropOffPatterns.length).toBe(1)
  })
})

describe('analyzeAttentionTrend', () => {
  it('should return stable for insufficient data', () => {
    const state = createEmptyState()
    const trend = analyzeAttentionTrend(state)
    expect(trend.trend).toBe('stable')
  })

  it('should detect improving trend', () => {
    let state = createEmptyState()
    for (let i = 0; i < 10; i++) {
      state = updateEngagementMetrics(state, 0.4 + i * 0.05, 2, 0, 30)
    }
    const trend = analyzeAttentionTrend(state)
    expect(trend.trend).toBe('improving')
  })
})

describe('compareWithBaseline', () => {
  it('should detect above baseline', () => {
    let state = createEmptyState()
    state = updateEngagementMetrics(state, 0.95, 6, 0.9, 70)
    const result = compareWithBaseline(state)
    expect(result.status).toBe('above')
    expect(result.vsBaseline).toBeGreaterThan(0)
  })

  it('should detect below baseline', () => {
    let state = createEmptyState()
    state = updateEngagementMetrics(state, 0.2, 0.5, -0.5, 10)
    const result = compareWithBaseline(state)
    expect(result.status).toBe('below')
  })
})

describe('getEngagementSummary', () => {
  it('should return engagement summary', () => {
    const state = createEmptyState()
    const summary = getEngagementSummary(state)
    expect(summary.currentScore).toBe(70)
    expect(summary.recommendation.length).toBeGreaterThan(0)
  })

  it('should flag retention risk', () => {
    let state = createEmptyState()
    for (let i = 0; i < 10; i++) {
      state = updateEngagementMetrics(state, 0.2, 0.5, -0.5, 10)
    }
    const summary = getEngagementSummary(state)
    expect(summary.retentionRisk).toBe(true)
  })
})

describe('detectEngagementAnomaly', () => {
  it('should detect sudden drop', () => {
    let state = createEmptyState()
    for (let i = 0; i < 5; i++) {
      state = updateEngagementMetrics(state, 0.8, 4, 0.5, 50)
    }
    state = updateEngagementMetrics(state, 0.1, 0, -0.8, 5)
    const anomaly = detectEngagementAnomaly(state)
    expect(anomaly.anomaly).toBe(true)
    expect(anomaly.type).toBeTruthy() // could be 'sudden_drop' or 'high_variance'
  })
})

describe('getAttentionHeatmapData', () => {
  it('should return sorted heatmap data', () => {
    let state = createEmptyState()
    state = recordAttentionSegment(state, 'ch1:0.2', 0.2, 0.4, 75, 0)
    state = recordAttentionSegment(state, 'ch1:0.6', 0.6, 0.8, 60, 1)
    const heatmap = getAttentionHeatmapData(state)
    expect(heatmap.length).toBe(2)
    expect(heatmap[0].position).toBeLessThan(heatmap[1].position)
  })
})
