/**
 * EvolutionOrchestrationSuite Tests - V117
 * Tests for Unified Evolution Orchestration Suite
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyOrchestrationState,
  createEmptyEvolutionMetrics,
  calculateHealthScore,
  getHealthStatus,
  getHealthRecommendations,
  getCriticalIssues,
  advancePhase,
  runOrchestrationCycle,
  formatOrchestrationSummary,
  formatEvolutionMetrics,
  formatFullDashboard,
  DEFAULT_ORCHESTRATION_CONFIG,
} from './EvolutionOrchestrationSuite'

// =============================================================================
// createEmptyOrchestrationState Tests
// =============================================================================

describe('createEmptyOrchestrationState', () => {
  it('should create empty state', () => {
    const state = createEmptyOrchestrationState()
    expect(state.phase).toBe('session_start')
    expect(state.orchestrationCount).toBe(0)
    expect(state.healthScore).toBe(50)
    expect(state.recommendations).toEqual([])
    expect(state.criticalIssues).toEqual([])
  })
})

// =============================================================================
// createEmptyEvolutionMetrics Tests
// =============================================================================

describe('createEmptyEvolutionMetrics', () => {
  it('should create empty metrics', () => {
    const metrics = createEmptyEvolutionMetrics()
    expect(metrics.cyclesCompleted).toBe(0)
    expect(metrics.patternsEvolved).toBe(0)
    expect(metrics.skillsTracked).toBe(0)
    expect(metrics.qualityAverage).toBe(0)
    expect(metrics.toolCallsTotal).toBe(0)
    expect(metrics.hooksRegistered).toBe(0)
  })
})

// =============================================================================
// calculateHealthScore Tests
// =============================================================================

describe('calculateHealthScore', () => {
  it('should return 0 for all zeros', () => {
    const score = calculateHealthScore(0, 0, 0, 0)
    expect(score).toBe(0)
  })

  it('should return 100 for perfect scores', () => {
    const score = calculateHealthScore(100, 10, 200, 20)
    expect(score).toBe(100)
  })

  it('should weight components correctly', () => {
    const score = calculateHealthScore(75, 5, 100, 10)
    expect(score).toBeLessThanOrEqual(100)
    expect(score).toBeGreaterThan(0)
  })

  it('should handle edge cases', () => {
    const score = calculateHealthScore(50, 3, 50, 5)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})

// =============================================================================
// getHealthStatus Tests
// =============================================================================

describe('getHealthStatus', () => {
  it('should return healthy for score >= 70', () => {
    const status = getHealthStatus(70)
    expect(status.status).toBe('healthy')
    expect(status.emoji).toBe('🟢')
  })

  it('should return moderate for score >= 50', () => {
    const status = getHealthStatus(50)
    expect(status.status).toBe('moderate')
    expect(status.emoji).toBe('🟡')
  })

  it('should return needs_attention for score >= 30', () => {
    const status = getHealthStatus(30)
    expect(status.status).toBe('needs_attention')
    expect(status.emoji).toBe('🟠')
  })

  it('should return critical for score < 30', () => {
    const status = getHealthStatus(29)
    expect(status.status).toBe('critical')
    expect(status.emoji).toBe('🔴')
  })
})

// =============================================================================
// getHealthRecommendations Tests
// =============================================================================

describe('getHealthRecommendations', () => {
  it('should recommend evolution for low health', () => {
    const recs = getHealthRecommendations(40, 50)
    expect(recs.some(r => r.includes('evolution'))).toBe(true)
  })

  it('should recommend quality focus for low quality', () => {
    const recs = getHealthRecommendations(60, 50)
    expect(recs.some(r => r.includes('quality'))).toBe(true)
  })

  it('should show positive message for high health', () => {
    const recs = getHealthRecommendations(80, 80)
    expect(recs.some(r => r.includes('performing well'))).toBe(true)
  })
})

// =============================================================================
// getCriticalIssues Tests
// =============================================================================

describe('getCriticalIssues', () => {
  it('should return critical issue for very low health', () => {
    const issues = getCriticalIssues(20, 50)
    expect(issues.some(i => i.includes('critical'))).toBe(true)
  })

  it('should return issue for very low quality', () => {
    const issues = getCriticalIssues(50, 30)
    expect(issues.some(i => i.includes('Quality'))).toBe(true)
  })

  it('should return empty for good scores', () => {
    const issues = getCriticalIssues(70, 70)
    expect(issues.length).toBe(0)
  })
})

// =============================================================================
// advancePhase Tests
// =============================================================================

describe('advancePhase', () => {
  it('should advance to next phase', () => {
    const state = createEmptyOrchestrationState()
    const newState = advancePhase(state, 'session_update')
    expect(newState.phase).toBe('session_update')
  })

  it('should increment orchestration count', () => {
    const state = createEmptyOrchestrationState()
    const newState = advancePhase(state, 'session_end')
    expect(newState.orchestrationCount).toBe(1)
  })

  it('should update last orchestration time', () => {
    const state = createEmptyOrchestrationState()
    const before = Date.now()
    const newState = advancePhase(state, 'quality_analyzed')
    expect(newState.lastOrchestrationTime).toBeGreaterThanOrEqual(before)
  })
})

// =============================================================================
// runOrchestrationCycle Tests
// =============================================================================

describe('runOrchestrationCycle', () => {
  it('should advance to next phase', () => {
    const state = createEmptyOrchestrationState()
    const newState = runOrchestrationCycle(state)
    expect(newState.phase).toBe('session_update')
  })

  it('should increment orchestration count', () => {
    const state = createEmptyOrchestrationState()
    const newState = runOrchestrationCycle(state)
    expect(newState.orchestrationCount).toBe(1)
  })

  it('should not re-enter if already processing', () => {
    const state = { ...createEmptyOrchestrationState(), isProcessing: true }
    const newState = runOrchestrationCycle(state)
    expect(newState.phase).toBe('session_start')
  })

  it('should cycle through all phases', () => {
    let state = createEmptyOrchestrationState()
    const phases = ['session_start', 'session_update', 'quality_analyzed', 'evolution_cycle', 'tool_call', 'daily_summary', 'session_end']

    for (let i = 0; i < 6; i++) {
      state = runOrchestrationCycle(state)
    }
    expect(state.phase).toBe('session_end')
    expect(state.orchestrationCount).toBe(6)
  })
})

// =============================================================================
// Formatting Tests
// =============================================================================

describe('formatOrchestrationSummary', () => {
  it('should format summary', () => {
    const state = createEmptyOrchestrationState()
    const summary = formatOrchestrationSummary(state)
    expect(summary).toContain('Evolution Orchestration Suite')
    expect(summary).toContain('Health: 50/100')
  })

  it('should include recommendations when present', () => {
    const state = { ...createEmptyOrchestrationState(), recommendations: ['Test recommendation'] }
    const summary = formatOrchestrationSummary(state)
    expect(summary).toContain('Recommendations')
    expect(summary).toContain('Test recommendation')
  })

  it('should include critical issues when present', () => {
    const state = { ...createEmptyOrchestrationState(), criticalIssues: ['Test issue'] }
    const summary = formatOrchestrationSummary(state)
    expect(summary).toContain('Critical Issues')
    expect(summary).toContain('Test issue')
  })
})

describe('formatEvolutionMetrics', () => {
  it('should format metrics', () => {
    const metrics = createEmptyEvolutionMetrics()
    const formatted = formatEvolutionMetrics(metrics)
    expect(formatted).toContain('Evolution Metrics')
    expect(formatted).toContain('Cycles Completed: 0')
  })
})

describe('formatFullDashboard', () => {
  it('should format full dashboard', () => {
    const state = createEmptyOrchestrationState()
    const metrics = createEmptyEvolutionMetrics()
    const dashboard = formatFullDashboard(state, metrics)
    expect(dashboard).toContain('EVOLUTION ORCHESTRATION DASHBOARD')
    expect(dashboard).toContain('Health: 50/100')
    expect(dashboard).toContain('Phase: session_start')
  })
})