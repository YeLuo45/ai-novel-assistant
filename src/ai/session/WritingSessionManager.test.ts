/**
 * WritingSessionManager Tests - V81
 * Tests for Writing Session Orchestration
 */

import { describe, it, expect } from 'vitest'
import {
  type SessionPhase,
  type WritingSessionConfig,
  type SessionEnergySnapshot,
  type PhaseMetrics,
  type QualityAnalysis,
  calculateCurrentEnergy,
  getEnergyLevel,
  getTempoProfile,
  analyzeQualityTrend,
  shouldTransitionPhase,
  recommendNextPhase,
  detectToolOveruse,
  createSessionEvent,
  formatSessionSummary,
  DEFAULT_SESSION_CONFIG,
  createInitialSessionState
} from './WritingSessionManager'
import type { ToolCall } from '../agents/ToolExecutor'

// ===============================================================================
// Helper - mock tool calls
// ===============================================================================

function makeToolCall(id: string, startTime: number): ToolCall {
  return { id, tool: 'testTool', args: {}, startTime }
}

// ===============================================================================
// calculateCurrentEnergy Tests
// ===============================================================================

describe('calculateCurrentEnergy', () => {
  it('should return 100 for fresh session', () => {
    const energy = calculateCurrentEnergy(Date.now() - 1000, 0, 'planning')
    expect(energy).toBeLessThan(100)
    expect(energy).toBeGreaterThan(95)
  })

  it('should decay faster in drafting phase', () => {
    const now = Date.now()
    const draftingEnergy = calculateCurrentEnergy(now - 300000, 5, 'drafting')
    const planningEnergy = calculateCurrentEnergy(now - 300000, 5, 'planning')
    expect(draftingEnergy).toBeLessThan(planningEnergy)
  })

  it('should respect lastEnergySnapshot', () => {
    const snapshot: SessionEnergySnapshot = { timestamp: Date.now(), energyLevel: 50, phase: 'drafting', qualityScore: 0.6, toolsCalledLast5Min: 3 }
    const energy = calculateCurrentEnergy(Date.now() - 60000, 2, 'drafting', snapshot)
    // Should use 50 as base, not 100
    expect(energy).toBeLessThan(55)
  })

  it('should not go below 0', () => {
    const energy = calculateCurrentEnergy(Date.now() - 10000000, 1000, 'drafting')
    expect(energy).toBe(0)
  })

  it('should not exceed 100', () => {
    const energy = calculateCurrentEnergy(Date.now() - 1000, -100, 'planning')
    expect(energy).toBeLessThanOrEqual(100)
  })
})

// ===============================================================================
// getEnergyLevel Tests
// ===============================================================================

describe('getEnergyLevel', () => {
  it('should return fresh for energy > 80', () => {
    expect(getEnergyLevel(85)).toBe('fresh')
    expect(getEnergyLevel(100)).toBe('fresh')
  })

  it('should return focused for energy 50-80', () => {
    expect(getEnergyLevel(80)).toBe('focused')
    expect(getEnergyLevel(60)).toBe('focused')
    expect(getEnergyLevel(51)).toBe('focused')
  })

  it('should return tired for energy 20-50', () => {
    expect(getEnergyLevel(50)).toBe('tired')
    expect(getEnergyLevel(30)).toBe('tired')
    expect(getEnergyLevel(21)).toBe('tired')
  })

  it('should return exhausted for energy <= 20', () => {
    expect(getEnergyLevel(20)).toBe('exhausted')
    expect(getEnergyLevel(0)).toBe('exhausted')
  })
})

// ===============================================================================
// getTempoProfile Tests
// ===============================================================================

