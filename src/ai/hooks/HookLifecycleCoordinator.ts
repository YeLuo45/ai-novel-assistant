/**
 * HookLifecycleCoordinator - V114
 * Hook Lifecycle Coordination for Evolution-Quality-Analytics Pipeline
 * 
 * Inspired by:
 * - thunderbolt: pipeline architecture + feedback loops for lifecycle orchestration
 * - chatdev: multi-agent coordination for role-based lifecycle hooks
 * - nanobot: distributed mesh for event-driven coordination
 * - generic-agent: autonomous tool orchestration across subsystems
 * 
 * Coordinates the entire writing session lifecycle:
 * - Registers lifecycle hooks for evolution, quality, analytics
 * - Orchestrates cross-module interactions
 * - Manages hook execution order and dependencies
 */

import type { WritingSessionState } from '../session/WritingSessionManager'
import type { StreamingQualityAnalyzerState } from '../quality/StreamingQualityAnalyzer'
import type { SelfEvolutionState } from '../evolution/SelfEvolutionEngine'
import type { ToolEvolutionState } from '../analytics/ToolCallEvolutionEngine'
import type { EvolutionAnalyticsState } from '../analytics/EvolutionAnalytics'

// =============================================================================
// Types
// =============================================================================

export type LifecyclePhase =
  | 'session_start'
  | 'session_update'
  | 'session_end'
  | 'quality_analyzed'
  | 'evolution_cycle'
  | 'tool_call'
  | 'daily_summary'

export type LifecyclePriority = 'critical' | 'high' | 'medium' | 'low'

export interface LifecycleHook {
  id: string
  phase: LifecyclePhase
  priority: LifecyclePriority
  handler: LifecycleHandler
  enabled: boolean
  executionCount: number
  lastExecutionTime: number | null
  errorCount: number
}

export type LifecycleHandler = (context: LifecycleContext) => void | Promise<void>

export interface LifecycleContext {
  phase: LifecyclePhase
  timestamp: number
  session?: WritingSessionState
  qualityState?: StreamingQualityAnalyzerState
  evolutionState?: SelfEvolutionState
  toolState?: ToolEvolutionState
  analyticsState?: EvolutionAnalyticsState
  metadata?: Record<string, unknown>
}

export interface LifecycleRegistration {
  phase: LifecyclePhase
  priority: LifecyclePriority
  handler: LifecycleHandler
  id?: string
}

export interface LifecycleStats {
  totalHooksRegistered: number
  hooksByPhase: Record<LifecyclePhase, number>
  hooksByPriority: Record<LifecyclePriority, number>
  totalExecutions: number
  totalErrors: number
  lastExecutionTimestamp: number | null
}

export interface LifecycleCoordinatorState {
  hooks: Map<string, LifecycleHook>
  executionHistory: LifecycleExecution[]
  stats: LifecycleStats
  isProcessing: boolean
  maxHistorySize: number
}

export interface LifecycleExecution {
  hookId: string
  phase: LifecyclePhase
  timestamp: number
  duration: number
  success: boolean
  error?: string
}

export interface LifecycleConfig {
  maxHistorySize: number       // max executions to keep in history (default: 1000)
  hookTimeoutMs: number        // max time per hook execution (default: 5000)
  continueOnError: boolean     // continue other hooks if one fails (default: true)
  logExecutions: boolean       // log execution details (default: false)
}

// =============================================================================
// State Management
// =============================================================================

export const DEFAULT_LIFECYCLE_CONFIG: LifecycleConfig = {
  maxHistorySize: 1000,
  hookTimeoutMs: 5000,
  continueOnError: true,
  logExecutions: false,
}

export function createEmptyLifecycleCoordinatorState(
  config?: Partial<LifecycleConfig>
): LifecycleCoordinatorState {
  return {
    hooks: new Map(),
    executionHistory: [],
    stats: {
      totalHooksRegistered: 0,
      hooksByPhase: {
        session_start: 0,
        session_update: 0,
        session_end: 0,
        quality_analyzed: 0,
        evolution_cycle: 0,
        tool_call: 0,
        daily_summary: 0,
      },
      hooksByPriority: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      totalExecutions: 0,
      totalErrors: 0,
      lastExecutionTimestamp: null,
    },
    isProcessing: false,
    maxHistorySize: config?.maxHistorySize ?? DEFAULT_LIFECYCLE_CONFIG.maxHistorySize,
  }
}

