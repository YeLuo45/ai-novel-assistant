/**
 * AutonomousPlanOptimizer Tests - V149
 * Tests for Adaptive Writing Strategy Optimization Engine
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyOptimizerState,
  registerStrategy,
  updateStrategyEffectiveness,
  setActiveStrategy,
  assignStrategyToChapter,
  recommendStrategy,
  recordPerformance,
  computeVelocityTrend,
  findPerformanceIssue,
  triggerStrategyAdaptation,
  formatStrategyComparison,
  formatOptimizerDashboard,
} from './AutonomousPlanOptimizer'

// =============================================================================
// createEmptyOptimizerState Tests
// =============================================================================

describe('createEmptyOptimizerState', () => {
  it('should create empty state', () => {
    const state = createEmptyOptimizerState()
    expect(state.strategies.size).toBe(0)
    expect(state.performanceHistory.length).toBe(0)
    expect(state.activeStrategyId).toBeNull()
    expect(state.sessionCount).toBe(0)
  })

  it('should have zero totals', () => {
    const state = createEmptyOptimizerState()
    expect(state.totalWordsWritten).toBe(0)
    expect(state.averageWordVelocity).toBe(0)
    expect(state.adaptationCount).toBe(0)
  })
})

// =============================================================================
// Strategy Management Tests
// =============================================================================

describe('registerStrategy', () => {
  it('should register a writing strategy', () => {
    let state = createEmptyOptimizerState()
    const result = registerStrategy(state, 'brainstorm_first', 'Brainstorm First', 'Explore before writing', ['exploration', 'plotting'], 300, ['fantasy'])
    expect(result.strategyId).toContain('strat_')
    expect(result.state.strategies.size).toBe(1)
  })

  it('should set strategy properties', () => {
    let state = createEmptyOptimizerState()
    const result = registerStrategy(state, 'outline_draft', 'Outline Draft', 'Plan thoroughly', ['planning'], 250, ['scifi'])
    const strat = result.state.strategies.get(result.strategyId)
    expect(strat?.type).toBe('outline_draft')
    expect(strat?.name).toBe('Outline Draft')
    expect(strat?.currentEffectiveness).toBe(50)
  })
})

describe('updateStrategyEffectiveness', () => {
  it('should update strategy effectiveness', () => {
    let state = createEmptyOptimizerState()
    const r1 = registerStrategy(state, 'fast_draft', 'Fast Draft', 'Write fast', ['speed'], 400, ['action'])
    state = r1.state
    state = updateStrategyEffectiveness(state, r1.strategyId, 5, 75)
    
    const strat = state.strategies.get(r1.strategyId)
    expect(strat?.currentEffectiveness).toBe(75)
    expect(strat?.effectivenessHistory.length).toBe(1)
  })

  it('should cap history at 20 entries', () => {
    let state = createEmptyOptimizerState()
    const r1 = registerStrategy(state, 'layered_writing', 'Layered', 'Multi-pass', ['quality'], 200, ['literary'])
    state = r1.state
    
    for (let i = 1; i <= 25; i++) {
      state = updateStrategyEffectiveness(state, r1.strategyId, i, 50 + i)
    }
    
    const strat = state.strategies.get(r1.strategyId)
    expect(strat?.effectivenessHistory.length).toBe(20)
    expect(strat?.effectivenessHistory[19].score).toBe(75)  // last entry
  })
})

describe('setActiveStrategy', () => {
  it('should set active strategy', () => {
    let state = createEmptyOptimizerState()
    const r1 = registerStrategy(state, 'brainstorm_first', 'Brainstorm', 'Desc', [], 300, ['any'])
    state = r1.state
    state = setActiveStrategy(state, r1.strategyId)
    
    expect(state.activeStrategyId).toBe(r1.strategyId)
  })

  it('should ignore invalid strategy id', () => {
    const state = createEmptyOptimizerState()
    const result = setActiveStrategy(state, 'nonexistent')
    expect(result).toBe(state)
  })
})

describe('assignStrategyToChapter', () => {
  it('should assign strategy to chapter', () => {
    let state = createEmptyOptimizerState()
    const r1 = registerStrategy(state, 'outline_draft', 'Outline', 'Desc', [], 250, ['any'])
    state = r1.state
    state = assignStrategyToChapter(state, 3, r1.strategyId)
    
    expect(state.chapterStrategyMap.get(3)).toBe(r1.strategyId)
  })
})

describe('recommendStrategy', () => {
  it('should recommend strategy for genre and chapter', () => {
    let state = createEmptyOptimizerState()
    const r1 = registerStrategy(state, 'outline_draft', 'Outline', 'Desc', [], 250, ['fantasy'])
    state = r1.state
    
    const recommended = recommendStrategy(state, 5, 'fantasy', 200)
    expect(recommended).toBe(r1.strategyId)
  })

  it('should fallback to highest effectiveness', () => {
    let state = createEmptyOptimizerState()
    const r1 = registerStrategy(state, 'fast_draft', 'Fast', 'Desc', [], 400, ['action'])
    state = r1.state
    state = updateStrategyEffectiveness(state, r1.strategyId, 1, 90)
    
    const r2 = registerStrategy(state, 'brainstorm_first', 'Brainstorm', 'Desc', [], 300, ['drama'])
    state = r2.state
    state = updateStrategyEffectiveness(state, r2.strategyId, 2, 60)
    
    const recommended = recommendStrategy(state, 10, 'unknown_genre', 200)
    expect(recommended).toBe(r1.strategyId)  // higher effectiveness
  })
})

// =============================================================================
// Performance Tracking Tests
// =============================================================================

describe('recordPerformance', () => {
  it('should record performance snapshot', () => {
    let state = createEmptyOptimizerState()
    state = recordPerformance(state, 500, 80, 75, 2, 60)
    
    expect(state.sessionCount).toBe(1)
    expect(state.totalWordsWritten).toBe(500)
    expect(state.performanceHistory.length).toBe(1)
    expect(state.performanceHistory[0].wordVelocity).toBeCloseTo(500, 2)  // 500w / 60min * 60 = 500
  })

  it('should update session word counts', () => {
    let state = createEmptyOptimizerState()
    state = recordPerformance(state, 300, 70, 60, 1, 30)
    state = recordPerformance(state, 450, 75, 70, 2, 45)
    
    expect(state.sessionWordCounts.length).toBe(2)
    expect(state.sessionWordCounts[1]).toBe(450)
  })

  it('should compute average word velocity', () => {
    let state = createEmptyOptimizerState()
    state = recordPerformance(state, 600, 80, 75, 2, 60)  // 600 w/h
    state = recordPerformance(state, 400, 70, 65, 1, 40)  // 600 w/h
    
    expect(state.averageWordVelocity).toBe(500)  // (600+400)/2
  })
})

describe('computeVelocityTrend', () => {
  it('should return stable with insufficient data', () => {
    let state = createEmptyOptimizerState()
    state = recordPerformance(state, 300, 70, 60, 1, 30)
    state = recordPerformance(state, 350, 75, 65, 1, 35)
    
    const trend = computeVelocityTrend(state)
    expect(trend).toBe('stable')
  })

  it('should detect improving trend', () => {
    let state = createEmptyOptimizerState()
    for (let i = 0; i < 6; i++) {
      state = recordPerformance(state, 200 + i * 50, 70, 60, 1, 30)  // increasing
    }
    
    const trend = computeVelocityTrend(state)
    expect(trend).toBe('improving')
  })

  it('should detect declining trend', () => {
    let state = createEmptyOptimizerState()
    for (let i = 0; i < 6; i++) {
      state = recordPerformance(state, 500 - i * 50, 70, 60, 1, 30)  // decreasing
    }
    
    const trend = computeVelocityTrend(state)
    expect(trend).toBe('declining')
  })
})

describe('findPerformanceIssue', () => {
  it('should detect low velocity', () => {
    let state = createEmptyOptimizerState()
    for (let i = 0; i < 3; i++) {
      state = recordPerformance(state, 150, 70, 60, 1, 30)
    }
    
    const issue = findPerformanceIssue(state)
    expect(issue).toBe('low_velocity')
  })

  it('should detect low flow', () => {
    let state = createEmptyOptimizerState()
    // Use varied word counts to avoid stall_pattern (which fires before low_flow check)
    const words = [300, 450, 380]  // variance > 10, so no stall
    const flows = [20, 22, 18]  // all low, average < 30
    for (let i = 0; i < 3; i++) {
      state = recordPerformance(state, words[i], 70, flows[i], 1, 30)
    }
    
    const issue = findPerformanceIssue(state)
    expect(issue).toBe('low_flow')
  })

  it('should return null when performance is fine', () => {
    let state = createEmptyOptimizerState()
    // Use varied word counts AND high flow to avoid both triggers
    const words = [300, 450, 550]  // high variance, no stall
    const flows = [70, 75, 80]  // all high, no low_flow
    for (let i = 0; i < 3; i++) {
      state = recordPerformance(state, words[i], 80, flows[i], 2, 40)
    }
    
    const issue = findPerformanceIssue(state)
    expect(issue).toBeNull()
  })
})

// =============================================================================
// Strategy Adaptation Tests
// =============================================================================

describe('triggerStrategyAdaptation', () => {
  it('should switch to fast_draft on low velocity', () => {
    let state = createEmptyOptimizerState()
    const r1 = registerStrategy(state, 'outline_draft', 'Outline', 'Desc', [], 250, ['any'])
    state = r1.state
    state = setActiveStrategy(state, r1.strategyId)
    
    const r2 = registerStrategy(state, 'fast_draft', 'Fast Draft', 'Desc', [], 400, ['any'])
    state = r2.state
    
    state = triggerStrategyAdaptation(state, 'low_velocity')
    
    expect(state.activeStrategyId).toBe(r2.strategyId)
    expect(state.adaptationCount).toBe(1)
  })

  it('should reduce old strategy effectiveness', () => {
    let state = createEmptyOptimizerState()
    const r1 = registerStrategy(state, 'brainstorm_first', 'Brainstorm', 'Desc', [], 300, ['any'])
    state = r1.state
    state = setActiveStrategy(state, r1.strategyId)
    state = updateStrategyEffectiveness(state, r1.strategyId, 1, 70)
    
    const r2 = registerStrategy(state, 'fast_draft', 'Fast', 'Desc', [], 400, ['any'])
    state = r2.state
    
    state = triggerStrategyAdaptation(state, 'low_velocity')
    
    const oldStrat = state.strategies.get(r1.strategyId)
    expect(oldStrat?.currentEffectiveness).toBe(55)  // 70 - 15
  })

  it('should increase new strategy effectiveness', () => {
    let state = createEmptyOptimizerState()
    const r1 = registerStrategy(state, 'outline_draft', 'Outline', 'Desc', [], 250, ['any'])
    state = r1.state
    state = setActiveStrategy(state, r1.strategyId)
    
    const r2 = registerStrategy(state, 'fast_draft', 'Fast Draft', 'Desc', [], 400, ['any'])
    state = r2.state
    state = updateStrategyEffectiveness(state, r2.strategyId, 1, 50)
    
    state = triggerStrategyAdaptation(state, 'low_velocity')
    
    const newStrat = state.strategies.get(r2.strategyId)
    expect(newStrat?.currentEffectiveness).toBe(60)  // 50 + 10
  })

  it('should do nothing with no alternative strategies', () => {
    let state = createEmptyOptimizerState()
    const r1 = registerStrategy(state, 'brainstorm_first', 'Brainstorm', 'Desc', [], 300, ['any'])
    state = r1.state
    state = setActiveStrategy(state, r1.strategyId)
    
    state = triggerStrategyAdaptation(state, 'low_velocity')
    
    expect(state.activeStrategyId).toBe(r1.strategyId)
    expect(state.adaptationCount).toBe(0)
  })
})

// =============================================================================
// Formatting Tests
// =============================================================================

describe('formatStrategyComparison', () => {
  it('should show all strategies', () => {
    let state = createEmptyOptimizerState()
    const r1 = registerStrategy(state, 'outline_draft', 'Outline Draft', 'Desc', [], 250, ['fantasy'])
    state = r1.state
    
    const output = formatStrategyComparison(state)
    expect(output).toContain('Outline Draft')
    expect(output).toContain('outline_draft')
  })

  it('should mark active strategy', () => {
    let state = createEmptyOptimizerState()
    const r1 = registerStrategy(state, 'brainstorm_first', 'Brainstorm', 'Desc', [], 300, ['any'])
    state = r1.state
    state = setActiveStrategy(state, r1.strategyId)
    
    const output = formatStrategyComparison(state)
    expect(output).toContain('[ACTIVE]')
  })
})

describe('formatOptimizerDashboard', () => {
  it('should show session stats', () => {
    let state = createEmptyOptimizerState()
    state = recordPerformance(state, 500, 80, 75, 2, 60)
    
    const dashboard = formatOptimizerDashboard(state)
    expect(dashboard).toContain('Sessions: 1')
    expect(dashboard).toContain('Total Words: 500')
  })

  it('should show velocity trend', () => {
    let state = createEmptyOptimizerState()
    for (let i = 0; i < 6; i++) {
      state = recordPerformance(state, 300 + i * 30, 75, 65, 1, 30)
    }
    
    const dashboard = formatOptimizerDashboard(state)
    expect(dashboard).toContain('Performance Trend')
  })

  it('should show performance alert', () => {
    let state = createEmptyOptimizerState()
    for (let i = 0; i < 3; i++) {
      state = recordPerformance(state, 100, 70, 20, 1, 30)
    }
    
    const dashboard = formatOptimizerDashboard(state)
    expect(dashboard).toContain('Performance Alert')
    expect(dashboard).toContain('low_velocity')
  })

  it('should show active strategy info', () => {
    let state = createEmptyOptimizerState()
    const r1 = registerStrategy(state, 'fast_draft', 'Fast Draft', 'Desc', [], 400, ['action'])
    state = r1.state
    state = setActiveStrategy(state, r1.strategyId)
    
    const dashboard = formatOptimizerDashboard(state)
    expect(dashboard).toContain('Active Strategy: Fast Draft')
  })
})
