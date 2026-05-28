/**
 * AutonomousGoalDecomposer - V146
 * Self-Regulating Hierarchical Task Planning Engine
 * 
 * Design references:
 * - ruflo: hierarchical decomposition (goal → sub-goals → tasks → steps)
 * - generic-agent: autonomous goal pursuit with self-correction
 * - chatdev: role-based task distribution and coordination
 * - thunderbolt: feedback loops for continuous monitoring and plan revision
 */

export type GoalStatus = 'pending' | 'active' | 'paused' | 'completed' | 'abandoned' | 'superseded'
export type Priority = 'critical' | 'high' | 'medium' | 'low' | 'background'
export type PlanRevisionReason = 'progress_stall' | 'new_information' | 'resource_change' | 'priority_shift' | 'dependency_resolved' | 'failed_attempt'

export interface Goal {
  goalId: string
  title: string
  description: string
  priority: Priority
  status: GoalStatus
  parentGoalId: string | null
  childGoalIds: string[]
  taskIds: string[]
  createdAtChapter: number
  targetChapter: number | null
  progress: number           // 0-100
  successProbability: number // 0-100
  attempts: number
  lastAttemptChapter: number | null
  revisionHistory: Array<{ chapter: number; reason: PlanRevisionReason; description: string }>
  blockedBy: string[]        // goalIds that must complete first
  blocks: string[]           // goalIds this goal blocks
  tags: string[]
  expectedOutcome: string
  actualOutcome: string | null
  learnedPatterns: string[]  // patterns learned from past attempts
  estimatedWordCount: number // words needed to complete this goal
}

export interface Task {
  taskId: string
  goalId: string
  title: string
  description: string
  priority: Priority
  status: GoalStatus
  estimatedHours: number
  actualHours: number
  subtaskIds: string[]
  assignedRole: string | null  // e.g., 'plot-agent', 'dialogue-agent'
  createdChapter: number
  completedChapter: number | null
  dependencies: string[]       // taskIds that must complete first
  progress: number             // 0-100
  blockedReason: string | null
  checkpoints: Array<{ id: string; description: string; passed: boolean }>
}

export interface PlannerState {
  goals: Map<string, Goal>
  tasks: Map<string, Task>
  currentGoalId: string | null
  currentTaskId: string | null
  activePlanSequence: string[]   // ordered goalIds
  revisionCount: number
  chapter: number
  totalGoalsCreated: number
  totalTasksCompleted: number
  efficiencyScore: number       // tasks completed / hours spent
}

// =============================================================================
// State Management
// =============================================================================

export function createEmptyPlannerState(): PlannerState {
  return {
    goals: new Map(),
    tasks: new Map(),
    currentGoalId: null,
    currentTaskId: null,
    activePlanSequence: [],
    revisionCount: 0,
    chapter: 1,
    totalGoalsCreated: 0,
    totalTasksCompleted: 0,
    efficiencyScore: 0,
  }
}

// =============================================================================
// Goal Management
// =============================================================================

