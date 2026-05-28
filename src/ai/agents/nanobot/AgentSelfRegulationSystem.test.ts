/**
 * AgentSelfRegulationSystem Tests - V127
 * Tests for Autonomous Goal Pursuit with Self-Correction
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createEmptySelfRegulationState,
  createGoal,
  startGoal,
  updateGoalProgress,
  completeGoal,
  abandonGoal,
  applyCorrection,
  assessAndCorrect,
  learnFromOutcome,
  getMostEffectivePattern,
  formatGoalSummary,
  formatSelfRegulationDashboard,
  DEFAULT_ADAPTIVE_THRESHOLDS,
} from './AgentSelfRegulationSystem'

// =============================================================================
// createEmptySelfRegulationState Tests
// =============================================================================

describe('createEmptySelfRegulationState', () => {
  it('should create empty state', () => {
    const state = createEmptySelfRegulationState()
    expect(state.goals.size).toBe(0)
    expect(state.activeGoalId).toBeNull()
    expect(state.goalHistory.length).toBe(0)
  })

  it('should have default adaptive thresholds', () => {
    const state = createEmptySelfRegulationState()
    expect(state.adaptiveThresholds.confidenceLowThreshold).toBe(0.3)
    expect(state.adaptiveThresholds.retryMaxCount).toBe(3)
  })
})

// =============================================================================
// Goal Creation Tests
// =============================================================================

describe('createGoal', () => {
  it('should create a goal with generated id', () => {
    let state = createEmptySelfRegulationState()
    const { state: newState, goalId } = createGoal(state, 'Write chapter 1', 'Chapter 1 completed')

    expect(goalId).toMatch(/^goal_/)
    expect(newState.goals.has(goalId)).toBe(true)
  })

  it('should set correct initial properties', () => {
    let state = createEmptySelfRegulationState()
    const { state: newState, goalId } = createGoal(state, 'Write chapter 1', 'Chapter 1 completed')

    const goal = newState.goals.get(goalId)!
    expect(goal.description).toBe('Write chapter 1')
    expect(goal.targetOutcome).toBe('Chapter 1 completed')
    expect(goal.status).toBe('active')
    expect(goal.progress).toBe(0)
    expect(goal.retries).toBe(0)
  })

  it('should allow custom priority', () => {
    let state = createEmptySelfRegulationState()
    const { state: newState, goalId } = createGoal(state, 'Critical task', 'Done', { priority: 9 })

    expect(newState.goals.get(goalId)?.priority).toBe(9)
  })

  it('should create sub-goal linking', () => {
    let state = createEmptySelfRegulationState()
    const { state: s1, goalId: parentId } = createGoal(state, 'Parent goal', 'Done')
    const { state: s2, goalId: childId } = createGoal(s1, 'Child goal', 'Done', { parentGoalId: parentId })

    expect(s2.goals.get(parentId)?.subGoals).toContain(childId)
    expect(s2.goals.get(childId)?.parentGoalId).toBe(parentId)
  })

  it('should set tags', () => {
    let state = createEmptySelfRegulationState()
    const { state: newState, goalId } = createGoal(state, 'Tagged goal', 'Done', { tags: ['writing', 'chapter'] })

    expect(newState.goals.get(goalId)?.tags).toContain('writing')
  })
})

// =============================================================================
// Goal Lifecycle Tests
// =============================================================================

describe('startGoal', () => {
  it('should set startedAt and activeGoalId', () => {
    let state = createEmptySelfRegulationState()
    const { state: s1, goalId } = createGoal(state, 'Start me', 'Done')
    state = startGoal(s1, goalId)

    expect(state.goals.get(goalId)?.startedAt).not.toBeNull()
    expect(state.activeGoalId).toBe(goalId)
  })

  it('should handle unknown goal', () => {
    const state = createEmptySelfRegulationState()
    const result = startGoal(state, 'unknown')
    expect(result).toBe(state)
  })
})

describe('updateGoalProgress', () => {
  it('should increment progress', () => {
    let state = createEmptySelfRegulationState()
    const { state: s1, goalId } = createGoal(state, 'Progress me', 'Done')
    state = updateGoalProgress(s1, goalId, 25)

    expect(state.goals.get(goalId)?.progress).toBe(25)
  })

  it('should cap at 100', () => {
    let state = createEmptySelfRegulationState()
    const { state: s1, goalId } = createGoal(state, 'Cap me', 'Done')
    state = updateGoalProgress(s1, goalId, 150)

    expect(state.goals.get(goalId)?.progress).toBe(100)
  })

  it('should update confidence trend', () => {
    let state = createEmptySelfRegulationState()
    const { state: s1, goalId } = createGoal(state, 'Track me', 'Done')
    state = updateGoalProgress(s1, goalId, 50)

    expect(state.confidenceTrends.has(goalId)).toBe(true)
  })

  it('should handle negative progress', () => {
    let state = createEmptySelfRegulationState()
    const { state: s1, goalId } = createGoal(state, 'Negative me', 'Done')
    state = updateGoalProgress(s1, goalId, -10)

    expect(state.goals.get(goalId)?.progress).toBe(0)
  })
})

describe('completeGoal', () => {
  it('should mark goal as completed with 100% progress', () => {
    let state = createEmptySelfRegulationState()
    const { state: s1, goalId } = createGoal(state, 'Complete me', 'Done')
    state = startGoal(s1, goalId)
    state = updateGoalProgress(s1, goalId, 100)
    state = completeGoal(state, goalId)

    expect(state.goals.get(goalId)?.status).toBe('completed')
    expect(state.goals.get(goalId)?.progress).toBe(100)
  })

  it('should add to goal history', () => {
    let state = createEmptySelfRegulationState()
    const { state: s1, goalId } = createGoal(state, 'History me', 'Done')
    state = completeGoal(s1, goalId)

    expect(state.goalHistory).toContain(goalId)
  })

  it('should clear activeGoalId if it was this goal', () => {
    let state = createEmptySelfRegulationState()
    const { state: s1, goalId } = createGoal(state, 'Active me', 'Done')
    state = startGoal(s1, goalId)
    state = completeGoal(state, goalId)

    expect(state.activeGoalId).toBeNull()
  })
})

describe('abandonGoal', () => {
  it('should mark goal as abandoned', () => {
    let state = createEmptySelfRegulationState()
    const { state: s1, goalId } = createGoal(state, 'Abandon me', 'Done')
    state = abandonGoal(s1, goalId, 'Too difficult')

    expect(state.goals.get(goalId)?.status).toBe('abandoned')
  })

  it('should add correction record', () => {
    let state = createEmptySelfRegulationState()
    const { state: s1, goalId } = createGoal(state, 'Correct me', 'Done')
    state = abandonGoal(s1, goalId, 'Impossible')

    expect(state.goals.get(goalId)?.corrections.length).toBe(1)
    expect(state.goals.get(goalId)?.corrections[0].type).toBe('abandon')
  })
})

// =============================================================================
// Self-Correction Tests
// =============================================================================

describe('applyCorrection', () => {
  it('should add correction to goal', () => {
    let state = createEmptySelfRegulationState()
    const { state: s1, goalId } = createGoal(state, 'Correct me', 'Done')
    state = applyCorrection(s1, goalId, {
      type: 'replan',
      reason: 'Initial plan failed',
      triggeredBy: 'agent_writer',
      success: null,
      outcome: null,
    })

    expect(state.goals.get(goalId)?.corrections.length).toBe(1)
    expect(state.goals.get(goalId)?.corrections[0].type).toBe('replan')
  })

  it('should increment retry count for retry type', () => {
    let state = createEmptySelfRegulationState()
    const { state: s1, goalId } = createGoal(state, 'Retry me', 'Done')
    state = applyCorrection(s1, goalId, {
      type: 'retry',
      reason: 'Try again',
      triggeredBy: 'self-regulation',
      success: null,
      outcome: null,
    })

    expect(state.goals.get(goalId)?.retries).toBe(1)
  })

  it('should increment totalSelfCorrections counter', () => {
    let state = createEmptySelfRegulationState()
    const { state: s1, goalId } = createGoal(state, 'Count me', 'Done')
    state = applyCorrection(s1, goalId, {
      type: 'decompose',
      reason: 'Break down',
      triggeredBy: 'self-regulation',
      success: null,
      outcome: null,
    })

    expect(state.totalSelfCorrections).toBe(1)
  })
})

describe('assessAndCorrect', () => {
  it('should do nothing for completed goal', () => {
    let state = createEmptySelfRegulationState()
    const { state: s1, goalId } = createGoal(state, 'Done already', 'Done')
    state = completeGoal(s1, goalId)
    const result = assessAndCorrect(state, goalId)

    expect(result.goals.get(goalId)?.corrections.length).toBe(0)
  })

  it('should not correct goal with high confidence', () => {
    let state = createEmptySelfRegulationState()
    const { state: s1, goalId } = createGoal(state, 'Confident me', 'Done')
    // Set progress high enough for high confidence
    for (let i = 0; i < 8; i++) {
      s1.goals.get(goalId)!.progress = 80
    }
    const result = assessAndCorrect(s1, goalId)

    // High confidence, no correction needed
    expect(result.goals.get(goalId)?.corrections.length).toBe(0)
  })
})

// =============================================================================
// Adaptive Learning Tests
// =============================================================================

describe('learnFromOutcome', () => {
  it('should update correction success', () => {
    let state = createEmptySelfRegulationState()
    const { state: s1, goalId } = createGoal(state, 'Learn me', 'Done')
    state = applyCorrection(s1, goalId, {
      type: 'retry',
      reason: 'Testing',
      triggeredBy: 'self-regulation',
      success: null,
      outcome: null,
    })
    state = learnFromOutcome(state, goalId, true, 500)

    const corrections = state.goals.get(goalId)?.corrections
    expect(corrections?.[corrections.length - 1].success).toBe(true)
  })
})

describe('getMostEffectivePattern', () => {
  it('should return null for empty learning buffer', () => {
    const state = createEmptySelfRegulationState()
    expect(getMostEffectivePattern(state)).toBeNull()
  })

  it('should return pattern with highest success rate (min 3 samples)', () => {
    let state = createEmptySelfRegulationState()
    const pattern = 'decompose_when_complex'

    // Add 3 successful entries
    for (let i = 0; i < 3; i++) {
      state.learningBuffer.push({
        timestamp: Date.now(),
        goalId: 'g1',
        pattern,
        outcome: 'success',
        tokensSaved: 100,
        correctionApplied: 'decompose',
      })
    }

    // Add 1 failed entry for another pattern
    state.learningBuffer.push({
      timestamp: Date.now(),
      goalId: 'g1',
      pattern: 'retry_when_failed',
      outcome: 'failure',
      tokensSaved: null,
      correctionApplied: 'retry',
    })

    const result = getMostEffectivePattern(state)
    expect(result).toBe(pattern)
  })
})

// =============================================================================
// Formatting Tests
// =============================================================================

describe('formatGoalSummary', () => {
  it('should format active goal', () => {
    let state = createEmptySelfRegulationState()
    const { state: s1, goalId } = createGoal(state, 'Format me', 'Done', { priority: 7 })
    state = startGoal(s1, goalId)
    state = updateGoalProgress(s1, goalId, 45)

    const summary = formatGoalSummary(state, goalId)
    expect(summary).toContain('Format me')
    expect(summary).toContain('45%')
  })

  it('should show not found for unknown', () => {
    const state = createEmptySelfRegulationState()
    const summary = formatGoalSummary(state, 'unknown')
    expect(summary).toContain('not found')
  })
})

describe('formatSelfRegulationDashboard', () => {
  it('should show empty state', () => {
    const state = createEmptySelfRegulationState()
    const dashboard = formatSelfRegulationDashboard(state)
    expect(dashboard).toContain('Self-Regulation Dashboard')
    expect(dashboard).toContain('Active Goals: 0')
  })

  it('should show active goals', () => {
    let state = createEmptySelfRegulationState()
    const { state: s1, goalId } = createGoal(state, 'Active goal one', 'Done', { priority: 8 })
    state = startGoal(s1, goalId)

    const dashboard = formatSelfRegulationDashboard(state)
    expect(dashboard).toContain('Active Goals: 1')
    expect(dashboard).toContain('Active goal one')
  })

  it('should show total corrections', () => {
    let state = createEmptySelfRegulationState()
    const { state: s1, goalId } = createGoal(state, 'Correct me', 'Done')
    state = applyCorrection(s1, goalId, {
      type: 'replan',
      reason: 'Test',
      triggeredBy: 'self-regulation',
      success: null,
      outcome: null,
    })

    const dashboard = formatSelfRegulationDashboard(state)
    expect(dashboard).toContain('Total Corrections: 1')
  })
})

// =============================================================================
// Default Thresholds Tests
// =============================================================================

describe('DEFAULT_ADAPTIVE_THRESHOLDS', () => {
  it('should have valid threshold values', () => {
    expect(DEFAULT_ADAPTIVE_THRESHOLDS.confidenceLowThreshold).toBeLessThan(
      DEFAULT_ADAPTIVE_THRESHOLDS.confidenceHighThreshold
    )
    expect(DEFAULT_ADAPTIVE_THRESHOLDS.retryMaxCount).toBeGreaterThan(0)
    expect(DEFAULT_ADAPTIVE_THRESHOLDS.progressStallThreshold).toBeGreaterThan(0)
  })
})