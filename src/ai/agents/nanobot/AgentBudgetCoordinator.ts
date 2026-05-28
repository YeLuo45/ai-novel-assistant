/**
 * AgentBudgetCoordinator - V122
 * Token Budget Management with Self-Regulation
 * 
 * Inspired by:
 * - claude-code: token budget tracking and management
 * - generic-agent: autonomous self-regulation and goal pursuit
 * - thunderbolt: feedback loops for adaptive resource allocation
 * 
 * Provides:
 * - Per-agent and per-session token budget tracking
 * - Self-regulatory mechanisms to stay within budget
 * - Budget alert thresholds and automatic throttling
 * - Token usage analytics and prediction
 */

import type { MeshCoordinationState } from './AgentMeshCoordinator'
import type { TaskRouterState } from './AgentTaskRouter'

// =============================================================================
// Types
// =============================================================================

export type BudgetAlertLevel = 'none' | 'warning' | 'critical' | 'exhausted'

export interface TokenBudget {
  agentId: string
  totalBudget: number           // max tokens allowed
  usedTokens: number           // tokens consumed
  reservedTokens: number       // tokens reserved for pending operations
  alertThreshold: number       // % at which to trigger warning (0-1)
  criticalThreshold: number     // % at which to trigger critical alert (0-1)
  alertLevel: BudgetAlertLevel
  lastAlertTime: number
  sessionStartTime: number
  requestCount: number
  avgTokensPerRequest: number
}

export interface BudgetPolicy {
  globalTokenLimit: number
  perAgentLimit: number
  reserveRatio: number         // 0-1, ratio to keep as reserve
  alertThresholds: {
    warning: number            // e.g., 0.7
    critical: number           // e.g., 0.9
  }
  autoThrottle: boolean        // enable automatic throttling
  throttleDelayMs: number      // delay between requests when throttled
  enablePrediction: boolean    // predict token needs
  predictionWindow: number     // number of past requests to analyze
}

export interface BudgetCoordinatorState {
  budgets: Map<string, TokenBudget>
  globalUsedTokens: number
  policy: BudgetPolicy
  throttleQueue: string[]      // agentIds waiting for throttled requests
  isThrottled: boolean
  totalRequestsProcessed: number
  totalTokensSpent: number
  budgetAlerts: BudgetAlert[]
}

export interface BudgetAlert {
  id: string
  agentId: string
  level: BudgetAlertLevel
  message: string
  timestamp: number
  tokensUsed: number
  tokensRemaining: number
  suggestedAction: string | null
}

// =============================================================================
// Default Policy
// =============================================================================

export const DEFAULT_BUDGET_POLICY: BudgetPolicy = {
  globalTokenLimit: 1000000,     // 1M tokens global
  perAgentLimit: 100000,         // 100K per agent
  reserveRatio: 0.1,             // keep 10% in reserve
  alertThresholds: {
    warning: 0.7,
    critical: 0.9,
  },
  autoThrottle: true,
  throttleDelayMs: 1000,
  enablePrediction: true,
  predictionWindow: 10,
}

// =============================================================================
// State Management
// =============================================================================

export function createEmptyBudgetCoordinatorState(policy?: Partial<BudgetPolicy>): BudgetCoordinatorState {
  return {
    budgets: new Map(),
    globalUsedTokens: 0,
    policy: { ...DEFAULT_BUDGET_POLICY, ...policy },
    throttleQueue: [],
    isThrottled: false,
    totalRequestsProcessed: 0,
    totalTokensSpent: 0,
    budgetAlerts: [],
  }
}

// =============================================================================
// Budget Initialization
// =============================================================================

export function initializeAgentBudget(
  state: BudgetCoordinatorState,
  agentId: string,
  customBudget?: number
): BudgetCoordinatorState {
  const limit = customBudget ?? state.policy.perAgentLimit

  const budget: TokenBudget = {
    agentId,
    totalBudget: limit,
    usedTokens: 0,
    reservedTokens: 0,
    alertThreshold: state.policy.alertThresholds.warning,
    criticalThreshold: state.policy.alertThresholds.critical,
    alertLevel: 'none',
    lastAlertTime: 0,
    sessionStartTime: Date.now(),
    requestCount: 0,
    avgTokensPerRequest: 0,
  }

  const newBudgets = new Map(state.budgets)
  newBudgets.set(agentId, budget)

  return { ...state, budgets: newBudgets }
}

export function removeAgentBudget(state: BudgetCoordinatorState, agentId: string): BudgetCoordinatorState {
  const newBudgets = new Map(state.budgets)
  newBudgets.delete(agentId)

  return { ...state, budgets: newBudgets }
}

// =============================================================================
// Token Consumption
// =============================================================================