export function createGoal(
  state: PlannerState,
  title: string,
  description: string,
  priority: Priority = 'medium',
  parentGoalId: string | null = null
): { state: PlannerState; goalId: string } {
  const goalId = `goal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  
  const goal: Goal = {
    goalId,
    title,
    description,
    priority,
    status: 'pending',
    parentGoalId,
    childGoalIds: [],
    taskIds: [],
    createdAtChapter: state.chapter,
    targetChapter: null,
    progress: 0,
    successProbability: 50,
    attempts: 0,
    lastAttemptChapter: null,
    revisionHistory: [],
    blockedBy: [],
    blocks: [],
    tags: [],
    expectedOutcome: '',
    actualOutcome: null,
    learnedPatterns: [],
    estimatedWordCount: 0,
  }
  
  const newGoals = new Map(state.goals)
  newGoals.set(goalId, goal)
  
  // Update parent if provided
  let updatedState = { ...state, goals: newGoals, totalGoalsCreated: state.totalGoalsCreated + 1 }
  
  if (parentGoalId) {
    const parent = newGoals.get(parentGoalId)
    if (parent) {
      const updatedParent = {
        ...parent,
        childGoalIds: [...parent.childGoalIds, goalId],
      }
      newGoals.set(parentGoalId, updatedParent)
      updatedState = { ...updatedState, goals: newGoals }
    }
  }
  
  return { state: updatedState, goalId }
}

export function decomposeGoal(
  state: PlannerState,
  goalId: string,
  subGoalTitles: Array<{ title: string; description: string; priority: Priority }>
): PlannerState {
  const goal = state.goals.get(goalId)
  if (!goal) return state
  
  let newState = state
  const newGoals = new Map(state.goals)
  
  for (const sg of subGoalTitles) {
    let result = createGoal(newState, sg.title, sg.description, sg.priority, goalId)
    newState = result.state
    newGoals.set(goalId, { ...goal, childGoalIds: [...goal.childGoalIds, result.goalId] })
  }
  
  return { ...newState, goals: newGoals }
}

export function activateGoal(
  state: PlannerState,
  goalId: string
): PlannerState {
  const goal = state.goals.get(goalId)
  if (!goal) return state
  
  const newGoals = new Map(state.goals)
  newGoals.set(goalId, {
    ...goal,
    status: 'active',
    attempts: goal.attempts + 1,
    lastAttemptChapter: state.chapter,
  })
  
  // Remove from sequence if already there, add to active position
  const seq = state.activePlanSequence.filter(id => id !== goalId)
  
  return {
    ...state,
    goals: newGoals,
    currentGoalId: goalId,
    activePlanSequence: [...seq, goalId],
  }
}

export function updateGoalProgress(
  state: PlannerState,
  goalId: string,
  progress: number,
  successProbability?: number
): PlannerState {
  const goal = state.goals.get(goalId)
  if (!goal) return state
  
  const updates: Partial<Goal> = { progress: Math.max(0, Math.min(100, progress)) }
  if (successProbability !== undefined) {
    updates.successProbability = Math.max(0, Math.min(100, successProbability))
  }
  
  const newGoals = new Map(state.goals)
  newGoals.set(goalId, { ...goal, ...updates })
  
  return { ...state, goals: newGoals }
}

export function completeGoal(
  state: PlannerState,
  goalId: string,
  actualOutcome: string
): PlannerState {
  const goal = state.goals.get(goalId)
  if (!goal) return state
  
  // Complete all child goals first
  let newState = state
  for (const childId of goal.childGoalIds) {
    if (state.goals.get(childId)?.status !== 'completed') {
      newState = completeGoal(newState, childId, 'parent_completed')
    }
  }
  
  const newGoals = new Map(newState.goals)
  const updatedGoal: Goal = {
    ...goal,
    status: 'completed',
    progress: 100,
    actualOutcome,
  }
  newGoals.set(goalId, updatedGoal)
  
  // Mark tasks as completed
  const newTasks = new Map(newState.tasks)
  for (const taskId of goal.taskIds) {
    const task = newTasks.get(taskId)
    if (task) {
      newTasks.set(taskId, { ...task, status: 'completed' })
    }
  }
  
  return {
    ...newState,
    goals: newGoals,
    tasks: newTasks,
    totalTasksCompleted: newState.totalTasksCompleted + goal.taskIds.length,
    currentGoalId: newState.currentGoalId === goalId ? null : newState.currentGoalId,
  }
}

export function reviseGoal(
  state: PlannerState,
  goalId: string,
  reason: PlanRevisionReason,
  description: string,
  newTargetChapter?: number
): PlannerState {
  const goal = state.goals.get(goalId)
  if (!goal) return state
  
  const newGoals = new Map(state.goals)
  const revisionEntry = { chapter: state.chapter, reason, description }
  
  newGoals.set(goalId, {
    ...goal,
    status: 'active',  // Re-activate after revision
    revisionHistory: [...goal.revisionHistory, revisionEntry],
    targetChapter: newTargetChapter ?? goal.targetChapter,
    attempts: goal.attempts + 1,
    lastAttemptChapter: state.chapter,
  })
  
  return {
    ...state,
    goals: newGoals,
    revisionCount: state.revisionCount + 1,
  }
}

export function prioritizeGoals(state: PlannerState): PlannerState {
  const goals = Array.from(state.goals.values())
    .filter(g => g.status === 'pending' || g.status === 'active')
  
  // Sort by: blocked status first, then priority, then progress (lower first)
  const priorityOrder: Record<Priority, number> = {
    critical: 0, high: 1, medium: 2, low: 3, background: 4
  }
  
  goals.sort((a, b) => {
    // Completed/abandoned go to bottom
    if (a.status === 'completed' || a.status === 'abandoned') return 1
    if (b.status === 'completed' || b.status === 'abandoned') return -1
    
    // Check if blocked
    const aBlocked = a.blockedBy.some(id => state.goals.get(id)?.status !== 'completed')
    const bBlocked = b.blockedBy.some(id => state.goals.get(id)?.status !== 'completed')
    if (aBlocked && !bBlocked) return 1
    if (!aBlocked && bBlocked) return -1
    
    // Priority
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (pDiff !== 0) return pDiff
    
    // Lower progress first (more work needed)
    return a.progress - b.progress
  })
  
  const orderedIds = goals.map(g => g.goalId)
  
  return {
    ...state,
    activePlanSequence: orderedIds,
  }
}

// =============================================================================
// Task Management
// =============================================================================

export function createTask(
  state: PlannerState,
  goalId: string,
  title: string,
  description: string,
  estimatedHours: number = 1,
  priority: Priority = 'medium',
  assignedRole: string | null = null
): { state: PlannerState; taskId: string } {
  const goal = state.goals.get(goalId)
  if (!goal) return { state, taskId: '' }
  
  const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  
  const task: Task = {
    taskId,
    goalId,
    title,
    description,
    priority,
    status: 'pending',
    estimatedHours,
    actualHours: 0,
    subtaskIds: [],
    assignedRole,
    createdChapter: state.chapter,
    completedChapter: null,
    dependencies: [],
    progress: 0,
    blockedReason: null,
    checkpoints: [],
  }
  
  const newTasks = new Map(state.tasks)
  newTasks.set(taskId, task)
  
  const newGoals = new Map(state.goals)
  newGoals.set(goalId, {
    ...goal,
    taskIds: [...goal.taskIds, taskId],
  })
  
  return {
    state: { ...state, tasks: newTasks, goals: newGoals },
    taskId,
  }
}

export function activateTask(
  state: PlannerState,
  taskId: string
): PlannerState {
  const task = state.tasks.get(taskId)
  if (!task) return state
  
  // Check dependencies
  for (const depId of task.dependencies) {
    const dep = state.tasks.get(depId)
    if (dep && dep.status !== 'completed') {
      const newTasks = new Map(state.tasks)
      newTasks.set(taskId, { ...task, status: 'pending', blockedReason: `Waiting for: ${dep.title}` })
      return { ...state, tasks: newTasks }
    }
  }
  
  const newTasks = new Map(state.tasks)
  newTasks.set(taskId, { ...task, status: 'active', blockedReason: null })
  
  const newGoals = new Map(state.goals)
  const goal = state.goals.get(task.goalId)
  if (goal) {
    newGoals.set(task.goalId, { ...goal, status: 'active' })
  }
  
  return {
    ...state,
    tasks: newTasks,
    goals: newGoals,
    currentTaskId: taskId,
  }
}

export function completeTask(
  state: PlannerState,
  taskId: string
): PlannerState {
  const task = state.tasks.get(taskId)
  if (!task) return state
  
  const newTasks = new Map(state.tasks)
  newTasks.set(taskId, {
    ...task,
    status: 'completed',
    progress: 100,
    completedChapter: state.chapter,
  })
  
  // Update goal progress based on task completion
  const goal = state.goals.get(task.goalId)
  let newState = { ...state, tasks: newTasks }
  
  if (goal) {
    const completedTasks = goal.taskIds.filter(id => newTasks.get(id)?.status === 'completed').length
    const progress = (completedTasks / goal.taskIds.length) * 100
    
    const newGoals = new Map(newState.goals)
    const updatedGoal = {
      ...goal,
      progress,
    }
    newGoals.set(task.goalId, updatedGoal)
    newState = { ...newState, goals: newGoals }
  }
  
  return newState
}

export function addCheckpoint(
  state: PlannerState,
  taskId: string,
  description: string
): PlannerState {
  const task = state.tasks.get(taskId)
  if (!task) return state
  
  const newTasks = new Map(state.tasks)
  const checkpointId = `cp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  
  newTasks.set(taskId, {
    ...task,
    checkpoints: [...task.checkpoints, { id: checkpointId, description, passed: false }],
  })
  
  return { ...state, tasks: newTasks }
}

