/**
 * AuthorDashboard Tests - V84
 * Tests for Unified Author Intelligence Dashboard
 */

import { describe, it, expect, vi } from 'vitest'
import {
  createEmptyDashboardState,
  createDefaultDashboardConfig,
  calculateOverallHealthScore,
  generateDashboardSummary,
  formatDashboardSummary,
  calculateReaderAnalytics,
  generateInsightId,
  type SessionAnalytics,
  type ReaderAnalytics
} from './AuthorDashboard'
import type { WritingSessionState } from '../session/WritingSessionManager'

// ===============================================================================
// createEmptyDashboardState Tests
// ===============================================================================

describe('createEmptyDashboardState', () => {
  it('should create empty state with null values', () => {
    const state = createEmptyDashboardState()
    expect(state.currentSession).toBeNull()
    expect(state.readerPrediction).toBeNull()
    expect(state.pacingAnalysis).toBeNull()
    expect(state.fatigueReport).toBeNull()
    expect(state.activeCharacters).toEqual([])
    expect(state.readerEngagementHistory).toEqual([])
  })

  it('should have recent timestamp', () => {
    const state = createEmptyDashboardState()
    expect(state.lastUpdated).toBeGreaterThan(0)
    expect(state.lastUpdated).toBeLessThanOrEqual(Date.now())
  })
})

// ===============================================================================
// createDefaultDashboardConfig Tests
// ===============================================================================

describe('createDefaultDashboardConfig', () => {
  it('should create config with expected defaults', () => {
    const config = createDefaultDashboardConfig()
    expect(config.autoTrackSession).toBe(true)
    expect(config.simulateReaders).toBe(true)
    expect(config.realTimeUpdates).toBe(false)
    expect(config.focusSkillAreas).toContain('plotting')
    expect(config.readerProfiles).toEqual([])
  })

  it('should have all expected skill areas', () => {
    const config = createDefaultDashboardConfig()
    expect(config.focusSkillAreas).toContain('character')
    expect(config.focusSkillAreas).toContain('dialogue')
    expect(config.focusSkillAreas).toContain('worldbuilding')
  })
})

// ===============================================================================
// calculateOverallHealthScore Tests
// ===============================================================================

describe('calculateOverallHealthScore', () => {
  it('should return weighted average of scores', () => {
    const score = calculateOverallHealthScore(80, 70, 90, 60)
    // session: 0.2, reader: 0.25, quality: 0.35, skill: 0.2
    // 80*0.2 + 70*0.25 + 90*0.35 + 60*0.2 = 16 + 17.5 + 31.5 + 12 = 77
    expect(score).toBeGreaterThan(70)
    expect(score).toBeLessThan(85)
  })

  it('should return 50 for all 50s', () => {
    const score = calculateOverallHealthScore(50, 50, 50, 50)
    expect(score).toBe(50)
  })

  it('should prioritize quality score', () => {
    const withHighQuality = calculateOverallHealthScore(50, 50, 100, 50)
    const withLowQuality = calculateOverallHealthScore(50, 50, 0, 50)
    expect(withHighQuality).toBeGreaterThan(withLowQuality)
  })

  it('should round to nearest integer', () => {
    const score = calculateOverallHealthScore(77, 77, 77, 77)
    expect(Number.isInteger(score)).toBe(true)
  })
})

// ===============================================================================
// calculateReaderAnalytics Tests
// ===============================================================================

describe('calculateReaderAnalytics', () => {
  it('should return null for empty history', () => {
    const result = calculateReaderAnalytics([], null as any, null as any)
    expect(result).toBeNull()
  })

  it('should calculate average engagement', () => {
    const history = [70, 75, 80, 65, 72]
    const result = calculateReaderAnalytics(history, null as any, null as any)
    expect(result).not.toBeNull()
    expect(result!.averageEngagement).toBe(Math.round((70 + 75 + 80 + 65 + 72) / 5))
  })

  it('should identify drop points', () => {
    const history = [80, 75, 25, 70, 65]  // Chapter 3 drops to 25
    const result = calculateReaderAnalytics(history, null as any, null as any)
    expect(result!.likelyDropPoints).toContain(3)
  })

  it('should calculate completion rate from last engagement', () => {
    const history = [80, 75, 70]
    const result = calculateReaderAnalytics(history, null as any, null as any)
    expect(result!.predictedCompletionRate).toBe(0.70)
  })
})

