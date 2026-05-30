/**
 * AgentTaskRouter - V120
 * Role-Based Task Routing with Pipeline Feedback Loops
 * 
 * Inspired by:
 * - chatdev: role-based task distribution and phase-gated execution
 * - thunderbolt: pipeline architecture with feedback loops
 * - nanobot: distributed mesh coordination for task routing
 * 
 * Provides:
 * - Role-based task routing to specialized agents
 * - Pipeline stage management with feedback loops
 * - Task queue management with priority handling
 * - Workload-aware task assignment
 */

import type { MeshCoordinationState } from './AgentMeshCoordinator'

// =============================================================================
// Types
// =============================================================================

export type TaskPriority = 'low' | 'normal' | 'high' | 'critical'
export type TaskStatus = 'pending' | 'routed' | 'in_progress' | 'completed' | 'failed' | 'blocked'
export type TaskPhase = 'analysis' | 'drafting' | 'revision' | 'review' | 'finalization'

export interface Task {
  id: string
  title: string
  description: string
  targetRole: string
  priority: TaskPriority
  phase: TaskPhase
  status: TaskStatus
  assignedAgentId: string | null
  createdAt: number
  startedAt: number | null
  completedAt: number | null
  estimatedDurationMs: number
  actualDurationMs: number | null
  dependencies: string[]
  tags: string[]
  inputContext: Record<string, any>
  outputResult: any
  feedbackScore: number | null       // 0-100 from downstream
  retryCount: number
  maxRetries: number
  blockedReason: string | null
}

export interface PipelineStage {
  id: string
  name: string
  phase: TaskPhase
  responsibleRole: string
  requiredCapabilities: string[]
  taskQueue: Task[]
  activeTasks: Task[]
  completedTasks: string[]
  failedTasks: string[]
  throughput: number                  // tasks completed per window
  avgCompletionTime: number
  qualityScore: number               // 0-100
}

export interface TaskRouterState {
  tasks: Map<string, Task>
  taskQueue: Task[]
  stages: Map<string, PipelineStage>
  pipelineHealth: number              // 0-100
  totalTasksRouted: number
  totalTasksCompleted: number
  totalTasksFailed: number
  avgRoutingTime: number             // ms
  feedbackScores: number[]
}

export interface RoutingPolicy {
  strategy: 'workload_balanced' | 'skill_matched' | 'priority_first' | 'round_robin'
  allowCrossRoleAssignment: boolean
  maxConcurrentTasksPerAgent: number
  taskTimeoutMs: number
  enableFeedbackLoop: boolean
  feedbackWeight: number             // 0-1, how much feedback affects routing
}

export const DEFAULT_ROUTING_POLICY: RoutingPolicy = {
  strategy: 'workload_balanced',
  allowCrossRoleAssignment: false,
  maxConcurrentTasksPerAgent: 3,
  taskTimeoutMs: 300000,           // 5 min
  enableFeedbackLoop: true,
  feedbackWeight: 0.3,
}

// =============================================================================
// State Management
// =============================================================================

export function createEmptyTaskRouterState(): TaskRouterState {
  return {
    tasks: new Map(),
    taskQueue: [],
    stages: new Map(),
    pipelineHealth: 100,
    totalTasksRouted: 0,
    totalTasksCompleted: 0,
    totalTasksFailed: 0,
    avgRoutingTime: 0,
    feedbackScores: [],
  }
}

export function createTask(
  state: TaskRouterState,
  task: Omit<Task, 'id' | 'createdAt' | 'status' | 'assignedAgentId' | 'startedAt' | 'completedAt' | 'actualDurationMs' | 'feedbackScore' | 'retryCount' | 'blockedReason'>
): { state: TaskRouterState; taskId: string } {
  const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const fullTask: Task = {
    ...task,
    id,
    createdAt: Date.now(),
    status: 'pending',
    assignedAgentId: null,
    startedAt: null,
    completedAt: null,
    actualDurationMs: null,
    feedbackScore: null,
    retryCount: 0,
    blockedReason: null,
  }

  const newTasks = new Map(state.tasks)
  newTasks.set(id, fullTask)

  return {
    state: { ...state, tasks: newTasks, taskQueue: [...state.taskQueue, fullTask] },
    taskId: id,
  }
}

// =============================================================================
// Pipeline Stage Management
// =============================================================================