export function passCheckpoint(
  state: PlannerState,
  taskId: string,
  checkpointId: string
): PlannerState {
  const task = state.tasks.get(taskId)
  if (!task) return state
  
  const newTasks = new Map(state.tasks)
  const updatedCheckpoints = task.checkpoints.map(cp =>
    cp.id === checkpointId ? { ...cp, passed: true } : cp
  )
  
  const passedCount = updatedCheckpoints.filter(cp => cp.passed).length
  const progress = (passedCount / updatedCheckpoints.length) * 100
  
  newTasks.set(taskId, {
    ...task,
    checkpoints: updatedCheckpoints,
    progress,
  })
  
  return { ...state, tasks: newTasks }
}

// =============================================================================
// Planning & Analysis
// =============================================================================

export function analyzeGoalDependencies(state: PlannerState): Map<string, string[]> {
  const dependencyMap = new Map<string, string[]>()
  
  for (const goal of Array.from(state.goals.values())) {
    const blockers: string[] = []
    for (const blockedId of goal.blockedBy) {
      const blocker = state.goals.get(blockedId)
      if (blocker && blocker.status !== 'completed') {
        blockers.push(blockedId)
      }
    }
    dependencyMap.set(goal.goalId, blockers)
  }
  
  return dependencyMap
}

