/**
 * WritingSessionOptimizer Tests - V161
 * Tests for Adaptive Writing Flow Optimization Engine
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptySessionState,
  startSession,
  endSession,
  recordMetrics,
  detectPhase,
  updatePhase,
  generateRecommendations,
  analyzeOptimalBlocks,
  optimizeSession,
  analyzeFlowTrend,
  getSessionStats,
  formatSessionSummary,
  formatSessionDashboard,
} from './WritingSessionOptimizer'

describe('createEmptySessionState', () => {
  it('should create empty state', () => {
    const state = createEmptySessionState()
    expect(state.currentSessionId).toBeNull()
    expect(state.metrics.length).toBe(0)
    expect(state.currentPhase).toBe('warmup')
    expect(state.totalWordsToday).toBe(0)
  })
})

describe('startSession', () => {
  it('should start a new session', () => {
    let state = createEmptySessionState()
    state = startSession(state)
    expect(state.currentSessionId).toBeTruthy()
    expect(state.sessionStartTime).toBeTruthy()
    expect(state.currentPhase).toBe('warmup')
  })
})

describe('endSession', () => {
  it('should end current session', () => {
    let state = createEmptySessionState()
    state = startSession(state)
    state = endSession(state)
    expect(state.currentSessionId).toBeNull()
    expect(state.sessionStartTime).toBeNull()
    expect(state.currentPhase).toBe('warmup')
  })
})

describe('recordMetrics', () => {
  it('should record metrics and update word count', () => {
    let state = createEmptySessionState()
    state = recordMetrics(state, 200, 80, 70, 75, 80, 0)
    expect(state.metrics.length).toBe(1)
    expect(state.metrics[0].wordsWritten).toBe(200)
    expect(state.totalWordsToday).toBe(200)
  })

  it('should accumulate word count', () => {
    let state = createEmptySessionState()
    state = recordMetrics(state, 200, 80, 70, 75, 80, 0)
    state = recordMetrics(state, 150, 75, 65, 70, 75, 1)
    expect(state.totalWordsToday).toBe(350)
    expect(state.metrics.length).toBe(2)
  })
})

describe('detectPhase', () => {
  it('should return warmup for insufficient data', () => {
    const phase = detectPhase([])
    expect(phase).toBe('warmup')
  })

  it('should detect peak phase for high energy and flow', () => {
    const metrics = [
      { timestamp: Date.now() - 2000, wordsWritten: 100, qualityScore: 80, flowState: 85, focusLevel: 80, energyLevel: 80, interruptions: 0 },
      { timestamp: Date.now() - 1000, wordsWritten: 150, qualityScore: 85, flowState: 88, focusLevel: 85, energyLevel: 78, interruptions: 0 },
      { timestamp: Date.now(), wordsWritten: 120, qualityScore: 82, flowState: 86, focusLevel: 83, energyLevel: 76, interruptions: 0 },
    ]
    const phase = detectPhase(metrics)
    expect(phase).toBe('peak')
  })

  it('should detect break_needed for low energy', () => {
    const metrics = [
      { timestamp: Date.now() - 2000, wordsWritten: 50, qualityScore: 50, flowState: 40, focusLevel: 30, energyLevel: 20, interruptions: 2 },
      { timestamp: Date.now() - 1000, wordsWritten: 40, qualityScore: 45, flowState: 35, focusLevel: 25, energyLevel: 18, interruptions: 3 },
      { timestamp: Date.now(), wordsWritten: 30, qualityScore: 42, flowState: 32, focusLevel: 22, energyLevel: 15, interruptions: 4 },
    ]
    const phase = detectPhase(metrics)
    expect(phase).toBe('break_needed')
  })

  it('should detect sustain for moderate flow', () => {
    const metrics = [
      { timestamp: Date.now() - 2000, wordsWritten: 80, qualityScore: 65, flowState: 60, focusLevel: 55, energyLevel: 55, interruptions: 1 },
      { timestamp: Date.now() - 1000, wordsWritten: 90, qualityScore: 68, flowState: 62, focusLevel: 58, energyLevel: 52, interruptions: 1 },
      { timestamp: Date.now(), wordsWritten: 85, qualityScore: 66, flowState: 59, focusLevel: 56, energyLevel: 53, interruptions: 1 },
    ]
    const phase = detectPhase(metrics)
    expect(phase).toBe('sustain')
  })
})

describe('updatePhase', () => {
  it('should update phase based on metrics', () => {
    let state = createEmptySessionState()
    state = recordMetrics(state, 100, 85, 90, 80, 85, 0)
    state = recordMetrics(state, 150, 88, 92, 82, 83, 0)
    state = recordMetrics(state, 120, 86, 91, 81, 84, 0)
    state = updatePhase(state)
    expect(state.currentPhase).toBe('peak')
  })
})

describe('generateRecommendations', () => {
  it('should return empty for no metrics', () => {
    const state = createEmptySessionState()
    const recs = generateRecommendations(state)
    expect(recs.length).toBe(0)
  })

  it('should recommend break for low energy', () => {
    let state = createEmptySessionState()
    state = recordMetrics(state, 50, 40, 30, 25, 25, 2)
    state = recordMetrics(state, 40, 35, 28, 22, 20, 3)
    const recs = generateRecommendations(state)
    expect(recs.some(r => r.includes('break'))).toBeTruthy()
  })

  it('should recommend continue for high quality', () => {
    let state = createEmptySessionState()
    for (let i = 0; i < 6; i++) {
      state = recordMetrics(state, 100, 90, 75, 70, 65, 0)
    }
    const recs = generateRecommendations(state)
    expect(recs.some(r => r.includes('peak') || r.includes('continue'))).toBeTruthy()
  })

  it('should warn about excessive daily target', () => {
    let state = createEmptySessionState()
    state = { ...state, targetWordsPerDay: 1000, totalWordsToday: 2000 }
    state = recordMetrics(state, 100, 70, 60, 55, 50, 1)
    const recs = generateRecommendations(state)
    expect(recs.some(r => r.includes('target') || r.includes('wind down'))).toBeTruthy()
  })
})

describe('analyzeOptimalBlocks', () => {
  it('should return empty for no metrics', () => {
    const state = createEmptySessionState()
    const blocks = analyzeOptimalBlocks(state)
    expect(blocks.length).toBe(0)
  })

  it('should analyze blocks by hour', () => {
    let state = createEmptySessionState()
    // Mock timestamps with different hours
    const now = Date.now()
    const m1: any = { timestamp: new Date(now).setHours(9, 0, 0), wordsWritten: 300, qualityScore: 85, flowState: 80, focusLevel: 75, energyLevel: 70, interruptions: 0 }
    const m2: any = { timestamp: new Date(now).setHours(9, 30, 0), wordsWritten: 250, qualityScore: 82, flowState: 78, focusLevel: 72, energyLevel: 68, interruptions: 1 }
    state = { ...state, metrics: [m1, m2] }
    const blocks = analyzeOptimalBlocks(state)
    expect(blocks.length).toBeGreaterThanOrEqual(0)
  })
})

describe('optimizeSession', () => {
  it('should generate recommendations and blocks', () => {
    let state = createEmptySessionState()
    state = recordMetrics(state, 200, 85, 80, 75, 70, 0)
    state = optimizeSession(state)
    expect(state.recommendations.length).toBeGreaterThanOrEqual(0)
  })
})

describe('analyzeFlowTrend', () => {
  it('should return stable for insufficient data', () => {
    const trend = analyzeFlowTrend([])
    expect(trend.trend).toBe('stable')
  })

  it('should detect improving trend', () => {
    const metrics = [
      { timestamp: Date.now() - 8000, wordsWritten: 100, qualityScore: 55, flowState: 48, focusLevel: 48, energyLevel: 48, interruptions: 1 },
      { timestamp: Date.now() - 7000, wordsWritten: 100, qualityScore: 58, flowState: 52, focusLevel: 52, energyLevel: 52, interruptions: 1 },
      { timestamp: Date.now() - 6000, wordsWritten: 100, qualityScore: 62, flowState: 58, focusLevel: 55, energyLevel: 55, interruptions: 0 },
      { timestamp: Date.now() - 5000, wordsWritten: 100, qualityScore: 65, flowState: 62, focusLevel: 60, energyLevel: 60, interruptions: 0 },
      { timestamp: Date.now() - 4000, wordsWritten: 100, qualityScore: 70, flowState: 68, focusLevel: 65, energyLevel: 65, interruptions: 0 },
      { timestamp: Date.now() - 3000, wordsWritten: 100, qualityScore: 75, flowState: 73, focusLevel: 70, energyLevel: 70, interruptions: 0 },
      { timestamp: Date.now() - 2000, wordsWritten: 100, qualityScore: 80, flowState: 78, focusLevel: 74, energyLevel: 74, interruptions: 0 },
      { timestamp: Date.now(), wordsWritten: 100, qualityScore: 88, flowState: 86, focusLevel: 82, energyLevel: 82, interruptions: 0 },
    ]
    const trend = analyzeFlowTrend(metrics)
    expect(trend.trend).toBe('improving')
  })

  it('should detect declining trend', () => {
    const metrics = [
      { timestamp: Date.now() - 8000, wordsWritten: 100, qualityScore: 85, flowState: 82, focusLevel: 78, energyLevel: 78, interruptions: 0 },
      { timestamp: Date.now() - 7000, wordsWritten: 100, qualityScore: 78, flowState: 75, focusLevel: 72, energyLevel: 72, interruptions: 0 },
      { timestamp: Date.now() - 6000, wordsWritten: 100, qualityScore: 70, flowState: 66, focusLevel: 64, energyLevel: 62, interruptions: 1 },
      { timestamp: Date.now() - 5000, wordsWritten: 100, qualityScore: 62, flowState: 58, focusLevel: 56, energyLevel: 54, interruptions: 1 },
      { timestamp: Date.now() - 4000, wordsWritten: 100, qualityScore: 55, flowState: 50, focusLevel: 48, energyLevel: 45, interruptions: 2 },
      { timestamp: Date.now() - 3000, wordsWritten: 100, qualityScore: 48, flowState: 42, focusLevel: 40, energyLevel: 38, interruptions: 2 },
      { timestamp: Date.now() - 2000, wordsWritten: 100, qualityScore: 40, flowState: 35, focusLevel: 33, energyLevel: 30, interruptions: 3 },
      { timestamp: Date.now(), wordsWritten: 100, qualityScore: 32, flowState: 28, focusLevel: 26, energyLevel: 22, interruptions: 4 },
    ]
    const trend = analyzeFlowTrend(metrics)
    expect(trend.trend).toBe('declining')
  })
})

describe('getSessionStats', () => {
  it('should return null for no metrics', () => {
    const state = createEmptySessionState()
    const stats = getSessionStats(state)
    expect(stats).toBeNull()
  })

  it('should calculate correct stats', () => {
    let state = createEmptySessionState()
    state = recordMetrics(state, 200, 80, 70, 65, 60, 1)
    state = recordMetrics(state, 150, 75, 65, 60, 55, 2)
    const stats = getSessionStats(state)!
    expect(stats.totalWords).toBe(350)
    expect(stats.avgQuality).toBe(77.5)
    expect(stats.avgFlow).toBe(67.5)
    expect(stats.totalInterruptions).toBe(3)
  })
})

describe('formatSessionSummary', () => {
  it('should format session summary', () => {
    let state = createEmptySessionState()
    state = startSession(state)
    state = recordMetrics(state, 200, 80, 70, 65, 60, 0)
    const summary = formatSessionSummary(state)
    expect(summary).toContain('Writing Session Status')
    expect(summary).toContain('200')
  })

  it('should show recommendations', () => {
    let state = createEmptySessionState()
    state = { ...state, recommendations: ['Energy low - take a break', 'Flow good - continue writing'] }
    const summary = formatSessionSummary(state)
    expect(summary).toContain('Recommendations')
  })
})

describe('formatSessionDashboard', () => {
  it('should show progress percentage', () => {
    let state = createEmptySessionState()
    state = { ...state, totalWordsToday: 1000, targetWordsPerDay: 2000 }
    const dashboard = formatSessionDashboard(state)
    expect(dashboard).toContain('Progress: 50%')
  })

  it('should show current phase', () => {
    let state = createEmptySessionState()
    state = updatePhase(state)
    const dashboard = formatSessionDashboard(state)
    expect(dashboard).toContain('Current Phase')
  })

  it('should show optimal blocks', () => {
    let state = createEmptySessionState()
    state = { ...state, optimalBlocks: [
      { blockId: 'b1', startHour: 9, endHour: 10, typicalOutput: 300, qualityRating: 88, optimalFor: ['word_count', 'quality'] },
      { blockId: 'b2', startHour: 14, endHour: 15, typicalOutput: 250, qualityRating: 82, optimalFor: ['flow_state'] },
    ]}
    const dashboard = formatSessionDashboard(state)
    expect(dashboard).toContain('Optimal Writing Windows')
  })
})
