/**
 * EvolutionOrchestrationSuite - V116
 * Unified Evolution Orchestration Suite - Final Module of Evolution Iteration
 * 
 * Inspired by all 6 design systems:
 * - thunderbolt: pipeline + feedback loops
 * - nanobot: distributed mesh + autonomous specialization  
 * - chatdev: multi-agent coordination
 * - generic-agent: autonomous goal pursuit
 * - ruflo: hierarchical decomposition
 * - claude-code: feedback-driven iteration
 * 
 * This module orchestrates all evolution subsystems:
 * - SelfEvolutionEngine (pattern + skill evolution)
 * - HookLifecycleCoordinator (lifecycle orchestration)
 * - Quality + Tool + Analytics tracking
 */

import type { WritingSessionState } from '../session/WritingSessionManager'

// =============================================================================
// Types
// =============================================================================

export type OrchestrationPhase =
  | 'session_start'
  | 'session_update'
  | 'session_end'
  | 'quality_analyzed'
  | 'evolution_cycle'
  | 'tool_call'
  | 'daily_summary'

export interface EvolutionHealthScore {
  overall: number                    // 0-100
  selfEvolution: number
  qualityAnalysis: number
  toolEvolution: number
  lifecycleCoordination: number
  momentum: number
}

export interface OrchestrationState {
  phase: OrchestrationPhase
  orchestrationCount: number
  lastOrchestrationTime: number
  isProcessing: boolean
  healthScore: number
  recommendations: string[]
  criticalIssues: string[]
}

export interface EvolutionMetrics {
  cyclesCompleted: number
  patternsEvolved: number
  skillsTracked: number
  qualityAverage: number
  toolCallsTotal: number
  hooksRegistered: number
}

export const DEFAULT_ORCHESTRATION_CONFIG = {
  qualityGoodThreshold: 75,
  qualityWarningThreshold: 50,
  evolutionCycleIntervalMs: 60000,
  minHealthScoreForGood: 60,
}

// =============================================================================
// State Management
// =============================================================================

export function createEmptyOrchestrationState(): OrchestrationState {
  return {
    phase: 'session_start',
    orchestrationCount: 0,
    lastOrchestrationTime: 0,
    isProcessing: false,
    healthScore: 50,
    recommendations: [],
    criticalIssues: [],
  }
}

export function createEmptyEvolutionMetrics(): EvolutionMetrics {
  return {
    cyclesCompleted: 0,
    patternsEvolved: 0,
    skillsTracked: 0,
    qualityAverage: 0,
    toolCallsTotal: 0,
    hooksRegistered: 0,
  }
}

// =============================================================================
// Health Score Calculation
// =============================================================================

export function calculateHealthScore(
  qualityScore: number,
  evolutionCycles: number,
  toolCalls: number,
  hooksRegistered: number
): number {
  const qualityComponent = qualityScore * 0.4
  const evolutionComponent = Math.min(100, evolutionCycles * 10) * 0.2
  const toolComponent = Math.min(100, toolCalls * 0.5) * 0.2
  const hookComponent = Math.min(100, hooksRegistered * 5) * 0.2

  return Math.round(qualityComponent + evolutionComponent + toolComponent + hookComponent)
}

export function getHealthStatus(healthScore: number): {
  status: 'healthy' | 'moderate' | 'needs_attention' | 'critical'
  emoji: string
} {
  if (healthScore >= 70) return { status: 'healthy', emoji: '🟢' }
  if (healthScore >= 50) return { status: 'moderate', emoji: '🟡' }
  if (healthScore >= 30) return { status: 'needs_attention', emoji: '🟠' }
  return { status: 'critical', emoji: '🔴' }
}

export function getHealthRecommendations(healthScore: number, qualityAverage: number): string[] {
  const recommendations: string[] = []

  if (healthScore < 50) {
    recommendations.push('Consider running evolution cycle to improve pattern usage')
  }

  if (qualityAverage < 60) {
    recommendations.push('Focus on quality improvements - consider reviewing sentence structure')
  }

  if (healthScore >= 70) {
    recommendations.push('System is performing well - maintain current approach')
  }

  return recommendations
}

export function getCriticalIssues(healthScore: number, qualityAverage: number): string[] {
  const issues: string[] = []

  if (healthScore < 30) {
    issues.push('Health score critical - immediate intervention recommended')
  }

  if (qualityAverage < 40) {
    issues.push('Quality average very low - check writing session state')
  }

  return issues
}