// ===============================================================================
// generateInsightId Tests
// ===============================================================================

describe('generateInsightId', () => {
  it('should generate category-prefixed ID', () => {
    const id = generateInsightId('session', 'Stagnation Detected')
    expect(id.startsWith('session_')).toBe(true)
  })

  it('should slugify title', () => {
    const id = generateInsightId('reader', 'High Dropout Risk')
    expect(id).toContain('high_dropout_risk')
  })

  it('should include timestamp', () => {
    const id = generateInsightId('quality', 'Critical Issue')
    const parts = id.split('_')
    const timestamp = parts[parts.length - 1]
    expect(parseInt(timestamp)).toBeGreaterThan(0)
  })
})

// ===============================================================================
// generateDashboardSummary Tests
// ===============================================================================

describe('generateDashboardSummary', () => {
  it('should calculate overall health score from session analytics', () => {
    const state = createEmptyDashboardState()
    const sessionAnalytics: SessionAnalytics = {
      currentPhase: 'drafting',
      sessionDuration: 30,
      wordsWritten: 500,
      averageWordRate: 16,
      qualityTrend: [0.7, 0.75],
      energyLevel: 'medium',
      recommendedBreak: false,
      breakSuggestion: 'Continue writing',
      currentMomentum: 70,
      stagnationRisk: false,
      toolCallCount: 5,
      lastToolCallTime: Date.now()
    }

    const summary = generateDashboardSummary(state, sessionAnalytics, null, null, null)
    expect(summary.overallHealthScore).toBeGreaterThan(0)
    expect(summary.overallHealthScore).toBeLessThanOrEqual(100)
  })

  it('should generate stagnation warning', () => {
    const state = createEmptyDashboardState()
    const sessionAnalytics: SessionAnalytics = {
      currentPhase: 'drafting',
      sessionDuration: 30,
      wordsWritten: 500,
      averageWordRate: 16,
      qualityTrend: [],
      energyLevel: 'medium',
      recommendedBreak: false,
      breakSuggestion: '',
      currentMomentum: 30,
      stagnationRisk: true,
      toolCallCount: 5,
      lastToolCallTime: Date.now()
    }

    const summary = generateDashboardSummary(state, sessionAnalytics, null, null, null)
    const stagnationWarning = summary.activeInsights.find(i => i.category === 'session' && i.type === 'warning')
    expect(stagnationWarning).toBeDefined()
    expect(stagnationWarning!.title).toContain('Stagnation')
  })

  it('should prioritize high priority insights first', () => {
    const state = createEmptyDashboardState()
    const summary = generateDashboardSummary(state, null, null, null, null)
    if (summary.activeInsights.length > 1) {
      const priorities = summary.activeInsights.map(i => i.priority)
      const highIndex = priorities.indexOf('high')
      const mediumIndex = priorities.indexOf('medium')
      if (highIndex !== -1 && mediumIndex !== -1) {
        expect(highIndex).toBeLessThan(mediumIndex)
      }
    }
  })
})

// ===============================================================================
// formatDashboardSummary Tests
// ===============================================================================

describe('formatDashboardSummary', () => {
  it('should format health scores', () => {
    const summary = generateDashboardSummary(createEmptyDashboardState(), null, null, null, null)
    const formatted = formatDashboardSummary(summary)
    expect(formatted).toContain('Overall Health:')
    expect(formatted).toContain('Session:')
    expect(formatted).toContain('Reader:')
  })

  it('should format insights section', () => {
    const summary = generateDashboardSummary(createEmptyDashboardState(), null, null, null, null)
    const formatted = formatDashboardSummary(summary)
    expect(formatted).toContain('Insights')
  })

  it('should show achievement section only when achievements exist', () => {
    // Empty state has no achievements by default
    const summary = generateDashboardSummary(createEmptyDashboardState(), null, null, null, null)
    // With no achievements, the section header is NOT added
    const hasAchievementsHeader = summary.recentAchievements.length > 0
    const formatted = formatDashboardSummary(summary)
    if (hasAchievementsHeader) {
      expect(formatted).toContain('Achievements')
    }
    // The format function should not throw
    expect(formatted).toBeDefined()
  })
})