export function initializePipelineStage(
  state: TaskRouterState,
  stage: Omit<PipelineStage, 'taskQueue' | 'activeTasks' | 'completedTasks' | 'failedTasks' | 'throughput' | 'avgCompletionTime' | 'qualityScore'>
): TaskRouterState {
  const fullStage: PipelineStage = {
    ...stage,
    taskQueue: [],
    activeTasks: [],
    completedTasks: [],
    failedTasks: [],
    throughput: 0,
    avgCompletionTime: 0,
    qualityScore: 100,
  }

  const newStages = new Map(state.stages)
  newStages.set(stage.id, fullStage)

  return { ...state, stages: newStages }
}

export function getOrCreateStage(state: TaskRouterState, phase: TaskPhase, role: string): PipelineStage {
  const stageId = `${phase}_${role}`
  let stage = state.stages.get(stageId)

  if (!stage) {
    const newState = initializePipelineStage(state, {
      id: stageId,
      name: stageId,
      phase,
      responsibleRole: role,
      requiredCapabilities: [],
    })
    return newState.stages.get(stageId)!
  }

  return stage
}

// =============================================================================
// Task Routing
// =============================================================================

export function routeTask(
  state: TaskRouterState,
  taskId: string,
  agentId: string
): TaskRouterState {
  const task = state.tasks.get(taskId)
  if (!task) return state

  const updatedTask: Task = {
    ...task,
    status: 'routed',
    assignedAgentId: agentId,
  }

  const newTasks = new Map(state.tasks)
  newTasks.set(taskId, updatedTask)

  const newQueue = state.taskQueue.filter(t => t.id !== taskId)

  return {
    ...state,
    tasks: newTasks,
    taskQueue: newQueue,
    totalTasksRouted: state.totalTasksRouted + 1,
  }
}

export function startTask(
  state: TaskRouterState,
  taskId: string
): TaskRouterState {
  const task = state.tasks.get(taskId)
  if (!task) return state

  const updatedTask: Task = {
    ...task,
    status: 'in_progress',
    startedAt: Date.now(),
  }

  const newTasks = new Map(state.tasks)
  newTasks.set(taskId, updatedTask)

  return { ...state, tasks: newTasks }
}

export function completeTask(
  state: TaskRouterState,
  taskId: string,
  result: any,
  feedbackScore?: number
): TaskRouterState {
  const task = state.tasks.get(taskId)
  if (!task) return state

  const completedAt = Date.now()
  const updatedTask: Task = {
    ...task,
    status: 'completed',
    completedAt,
    actualDurationMs: task.startedAt ? completedAt - task.startedAt : null,
    outputResult: result,
    feedbackScore: feedbackScore ?? null,
  }

  const newTasks = new Map(state.tasks)
  newTasks.set(taskId, updatedTask)

  const newFeedbackScores = feedbackScore !== undefined
    ? [...state.feedbackScores, feedbackScore].slice(-100)
    : state.feedbackScores

  return {
    ...state,
    tasks: newTasks,
    totalTasksCompleted: state.totalTasksCompleted + 1,
    feedbackScores: newFeedbackScores,
  }
}

export function failTask(
  state: TaskRouterState,
  taskId: string,
  reason: string
): TaskRouterState {
  const task = state.tasks.get(taskId)
  if (!task) return state

  const shouldRetry = task.retryCount < task.maxRetries
  const updatedTask: Task = {
    ...task,
    status: shouldRetry ? 'pending' : 'failed',
    blockedReason: reason,
    retryCount: task.retryCount + (shouldRetry ? 1 : 0),
  }

  const newTasks = new Map(state.tasks)
  newTasks.set(taskId, updatedTask)

  const newQueue = shouldRetry
    ? [...state.taskQueue, updatedTask]
    : state.taskQueue

  return {
    ...state,
    tasks: newTasks,
    taskQueue: newQueue,
    totalTasksFailed: state.totalTasksFailed + (shouldRetry ? 0 : 1),
  }
}

// =============================================================================
// Task Selection Strategies
// =============================================================================

export function selectTaskByPriority(state: TaskRouterState, role: string): string | null {
  const roleTasks = state.taskQueue.filter(
    t => t.targetRole === role && t.status === 'pending'
  )

  if (roleTasks.length === 0) return null

  // Sort by priority (critical > high > normal > low)
  const priorityOrder: Record<TaskPriority, number> = {
    critical: 0,
    high: 1,
    normal: 2,
    low: 3,
  }

  return roleTasks.sort((a, b) =>
    priorityOrder[a.priority] - priorityOrder[b.priority]
  )[0].id
}

