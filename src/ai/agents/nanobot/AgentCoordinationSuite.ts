/**
 * AgentCoordinationSuite - V124
 * Unified Multi-Agent Coordination Hub
 * 
 * Inspired by:
 * - ruflo: hierarchical decomposition and orchestration
 * - chatdev: multi-agent coordination and role specialization
 * - nanobot: distributed mesh networking
 * 
 * Provides a unified interface combining:
 * - AgentMeshCoordinator: distributed mesh with message routing
 * - AgentTaskRouter: role-based task pipeline management
 * - AgentBudgetCoordinator: token budget self-regulation
 * 
 * This is the top-level orchestration layer for multi-agent writing teams.
 */

import type { MeshCoordinationState, AgentRole, MeshAgent, AgentMessage } from './AgentMeshCoordinator'
import type { TaskRouterState, Task, TaskPhase } from './AgentTaskRouter'
import type { BudgetCoordinatorState } from './AgentBudgetCoordinator'

// =============================================================================
// Types
// =============================================================================

export type CoordinationMode = 'centralized' | 'distributed' | 'hierarchical' | 'hybrid'

export interface CoordinationConfig {
  mode: CoordinationMode
  maxAgents: number
  enableBudgetEnforcement: boolean
  enableTaskRouting: boolean
  enableMeshNetworking: boolean
  allowCrossRoleTasks: boolean
  autoScaleAgents: boolean
  scaleThreshold: number       // workload % at which to scale up
}

export const DEFAULT_COORDINATION_CONFIG: CoordinationConfig = {
  mode: 'distributed',
  maxAgents: 20,
  enableBudgetEnforcement: true,
  enableTaskRouting: true,
  enableMeshNetworking: true,
  allowCrossRoleTasks: false,
  autoScaleAgents: false,
  scaleThreshold: 85,
}

// =============================================================================
// Suite State
// =============================================================================

export interface AgentCoordinationSuiteState {
  mesh: MeshCoordinationState
  router: TaskRouterState
  budget: BudgetCoordinatorState
  config: CoordinationConfig
  coordinationHealth: number   // 0-100
  totalCoordinationCycles: number
  activeAgents: string[]
  pendingTasks: number
  completedTasks: number
  failedTasks: number
}

export function createEmptyCoordinationSuiteState(
  config?: Partial<CoordinationConfig>
): AgentCoordinationSuiteState {
  return {
    mesh: {
      agents: new Map(),
      agentRegistry: new Map(),
      messages: [],
      messageQueue: [],
      totalMessages: 0,
      meshHealth: 100,
      coordinators: new Set(),
      pendingMessages: 0,
      broadcastCount: 0,
      deliveredCount: 0,
      failedDeliveryCount: 0,
    },
    router: {
      tasks: new Map(),
      taskQueue: [],
      stages: new Map(),
      pipelineHealth: 100,
      totalTasksRouted: 0,
      totalTasksCompleted: 0,
      totalTasksFailed: 0,
      avgRoutingTime: 0,
      feedbackScores: [],
    },
    budget: {
      budgets: new Map(),
      globalUsedTokens: 0,
      policy: {
        globalTokenLimit: 1000000,
        perAgentLimit: 100000,
        reserveRatio: 0.1,
        alertThresholds: { warning: 0.7, critical: 0.9 },
        autoThrottle: true,
        throttleDelayMs: 1000,
        enablePrediction: true,
        predictionWindow: 10,
      },
      throttleQueue: [],
      isThrottled: false,
      totalRequestsProcessed: 0,
      totalTokensSpent: 0,
      budgetAlerts: [],
    },
    config: { ...DEFAULT_COORDINATION_CONFIG, ...config },
    coordinationHealth: 100,
    totalCoordinationCycles: 0,
    activeAgents: [],
    pendingTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
  }
}

// =============================================================================
// Agent Management (delegates to Mesh)
// =============================================================================

export function registerAgentToSuite(
  state: AgentCoordinationSuiteState,
  agent: MeshAgent
): AgentCoordinationSuiteState {
  // Register in mesh
  const newMeshAgents = new Map(state.mesh.agents)
  newMeshAgents.set(agent.id, agent)

  const newRegistry = new Map(state.mesh.agentRegistry)
  const existing = newRegistry.get(agent.role) ?? []
  if (!existing.includes(agent.id)) {
    newRegistry.set(agent.role, [...existing, agent.id])
  }

  // Initialize budget
  const newBudgets = new Map(state.budget.budgets)
  newBudgets.set(agent.id, {
    agentId: agent.id,
    totalBudget: state.budget.policy.perAgentLimit,
    usedTokens: 0,
    reservedTokens: 0,
    alertThreshold: 0.7,
    criticalThreshold: 0.9,
    alertLevel: 'none',
    lastAlertTime: 0,
    sessionStartTime: Date.now(),
    requestCount: 0,
    avgTokensPerRequest: 0,
  })

  return {
    ...state,
    mesh: { ...state.mesh, agents: newMeshAgents, agentRegistry: newRegistry },
    budget: { ...state.budget, budgets: newBudgets },
    activeAgents: [...state.activeAgents.filter(id => id !== agent.id), agent.id],
  }
}