// =============================================================================
// Phase Orchestration
// =============================================================================

export function advancePhase(state: OrchestrationState, nextPhase: OrchestrationPhase): OrchestrationState {
  return {
    ...state,
    phase: nextPhase,
    lastOrchestrationTime: Date.now(),
    orchestrationCount: state.orchestrationCount + 1,
  }
}

export function runOrchestrationCycle(state: OrchestrationState): OrchestrationState {
  if (state.isProcessing) return state

  // Run through phases in order
  const phases: OrchestrationPhase[] = [
    'session_start',
    'session_update',
    'quality_analyzed',
    'evolution_cycle',
    'tool_call',
    'daily_summary',
    'session_end',
  ]

  // Find next phase after current
  const currentIdx = phases.indexOf(state.phase)
  const nextPhase = currentIdx < phases.length - 1 ? phases[currentIdx + 1] : 'session_end'

  return advancePhase(state, nextPhase)
}

// =============================================================================
// Session Integration
// =============================================================================

export function updateStateFromSession(state: OrchestrationState, session: WritingSessionState): OrchestrationState {
  // Extract quality from session
  const qualityAverage = session.stagnationIndicator > 0.7
    ? 30
    : session.stagnationIndicator > 0.4
    ? 60
    : 80

  const newHealth = calculateHealthScore(
    qualityAverage,
    state.orchestrationCount,
    session.totalToolCalls,
    state.orchestrationCount
  )

  const recommendations = getHealthRecommendations(newHealth, qualityAverage)
  const criticalIssues = getCriticalIssues(newHealth, qualityAverage)

  return {
    ...state,
    healthScore: newHealth,
    recommendations,
    criticalIssues,
  }
}

// =============================================================================
// Formatting
// =============================================================================

export function formatOrchestrationSummary(state: OrchestrationState): string {
  const { status, emoji } = getHealthStatus(state.healthScore)

  const lines = [
    `=== Evolution Orchestration Suite ===`,
    `${emoji} Status: ${status.toUpperCase()} | Health: ${state.healthScore}/100`,
    `Phase: ${state.phase} | Cycles: ${state.orchestrationCount}`,
  ]

  if (state.recommendations.length > 0) {
    lines.push('')
    lines.push('Recommendations:')
    for (const rec of state.recommendations) {
      lines.push(`  - ${rec}`)
    }
  }

  if (state.criticalIssues.length > 0) {
    lines.push('')
    lines.push('Critical Issues:')
    for (const issue of state.criticalIssues) {
      lines.push(`  - ${issue}`)
    }
  }

  return lines.join('\n')
}

export function formatEvolutionMetrics(metrics: EvolutionMetrics): string {
  return [
    '=== Evolution Metrics ===',
    `Cycles Completed: ${metrics.cyclesCompleted}`,
    `Patterns Evolved: ${metrics.patternsEvolved}`,
    `Skills Tracked: ${metrics.skillsTracked}`,
    `Quality Average: ${metrics.qualityAverage}`,
    `Tool Calls Total: ${metrics.toolCallsTotal}`,
    `Hooks Registered: ${metrics.hooksRegistered}`,
  ].join('\n')
}

export function formatFullDashboard(state: OrchestrationState, metrics: EvolutionMetrics): string {
  const { status, emoji } = getHealthStatus(state.healthScore)

  return [
    '═══════════════════════════════════════',
    '   EVOLUTION ORCHESTRATION DASHBOARD   ',
    '═══════════════════════════════════════',
    '',
    `${emoji} System Status: ${status.toUpperCase()}`,
    `Overall Health: ${state.healthScore}/100`,
    `Current Phase: ${state.phase}`,
    `Orchestrations: ${state.orchestrationCount}`,
    '',
    '--- Evolution Metrics ---',
    `  Cycles: ${metrics.cyclesCompleted} | Patterns: ${metrics.patternsEvolved}`,
    `  Skills: ${metrics.skillsTracked} | Quality Avg: ${metrics.qualityAverage}`,
    `  Tool Calls: ${metrics.toolCallsTotal} | Hooks: ${metrics.hooksRegistered}`,
    '',
    state.recommendations.length > 0 ? '--- Recommendations ---' : '',
    ...state.recommendations.map(r => `  → ${r}`),
    state.criticalIssues.length > 0 ? '--- Critical Issues ---' : '',
    ...state.criticalIssues.map(i => `  ⚠ ${i}`),
    '',
    '═══════════════════════════════════════',
  ].filter(Boolean).join('\n')
}