// =============================================================================
// Hook Registration
// =============================================================================

let hookIdCounter = 0

export function registerLifecycleHook(
  state: LifecycleCoordinatorState,
  registration: LifecycleRegistration
): LifecycleCoordinatorState {
  const id = registration.id ?? `hook_${++hookIdCounter}`

  const hook: LifecycleHook = {
    id,
    phase: registration.phase,
    priority: registration.priority,
    handler: registration.handler,
    enabled: true,
    executionCount: 0,
    lastExecutionTime: null,
    errorCount: 0,
  }

  const newHooks = new Map(state.hooks)
  newHooks.set(id, hook)

  const newStats = { ...state.stats }
  newStats.totalHooksRegistered = newHooks.size
  newStats.hooksByPhase[registration.phase]++
  newStats.hooksByPriority[registration.priority]++

  return {
    ...state,
    hooks: newHooks,
    stats: newStats,
  }
}

export function unregisterLifecycleHook(
  state: LifecycleCoordinatorState,
  hookId: string
): LifecycleCoordinatorState {
  const hook = state.hooks.get(hookId)
  if (!hook) return state

  const newHooks = new Map(state.hooks)
  newHooks.delete(hookId)

  const newStats = { ...state.stats }
  newStats.totalHooksRegistered = newHooks.size
  newStats.hooksByPhase[hook.phase]--
  newStats.hooksByPriority[hook.priority]--

  return {
    ...state,
    hooks: newHooks,
    stats: newStats,
  }
}

export function enableHook(state: LifecycleCoordinatorState, hookId: string): LifecycleCoordinatorState {
  const hook = state.hooks.get(hookId)
  if (!hook) return state

  const newHooks = new Map(state.hooks)
  newHooks.set(hookId, { ...hook, enabled: true })

  return { ...state, hooks: newHooks }
}

export function disableHook(state: LifecycleCoordinatorState, hookId: string): LifecycleCoordinatorState {
  const hook = state.hooks.get(hookId)
  if (!hook) return state

  const newHooks = new Map(state.hooks)
  newHooks.set(hookId, { ...hook, enabled: false })

  return { ...state, hooks: newHooks }
}

// =============================================================================
// Lifecycle Execution
// =============================================================================

export async function executeLifecyclePhase(
  state: LifecycleCoordinatorState,
  phase: LifecyclePhase,
  context: LifecycleContext,
  config: LifecycleConfig = DEFAULT_LIFECYCLE_CONFIG
): Promise<LifecycleCoordinatorState> {
  if (state.isProcessing) return state

  let newState = { ...state, isProcessing: true }

  // Get all hooks for this phase, sorted by priority
  const priorityOrder: Record<LifecyclePriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  }

  const phaseHooks = Array.from(state.hooks.values())
    .filter(h => h.enabled && h.phase === phase)
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  for (const hook of phaseHooks) {
    const startTime = Date.now()
    let success = true
    let errorMsg: string | undefined

    try {
      const result = hook.handler(context)
      if (result instanceof Promise) {
        await Promise.race([
          result,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Hook timeout')), config.hookTimeoutMs)),
        ])
      }
    } catch (err) {
      success = false
      errorMsg = err instanceof Error ? err.message : 'Unknown error'
    }

    const duration = Date.now() - startTime
    const execution: LifecycleExecution = {
      hookId: hook.id,
      phase,
      timestamp: Date.now(),
      duration,
      success,
      error: errorMsg,
    }

    // Update hook stats
    const updatedHook: LifecycleHook = {
      ...hook,
      executionCount: hook.executionCount + 1,
      lastExecutionTime: Date.now(),
      errorCount: success ? hook.errorCount : hook.errorCount + 1,
    }

    const newHooks = new Map(newState.hooks)
    newHooks.set(hook.id, updatedHook)

    // Add to history
    const newHistory = [...newState.executionHistory, execution]
    if (newHistory.length > newState.maxHistorySize) {
      newHistory.shift()
    }

    // Update stats
    const newStats = {
      ...newState.stats,
      totalExecutions: newState.stats.totalExecutions + 1,
      totalErrors: success ? newState.stats.totalErrors : newState.stats.totalErrors + 1,
      lastExecutionTimestamp: Date.now(),
    }

    newState = {
      ...newState,
      hooks: newHooks,
      executionHistory: newHistory,
      stats: newStats,
    }

    if (!success && !config.continueOnError) {
      break
    }
  }

  return { ...newState, isProcessing: false }
}