export function findStalledGoals(state: PlannerState): Goal[] {
  return Array.from(state.goals.values())
    .filter(g => 
      (g.status === 'active') &&
      g.progress === 0 &&
      g.attempts > 0 &&
      g.lastAttemptChapter !== null &&
      (state.chapter - g.lastAttemptChapter) > 3
    )
}

export function suggestPlanRevisions(state: PlannerState): Array<{ goalId: string; reason: PlanRevisionReason; suggestion: string }> {
  const suggestions: Array<{ goalId: string; reason: PlanRevisionReason; suggestion: string }> = []
  
  // Find stalled goals
  const stalled = findStalledGoals(state)
  for (const goal of stalled) {
    suggestions.push({
      goalId: goal.goalId,
      reason: 'progress_stall',
      suggestion: `Goal "${goal.title}" has stalled. Consider revising strategy or decomposing into smaller sub-goals.`,
    })
  }
  
  // Find goals with low success probability
  const lowProb = Array.from(state.goals.values())
    .filter(goal => goal.status === 'active' && goal.successProbability < 30)
  for (const goal of lowProb) {
    suggestions.push({
      goalId: goal.goalId,
      reason: 'new_information',
      suggestion: `Goal "${goal.title}" has low success probability (${goal.successProbability}%). Consider gathering more information or adjusting approach.`,
    })
  }
  
  return suggestions
}

export function predictCompletionChapter(state: PlannerState, goalId: string): number | null {
  const goal = state.goals.get(goalId)
  if (!goal || goal.progress === 0) return null
  
  const tasks = goal.taskIds.map(id => state.tasks.get(id)).filter(Boolean) as Task[]
  if (tasks.length === 0) return null
  
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const totalTasks = tasks.length
  const completionRatio = completedTasks / totalTasks
  
  if (completionRatio === 0) return null
  
  const chaptersPerProgress = state.chapter / goal.progress
  const remainingProgress = 100 - goal.progress
  const estimatedChapters = state.chapter + (remainingProgress * chaptersPerProgress)
  
  return Math.ceil(estimatedChapters)
}

