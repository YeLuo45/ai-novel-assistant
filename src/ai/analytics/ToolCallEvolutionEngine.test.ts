/**
 * ToolCallEvolutionEngine Tests - V111
 * Tests for Tool Usage Analytics and Evolution Tracking Engine
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyToolEvolutionState,
  recordToolCall,
  calculateEfficiencyScore,
  detectToolSequencePatterns,
  predictNextTool,
  getToolEfficiencyReport,
  analyzeToolEvolution,
  analyzeSessionToolUsage,
  formatToolEvolutionSummary,
  DEFAULT_TOOL_EVOLUTION_CONFIG,
} from './ToolCallEvolutionEngine'

// =============================================================================
// createEmptyToolEvolutionState Tests
// =============================================================================

describe('createEmptyToolEvolutionState', () => {
  it('should create empty state', () => {
    const state = createEmptyToolEvolutionState()
    expect(state.usageRecords).toEqual([])
    expect(state.totalToolsUsed).toBe(0)
    expect(state.mostUsedTool).toBeNull()
  })
})

// =============================================================================
// recordToolCall Tests
// =============================================================================

describe('recordToolCall', () => {
  it('should record a tool call', () => {
    let state = createEmptyToolEvolutionState()
    state = recordToolCall(state, 'tool1', 'Tool One', 'sess1', 100, true, 50, 100)
    expect(state.usageRecords.length).toBe(1)
    expect(state.totalToolsUsed).toBe(1)
  })

  it('should update efficiency score', () => {
    let state = createEmptyToolEvolutionState()
    state = recordToolCall(state, 'tool1', 'Tool One', 'sess1', 100, true, 50, 100)
    const efficiency = state.efficiencyScores.get('tool1')
    expect(efficiency).toBeDefined()
    expect(efficiency!.totalCalls).toBe(1)
    expect(efficiency!.successRate).toBe(1)
  })

  it('should track multiple calls to same tool', () => {
    let state = createEmptyToolEvolutionState()
    state = recordToolCall(state, 'tool1', 'Tool One', 'sess1', 100, true, 50, 100)
    state = recordToolCall(state, 'tool1', 'Tool One', 'sess2', 150, true, 60, 120)
    const efficiency = state.efficiencyScores.get('tool1')
    expect(efficiency!.totalCalls).toBe(2)
    expect(efficiency!.averageDuration).toBe(125) // (100+150)/2
  })

  it('should set most used tool', () => {
    let state = createEmptyToolEvolutionState()
    state = recordToolCall(state, 'tool1', 'Tool One', 'sess1', 100, true, 50, 100)
    state = recordToolCall(state, 'tool2', 'Tool Two', 'sess2', 100, true, 50, 100)
    state = recordToolCall(state, 'tool1', 'Tool One', 'sess3', 100, true, 50, 100)
    expect(state.mostUsedTool).toBe('tool1')
  })
})

// =============================================================================
// calculateEfficiencyScore Tests
// =============================================================================

describe('calculateEfficiencyScore', () => {
  it('should return score between 0-100', () => {
    const score = calculateEfficiencyScore(0.9, 200, 200)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('should weight success rate heavily', () => {
    const scoreHighSuccess = calculateEfficiencyScore(1.0, 200, 200)
    const scoreLowSuccess = calculateEfficiencyScore(0.5, 200, 200)
    expect(scoreHighSuccess).toBeGreaterThan(scoreLowSuccess)
  })

  it('should penalize slow tools', () => {
    const scoreFast = calculateEfficiencyScore(0.9, 100, 200)
    const scoreSlow = calculateEfficiencyScore(0.9, 2000, 200)
    expect(scoreFast).toBeGreaterThan(scoreSlow)
  })
})

// =============================================================================
// detectToolSequencePatterns Tests
// =============================================================================

describe('detectToolSequencePatterns', () => {
  it('should return empty for insufficient records', () => {
    let state = createEmptyToolEvolutionState()
    state = recordToolCall(state, 'tool1', 'Tool One', 'sess1', 100, true, 50, 100)
    const patterns = detectToolSequencePatterns(state)
    expect(patterns).toEqual([])
  })

  it('should detect 2-tool sequence pattern', () => {
    let state = createEmptyToolEvolutionState()
    // Record same sequence in multiple sessions
    state = recordToolCall(state, 'tool1', 'Tool One', 'sess1', 100, true, 50, 100)
    state = recordToolCall(state, 'tool2', 'Tool Two', 'sess1', 100, true, 50, 100)
    state = recordToolCall(state, 'tool1', 'Tool One', 'sess2', 100, true, 50, 100)
    state = recordToolCall(state, 'tool2', 'Tool Two', 'sess2', 100, true, 50, 100)
    state = recordToolCall(state, 'tool1', 'Tool One', 'sess3', 100, true, 50, 100)
    state = recordToolCall(state, 'tool2', 'Tool Two', 'sess3', 100, true, 50, 100)

    const patterns = detectToolSequencePatterns(state)
    const twoToolPattern = patterns.find(p => p.toolSequence.length === 2)
    expect(twoToolPattern).toBeDefined()
  })
})

// =============================================================================
// predictNextTool Tests
// =============================================================================

describe('predictNextTool', () => {
  it('should return empty predictions for new state', () => {
    const state = createEmptyToolEvolutionState()
    const predictions = predictNextTool(state, 'test', [])
    expect(predictions).toEqual([])
  })
})

// =============================================================================
// getToolEfficiencyReport Tests
// =============================================================================

describe('getToolEfficiencyReport', () => {
  it('should return report for empty state', () => {
    const state = createEmptyToolEvolutionState()
    const report = getToolEfficiencyReport(state)
    expect(report.totalCalls).toBe(0)
    expect(report.uniqueTools).toBe(0)
  })

  it('should include top tools', () => {
    let state = createEmptyToolEvolutionState()
    state = recordToolCall(state, 'tool1', 'Tool One', 'sess1', 100, true, 50, 100)
    state = recordToolCall(state, 'tool2', 'Tool Two', 'sess1', 100, true, 50, 100)

    const report = getToolEfficiencyReport(state)
    expect(report.uniqueTools).toBe(2)
    expect(report.topTools.length).toBeGreaterThan(0)
  })
})

// =============================================================================
// analyzeToolEvolution Tests
// =============================================================================

describe('analyzeToolEvolution', () => {
  it('should return empty arrays for fresh state', () => {
    const state = createEmptyToolEvolutionState()
    const result = analyzeToolEvolution(state)
    expect(result.improvingTools).toEqual([])
    expect(result.degradingTools).toEqual([])
  })
})

// =============================================================================
// analyzeSessionToolUsage Tests
// =============================================================================

describe('analyzeSessionToolUsage', () => {
  it('should return zeros for unknown session', () => {
    const state = createEmptyToolEvolutionState()
    const result = analyzeSessionToolUsage(state, {
      id: 'unknown',
      currentQualityScore: 70,
      rollingQualityScores: [60, 70],
      startTime: Date.now() - 3600000,
      lastUpdateTime: Date.now(),
      totalToolCalls: 0,
      totalWordsGenerated: 100,
      activeContext: { currentChapter: 1, activeCharacters: [], recentToolCalls: [] },
    } as any)
    expect(result.toolCount).toBe(0)
    expect(result.uniqueTools).toBe(0)
  })
})

// =============================================================================
// formatToolEvolutionSummary Tests
// =============================================================================

describe('formatToolEvolutionSummary', () => {
  it('should format summary', () => {
    const state = createEmptyToolEvolutionState()
    const summary = formatToolEvolutionSummary(state)
    expect(summary).toContain('Tool Evolution Summary')
  })
})