export function selectTaskBySkillMatch(state: TaskRouterState, role: string, agentCapabilities: string[]): string | null {
  const roleTasks = state.taskQueue.filter(
    t => t.targetRole === role && t.status === 'pending'
  )

  if (roleTasks.length === 0) return null

  // Score by tag overlap with agent capabilities
  const scored = roleTasks.map(task => ({
    taskId: task.id,
    score: task.tags.filter(tag => agentCapabilities.includes(tag)).length,
  }))

  scored.sort((a, b) => b.score - a.score)

  return scored[0].taskId
}

export function getPendingTaskCount(state: TaskRouterState, role: string): number {
  return state.taskQueue.filter(t => t.targetRole === role && t.status === 'pending').length
}

// =============================================================================
// Pipeline Health
// =============================================================================

export function calculatePipelineHealth(state: TaskRouterState): number {
  const stages = Array.from(state.stages.values())
  if (stages.length === 0) return 100

  // Calculate stage health
  const stageHealthScores = stages.map(s => {
    const activeRatio = 1 - (s.activeTasks.length / 10) // penalize too many active
    const qualityRatio = s.qualityScore / 100
    return (activeRatio * 0.3 + qualityRatio * 0.7)
  })

  const avgStageHealth = stageHealthScores.reduce((s, v) => s + v, 0) / stageHealthScores.length

  // Factor in completion rate
  const total = state.totalTasksCompleted + state.totalTasksFailed
  const completionRate = total > 0 ? state.totalTasksCompleted / total : 1

  // Factor in feedback scores
  const feedbackFactor = state.feedbackScores.length > 0
    ? state.feedbackScores.reduce((s, v) => s + v, 0) / state.feedbackScores.length / 100
    : 1

  return Math.round(
    (avgStageHealth * 0.3 + completionRate * 0.4 + feedbackFactor * 0.3) * 100
  )
}

export function recordStageFeedback(
  state: TaskRouterState,
  stageId: string,
  qualityScore: number
): TaskRouterState {
  const stage = state.stages.get(stageId)
  if (!stage) return state

  const newStages = new Map(state.stages)
  newStages.set(stageId, {
    ...stage,
    qualityScore: (stage.qualityScore * 0.7 + qualityScore * 0.3), // EMA
    throughput: stage.throughput + 1,
  })

  return {
    ...state,
    stages: newStages,
    pipelineHealth: calculatePipelineHealth({ ...state, stages: newStages }),
  }
}

// =============================================================================
// Formatters
// =============================================================================

export function formatRouterSummary(state: TaskRouterState): string {
  const lines = [
    '=== Task Router Summary ===',
    `Pipeline Health: ${state.pipelineHealth}/100`,
    `Tasks: ${state.totalTasksCompleted} completed, ${state.totalTasksFailed} failed, ${state.taskQueue.length} pending`,
    `Total Routed: ${state.totalTasksRouted}`,
    '',
    '--- Pipeline Stages ---',
  ]

  for (const [id, stage] of state.stages.entries()) {
    lines.push(
      `  ${id}: ${stage.activeTasks.length} active, ${stage.completedTasks.length} completed, quality=${stage.qualityScore.toFixed(1)}`
    )
  }

  return lines.join('\n')
}

export function formatTaskDetails(state: TaskRouterState, taskId: string): string {
  const task = state.tasks.get(taskId)
  if (!task) return `Task ${taskId} not found`

  return [
    `=== Task: ${task.id} ===`,
    `Title: ${task.title}`,
    `Role: ${task.targetRole} | Priority: ${task.priority} | Phase: ${task.phase}`,
    `Status: ${task.status}`,
    `Assigned: ${task.assignedAgentId ?? '(unassigned)'}`,
    `Created: ${new Date(task.createdAt).toLocaleTimeString()}`,
    `Duration: ${task.actualDurationMs ? `${task.actualDurationMs}ms` : '(in progress)'}`,
    `Retry: ${task.retryCount}/${task.maxRetries}`,
    task.blockedReason ? `Blocked: ${task.blockedReason}` : '',
  ].filter(Boolean).join('\n')
}