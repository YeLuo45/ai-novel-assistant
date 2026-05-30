/**
 * PatternEvolver Tests - V102
 * Tests for Pattern Library Self-Evolution Engine
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createEmptyEvolverState,
  recordPatternUsage,
  getRecentUsageRecords,
  calculatePatternStatistics,
  evolvePatterns,
  applyEvolutionToPatterns,
  getEvolutionRecommendations,
  formatEvolutionSummary,
  calculateEffectivenessScore,
  shouldPromotePattern,
  shouldDemotePattern,
  shouldPrunePattern,
  DEFAULT_EVOLVER_CONFIG,
  type PatternEvolverState,
  type PatternUsageRecord
} from './PatternEvolver'

// =============================================================================
// Helper Functions
// =============================================================================

function makeMinimalPatterns() {
  return {
    patterns: [
      { id: 'p1', name: 'Pattern 1', category: 'dialogue', weight: 1.0, isActive: true, description: '', examples: [], compatibilityNotes: [], createdAt: 0, updatedAt: 0 },
      { id: 'p2', name: 'Pattern 2', category: 'scene', weight: 1.0, isActive: true, description: '', examples: [], compatibilityNotes: [], createdAt: 0, updatedAt: 0 },
      { id: 'p3', name: 'Pattern 3', category: 'narrative', weight: 0.5, isActive: true, description: '', examples: [], compatibilityNotes: [], createdAt: 0, updatedAt: 0 },
    ]
  }
}

function makeFakeSession(chapter: number, toolCalls: any[], id: string = 's1'): any {
  return {
    id,
    sessionName: `Session ${id}`,
    currentPhase: 'writing' as const,
    phaseHistory: [],
    currentQualityScore: 75,
    rollingQualityScores: [70, 75, 80],
    startTime: Date.now() - 3600000,
    lastUpdateTime: Date.now(),
    totalToolCalls: toolCalls.length,
    totalWordsGenerated: 500,
    energyLevel: 80,
    activeContext: {
      currentChapter: chapter,
      activeCharacters: ['Alice'],
      recentToolCalls: toolCalls,
    },
    pendingReviews: [],
    completedGoals: [],
    stagnationCount: 0,
  }
}

function makeToolCall(patternId: string, qualityScore: number, qualityBefore: number = 50): any {
  return { patternId, qualityScore, qualityBefore, startTime: Date.now() }
}

// =============================================================================
// createEmptyEvolverState Tests
// =============================================================================

describe('createEmptyEvolverState', () => {
  it('should create state with defaults', () => {
    const state = createEmptyEvolverState()
    expect(state.config.promotionThreshold).toBe(15)
    expect(state.usageRecords).toEqual([])
    expect(state.evolutionHistory).toEqual([])
    expect(state.totalSessionsAnalyzed).toBe(0)
  })

  it('should accept custom config', () => {
    const state = createEmptyEvolverState({ promotionThreshold: 20 })
    expect(state.config.promotionThreshold).toBe(20)
    expect(state.config.demotionThreshold).toBe(DEFAULT_EVOLVER_CONFIG.demotionThreshold)
  })
})

// =============================================================================
// recordPatternUsage Tests
// =============================================================================

describe('recordPatternUsage', () => {
  it('should add usage record to state', () => {
    let state = createEmptyEvolverState()
    state = recordPatternUsage(state, 'p1', 1, 50, 75, 's1')
    expect(state.usageRecords.length).toBe(1)
    expect(state.usageRecords[0].patternId).toBe('p1')
    expect(state.usageRecords[0].qualityBefore).toBe(50)
    expect(state.usageRecords[0].qualityAfter).toBe(75)
    expect(state.usageRecords[0].effectivenessScore).toBe(25)
  })

  it('should calculate effectiveness as delta', () => {
    let state = createEmptyEvolverState()
    state = recordPatternUsage(state, 'p1', 2, 40, 60, 's1')
    expect(state.usageRecords[0].effectivenessScore).toBe(20)
  })
})

// =============================================================================
// getRecentUsageRecords Tests
// =============================================================================

describe('getRecentUsageRecords', () => {
  it('should return records within window', () => {
    let state = createEmptyEvolverState()
    state = recordPatternUsage(state, 'p1', 1, 50, 75, 's1')
    state = recordPatternUsage(state, 'p1', 2, 50, 80, 's2')
    const recent = getRecentUsageRecords(state, 'p1')
    expect(recent.length).toBe(2)
  })

  it('should filter by pattern ID', () => {
    let state = createEmptyEvolverState()
    state = recordPatternUsage(state, 'p1', 1, 50, 75, 's1')
    state = recordPatternUsage(state, 'p2', 1, 50, 70, 's2')
    const recent = getRecentUsageRecords(state, 'p1')
    expect(recent.length).toBe(1)
  })
})

// =============================================================================
// calculateEffectivenessScore Tests
// =============================================================================

describe('calculateEffectivenessScore', () => {
  it('should calculate delta', () => {
    expect(calculateEffectivenessScore(50, 75)).toBe(25)
    expect(calculateEffectivenessScore(80, 60)).toBe(-20)
    expect(calculateEffectivenessScore(50, 50)).toBe(0)
  })
})

// =============================================================================
// calculatePatternStatistics Tests
// =============================================================================

describe('calculatePatternStatistics', () => {
  it('should return zeros for unknown pattern', () => {
    const state = createEmptyEvolverState()
    const stats = calculatePatternStatistics(state, 'unknown')
    expect(stats.usageCount).toBe(0)
    expect(stats.averageEffectiveness).toBe(0)
    expect(stats.trend).toBe('stable')
  })

  it('should calculate average effectiveness', () => {
    let state = createEmptyEvolverState()
    state = recordPatternUsage(state, 'p1', 1, 50, 70, 's1')
    state = recordPatternUsage(state, 'p1', 2, 50, 80, 's2')
    const stats = calculatePatternStatistics(state, 'p1')
    expect(stats.usageCount).toBe(2)
    expect(stats.averageEffectiveness).toBe(25)
  })
})

// =============================================================================
// shouldPromotePattern Tests
// =============================================================================

describe('shouldPromotePattern', () => {
  it('should return false for insufficient data', () => {
    const state = createEmptyEvolverState()
    const stats = calculatePatternStatistics(state, 'p1')
    expect(shouldPromotePattern(stats, state.config)).toBe(false)
  })
})

// =============================================================================
// shouldDemotePattern Tests
// =============================================================================

describe('shouldDemotePattern', () => {
  it('should return false for insufficient data', () => {
    const state = createEmptyEvolverState()
    const stats = calculatePatternStatistics(state, 'p1')
    expect(shouldDemotePattern(stats, state.config)).toBe(false)
  })
})

// =============================================================================
// shouldPrunePattern Tests
// =============================================================================

describe('shouldPrunePattern', () => {
  it('should return false for insufficient usage', () => {
    const state = createEmptyEvolverState()
    const stats = calculatePatternStatistics(state, 'p1')
    expect(shouldPrunePattern(stats, state.config)).toBe(false)
  })
})

// =============================================================================
// evolvePatterns Tests
// =============================================================================

describe('evolvePatterns', () => {
  it('should analyze sessions and update state', () => {
    const state = createEmptyEvolverState()
    const patterns = makeMinimalPatterns()
    const sessions = [
      makeFakeSession(1, [makeToolCall('p1', 80, 50), makeToolCall('p2', 60, 50)]),
    ]
    // Note: toolCalls have patternId, evolvePatterns records usage if patternId exists
    const { evolvedState, metrics } = evolvePatterns(state, patterns, sessions)
    expect(evolvedState.totalSessionsAnalyzed).toBe(1)
    expect(metrics.totalPatternsAnalyzed).toBeGreaterThan(0)
  })

  it('should calculate metrics', () => {
    const state = createEmptyEvolverState()
    const patterns = makeMinimalPatterns()
    const sessions = [makeFakeSession(1, [])]
    const { metrics } = evolvePatterns(state, patterns, sessions)
    expect(metrics.patternsPromoted).toBe(0)
    expect(metrics.patternsDemoted).toBe(0)
    expect(metrics.patternsPruned).toBe(0)
  })
})

// =============================================================================
// applyEvolutionToPatterns Tests
// =============================================================================

describe('applyEvolutionToPatterns', () => {
  it('should return unchanged patterns for empty results', () => {
    const patterns = makeMinimalPatterns()
    const updated = applyEvolutionToPatterns(patterns, [])
    expect(updated.patterns.length).toBe(3)
  })

  it('should demote pattern weight', () => {
    const patterns = makeMinimalPatterns()
    const results = [{
      patternId: 'p1', evolutionType: 'demote' as const,
      previousWeight: 1.0, newWeight: 0.5,
      reason: 'Test demotion', evidenceCount: 3
    }]
    const updated = applyEvolutionToPatterns(patterns, results)
    const p1 = updated.patterns.find(p => p.id === 'p1')!
    expect(p1.weight).toBe(0.5)
  })

  it('should promote pattern weight', () => {
    const patterns = makeMinimalPatterns()
    const results = [{
      patternId: 'p3', evolutionType: 'promote' as const,
      previousWeight: 0.5, newWeight: 1.0,
      reason: 'Test promotion', evidenceCount: 5
    }]
    const updated = applyEvolutionToPatterns(patterns, results)
    const p3 = updated.patterns.find(p => p.id === 'p3')!
    expect(p3.weight).toBe(1.0)
  })
})

// =============================================================================
// getEvolutionRecommendations Tests
// =============================================================================

describe('getEvolutionRecommendations', () => {
  it('should return recommendations for patterns', () => {
    const state = createEmptyEvolverState()
    const patterns = makeMinimalPatterns()
    const recs = getEvolutionRecommendations(state, patterns)
    expect(Array.isArray(recs)).toBe(true)
  })
})

// =============================================================================
// formatEvolutionSummary Tests
// =============================================================================

describe('formatEvolutionSummary', () => {
  it('should format summary', () => {
    const state = createEmptyEvolverState()
    const summary = formatEvolutionSummary(state, [], {
      totalPatternsAnalyzed: 0,
      patternsPromoted: 0,
      patternsDemoted: 0,
      patternsPruned: 0,
      newPatternsDiscovered: 0,
      averageEffectivenessImprovement: 0,
    })
    expect(summary).toContain('Pattern Evolution Summary')
  })
})
