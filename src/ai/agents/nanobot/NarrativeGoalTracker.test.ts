import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  createGoal,
  updateProgress,
  addObstacle,
  resolveObstacle,
  detectConflicts,
  getGoalSummary,
  prioritizeGoals,
  abandonGoal,
} from './NarrativeGoalTracker'

describe('createEmptyState', () => {
  it('should create empty goal state', () => {
    const s = createEmptyState()
    expect(s.goals).toEqual({})
    expect(s.activeGoalId).toBeNull()
    expect(s.completionRate).toBe(0)
    expect(s.typeAlias).toEqual({})
  })
})

describe('createGoal', () => {
  it('should create a goal', () => {
    let s = createEmptyState()
    s = createGoal(s, 'Defeat the villain', 'critical')
    expect(Object.keys(s.goals).length).toBe(1)
    const goal = Object.values(s.goals)[0]
    expect(goal.description).toBe('Defeat the villain')
    expect(goal.priority).toBe('critical')
    expect(goal.status).toBe('active')
    expect(goal.progress).toBe(0)
  })

  it('should set first goal as active', () => {
    let s = createEmptyState()
    s = createGoal(s, 'First goal')
    expect(s.activeGoalId).toBeTruthy()
  })

  it('should not change active goal on subsequent goals', () => {
    let s = createEmptyState()
    s = createGoal(s, 'First')
    const firstId = s.activeGoalId
    s = createGoal(s, 'Second')
    expect(s.activeGoalId).toBe(firstId)
  })
})

describe('updateProgress', () => {
  it('should update goal progress', () => {
    let s = createEmptyState()
    s = createGoal(s, 'Test goal')
    const goalId = Object.keys(s.goals)[0]
    s = updateProgress(s, goalId, 50)
    expect(s.goals[goalId].progress).toBe(50)
  })

  it('should mark as achieved at 100', () => {
    let s = createEmptyState()
    s = createGoal(s, 'Test goal')
    const goalId = Object.keys(s.goals)[0]
    s = updateProgress(s, goalId, 100)
    expect(s.goals[goalId].status).toBe('achieved')
    expect(s.goals[goalId].achievedAt).toBeTruthy()
  })

  it('should clamp progress between 0 and 100', () => {
    let s = createEmptyState()
    s = createGoal(s, 'Test goal')
    const goalId = Object.keys(s.goals)[0]
    s = updateProgress(s, goalId, 150)
    expect(s.goals[goalId].progress).toBe(100)
    s = updateProgress(s, goalId, -10)
    expect(s.goals[goalId].progress).toBe(0)
  })
})

describe('addObstacle', () => {
  it('should add obstacle to goal', () => {
    let s = createEmptyState()
    s = createGoal(s, 'Test goal')
    const goalId = Object.keys(s.goals)[0]
    s = addObstacle(s, goalId, 'No resources', 70)
    expect(s.goals[goalId].obstacles.length).toBe(1)
    expect(s.goals[goalId].obstacles[0].severity).toBe(70)
  })
})

describe('resolveObstacle', () => {
  it('should mark obstacle as resolved', () => {
    let s = createEmptyState()
    s = createGoal(s, 'Test goal')
    const goalId = Object.keys(s.goals)[0]
    s = addObstacle(s, goalId, 'No resources')
    const obsId = s.goals[goalId].obstacles[0].id
    s = resolveObstacle(s, goalId, obsId, 'Got resources')
    expect(s.goals[goalId].obstacles[0].resolved).toBe(true)
    expect(s.goals[goalId].obstacles[0].resolution).toBe('Got resources')
  })
})

describe('detectConflicts', () => {
  it('should detect no conflicts initially', () => {
    const s = createEmptyState()
    expect(detectConflicts(s)).toEqual([])
  })

  it('should detect character conflicts', () => {
    let s = createEmptyState()
    s = createGoal(s, 'Goal 1', 'high', ['alice', 'bob'])
    s = createGoal(s, 'Goal 2', 'high', ['alice'])
    const conflicts = detectConflicts(s)
    expect(conflicts.some(c => c.type === 'character')).toBe(true)
  })

  it('should detect timeline conflicts', () => {
    let s = createEmptyState()
    s = createGoal(s, 'Goal 1', 'high', [], 'ch1')
    s = createGoal(s, 'Goal 2', 'high', [], 'ch1')
    const conflicts = detectConflicts(s)
    expect(conflicts.some(c => c.type === 'timeline')).toBe(true)
  })
})

describe('getGoalSummary', () => {
  it('should return comprehensive summary', () => {
    let s = createEmptyState()
    s = createGoal(s, 'Goal 1')
    s = createGoal(s, 'Goal 2')
    const goalId1 = Object.keys(s.goals)[0]
    s = updateProgress(s, goalId1, 100)
    const summary = getGoalSummary(s)
    expect(summary.total).toBe(2)
    expect(summary.achieved).toBe(1)
    expect(summary.completionRate).toBe(50)
  })
})

describe('prioritizeGoals', () => {
  it('should sort by priority then unresolved obstacles', () => {
    let s = createEmptyState()
    s = createGoal(s, 'Low goal', 'low')
    s = createGoal(s, 'Critical goal', 'critical')
    s = createGoal(s, 'Medium goal', 'medium')
    const ordered = prioritizeGoals(s)
    const goals = Object.values(s.goals)
    const criticalId = goals.find(g => g.priority === 'critical')!.id
    expect(ordered[0]).toBe(criticalId)
  })
})

describe('abandonGoal', () => {
  it('should mark goal as abandoned', () => {
    let s = createEmptyState()
    s = createGoal(s, 'Test goal')
    const goalId = Object.keys(s.goals)[0]
    s = abandonGoal(s, goalId)
    expect(s.goals[goalId].status).toBe('abandoned')
  })
})