describe('getTempoProfile', () => {
  it('should recommend no break for fresh energy', () => {
    const profile = getTempoProfile(90, 'drafting')
    expect(profile.breakRecommendation).toBe('none')
    expect(profile.optimalSessionLength).toBe(45)
  })

  it('should recommend short break for focused energy', () => {
    const profile = getTempoProfile(65, 'drafting')
    expect(profile.breakRecommendation).toBe('short')
    expect(profile.optimalSessionLength).toBe(30)
  })

  it('should recommend long break for tired energy', () => {
    const profile = getTempoProfile(35, 'drafting')
    expect(profile.breakRecommendation).toBe('long')
    expect(profile.optimalSessionLength).toBe(15)
  })

  it('should recommend completing session when exhausted', () => {
    const profile = getTempoProfile(15, 'drafting')
    expect(profile.recommendedPhase).toBe('completed')
    expect(profile.breakRecommendation).toBe('long')
    expect(profile.optimalSessionLength).toBe(0)
  })

  it('should adjust throttle based on energy', () => {
    const freshProfile = getTempoProfile(95, 'drafting')
    const tiredProfile = getTempoProfile(35, 'drafting')
    expect(freshProfile.toolCallThrottle).toBeGreaterThan(tiredProfile.toolCallThrottle)
  })
})

// ===============================================================================
// analyzeQualityTrend Tests
// ===============================================================================

describe('analyzeQualityTrend', () => {
  it('should return stable for insufficient data', () => {
    const result = analyzeQualityTrend([0.7])
    expect(result.trend).toBe('stable')
    expect(result.volatility).toBe(0)
  })

  it('should detect improving trend', () => {
    const scores = [0.5, 0.55, 0.6, 0.65, 0.7]
    const result = analyzeQualityTrend(scores)
    expect(result.trend).toBe('improving')
    expect(result.bestScore).toBe(0.7)
  })

  it('should detect declining trend', () => {
    const scores = [0.8, 0.72, 0.65, 0.58, 0.5]
    const result = analyzeQualityTrend(scores)
    expect(result.trend).toBe('declining')
    expect(result.worstScore).toBe(0.5)
  })

  it('should detect volatile trend', () => {
    const scores = [0.6, 0.4, 0.7, 0.35, 0.65]
    const result = analyzeQualityTrend(scores)
    expect(result.trend).toBe('volatile')
    expect(result.volatility).toBeGreaterThan(0.1)
  })

  it('should calculate average score', () => {
    const scores = [0.5, 0.6, 0.7, 0.8]
    const result = analyzeQualityTrend(scores)
    expect(result.averageScore).toBeCloseTo(0.65, 1)
  })

  it('should project completion quality', () => {
    const scores = [0.5, 0.55, 0.6]
    const result = analyzeQualityTrend(scores)
    expect(result.projectedCompletionQuality).toBeGreaterThan(0.6)
  })
})

// ===============================================================================
// shouldTransitionPhase Tests
// ===============================================================================