// =============================================================================
// Formatters
// =============================================================================

export function formatGoalTree(state: PlannerState, goalId: string, indent: number = 0): string {
  const goal = state.goals.get(goalId)
  if (!goal) return `Goal ${goalId} not found`
  
  const prefix = '  '.repeat(indent)
  const lines = [
    `${prefix}[${goal.priority.toUpperCase()}] ${goal.title} (${goal.status}) - ${goal.progress}%`,
    `${prefix}  ID: ${goal.goalId} | Attempts: ${goal.attempts} | Revisions: ${goal.revisionHistory.length}`,
  ]
  
  for (const childId of goal.childGoalIds) {
    lines.push(formatGoalTree(state, childId, indent + 1))
  }
  
  return lines.join('\n')
}

export function formatActivePlan(state: PlannerState): string {
  const lines = [
    '=== Active Writing Plan ===',
    `Chapter: ${state.chapter} | Goals: ${state.goals.size} | Tasks: ${state.tasks.size}`,
    `Completed: ${state.totalTasksCompleted} tasks | Revision count: ${state.revisionCount}`,
    '',
  ]
  
  for (const goalId of state.activePlanSequence) {
    const goal = state.goals.get(goalId)
    if (!goal || goal.status === 'completed' || goal.status === 'abandoned') continue
    
    const statusIcon = goal.status === 'active' ? '▶' : '○'
    const priorityColor = goal.priority === 'critical' ? '!' : goal.priority === 'high' ? '+' : ' '
    lines.push(`${statusIcon}${priorityColor} ${goal.title} [${goal.priority}] - ${goal.progress}%`)
    
    for (const taskId of goal.taskIds.slice(0, 3)) {
      const task = state.tasks.get(taskId)
      if (!task) continue
      const taskIcon = task.status === 'completed' ? '✓' : task.status === 'active' ? '→' : ' '
      lines.push(`    ${taskIcon} ${task.title}`)
    }
    if (goal.taskIds.length > 3) {
      lines.push(`    ... and ${goal.taskIds.length - 3} more tasks`)
    }
  }
  
  return lines.join('\n')
}

export function formatPlannerDashboard(state: PlannerState): string {
  const activeGoals = Array.from(state.goals.values()).filter(g => g.status === 'active')
  const pendingGoals = Array.from(state.goals.values()).filter(g => g.status === 'pending')
  const completedGoals = Array.from(state.goals.values()).filter(g => g.status === 'completed')
  
  const activeTasks = Array.from(state.tasks.values()).filter(t => t.status === 'active')
  const pendingTasks = Array.from(state.tasks.values()).filter(t => t.status === 'pending')
  const completedTasks = Array.from(state.tasks.values()).filter(t => t.status === 'completed')
  
  const suggestions = suggestPlanRevisions(state)
  
  const lines = [
    '=== Autonomous Goal Planner Dashboard ===',
    `Chapter ${state.chapter} | Efficiency: ${state.efficiencyScore.toFixed(1)} tasks/hr`,
    '',
    `--- Goal Overview ---`,
    `Active: ${activeGoals.length} | Pending: ${pendingGoals.length} | Completed: ${completedGoals.length}`,
    '',
    `--- Task Overview ---`,
    `Active: ${activeTasks.length} | Pending: ${pendingTasks.length} | Completed: ${completedTasks.length}`,
    '',
    `--- Revision History ---`,
    `Total revisions: ${state.revisionCount}`,
  ]
  
  if (suggestions.length > 0) {
    lines.push('')
    lines.push('--- Plan Revision Suggestions ---')
    for (const s of suggestions.slice(0, 5)) {
      lines.push(`  [!] ${s.suggestion}`)
    }
  }

  return lines.join('\n')
}
