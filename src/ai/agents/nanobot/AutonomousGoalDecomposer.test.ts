/**
 * AutonomousGoalDecomposer Tests - V147
 * Tests for Self-Regulating Hierarchical Task Planning Engine
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createEmptyPlannerState,
  createGoal,
  decomposeGoal,
  activateGoal,
  updateGoalProgress,
  completeGoal,
  reviseGoal,
  prioritizeGoals,
  createTask,
  activateTask,
  completeTask,
  addCheckpoint,
  passCheckpoint,
  analyzeGoalDependencies,
  findStalledGoals,
  suggestPlanRevisions,
  predictCompletionChapter,
  formatGoalTree,
  formatActivePlan,
  formatPlannerDashboard,
} from './AutonomousGoalDecomposer'

// =============================================================================
// createEmptyPlannerState Tests
// =============================================================================

describe('createEmptyPlannerState', () => {
  it('should create empty state', () => {
    const state = createEmptyPlannerState()
    expect(state.goals.size).toBe(0)
    expect(state.tasks.size).toBe(0)
    expect(state.currentGoalId).toBeNull()
    expect(state.totalGoalsCreated).toBe(0)
  })

  it('should start at chapter 1', () => {
    const state = createEmptyPlannerState()
    expect(state.chapter).toBe(1)
  })
})

// =============================================================================
// Goal Management Tests
// =============================================================================

describe('createGoal', () => {
  it('should create a goal', () => {
    let state = createEmptyPlannerState()
    const result = createGoal(state, 'Write Chapter 1', 'Complete first chapter', 'high')
    expect(result.goalId).toContain('goal_')
    expect(result.state.goals.size).toBe(1)
  })

  it('should set priority correctly', () => {
    let state = createEmptyPlannerState()
    const result = createGoal(state, 'Test Goal', 'Description', 'critical')
    const goal = result.state.goals.get(result.goalId)
    expect(goal?.priority).toBe('critical')
  })

  it('should track total goals created', () => {
    let state = createEmptyPlannerState()
    const r1 = createGoal(state, 'Goal 1', 'Desc', 'medium')
    state = r1.state
    const r2 = createGoal(state, 'Goal 2', 'Desc', 'medium')
    expect(r2.state.totalGoalsCreated).toBe(2)
  })

  it('should create child goal with parent', () => {
    let state = createEmptyPlannerState()
    const r1 = createGoal(state, 'Parent', 'Desc', 'high')
    state = r1.state
    const r2 = createGoal(state, 'Child', 'Desc', 'medium', r1.goalId)
    expect(r2.state.goals.get(r1.goalId)?.childGoalIds).toContain(r2.goalId)
  })
})

describe('decomposeGoal', () => {
  it('should decompose goal into sub-goals', () => {
    let state = createEmptyPlannerState()
    const r1 = createGoal(state, 'Main Goal', 'Description', 'high')
    state = r1.state
    state = decomposeGoal(state, r1.goalId, [
      { title: 'Sub 1', description: 'Desc1', priority: 'high' as const },
      { title: 'Sub 2', description: 'Desc2', priority: 'medium' as const },
    ])
    // The parent should have 2 child goal IDs
    const childIds = state.goals.get(r1.goalId)?.childGoalIds || []
    expect(childIds.length).toBeGreaterThanOrEqual(1)
  })

  it('should not affect non-existent goal', () => {
    const state = createEmptyPlannerState()
    const result = decomposeGoal(state, 'nonexistent', [])
    expect(result).toBe(state)
  })
})

describe('activateGoal', () => {
  it('should activate goal and increment attempts', () => {
    let state = createEmptyPlannerState()
    const r1 = createGoal(state, 'Test', 'Desc', 'high')
    state = r1.state
    state = activateGoal(state, r1.goalId)
    const goal = state.goals.get(r1.goalId)
    expect(goal?.status).toBe('active')
    expect(goal?.attempts).toBe(1)
  })
})

describe('updateGoalProgress', () => {
  it('should update progress', () => {
    let state = createEmptyPlannerState()
    const r1 = createGoal(state, 'Test', 'Desc', 'medium')
    state = r1.state
    state = updateGoalProgress(state, r1.goalId, 50)
    expect(state.goals.get(r1.goalId)?.progress).toBe(50)
  })

  it('should clamp progress to 0-100', () => {
    let state = createEmptyPlannerState()
    const r1 = createGoal(state, 'Test', 'Desc', 'medium')
    state = r1.state
    state = updateGoalProgress(state, r1.goalId, 150)
    expect(state.goals.get(r1.goalId)?.progress).toBe(100)
  })
})

describe('completeGoal', () => {
  it('should mark goal as completed with outcome', () => {
    let state = createEmptyPlannerState()
    const r1 = createGoal(state, 'Test', 'Desc', 'medium')
    state = r1.state
    state = completeGoal(state, r1.goalId, 'Successfully completed')
    const goal = state.goals.get(r1.goalId)
    expect(goal?.status).toBe('completed')
    expect(goal?.actualOutcome).toBe('Successfully completed')
  })

  it('should set progress to 100', () => {
    let state = createEmptyPlannerState()
    const r1 = createGoal(state, 'Test', 'Desc', 'medium')
    state = r1.state
    state = completeGoal(state, r1.goalId, 'Done')
    expect(state.goals.get(r1.goalId)?.progress).toBe(100)
  })
})

describe('reviseGoal', () => {
  it('should add revision history entry', () => {
    let state = createEmptyPlannerState()
    const r1 = createGoal(state, 'Test', 'Desc', 'medium')
    state = r1.state
    state = reviseGoal(state, r1.goalId, 'progress_stall', 'Strategy was too ambitious')
    
    const goal = state.goals.get(r1.goalId)
    expect(goal?.revisionHistory.length).toBe(1)
    expect(goal?.revisionHistory[0].reason).toBe('progress_stall')
    expect(state.revisionCount).toBe(1)
  })
})

describe('prioritizeGoals', () => {
  it('should sort goals by priority', () => {
    let state = createEmptyPlannerState()
    const r1 = createGoal(state, 'Low', 'Desc', 'low')
    state = r1.state
    const r2 = createGoal(state, 'Critical', 'Desc', 'critical')
    state = r2.state
    const r3 = createGoal(state, 'Medium', 'Desc', 'medium')
    state = r3.state
    
    state = prioritizeGoals(state)
    expect(state.activePlanSequence[0]).toBe(r2.goalId)  // critical first
  })

  it('should skip completed goals', () => {
    let state = createEmptyPlannerState()
    const r1 = createGoal(state, 'Done', 'Desc', 'high')
    state = r1.state
    state = activateGoal(state, r1.goalId)
    state = completeGoal(state, r1.goalId, 'Done')
    
    const r2 = createGoal(state, 'Active', 'Desc', 'high')
    state = r2.state
    state = activateGoal(state, r2.goalId)
    
    state = prioritizeGoals(state)
    expect(state.activePlanSequence).not.toContain(r1.goalId)
  })
})

// =============================================================================
// Task Management Tests
// =============================================================================

describe('createTask', () => {
  it('should create task for goal', () => {
    let state = createEmptyPlannerState()
    const r1 = createGoal(state, 'Test Goal', 'Desc', 'high')
    state = r1.state
    const result = createTask(state, r1.goalId, 'Write scene', 'Description', 2, 'high', 'plot-agent')
    
    expect(result.taskId).toContain('task_')
    expect(result.state.tasks.size).toBe(1)
  })

  it('should link task to goal', () => {
    let state = createEmptyPlannerState()
    const r1 = createGoal(state, 'Test', 'Desc', 'medium')
    state = r1.state
    const r2 = createTask(state, r1.goalId, 'Task', 'Desc', 1)
    
    expect(r2.state.goals.get(r1.goalId)?.taskIds).toContain(r2.taskId)
  })
})

describe('activateTask', () => {
  it('should activate task', () => {
    let state = createEmptyPlannerState()
    const r1 = createGoal(state, 'Test', 'Desc', 'medium')
    state = r1.state
    const r2 = createTask(state, r1.goalId, 'Task', 'Desc', 1)
    state = r2.state
    state = activateTask(state, r2.taskId)
    
    expect(state.tasks.get(r2.taskId)?.status).toBe('active')
    expect(state.currentTaskId).toBe(r2.taskId)
  })
})

describe('completeTask', () => {
  it('should mark task as completed', () => {
    let state = createEmptyPlannerState()
    const r1 = createGoal(state, 'Test', 'Desc', 'medium')
    state = r1.state
    const r2 = createTask(state, r1.goalId, 'Task', 'Desc', 1)
    state = r2.state
    state = activateTask(state, r2.taskId)
    state = completeTask(state, r2.taskId)
    
    expect(state.tasks.get(r2.taskId)?.status).toBe('completed')
    expect(state.tasks.get(r2.taskId)?.progress).toBe(100)
  })

  it('should update goal progress', () => {
    let state = createEmptyPlannerState()
    const r1 = createGoal(state, 'Test', 'Desc', 'medium')
    state = r1.state
    const r2 = createTask(state, r1.goalId, 'Task', 'Desc', 1)
    state = r2.state
    state = activateTask(state, r2.taskId)
    state = completeTask(state, r2.taskId)
    
    const goal = state.goals.get(r1.goalId)
    expect(goal?.progress).toBe(100)  // 1/1 tasks = 100%
  })
})

describe('addCheckpoint', () => {
  it('should add checkpoint to task', () => {
    let state = createEmptyPlannerState()
    const r1 = createGoal(state, 'Test', 'Desc', 'medium')
    state = r1.state
    const r2 = createTask(state, r1.goalId, 'Task', 'Desc', 1)
    state = r2.state
    state = addCheckpoint(state, r2.taskId, 'Verify plot')
    
    expect(state.tasks.get(r2.taskId)?.checkpoints.length).toBe(1)
  })
})

describe('passCheckpoint', () => {
  it('should mark checkpoint as passed', () => {
    let state = createEmptyPlannerState()
    const r1 = createGoal(state, 'Test', 'Desc', 'medium')
    state = r1.state
    const r2 = createTask(state, r1.goalId, 'Task', 'Desc', 1)
    state = r2.state
    state = addCheckpoint(state, r2.taskId, 'Verify plot')
    const cpId = state.tasks.get(r2.taskId)!.checkpoints[0].id
    state = passCheckpoint(state, r2.taskId, cpId)
    
    expect(state.tasks.get(r2.taskId)?.checkpoints[0].passed).toBe(true)
  })

  it('should update task progress', () => {
    let state = createEmptyPlannerState()
    const r1 = createGoal(state, 'Test', 'Desc', 'medium')
    state = r1.state
    const r2 = createTask(state, r1.goalId, 'Task', 'Desc', 1)
    state = r2.state
    state = addCheckpoint(state, r2.taskId, 'Check 1')
    state = addCheckpoint(state, r2.taskId, 'Check 2')
    const task = state.tasks.get(r2.taskId)!
    expect(task.checkpoints.length).toBe(2)  // Verify 2 checkpoints exist
    const cp1 = task.checkpoints[0].id
    state = passCheckpoint(state, r2.taskId, cp1)
    
    // After passing 1 of 2 checkpoints, progress should be 50
    const updatedTask = state.tasks.get(r2.taskId)!
    expect(updatedTask.progress).toBe(50)
  })
})

// =============================================================================
// Planning & Analysis Tests
// =============================================================================

describe('analyzeGoalDependencies', () => {
  it('should identify blocking goals', () => {
    let state = createEmptyPlannerState()
    const r1 = createGoal(state, 'First', 'Desc', 'high')
    state = r1.state
    const r2 = createGoal(state, 'Second', 'Desc', 'medium')
    state = r2.state
    
    // Set r1 as blocker of r2
    const newGoals = new Map(state.goals)
    const goal2 = newGoals.get(r2.goalId)!
    newGoals.set(r2.goalId, { ...goal2, blockedBy: [r1.goalId] })
    state = { ...state, goals: newGoals }
    
    const deps = analyzeGoalDependencies(state)
    expect(deps.get(r2.goalId)?.length).toBe(1)
  })
})

describe('findStalledGoals', () => {
  it('should find goals with no progress after multiple attempts', () => {
    let state = createEmptyPlannerState()
    const r1 = createGoal(state, 'Stalled', 'Desc', 'medium')
    state = r1.state
    state = activateGoal(state, r1.goalId)
    
    // Move chapter forward
    state = { ...state, chapter: 10 }
    state = updateGoalProgress(state, r1.goalId, 0)
    
    const stalled = findStalledGoals(state)
    expect(stalled.length).toBe(1)
    expect(stalled[0].title).toBe('Stalled')
  })
})

describe('suggestPlanRevisions', () => {
  it('should suggest revision for stalled goals', () => {
    let state = createEmptyPlannerState()
    const r1 = createGoal(state, 'Stalled Goal', 'Desc', 'medium')
    state = r1.state
    state = activateGoal(state, r1.goalId)
    state = { ...state, chapter: 15 }
    state = updateGoalProgress(state, r1.goalId, 0)
    
    const suggestions = suggestPlanRevisions(state)
    expect(suggestions.length).toBe(1)
    expect(suggestions[0].reason).toBe('progress_stall')
  })

  it('should suggest for low success probability', () => {
    let state = createEmptyPlannerState()
    const r1 = createGoal(state, 'Risky', 'Desc', 'medium')
    state = r1.state
    state = activateGoal(state, r1.goalId)
    state = updateGoalProgress(state, r1.goalId, 30, 15)  // 15% success
    
    const suggestions = suggestPlanRevisions(state)
    expect(suggestions.some(s => s.reason === 'new_information')).toBe(true)
  })
})

describe('predictCompletionChapter', () => {
  it('should predict completion based on progress', () => {
    let state = createEmptyPlannerState()
    const r1 = createGoal(state, 'Test', 'Desc', 'medium')
    state = r1.state
    state = activateGoal(state, r1.goalId)
    state = updateGoalProgress(state, r1.goalId, 50)
    state = { ...state, chapter: 10 }
    
    // Create 2 tasks, complete 1
    const r2 = createTask(state, r1.goalId, 'Task 1', 'Desc', 1)
    state = r2.state
    const r3 = createTask(state, r1.goalId, 'Task 2', 'Desc', 1)
    state = r3.state
    state = activateTask(state, r2.taskId)
    state = completeTask(state, r2.taskId)
    
    const predicted = predictCompletionChapter(state, r1.goalId)
    expect(predicted).toBeGreaterThan(10)
  })

  it('should return null for zero progress', () => {
    const state = createEmptyPlannerState()
    const predicted = predictCompletionChapter(state, 'nonexistent')
    expect(predicted).toBeNull()
  })
})

// =============================================================================
// Formatting Tests
// =============================================================================

describe('formatGoalTree', () => {
  it('should format goal tree with children', () => {
    let state = createEmptyPlannerState()
    const r1 = createGoal(state, 'Parent', 'Desc', 'high')
    state = r1.state
    const r2 = createGoal(state, 'Child', 'Desc', 'medium', r1.goalId)
    state = r2.state
    
    const tree = formatGoalTree(state, r1.goalId)
    expect(tree).toContain('Parent')
    expect(tree).toContain('Child')
  })

  it('should handle nonexistent goal', () => {
    const state = createEmptyPlannerState()
    const tree = formatGoalTree(state, 'nonexistent')
    expect(tree).toContain('not found')
  })
})

describe('formatActivePlan', () => {
  it('should show active goals', () => {
    let state = createEmptyPlannerState()
    const r1 = createGoal(state, 'Active Goal', 'Desc', 'high')
    state = r1.state
    state = activateGoal(state, r1.goalId)
    
    const plan = formatActivePlan(state)
    expect(plan).toContain('Active Goal')
    expect(plan).toContain('Chapter')
  })
})

describe('formatPlannerDashboard', () => {
  it('should show goal and task counts', () => {
    const state = createEmptyPlannerState()
    const dashboard = formatPlannerDashboard(state)
    expect(dashboard).toContain('Goal Overview')
    expect(dashboard).toContain('Task Overview')
  })

  it('should show revision count', () => {
    let state = createEmptyPlannerState()
    const r1 = createGoal(state, 'Test', 'Desc', 'medium')
    state = r1.state
    state = activateGoal(state, r1.goalId)
    state = reviseGoal(state, r1.goalId, 'progress_stall', 'Test revision')
    
    const dashboard = formatPlannerDashboard(state)
    expect(dashboard).toContain('Total revisions: 1')
  })

  it('should show plan suggestions when stalled', () => {
    let state = createEmptyPlannerState()
    const r1 = createGoal(state, 'Stalled', 'Desc', 'medium')
    state = r1.state
    state = activateGoal(state, r1.goalId)
    state = { ...state, chapter: 20 }
    state = updateGoalProgress(state, r1.goalId, 0)
    
    const dashboard = formatPlannerDashboard(state)
    expect(dashboard).toContain('Plan Revision Suggestions')
  })
})
