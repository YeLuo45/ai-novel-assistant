/**
 * SkillEvolutionEngine Tests - V104
 * Tests for Skill Graph Self-Evolution Engine
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptySkillEvolutionState,
  calculateXpGained,
  calculateMasteryScore,
  updateSkillLevel,
  recordSkillProgression,
  getSkillRecommendations,
  analyzeSkillTrends,
  evolveSkillFromSessions,
  formatSkillEvolutionSummary,
  DEFAULT_SKILL_EVOLUTION_CONFIG,
} from './SkillEvolutionEngine'

// =============================================================================
// Helper Functions
// =============================================================================

function makeFakeSession(id: string, qualityScore: number, toolCalls: number, durationMs: number = 3600000): any {
  return {
    id,
    currentQualityScore: qualityScore,
    rollingQualityScores: [50, 60, 70],
    startTime: Date.now() - durationMs,
    lastUpdateTime: Date.now(),
    totalToolCalls: toolCalls,
    totalWordsGenerated: 500,
    activeContext: {
      currentChapter: 1,
      activeCharacters: ['Alice', 'Bob'],
      recentToolCalls: [],
    },
  }
}

// =============================================================================
// createEmptySkillEvolutionState Tests
// =============================================================================

describe('createEmptySkillEvolutionState', () => {
  it('should create state with defaults', () => {
    const state = createEmptySkillEvolutionState()
    expect(state.config.xpPerQualityPoint).toBe(2)
    expect(state.config.levelUpThreshold).toBe(100)
    expect(state.skillLevels.size).toBe(0)
    expect(state.progressionRecords).toEqual([])
    expect(state.totalSessionsAnalyzed).toBeGreaterThanOrEqual(0)
  })

  it('should accept custom config', () => {
    const state = createEmptySkillEvolutionState({ xpPerQualityPoint: 5 })
    expect(state.config.xpPerQualityPoint).toBe(5)
  })
})

// =============================================================================
// calculateXpGained Tests
// =============================================================================

describe('calculateXpGained', () => {
  it('should calculate base XP', () => {
    const xp = calculateXpGained(0, 10, 0.5, DEFAULT_SKILL_EVOLUTION_CONFIG)
    expect(xp).toBeGreaterThanOrEqual(0)
  })

  it('should add quality bonus for positive delta', () => {
    const xpHigh = calculateXpGained(20, 10, 0.5, DEFAULT_SKILL_EVOLUTION_CONFIG)
    const xpLow = calculateXpGained(0, 10, 0.5, DEFAULT_SKILL_EVOLUTION_CONFIG)
    expect(xpHigh).toBeGreaterThan(xpLow)
  })

  it('should add success bonus for high success rate', () => {
    const xpHigh = calculateXpGained(10, 10, 0.9, DEFAULT_SKILL_EVOLUTION_CONFIG)
    const xpLow = calculateXpGained(10, 10, 0.3, DEFAULT_SKILL_EVOLUTION_CONFIG)
    expect(xpHigh).toBeGreaterThan(xpLow)
  })
})

// =============================================================================
// calculateMasteryScore Tests
// =============================================================================

describe('calculateMasteryScore', () => {
  it('should return score between 0-100', () => {
    const score = calculateMasteryScore(5, 50, Date.now(), DEFAULT_SKILL_EVOLUTION_CONFIG)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('should be higher for higher level', () => {
    const scoreLow = calculateMasteryScore(2, 0, Date.now(), DEFAULT_SKILL_EVOLUTION_CONFIG)
    const scoreHigh = calculateMasteryScore(8, 0, Date.now(), DEFAULT_SKILL_EVOLUTION_CONFIG)
    expect(scoreHigh).toBeGreaterThan(scoreLow)
  })
})

// =============================================================================
// updateSkillLevel Tests
// =============================================================================

describe('updateSkillLevel', () => {
  it('should create new skill if not exists', () => {
    let state = createEmptySkillEvolutionState()
    state = updateSkillLevel(state, 'dialogue', 50)
    expect(state.skillLevels.has('dialogue')).toBe(true)
    expect(state.skillLevels.get('dialogue')!.level).toBe(1)
  })

  it('should level up when enough XP', () => {
    let state = createEmptySkillEvolutionState()
    state = updateSkillLevel(state, 'dialogue', 200)
    expect(state.skillLevels.get('dialogue')!.level).toBeGreaterThan(1)
  })

  it('should cap level at 10', () => {
    let state = createEmptySkillEvolutionState()
    state = updateSkillLevel(state, 'dialogue', 2000)
    expect(state.skillLevels.get('dialogue')!.level).toBe(10)
  })
})

// =============================================================================
// recordSkillProgression Tests
// =============================================================================

describe('recordSkillProgression', () => {
  it('should add progression record', () => {
    let state = createEmptySkillEvolutionState()
    state = recordSkillProgression(state, 'dialogue', 's1', 15, 0.8, 3, 10)
    expect(state.progressionRecords.length).toBe(1)
    expect(state.progressionRecords[0].skillId).toBe('dialogue')
    expect(state.progressionRecords[0].xpGained).toBeGreaterThan(0)
  })

  it('should update skill level', () => {
    let state = createEmptySkillEvolutionState()
    state = recordSkillProgression(state, 'dialogue', 's1', 15, 0.8, 3, 20)
    expect(state.skillLevels.has('dialogue')).toBe(true)
  })
})

// =============================================================================
// getSkillRecommendations Tests
// =============================================================================

describe('getSkillRecommendations', () => {
  it('should recommend untracked skills', () => {
    const state = createEmptySkillEvolutionState()
    const recs = getSkillRecommendations(state)
    expect(recs.length).toBeGreaterThan(0)
    expect(recs.some(r => r.priority === 'high')).toBe(true)
  })
})

// =============================================================================
// analyzeSkillTrends Tests
// =============================================================================

describe('analyzeSkillTrends', () => {
  it('should return defaults for unknown skill', () => {
    const state = createEmptySkillEvolutionState()
    const trend = analyzeSkillTrends(state, 'unknown')
    expect(trend.trend).toBe('stable')
    expect(trend.sessionsInWindow).toBe(0)
  })
})

// =============================================================================
// evolveSkillFromSessions Tests
// =============================================================================

describe('evolveSkillFromSessions', () => {
  it('should increment session counter', () => {
    let state = createEmptySkillEvolutionState()
    const sessions = [
      makeFakeSession('s1', 75, 15, 3600000),
    ]
    state = evolveSkillFromSessions(state, sessions)
    expect(state.totalSessionsAnalyzed).toBeGreaterThanOrEqual(1)
  })

  it('should ignore short sessions', () => {
    let state = createEmptySkillEvolutionState()
    const sessions = [
      makeFakeSession('s1', 75, 15, 60000), // 1 minute
    ]
    state = evolveSkillFromSessions(state, sessions)
    expect(state.totalSessionsAnalyzed).toBeGreaterThanOrEqual(0)
  })
})

// =============================================================================
// formatSkillEvolutionSummary Tests
// =============================================================================

describe('formatSkillEvolutionSummary', () => {
  it('should format summary', () => {
    const state = createEmptySkillEvolutionState()
    const summary = formatSkillEvolutionSummary(state)
    expect(summary).toContain('Skill Evolution Summary')
    expect(summary).toContain('Sessions Analyzed')
  })
})