export function unregisterAgentFromSuite(
  state: AgentCoordinationSuiteState,
  agentId: string
): AgentCoordinationSuiteState {
  const agent = state.mesh.agents.get(agentId)
  if (!agent) return state

  const newMeshAgents = new Map(state.mesh.agents)
  newMeshAgents.delete(agentId)

  const newRegistry = new Map(state.mesh.agentRegistry)
  const roleAgents = newRegistry.get(agent.role) ?? []
  newRegistry.set(agent.role, roleAgents.filter(id => id !== agentId))

  const newBudgets = new Map(state.budget.budgets)
  newBudgets.delete(agentId)

  return {
    ...state,
    mesh: { ...state.mesh, agents: newMeshAgents, agentRegistry: newRegistry },
    budget: { ...state.budget, budgets: newBudgets },
    activeAgents: state.activeAgents.filter(id => id !== agentId),
  }
}

// =============================================================================
// Task Routing (delegates to Router + Budget)
// =============================================================================

export function submitTaskToSuite(
  state: AgentCoordinationSuiteState,
  task: Omit<Task, 'id' | 'createdAt' | 'status' | 'assignedAgentId' | 'startedAt' | 'completedAt' | 'actualDurationMs' | 'feedbackScore' | 'retryCount' | 'blockedReason'>
): { state: AgentCoordinationSuiteState; taskId: string } {
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

  const newTasks = new Map(state.router.tasks)
  newTasks.set(id, fullTask)

  return {
    state: {
      ...state,
      router: {
        ...state.router,
        tasks: newTasks,
        taskQueue: [...state.router.taskQueue, fullTask],
      },
      pendingTasks: state.pendingTasks + 1,
    },
    taskId: id,
  }
}

export function routeTaskToAgent(
  state: AgentCoordinationSuiteState,
  taskId: string,
  agentId: string
): AgentCoordinationSuiteState {
  const task = state.router.tasks.get(taskId)
  if (!task) return state

  const updatedTask: Task = { ...task, status: 'routed', assignedAgentId: agentId }

  const newTasks = new Map(state.router.tasks)
  newTasks.set(taskId, updatedTask)

  const newQueue = state.router.taskQueue.filter(t => t.id !== taskId)

  // Reserve budget for estimated tokens
  const estimatedTokens = Math.round(task.estimatedDurationMs / 100)
  const budget = state.budget.budgets.get(agentId)
  const newReserved = budget ? budget.reservedTokens + estimatedTokens : 0

  const newBudgets = new Map(state.budget.budgets)
  if (budget) {
    newBudgets.set(agentId, { ...budget, reservedTokens: newReserved })
  }

  return {
    ...state,
    router: { ...state.router, tasks: newTasks, taskQueue: newQueue, totalTasksRouted: state.router.totalTasksRouted + 1 },
    budget: { ...state.budget, budgets: newBudgets },
  }
}

export function completeSuiteTask(
  state: AgentCoordinationSuiteState,
  taskId: string,
  result: any,
  feedbackScore?: number
): AgentCoordinationSuiteState {
  const task = state.router.tasks.get(taskId)
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

  const newTasks = new Map(state.router.tasks)
  newTasks.set(taskId, updatedTask)

  // Release reserved tokens
  let newBudgets = state.budget.budgets
  if (task.assignedAgentId) {
    const estimatedTokens = Math.round(task.estimatedDurationMs / 100)
    const budget = newBudgets.get(task.assignedAgentId)
    if (budget) {
      newBudgets = new Map(newBudgets)
      newBudgets.set(task.assignedAgentId, {
        ...budget,
        reservedTokens: Math.max(0, budget.reservedTokens - estimatedTokens),
      })
    }
  }

  // Record feedback
  let newFeedbackScores = state.router.feedbackScores
  if (feedbackScore !== undefined) {
    newFeedbackScores = [...newFeedbackScores, feedbackScore].slice(-100)
  }

  const newAlerts = feedbackScore !== undefined && feedbackScore < 70
    ? [...state.budget.budgetAlerts, {
        id: `alert_${Date.now()}`,
        agentId: task.assignedAgentId ?? 'unknown',
        level: (feedbackScore < 50 ? 'critical' : 'warning') as 'critical' | 'warning',
        message: `Task ${taskId} completed with low score: ${feedbackScore}`,
        timestamp: Date.now(),
        tokensUsed: 0,
        tokensRemaining: 0,
        suggestedAction: 'Review task quality',
      }].slice(-50)
    : state.budget.budgetAlerts

  return {
    ...state,
    router: {
      ...state.router,
      tasks: newTasks,
      totalTasksCompleted: state.router.totalTasksCompleted + 1,
      feedbackScores: newFeedbackScores,
    },
    budget: { ...state.budget, budgets: newBudgets, budgetAlerts: newAlerts },
    completedTasks: state.completedTasks + 1,
    pendingTasks: Math.max(0, state.pendingTasks - 1),
  }
}