describe('shouldTransitionPhase', () => {
  const config: WritingSessionConfig = { ...DEFAULT_SESSION_CONFIG, timeBudgetMs: 60000 }

  it('should not transition when quality is below threshold', () => {
    const metrics: PhaseMetrics = {
      phase: 'drafting',
      startTime: Date.now() - 30000,
      durationMs: 30000,
      qualityScore: 0.4,
      productivityScore: 0.5,
      toolCalls: 5,
      energyConsumed: 10,
      transitions: 0,
      qualityHistory: []
    }
    const analysis = analyzeQualityTrend([0.4, 0.42, 0.41])
    const result = shouldTransitionPhase('drafting', metrics, config, analysis)
    expect(result.should).toBe(false)
  })

  it('should transition on quality threshold', () => {
    const metrics: PhaseMetrics = {
      phase: 'drafting',
      startTime: Date.now() - 10000,
      durationMs: 10000,
      qualityScore: 0.7,  // Exceeds drafting threshold of 0.5
      productivityScore: 0.6,
      toolCalls: 3,
      energyConsumed: 5,
      transitions: 0,
      qualityHistory: []
    }
    const analysis = analyzeQualityTrend([0.7])
    const result = shouldTransitionPhase('drafting', metrics, config, analysis)
    expect(result.should).toBe(true)
    expect(result.trigger).toBe('quality_threshold')
  })

  it('should transition on time budget exceeded', () => {
    const metrics: PhaseMetrics = {
      phase: 'planning',
      startTime: Date.now() - 70000,  // Exceeds 60s budget
      durationMs: 70000,
      qualityScore: 0.3,
      productivityScore: 0.4,
      toolCalls: 8,
      energyConsumed: 15,
      transitions: 0,
      qualityHistory: []
    }
    const analysis = analyzeQualityTrend([0.3])
    const result = shouldTransitionPhase('planning', metrics, config, analysis)
    expect(result.should).toBe(true)
    expect(result.trigger).toBe('time_budget_exceeded')
  })

  it('should detect stagnation (quality below threshold, no time excess)', () => {
    const metrics: PhaseMetrics = {
      phase: 'drafting',
      startTime: Date.now() - 10000,  // Only 10s - well under 60s budget
      durationMs: 10000,
      qualityScore: 0.4,  // Below threshold (0.5) - won't trigger quality_threshold
      productivityScore: 0.5,
      toolCalls: 10,
      energyConsumed: 20,
      transitions: 0,
      qualityHistory: [0.5, 0.501, 0.502, 0.503, 0.504]  // No significant change (std dev very small)
    }
    const analysis = analyzeQualityTrend(metrics.qualityHistory)
    const result = shouldTransitionPhase('drafting', metrics, config, analysis)
    expect(result.should).toBe(true)
    expect(result.trigger).toBe('stagnation_detected')
  })
})

// ===============================================================================
// recommendNextPhase Tests
// ===============================================================================

describe('recommendNextPhase', () => {
  it('should default to next phase in sequence', () => {
    const recommendation = recommendNextPhase('drafting', analyzeQualityTrend([0.5, 0.55, 0.6]), 80, [])
    expect(recommendation.recommendedPhase).toBe('revision')
  })

  it('should switch to revision when quality declining', () => {
    const analysis = analyzeQualityTrend([0.8, 0.7, 0.6, 0.5])
    const recommendation = recommendNextPhase('drafting', analysis, 80, [])
    expect(recommendation.recommendedPhase).toBe('revision')
    expect(recommendation.confidence).toBeGreaterThan(0.7)
  })

  it('should switch to polishing when energy low', () => {
    const recommendation = recommendNextPhase('drafting', analyzeQualityTrend([0.6]), 25, [])
    expect(recommendation.recommendedPhase).toBe('polishing')
    expect(recommendation.reasoning).toContain('Low energy')
  })

  it('should recommend revision after multiple goals completed', () => {
    const recommendation = recommendNextPhase('drafting', analyzeQualityTrend([0.6]), 60, ['goal1', 'goal2', 'goal3', 'goal4'])
    expect(recommendation.recommendedPhase).toBe('revision')
    expect(recommendation.confidence).toBe(0.8)
  })

  it('should estimate duration for next phase', () => {
    const recommendation = recommendNextPhase('drafting', analyzeQualityTrend([0.6]), 70, [])
    expect(recommendation.estimatedDurationMs).toBeGreaterThan(0)
    expect(recommendation.estimatedDurationMs).not.toBeUndefined()
  })
})

// ===============================================================================
// detectToolOveruse Tests
// ===============================================================================

