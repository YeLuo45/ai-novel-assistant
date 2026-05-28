/**
 * ToolChainOrchestrator - V130
 * Automatic Tool Chain Execution Engine
 * 
 * Inspired by:
 * - thunderbolt: pipeline feedback loops and automatic execution orchestration
 * - claude-code: tool chain execution with automatic fallbacks
 * - nanobot: distributed mesh tool sharing and parallel execution
 * 
 * Provides:
 * - Automatic tool chain execution with dependency resolution
 * - Parallel group execution (within groups)
 * - Sequential execution (across groups)
 * - Automatic fallback to alternative tools
 * - Execution state machine: pending -> running -> completed/failed
 * - Tool chain progress tracking
 */

import type { ToolRegistryState } from './ToolRegistry'

// =============================================================================
// Types
// =============================================================================

export type ChainExecutionStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
export type StepExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'waiting'

export interface ToolChainExecution {
  id: string
  chainId: string
  status: ChainExecutionStatus
  startedAt: number | null
  completedAt: number | null
  currentStepIndex: number
  stepResults: Map<number, StepResult>
  totalTokensSpent: number
  error: string | null
  fallbackCount: number
  agentId: string | null
}

export interface StepResult {
  stepIndex: number
  toolId: string
  status: StepExecutionStatus
  startedAt: number | null
  completedAt: number | null
  output: Record<string, any> | null
  error: string | null
  fallbackUsed: boolean
  fallbackToolId: string | null
  tokensSpent: number
}

export interface ToolChainOrchestratorState {
  activeExecutions: Map<string, ToolChainExecution>
  executionHistory: string[]      // execution IDs, most recent first
  maxConcurrentExecutions: number
  defaultTimeoutMs: number
  enableFallbacks: boolean
  maxRetriesPerStep: number
}

// =============================================================================
// State Management
// =============================================================================

export function createEmptyOrchestratorState(): ToolChainOrchestratorState {
  return {
    activeExecutions: new Map(),
    executionHistory: [],
    maxConcurrentExecutions: 5,
    defaultTimeoutMs: 300000,      // 5 minutes
    enableFallbacks: true,
    maxRetriesPerStep: 2,
  }
}

// =============================================================================
// Chain Execution Lifecycle
// =============================================================================