export function consumeTokens(
  state: BudgetCoordinatorState,
  agentId: string,
  tokens: number
): BudgetCoordinatorState {
  const budget = state.budgets.get(agentId)
  if (!budget) return state

  const newUsed = budget.usedTokens + tokens
  const newAvg = budget.requestCount > 0
    ? (budget.avgTokensPerRequest * budget.requestCount + tokens) / (budget.requestCount + 1)
    : tokens

  const usageRatio = (newUsed + budget.reservedTokens) / budget.totalBudget

  let alertLevel: BudgetAlertLevel = 'none'
  if (usageRatio >= budget.criticalThreshold) {
    alertLevel = 'critical'
  } else if (usageRatio >= budget.alertThreshold) {
    alertLevel = 'warning'
  } else if (newUsed >= budget.totalBudget) {
    alertLevel = 'exhausted'
  }

  const updatedBudget: TokenBudget = {
    ...budget,
    usedTokens: newUsed,
    alertLevel,
    lastAlertTime: alertLevel !== 'none' ? Date.now() : budget.lastAlertTime,
    requestCount: budget.requestCount + 1,
    avgTokensPerRequest: newAvg,
  }

  const newBudgets = new Map(state.budgets)
  newBudgets.set(agentId, updatedBudget)

  const newAlerts = alertLevel !== 'none' && alertLevel !== budget.alertLevel
    ? [...state.budgetAlerts, createBudgetAlert(updatedBudget, alertLevel)]
    : state.budgetAlerts

  return {
    ...state,
    budgets: newBudgets,
    globalUsedTokens: state.globalUsedTokens + tokens,
    totalRequestsProcessed: state.totalRequestsProcessed + 1,
    totalTokensSpent: state.totalTokensSpent + tokens,
    budgetAlerts: newAlerts.slice(-50), // keep last 50 alerts
  }
}

export function reserveTokens(
  state: BudgetCoordinatorState,
  agentId: string,
  tokens: number
): BudgetCoordinatorState {
  const budget = state.budgets.get(agentId)
  if (!budget) return state

  const available = budget.totalBudget - budget.usedTokens - budget.reservedTokens
  const actualReserve = Math.min(tokens, available)

  const newBudgets = new Map(state.budgets)
  newBudgets.set(agentId, {
    ...budget,
    reservedTokens: budget.reservedTokens + actualReserve,
  })

  return { ...state, budgets: newBudgets }
}

export function releaseReservedTokens(
  state: BudgetCoordinatorState,
  agentId: string,
  tokens: number
): BudgetCoordinatorState {
  const budget = state.budgets.get(agentId)
  if (!budget) return state

  const newBudgets = new Map(state.budgets)
  newBudgets.set(agentId, {
    ...budget,
    reservedTokens: Math.max(0, budget.reservedTokens - tokens),
  })

  return { ...state, budgets: newBudgets }
}

// =============================================================================
// Budget Queries
// =============================================================================

export function getAvailableTokens(state: BudgetCoordinatorState, agentId: string): number {
  const budget = state.budgets.get(agentId)
  if (!budget) return 0

  return Math.max(0, budget.totalBudget - budget.usedTokens - budget.reservedTokens)
}

export function getUsageRatio(state: BudgetCoordinatorState, agentId: string): number {
  const budget = state.budgets.get(agentId)
  if (!budget) return 0

  return (budget.usedTokens + budget.reservedTokens) / budget.totalBudget
}

export function isWithinBudget(state: BudgetCoordinatorState, agentId: string, tokens: number): boolean {
  return getAvailableTokens(state, agentId) >= tokens
}

export function predictTokenNeed(state: BudgetCoordinatorState, agentId: string): number | null {
  const budget = state.budgets.get(agentId)
  if (!budget || !state.policy.enablePrediction) return null

  return Math.round(budget.avgTokensPerRequest * state.policy.predictionWindow)
}

// =============================================================================
// Throttling
// =============================================================================

export function shouldThrottle(state: BudgetCoordinatorState, agentId: string): boolean {
  if (!state.policy.autoThrottle) return false

  const budget = state.budgets.get(agentId)
  if (!budget) return false

  // Throttle if at or above critical threshold
  const usageRatio = (budget.usedTokens + budget.reservedTokens) / budget.totalBudget
  return usageRatio >= budget.criticalThreshold
}

export function enqueueForThrottle(state: BudgetCoordinatorState, agentId: string): BudgetCoordinatorState {
  if (state.throttleQueue.includes(agentId)) return state

  return {
    ...state,
    throttleQueue: [...state.throttleQueue, agentId],
    isThrottled: true,
  }
}

export function dequeueFromThrottle(state: BudgetCoordinatorState, agentId: string): BudgetCoordinatorState {
  const newQueue = state.throttleQueue.filter(id => id !== agentId)

  return {
    ...state,
    throttleQueue: newQueue,
    isThrottled: newQueue.length > 0,
  }
}

// =============================================================================
// Alert Generation
// =============================================================================