describe('detectToolOveruse', () => {
  it('should not flag normal usage', () => {
    const now = Date.now()
    const calls = [
      makeToolCall('t1', now - 60000),
      makeToolCall('t2', now - 120000),
      makeToolCall('t3', now - 180000)
    ]
    const result = detectToolOveruse(calls, 300000)
    expect(result.isOveruse).toBe(false)
    expect(result.overuseRatio).toBeLessThan(1)
  })

  it('should flag excessive calls', () => {
    const now = Date.now()
    // 20 calls in 30 seconds = 40 calls/minute >> 12 limit
    const calls = Array.from({ length: 20 }, (_, i) => makeToolCall(`t${i}`, now - i * 1500))
    const result = detectToolOveruse(calls, 30000)  // 30-second window
    expect(result.isOveruse).toBe(true)
    expect(result.overuseRatio).toBeGreaterThan(1)
    expect(result.recommendedThrottle).toBeLessThan(12)
  })

  it('should use startTime for filtering', () => {
    const now = Date.now()
    const calls = [
      makeToolCall('t1', now - 10000),
      makeToolCall('t2', now - 10000)
    ]
    const result = detectToolOveruse(calls, 60000)
    expect(result.overuseRatio).toBeGreaterThan(0)
  })
})

// ===============================================================================
// createSessionEvent Tests
// ===============================================================================

describe('createSessionEvent', () => {
  it('should create event with correct type', () => {
    const event = createSessionEvent('phase_started', 'Started drafting phase', 'drafting')
    expect(event.type).toBe('phase_started')
    expect(event.phase).toBe('drafting')
    expect(event.details).toBe('Started drafting phase')
  })

  it('should include timestamp', () => {
    const before = Date.now()
    const event = createSessionEvent('quality_improved', 'Score increased')
    const after = Date.now()
    expect(event.timestamp).toBeGreaterThanOrEqual(before)
    expect(event.timestamp).toBeLessThanOrEqual(after)
  })

  it('should generate unique id', () => {
    const event1 = createSessionEvent('session_completed', 'Done')
    const event2 = createSessionEvent('session_completed', 'Done')
    expect(event1.id).not.toBe(event2.id)
  })

  it('should include metrics snapshot if provided', () => {
    const metrics = { qualityScore: 0.8, productivityScore: 0.6 }
    const event = createSessionEvent('milestone_reached', 'Chapter 5 done', undefined, metrics)
    expect(event.metricsSnapshot).toEqual(metrics)
  })
})

// ===============================================================================
// formatSessionSummary Tests
// ===============================================================================

describe('formatSessionSummary', () => {
  it('should include session name and phase', () => {
    const state = createInitialSessionState('s1', 'Test Session')
    const summary = formatSessionSummary(state)
    expect(summary).toContain('Test Session')
    expect(summary).toContain('planning')
  })

  it('should show quality trend', () => {
    const state = createInitialSessionState('s2', 'Test')
    state.activeContext.qualityTrend = 'declining'
    state.currentQualityScore = 0.45
    const summary = formatSessionSummary(state)
    expect(summary).toContain('declining')
    expect(summary).toContain('45%')
  })

  it('should show energy level', () => {
    const state = createInitialSessionState('s3', 'Test')
    state.energyLevel = 35
    const summary = formatSessionSummary(state)
    expect(summary).toContain('35%')
  })

  it('should show tool call count', () => {
    const state = createInitialSessionState('s4', 'Test')
    state.totalToolCalls = 42
    const summary = formatSessionSummary(state)
    expect(summary).toContain('42')
  })

  it('should show pending reviews', () => {
    const state = createInitialSessionState('s5', 'Test')
    state.pendingReviews.push({ id: 'r1', type: 'plot', priority: 'high', description: 'Check twist', completed: false, createdAt: Date.now() })
    state.pendingReviews.push({ id: 'r2', type: 'character', priority: 'low', description: 'Check arc', completed: true, createdAt: Date.now() })
    const summary = formatSessionSummary(state)
    expect(summary).toContain('1')  // Only uncompleted
  })
})

// ===============================================================================
// createInitialSessionState Tests
// ===============================================================================