export function startChainExecution(
  state: ToolChainOrchestratorState,
  chainId: string,
  agentId?: string
): { state: ToolChainOrchestratorState; executionId: string } {
  const id = `chain_exec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  const execution: ToolChainExecution = {
    id,
    chainId,
    status: 'pending',
    startedAt: null,
    completedAt: null,
    currentStepIndex: 0,
    stepResults: new Map(),
    totalTokensSpent: 0,
    error: null,
    fallbackCount: 0,
    agentId: agentId ?? null,
  }

  const newActive = new Map(state.activeExecutions)
  newActive.set(id, execution)

  return {
    state: {
      ...state,
      activeExecutions: newActive,
    },
    executionId: id,
  }
}

export function beginChainExecution(
  state: ToolChainOrchestratorState,
  executionId: string
): ToolChainOrchestratorState {
  const exec = state.activeExecutions.get(executionId)
  if (!exec) return state

  const newActive = new Map(state.activeExecutions)
  newActive.set(executionId, {
    ...exec,
    status: 'running',
    startedAt: Date.now(),
  })

  return { ...state, activeExecutions: newActive }
}

export function recordStepStart(
  state: ToolChainOrchestratorState,
  executionId: string,
  stepIndex: number,
  toolId: string
): ToolChainOrchestratorState {
  const exec = state.activeExecutions.get(executionId)
  if (!exec) return state

  const stepResult: StepResult = {
    stepIndex,
    toolId,
    status: 'running',
    startedAt: Date.now(),
    completedAt: null,
    output: null,
    error: null,
    fallbackUsed: false,
    fallbackToolId: null,
    tokensSpent: 0,
  }

  const newResults = new Map(exec.stepResults)
  newResults.set(stepIndex, stepResult)

  const newActive = new Map(state.activeExecutions)
  newActive.set(executionId, {
    ...exec,
    currentStepIndex: stepIndex,
    stepResults: newResults,
  })

  return { ...state, activeExecutions: newActive }
}

export function recordStepCompletion(
  state: ToolChainOrchestratorState,
  executionId: string,
  stepIndex: number,
  output: Record<string, any>,
  tokensSpent: number
): ToolChainOrchestratorState {
  const exec = state.activeExecutions.get(executionId)
  if (!exec) return state

  const existing = exec.stepResults.get(stepIndex)
  if (!existing) return state

  const stepResult: StepResult = {
    ...existing,
    status: 'completed',
    completedAt: Date.now(),
    output,
    tokensSpent,
  }

  const newResults = new Map(exec.stepResults)
  newResults.set(stepIndex, stepResult)

  const newActive = new Map(state.activeExecutions)
  newActive.set(executionId, {
    ...exec,
    stepResults: newResults,
    totalTokensSpent: exec.totalTokensSpent + tokensSpent,
  })

  return { ...state, activeExecutions: newActive }
}

export function recordStepFailure(
  state: ToolChainOrchestratorState,
  executionId: string,
  stepIndex: number,
  error: string,
  fallbackToolId?: string
): ToolChainOrchestratorState {
  const exec = state.activeExecutions.get(executionId)
  if (!exec) return state

  const existing = exec.stepResults.get(stepIndex)
  if (!existing) return state

  const stepResult: StepResult = {
    ...existing,
    status: 'failed',
    completedAt: Date.now(),
    error,
    fallbackUsed: !!fallbackToolId,
    fallbackToolId: fallbackToolId ?? null,
  }

  const newResults = new Map(exec.stepResults)
  newResults.set(stepIndex, stepResult)

  const newActive = new Map(state.activeExecutions)
  newActive.set(executionId, {
    ...exec,
    stepResults: newResults,
    fallbackCount: fallbackToolId ? exec.fallbackCount + 1 : exec.fallbackCount,
  })

  return { ...state, activeExecutions: newActive }
}

export function completeChainExecution(
  state: ToolChainOrchestratorState,
  executionId: string,
  success: boolean,
  error?: string
): ToolChainOrchestratorState {
  const exec = state.activeExecutions.get(executionId)
  if (!exec) return state

  const completed: ToolChainExecution = {
    ...exec,
    status: success ? 'completed' : 'failed',
    completedAt: Date.now(),
    error: error ?? null,
  }

  const newActive = new Map(state.activeExecutions)
  newActive.delete(executionId)

  const newHistory = [executionId, ...state.executionHistory].slice(0, 100)

  return {
    ...state,
    activeExecutions: newActive,
    executionHistory: newHistory,
  }
}

export function cancelChainExecution(
  state: ToolChainOrchestratorState,
  executionId: string
): ToolChainOrchestratorState {
  const exec = state.activeExecutions.get(executionId)
  if (!exec) return state

  const newActive = new Map(state.activeExecutions)
  newActive.delete(executionId)

  const newHistory = [executionId, ...state.executionHistory].slice(0, 100)

  return {
    ...state,
    activeExecutions: newActive,
    executionHistory: newHistory,
  }
}

// =============================================================================
// Step Dependency Resolution
// =============================================================================

export interface ResolvedStep {
  index: number
  toolId: string
  canExecute: boolean
  blockedBy: number[]        // step indices that must complete first
}

export function resolveStepDependencies(
  toolRegistry: ToolRegistryState,
  chainId: string,
  completedSteps: Set<number>
): ResolvedStep[] {
  const chain = toolRegistry.chains.get(chainId)
  if (!chain) return []

  const results: ResolvedStep[] = []

  for (let i = 0; i < chain.steps.length; i++) {
    const step = chain.steps[i]
    if (completedSteps.has(i)) {
      results.push({ index: i, toolId: step.toolId, canExecute: false, blockedBy: [] })
      continue
    }

    const blockedBy: number[] = []
    for (const dep of step.dependsOn) {
      const depIndex = chain.steps.findIndex(s => s.toolId === dep)
      if (depIndex !== -1 && !completedSteps.has(depIndex)) {
        blockedBy.push(depIndex)
      }
    }

    const canExecute = blockedBy.length === 0
    results.push({ index: i, toolId: step.toolId, canExecute, blockedBy })
  }

  return results
}

export function getNextExecutableSteps(
  toolRegistry: ToolRegistryState,
  chainId: string,
  completedSteps: Set<number>
): number[] {
  const resolved = resolveStepDependencies(toolRegistry, chainId, completedSteps)
  return resolved.filter(r => r.canExecute).map(r => r.index)
}

// =============================================================================
// Parallel Group Execution
// =============================================================================

export interface ParallelGroup {
  groupNumber: number
  stepIndices: number[]
  toolIds: string[]
}

export function groupStepsByParallelism(
  toolRegistry: ToolRegistryState,
  chainId: string,
  pendingSteps: number[]
): ParallelGroup[] {
  const chain = toolRegistry.chains.get(chainId)
  if (!chain) return []

  const groups: Map<number, number[]> = new Map()
  const stepToGroup: Map<number, number> = new Map()

  for (const stepIdx of pendingSteps) {
    const step = chain.steps[stepIdx]
    const groupNum = step.parallelGroup ?? stepIdx  // null = sequential, use stepIdx

    if (!groups.has(groupNum)) {
      groups.set(groupNum, [])
    }
    groups.get(groupNum)!.push(stepIdx)
    stepToGroup.set(stepIdx, groupNum)
  }

  const result: ParallelGroup[] = []
  for (const [groupNum, indices] of Array.from(groups.entries())) {
    result.push({
      groupNumber: groupNum,
      stepIndices: indices.sort((a, b) => a - b),
      toolIds: indices.map(i => chain.steps[i].toolId),
    })
  }

  return result.sort((a, b) => a.groupNumber - b.groupNumber)
}

// =============================================================================
// Execution State Queries
// =============================================================================

export function getExecutionProgress(
  state: ToolChainOrchestratorState,
  executionId: string
): { current: number; total: number; percentage: number } | null {
  const exec = state.activeExecutions.get(executionId)
  if (!exec) return null

  // We don't know total steps without chain reference
  // Return based on completed step results
  const completedCount = Array.from(exec.stepResults.values())
    .filter(r => r.status === 'completed' || r.status === 'failed').length

  return {
    current: completedCount,
    total: exec.stepResults.size,
    percentage: exec.stepResults.size > 0
      ? Math.round((completedCount / exec.stepResults.size) * 100)
      : 0,
  }
}

export function getActiveExecutionCount(state: ToolChainOrchestratorState): number {
  return state.activeExecutions.size
}

export function isChainExecuting(state: ToolChainOrchestratorState, chainId: string): boolean {
  for (const exec of Array.from(state.activeExecutions.values())) {
    if (exec.chainId === chainId) return true
  }
  return false
}

// =============================================================================
// Formatters
// =============================================================================

export function formatExecutionProgress(state: ToolChainOrchestratorState, executionId: string): string {
  const exec = state.activeExecutions.get(executionId)
  if (!exec) return `Execution ${executionId} not found`

  const completed = Array.from(exec.stepResults.values())
    .filter(r => r.status === 'completed').length
  const failed = Array.from(exec.stepResults.values())
    .filter(r => r.status === 'failed').length
  const running = Array.from(exec.stepResults.values())
    .filter(r => r.status === 'running').length

  const lines = [
    `=== Chain Execution: ${executionId} ===`,
    `Chain: ${exec.chainId} | Status: ${exec.status}`,
    `Started: ${exec.startedAt ? new Date(exec.startedAt).toLocaleString() : 'Not started'}`,
    `Steps: ${completed} completed | ${failed} failed | ${running} running`,
    `Fallbacks: ${exec.fallbackCount} | Tokens: ${exec.totalTokensSpent}`,
    exec.error ? `Error: ${exec.error}` : '',
  ]

  return lines.filter(Boolean).join('\n')
}

export function formatOrchestratorDashboard(state: ToolChainOrchestratorState): string {
  const lines = [
    '=== Tool Chain Orchestrator Dashboard ===',
    `Active Executions: ${state.activeExecutions.size}`,
    `History Size: ${state.executionHistory.length}`,
    `Max Concurrent: ${state.maxConcurrentExecutions}`,
    `Default Timeout: ${state.defaultTimeoutMs}ms`,
    '',
  ]

  if (state.activeExecutions.size > 0) {
    lines.push('--- Active Executions ---')
    for (const exec of Array.from(state.activeExecutions.values())) {
      const progress = getExecutionProgress(state, exec.id)
      lines.push(`  ${exec.chainId}: ${exec.status} ${progress ? `(${progress.percentage}%)` : ''}`)
    }
  } else {
    lines.push('No active executions')
  }

  return lines.join('\n')
}