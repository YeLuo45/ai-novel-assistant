/**
 * EvolutionAnalytics Tests - V113
 * Tests for Advanced Cross-Module Analytics Engine
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyEvolutionAnalyticsState,
  calculateWriterHealthScore,
  recordDailyProgress,
  generatePredictiveInsights,
  getEvolutionAnalyticsSummary,
  formatEvolutionAnalyticsReport,
  DEFAULT_EVOLUTION_ANALYTICS_CONFIG,
} from './EvolutionAnalytics'

// =============================================================================
// createEmptyEvolutionAnalyticsState Tests
// =============================================================================

describe('createEmptyEvolutionAnalyticsState', () => {
  it('should create empty state', () => {
    const state = createEmptyEvolutionAnalyticsState()
    expect(state.dailyProgressRecords).toEqual([])
    expect(state.healthScoreHistory).toEqual([])
    expect(state.predictiveInsights).toEqual([])
    expect(state.totalDaysTracked).toBe(0)
  })
})

// =============================================================================
// calculateWriterHealthScore Tests
// =============================================================================

describe('calculateWriterHealthScore', () => {
  it('should return health score object', () => {
    const evolutionState = {
      cycleHistory: [],
      currentCycleNumber: 0,
    } as any
    const qualityState = {
      sentenceHistory: [],
    } as any
    const toolState = {
      totalToolsUsed: 0,
      efficiencyScores: new Map(),
    } as any

    const score = calculateWriterHealthScore(evolutionState, qualityState, toolState)
    expect(score.overall).toBeLessThanOrEqual(100)
    expect(score.overall).toBeGreaterThanOrEqual(0)
  })

  it('should weight components', () => {
    const evolutionState = {
      cycleHistory: [{ overallHealthScore: 80 }],
      currentCycleNumber: 1,
    } as any
    const qualityState = {
      sentenceHistory: [{ qualityScore: 85 }],
    } as any
    const toolState = {
      totalToolsUsed: 1,
      efficiencyScores: new Map([['t1', { efficiencyScore: 70 }]]),
    } as any

    const score = calculateWriterHealthScore(evolutionState, qualityState, toolState)
    expect(score.overall).toBeLessThanOrEqual(100)
    expect(score.overall).toBeGreaterThanOrEqual(0)
  })
})

// =============================================================================
// recordDailyProgress Tests
// =============================================================================

describe('recordDailyProgress', () => {
  it('should add a daily record', () => {
    let state = createEmptyEvolutionAnalyticsState()
    state = recordDailyProgress(state, 3, 1500, 75, 25, 1, 60, 70)
    expect(state.dailyProgressRecords.length).toBe(1)
    expect(state.totalDaysTracked).toBe(1)
  })

  it('should update existing day record', () => {
    let state = createEmptyEvolutionAnalyticsState()
    state = recordDailyProgress(state, 3, 1500, 75, 25, 1, 60, 70)
    state = recordDailyProgress(state, 5, 2000, 78, 30, 2, 65, 75) // same day
    expect(state.dailyProgressRecords.length).toBe(1)
    expect(state.dailyProgressRecords[0].sessionsCompleted).toBe(5)
  })
})

// =============================================================================
// generatePredictiveInsights Tests
// =============================================================================

describe('generatePredictiveInsights', () => {
  it('should return empty for insufficient data', () => {
    const state = createEmptyEvolutionAnalyticsState()
    const insights = generatePredictiveInsights(state, {} as any, {} as any, {} as any)
    expect(insights).toEqual([])
  })

  it('should run without errors', () => {
    let state = createEmptyEvolutionAnalyticsState()
    // Add multiple days of records
    for (let i = 0; i < 8; i++) {
      state = recordDailyProgress(state, 1, 100, 40, 10, 0, 50, 60)
    }

    const qualityState = {
      sentenceHistory: Array.from({ length: 10 }, (_, i) => ({
        qualityScore: 40,
        sentenceId: `s${i}`,
      })),
    } as any

    const insights = generatePredictiveInsights(state, { cycleHistory: [], skillEvolverState: { skillLevels: new Map() }, patternEvolverState: { evolutionHistory: [] } } as any, qualityState, { efficiencyScores: new Map() } as any)
    // Just verify it returns an array
    expect(Array.isArray(insights)).toBe(true)
  })
})

// =============================================================================
// getEvolutionAnalyticsSummary Tests
// =============================================================================

describe('getEvolutionAnalyticsSummary', () => {
  it('should return zeros for empty state', () => {
    const state = createEmptyEvolutionAnalyticsState()
    const summary = getEvolutionAnalyticsSummary(state)
    expect(summary.daysTracked).toBe(0)
    expect(summary.totalSessions).toBe(0)
    expect(summary.averageQuality).toBe(0)
  })

  it('should calculate summary metrics', () => {
    let state = createEmptyEvolutionAnalyticsState()
    state = recordDailyProgress(state, 2, 1000, 70, 20, 1, 55, 65)
    state = recordDailyProgress(state, 3, 1500, 80, 30, 1, 60, 70)

    const summary = getEvolutionAnalyticsSummary(state)
    expect(summary.daysTracked).toBeGreaterThanOrEqual(1)
    expect(summary.totalSessions).toBe(3)
    expect(summary.averageQuality).toBeGreaterThan(0)
  })
})

// =============================================================================
// formatEvolutionAnalyticsReport Tests
// =============================================================================

describe('formatEvolutionAnalyticsReport', () => {
  it('should format report', () => {
    const state = createEmptyEvolutionAnalyticsState()
    const report = formatEvolutionAnalyticsReport(state)
    expect(report).toContain('Evolution Analytics Report')
    expect(report).toContain('Days Tracked: 0')
  })
})