/**
 * SelfEvolutionEngine Tests - V106
 * Tests for Unified Self-Evolution Coordinator
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptySelfEvolutionState,
  runEvolutionCycle,
  shouldRunEvolutionCycle,
  getEvolutionStatus,
  getPrioritizedRecommendations,
  formatSelfEvolutionSummary,
  DEFAULT_SELF_EVOLUTION_CONFIG,
} from './SelfEvolutionEngine'

// =============================================================================
// Helper Functions
// =============================================================================

function makeFakeSession(qualityScore: number, toolCalls: number, durationMs: number = 3600000): any {
  return {
    id: `session_${Date.now()}`,
    currentQualityScore: qualityScore,
    rollingQualityScores: [50, 60, 70],
    startTime: Date.now() - durationMs,
    lastUpdateTime: Date.now(),
    totalToolCalls: toolCalls,
    totalWordsGenerated: 500,
    activeContext: {
      currentChapter: 1,
      activeCharacters: ['Alice'],
      recentToolCalls: [],
    },
  }
}

// =============================================================================
// createEmptySelfEvolutionState Tests
// =============================================================================

describe('createEmptySelfEvolutionState', () => {
  it('should create state with defaults', () => {
    const state = createEmptySelfEvolutionState()
    expect(state.currentCycleNumber).toBe(0)
    expect(state.cycleHistory).toEqual([])
    expect(state.totalSessionsAnalyzed).toBe(0)
  })

  it('should accept custom config', () => {
    const state = createEmptySelfEvolutionState({ minSessionsPerCycle: 5 })
    expect(state.config.minSessionsPerCycle).toBe(5)
  })
})

// =============================================================================
// runEvolutionCycle Tests
// =============================================================================

describe('runEvolutionCycle', () => {
  it('should increment cycle number', () => {
    let state = createEmptySelfEvolutionState()
    const sessions = [makeFakeSession(75, 15), makeFakeSession(80, 20), makeFakeSession(85, 25)]
    const { evolvedState } = runEvolutionCycle(state, sessions, { patterns: [] })
    expect(evolvedState.currentCycleNumber).toBe(1)
  })

  it('should record cycle history', () => {
    let state = createEmptySelfEvolutionState()
    const sessions = [makeFakeSession(75, 15), makeFakeSession(80, 20), makeFakeSession(85, 25)]
    const { evolvedState } = runEvolutionCycle(state, sessions, { patterns: [] })
    expect(evolvedState.cycleHistory.length).toBe(1)
    expect(evolvedState.cycleHistory[0].cycleNumber).toBe(1)
  })

  it('should return result with metrics', () => {
    let state = createEmptySelfEvolutionState()
    const sessions = [makeFakeSession(75, 15), makeFakeSession(80, 20), makeFakeSession(85, 25)]
    const { result } = runEvolutionCycle(state, sessions, { patterns: [] })
    expect(result.patternEvolution).toBeDefined()
    expect(result.skillEvolution).toBeDefined()
    expect(result.overallHealthScore).toBeGreaterThanOrEqual(0)
  })

  it('should handle insufficient sessions', () => {
    let state = createEmptySelfEvolutionState()
    const sessions = [makeFakeSession(75, 15)] // only 1, min is 3
    const { evolvedState, result } = runEvolutionCycle(state, sessions, { patterns: [] })
    expect(result.recommendations[0]).toContain('Not enough sessions')
  })
})

// =============================================================================
// shouldRunEvolutionCycle Tests
// =============================================================================

describe('shouldRunEvolutionCycle', () => {
  it('should return false for recently run cycle', () => {
    const state = createEmptySelfEvolutionState()
    const shouldRun = shouldRunEvolutionCycle(state)
    expect(shouldRun).toBe(false)
  })
})

// =============================================================================
// getEvolutionStatus Tests
// =============================================================================

describe('getEvolutionStatus', () => {
  it('should return status object', () => {
    const state = createEmptySelfEvolutionState()
    const status = getEvolutionStatus(state)
    expect(status.cycleCount).toBe(0)
    expect(status.totalSessionsAnalyzed).toBe(0)
    expect(status.trackedSkills).toBe(0)
    expect(status.healthScore).toBe(50)
  })
})

// =============================================================================
// getPrioritizedRecommendations Tests
// =============================================================================

describe('getPrioritizedRecommendations', () => {
  it('should return recommendations array', () => {
    const state = createEmptySelfEvolutionState()
    const recs = getPrioritizedRecommendations(state)
    expect(Array.isArray(recs)).toBe(true)
  })
})

// =============================================================================
// formatSelfEvolutionSummary Tests
// =============================================================================

describe('formatSelfEvolutionSummary', () => {
  it('should format summary', () => {
    const state = createEmptySelfEvolutionState()
    const summary = formatSelfEvolutionSummary(state)
    expect(summary).toContain('Self-Evolution Summary')
    expect(summary).toContain('Cycles Run')
  })
})