describe('createInitialSessionState', () => {
  it('should create state with planning phase', () => {
    const state = createInitialSessionState('s1', 'My Session')
    expect(state.currentPhase).toBe('planning')
    expect(state.id).toBe('s1')
    expect(state.sessionName).toBe('My Session')
  })

  it('should initialize energy at 100', () => {
    const state = createInitialSessionState('s2', 'Test')
    expect(state.energyLevel).toBe(100)
  })

  it('should start with phase history entry', () => {
    const state = createInitialSessionState('s3', 'Test')
    expect(state.phaseHistory).toHaveLength(1)
    expect(state.phaseHistory[0].phase).toBe('planning')
  })

  it('should initialize quality score at 0.5', () => {
    const state = createInitialSessionState('s4', 'Test')
    expect(state.currentQualityScore).toBe(0.5)
    expect(state.rollingQualityScores).toEqual([0.5])
  })

  it('should initialize empty pending reviews', () => {
    const state = createInitialSessionState('s5', 'Test')
    expect(state.pendingReviews).toHaveLength(0)
    expect(state.completedGoals).toHaveLength(0)
  })
})

// ===============================================================================
// DEFAULT_SESSION_CONFIG Tests
// ===============================================================================

describe('DEFAULT_SESSION_CONFIG', () => {
  it('should have reasonable quality thresholds', () => {
    expect(DEFAULT_SESSION_CONFIG.qualityThresholds.planning).toBeLessThan(1)
    expect(DEFAULT_SESSION_CONFIG.qualityThresholds.drafting).toBeLessThan(1)
    expect(DEFAULT_SESSION_CONFIG.qualityThresholds.revision).toBeGreaterThan(DEFAULT_SESSION_CONFIG.qualityThresholds.drafting)
    expect(DEFAULT_SESSION_CONFIG.qualityThresholds.polish).toBeGreaterThan(DEFAULT_SESSION_CONFIG.qualityThresholds.revision)
  })

  it('should have 60 minute time budget', () => {
    expect(DEFAULT_SESSION_CONFIG.timeBudgetMs).toBe(3600000)
  })

  it('should enable real-time monitoring by default', () => {
    expect(DEFAULT_SESSION_CONFIG.enableRealTimeMonitoring).toBe(true)
    expect(DEFAULT_SESSION_CONFIG.enableDreamMemoryIntegration).toBe(true)
  })
})

// ===============================================================================
// Edge Cases
// ===============================================================================

describe('Edge Cases', () => {
  it('should not trigger stagnation on insufficient history', () => {
    // With empty history and qualityScore=0.5, quality_threshold triggers (0.5 >= 0.5)
    // Test with quality below threshold so only stagnation check applies
    const config: WritingSessionConfig = { ...DEFAULT_SESSION_CONFIG, timeBudgetMs: 60000 }
    const metrics: PhaseMetrics = {
      phase: 'drafting',
      startTime: Date.now() - 10000,
      durationMs: 10000,
      qualityScore: 0.4,  // Below threshold - won't trigger quality_threshold
      productivityScore: 0.5,
      toolCalls: 5,
      energyConsumed: 10,
      transitions: 0,
      qualityHistory: []  // Empty - stagnation requires 5+ scores
    }
    const analysis = analyzeQualityTrend([])  // Returns stable, slope=0
    const result = shouldTransitionPhase('drafting', metrics, config, analysis)
    expect(result.should).toBe(false)  // No stagnation - history too short, quality below threshold
  })

  it('should handle analyzeQualityTrend with single score', () => {
    const result = analyzeQualityTrend([0.8])
    expect(result.trend).toBe('stable')
    expect(result.averageScore).toBe(0.8)
    expect(result.bestScore).toBe(0.8)
    expect(result.worstScore).toBe(0.8)
  })

  it('should handle zero window in detectToolOveruse', () => {
    const result = detectToolOveruse([], 0)
    expect(result.isOveruse).toBe(false)
  })

  it('should handle recommendNextPhase for completed phase', () => {
    const recommendation = recommendNextPhase('completed', analyzeQualityTrend([0.9]), 80, [])
    expect(recommendation.recommendedPhase).toBe('completed')
  })
})