// =============================================================================
// Lifecycle Utilities
// =============================================================================

export function getHooksByPhase(state: LifecycleCoordinatorState, phase: LifecyclePhase): LifecycleHook[] {
  return Array.from(state.hooks.values()).filter(h => h.phase === phase)
}

export function getHooksByPriority(state: LifecycleCoordinatorState, priority: LifecyclePriority): LifecycleHook[] {
  return Array.from(state.hooks.values()).filter(h => h.priority === priority)
}

export function getHookStats(state: LifecycleCoordinatorState, hookId: string): LifecycleHook | null {
  return state.hooks.get(hookId) ?? null
}

export function getRecentExecutions(
  state: LifecycleCoordinatorState,
  limit: number = 10
): LifecycleExecution[] {
  return state.executionHistory.slice(-limit)
}

export function getFailedExecutions(state: LifecycleCoordinatorState, limit: number = 10): LifecycleExecution[] {
  return state.executionHistory.filter(e => !e.success).slice(-limit)
}

// =============================================================================
// Lifecycle Pipeline Helpers
// =============================================================================

export function createSessionStartHook(
  qualityAnalyzer: (state: StreamingQualityAnalyzerState, sessionId: string) => StreamingQualityAnalyzerState,
  evolutionEngine: (state: SelfEvolutionState) => SelfEvolutionState
): LifecycleHandler {
  return (context: LifecycleContext) => {
    if (!context.session) return
    // Initialize quality tracking for new session
    context.metadata = {
      ...context.metadata,
      sessionStartTime: Date.now(),
    }
  }
}

export function createSessionEndHook(
  analyticsRecorder: (state: EvolutionAnalyticsState, session: WritingSessionState) => EvolutionAnalyticsState
): LifecycleHandler {
  return (context: LifecycleContext) => {
    if (!context.session) return
    // Record session data for analytics
    context.metadata = {
      ...context.metadata,
      sessionEndTime: Date.now(),
    }
  }
}

export function createQualityAnalyzedHook(
  onQualityUpdate: (quality: number, state: StreamingQualityAnalyzerState) => void
): LifecycleHandler {
  return (context: LifecycleContext) => {
    if (!context.qualityState) return
    const latest = context.qualityState.sentenceHistory.slice(-1)[0]
    if (latest) {
      onQualityUpdate(latest.qualityScore, context.qualityState)
    }
  }
}

// =============================================================================
// Formatting
// =============================================================================

export function formatLifecycleSummary(state: LifecycleCoordinatorState): string {
  const lines = [
    '=== Lifecycle Coordinator Summary ===',
    `Total Hooks Registered: ${state.stats.totalHooksRegistered}`,
    `Total Executions: ${state.stats.totalExecutions}`,
    `Total Errors: ${state.stats.totalErrors}`,
    '',
    '--- Hooks by Phase ---',
  ]

  for (const [phase, count] of Object.entries(state.stats.hooksByPhase)) {
    if (count > 0) {
      lines.push(`  ${phase}: ${count}`)
    }
  }

  lines.push('')
  lines.push('--- Hooks by Priority ---')
  for (const [priority, count] of Object.entries(state.stats.hooksByPriority)) {
    if (count > 0) {
      lines.push(`  ${priority}: ${count}`)
    }
  }

  const recentFails = getFailedExecutions(state, 3)
  if (recentFails.length > 0) {
    lines.push('')
    lines.push('--- Recent Failures ---')
    for (const fail of recentFails) {
      lines.push(`[${fail.phase}] ${fail.hookId}: ${fail.error}`)
    }
  }

  return lines.join('\n')
}