// =============================================================================
// Budget Enforcement
// =============================================================================

export function enforceBudgetLimits(state: AgentCoordinationSuiteState): AgentCoordinationSuiteState {
  if (!state.config.enableBudgetEnforcement) return state

  let newBudgets = new Map(state.budget.budgets)
  let hasChanges = false

  for (const pair of Array.from(newBudgets.entries())) {
    const agentId = pair[0]
    const budget = pair[1]
    const usageRatio = (budget.usedTokens + budget.reservedTokens) / budget.totalBudget

    if (usageRatio >= budget.criticalThreshold) {
      // Mark agent as busy to prevent new task assignment
      const meshAgent = state.mesh.agents.get(agentId)
      if (meshAgent && meshAgent.status !== 'busy') {
        const newMeshAgents = new Map(state.mesh.agents)
        newMeshAgents.set(agentId, { ...meshAgent, status: 'busy' })
        state = { ...state, mesh: { ...state.mesh, agents: newMeshAgents } }
      }
      hasChanges = true
    }
  }

  // Convert back
  const finalBudgets = new Map<string, typeof state.budget.budgets extends Map<string, infer V> ? V : never>()
  for (const pair of Array.from(newBudgets.entries())) { finalBudgets.set(pair[0], pair[1]) }

  return { ...state, budget: { ...state.budget, budgets: finalBudgets } }
}

// =============================================================================
// Health Calculation
// =============================================================================

export function calculateSuiteHealth(state: AgentCoordinationSuiteState): number {
  const meshHealth = state.mesh.meshHealth
  const pipelineHealth = state.router.pipelineHealth
  const budgetHealth = state.budget.budgets.size > 0
    ? (1 - state.budget.globalUsedTokens / state.budget.policy.globalTokenLimit) * 100
    : 100

  const onlineRatio = state.activeAgents.length > 0
    ? Array.from(state.mesh.agents.values()).filter(a => a.isOnline).length / state.activeAgents.length
    : 1

  const completionRate = (state.completedTasks + state.failedTasks) > 0
    ? state.completedTasks / (state.completedTasks + state.failedTasks)
    : 1

  return Math.round(
    (meshHealth * 0.25 + pipelineHealth * 0.25 + budgetHealth * 0.25 + onlineRatio * 100 * 0.15 + completionRate * 100 * 0.1)
  )
}

// =============================================================================
// Formatters
// =============================================================================

export function formatSuiteSummary(state: AgentCoordinationSuiteState): string {
  const health = calculateSuiteHealth(state)

  const lines = [
    '=== Agent Coordination Suite ===',
    `Mode: ${state.config.mode} | Health: ${health}/100`,
    `Agents: ${state.activeAgents.length} active | Tasks: ${state.pendingTasks} pending, ${state.completedTasks} completed, ${state.failedTasks} failed`,
    '',
    '--- Mesh Health ---',
    `  ${state.mesh.agents.size} registered | ${state.mesh.totalMessages} messages | ${state.mesh.pendingMessages} pending`,
    '',
    '--- Budget ---',
    `  Global: ${state.budget.globalUsedTokens.toLocaleString()} tokens | ${state.budget.totalRequestsProcessed} requests`,
    '',
    '--- Pipeline ---',
    `  Routed: ${state.router.totalTasksRouted} | Completed: ${state.router.totalTasksCompleted} | Failed: ${state.router.totalTasksFailed}`,
  ]

  return lines.join('\n')
}

export function formatAgentStatus(state: AgentCoordinationSuiteState, agentId: string): string {
  const meshAgent = state.mesh.agents.get(agentId)
  const budget = state.budget.budgets.get(agentId)
  const pendingCount = Array.from(state.router.tasks.values()).filter(
    t => t.assignedAgentId === agentId && t.status === 'in_progress'
  ).length

  if (!meshAgent) return `Agent ${agentId} not found in suite`

  const budgetUsed = budget
    ? `${((budget.usedTokens / budget.totalBudget) * 100).toFixed(1)}%`
    : 'N/A'

  return [
    `=== Agent: ${agentId} ===`,
    `Role: ${meshAgent.role} | Status: ${meshAgent.status} | Online: ${meshAgent.isOnline}`,
    `Workload: ${meshAgent.workload}% | Tasks in progress: ${pendingCount}`,
    `Budget: ${budgetUsed} | Success rate: ${(meshAgent.successRate * 100).toFixed(1)}%`,
  ].join('\n')
}