function createBudgetAlert(budget: TokenBudget, level: BudgetAlertLevel): BudgetAlert {
  const remaining = budget.totalBudget - budget.usedTokens - budget.reservedTokens
  const usagePercent = Math.round(((budget.usedTokens + budget.reservedTokens) / budget.totalBudget) * 100)

  let message: string
  let suggestedAction: string | null = null

  switch (level) {
    case 'warning':
      message = `Agent ${budget.agentId} at ${usagePercent}% budget usage`
      suggestedAction = 'Consider reducing output verbosity'
      break
    case 'critical':
      message = `Agent ${budget.agentId} at ${usagePercent}% - critical budget level`
      suggestedAction = 'Switch to concise mode immediately'
      break
    case 'exhausted':
      message = `Agent ${budget.agentId} exhausted budget`
      suggestedAction = 'Stop generating and finalize output'
      break
    default:
      message = ''
  }

  return {
    id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    agentId: budget.agentId,
    level,
    message,
    timestamp: Date.now(),
    tokensUsed: budget.usedTokens,
    tokensRemaining: remaining,
    suggestedAction,
  }
}

// =============================================================================
// Integration Helpers
// =============================================================================

export function syncFromMeshState(state: BudgetCoordinatorState, meshState: MeshCoordinationState): BudgetCoordinatorState {
  let newState = state

  // Add budgets for new agents
  for (const agentId of meshState.agents.keys()) {
    if (!newState.budgets.has(agentId)) {
      newState = initializeAgentBudget(newState, agentId)
    }
  }

  // Remove budgets for agents that left
  for (const agentId of newState.budgets.keys()) {
    if (!meshState.agents.has(agentId)) {
      newState = removeAgentBudget(newState, agentId)
    }
  }

  return newState
}

export function syncFromRouterState(state: BudgetCoordinatorState, routerState: TaskRouterState): BudgetCoordinatorState {
  // Reserve tokens based on in-progress tasks
  let newState = state

  for (const [taskId, task] of routerState.tasks.entries()) {
    if (task.status === 'in_progress' && task.assignedAgentId) {
      // Reserve based on estimated duration (rough token estimate)
      const estimatedTokens = Math.round(task.estimatedDurationMs / 100) // ~10 tokens/ms
      newState = reserveTokens(newState, task.assignedAgentId, estimatedTokens)
    }
  }

  return newState
}

// =============================================================================
// Formatters
// =============================================================================

export function formatBudgetSummary(state: BudgetCoordinatorState): string {
  const lines = [
    '=== Budget Coordinator Summary ===',
    `Global: ${state.globalUsedTokens.toLocaleString()} tokens used`,
    `Requests: ${state.totalRequestsProcessed} | Total Spent: ${state.totalTokensSpent.toLocaleString()}`,
    `Throttled: ${state.isThrottled ? 'YES' : 'NO'} (${state.throttleQueue.length} queued)`,
    '',
    '--- Agent Budgets ---',
  ]

  for (const [agentId, budget] of state.budgets.entries()) {
    const usagePercent = Math.round(((budget.usedTokens + budget.reservedTokens) / budget.totalBudget) * 100)
    const remaining = budget.totalBudget - budget.usedTokens - budget.reservedTokens
    lines.push(
      `  ${agentId}: ${usagePercent}% used, ${remaining.toLocaleString()} remaining, avg=${Math.round(budget.avgTokensPerRequest)}/req`
    )
  }

  return lines.join('\n')
}

export function formatAgentBudget(state: BudgetCoordinatorState, agentId: string): string {
  const budget = state.budgets.get(agentId)
  if (!budget) return `No budget found for ${agentId}`

  const usage = ((budget.usedTokens + budget.reservedTokens) / budget.totalBudget * 100).toFixed(1)
  const remaining = budget.totalBudget - budget.usedTokens - budget.reservedTokens

  return [
    `=== Budget: ${agentId} ===`,
    `Usage: ${usage}% | ${budget.usedTokens.toLocaleString()} / ${budget.totalBudget.toLocaleString()}`,
    `Available: ${remaining.toLocaleString()} tokens`,
    `Alert Level: ${budget.alertLevel}`,
    `Requests: ${budget.requestCount} | Avg: ${Math.round(budget.avgTokensPerRequest)} tokens/req`,
    budget.alertLevel !== 'none' ? `Last Alert: ${new Date(budget.lastAlertTime).toLocaleTimeString()}` : '',
  ].filter(Boolean).join('\n')
}

export function formatRecentAlerts(state: BudgetCoordinatorState): string {
  if (state.budgetAlerts.length === 0) return 'No recent budget alerts'

  const lines = ['=== Recent Budget Alerts ===']
  for (const alert of state.budgetAlerts.slice(-5).reverse()) {
    lines.push(`[${alert.level.toUpperCase()}] ${alert.message} - ${new Date(alert.timestamp).toLocaleTimeString()}`)
  }
  return lines.join('\n')
}