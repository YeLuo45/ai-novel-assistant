/**
 * AgentPerformanceEvaluator - V134
 * Hierarchical Agent Lifecycle & Performance Tracking
 * 
 * Inspired by:
 * - ruflo: hierarchical decomposition and orchestration
 * - chatdev: agent role specialization and lifecycle management
 * - nanobot: distributed agent mesh with health tracking
 * - thunderbolt: pipeline feedback loops for continuous improvement
 * - generic-agent: autonomous goal pursuit with self-evaluation
 */

import type { AgentCoordinationSuiteState } from './AgentCoordinationSuite'

export type AgentLifecycleState = 'active' | 'cooling_down' | 'retired' | 'reassigned'
export type SpecializationFocus = 'writing' | 'editing' | 'world_building' | 'plotting' | 'dialogue' | 'description' | 'research'
export type PerformanceDimension = 'speed' | 'quality' | 'reliability' | 'creativity' | 'collaboration'

export interface AgentPerformanceRecord {
  agentId: string
  lifecycleState: AgentLifecycleState
  currentSpecialization: SpecializationFocus
  performanceScores: Map<PerformanceDimension, number>
  historicalScores: Array<{ timestamp: number; scores: Record<PerformanceDimension, number> }>
  totalTasksCompleted: number
  totalTasksFailed: number
  averageResponseTimeMs: number
  lastActiveAt: number
  cooldownUntil: number | null
  specializationEvolutionCount: number
  retirementVotes: number
  consecutiveFailures: number
}

export interface AgentPerformanceEvaluatorState {
  agentRecords: Map<string, AgentPerformanceRecord>
  performanceHistory: Array<{ timestamp: number; agentId: string; dimension: PerformanceDimension; score: number }>
  benchmarkThresholds: Map<PerformanceDimension, { min: number; target: number; excellent: number }>
  evaluationCounter: number
  coolingDownAgents: string[]
}

export function createEmptyEvaluatorState(): AgentPerformanceEvaluatorState {
  return {
    agentRecords: new Map(),
    performanceHistory: [],
    benchmarkThresholds: new Map([
      ['speed', { min: 20, target: 60, excellent: 85 }],
      ['quality', { min: 30, target: 70, excellent: 90 }],
      ['reliability', { min: 25, target: 65, excellent: 88 }],
      ['creativity', { min: 15, target: 55, excellent: 80 }],
      ['collaboration', { min: 20, target: 60, excellent: 82 }],
    ]),
    evaluationCounter: 0,
    coolingDownAgents: [],
  }
}

export function registerAgent(
  state: AgentPerformanceEvaluatorState,
  agentId: string,
  initialSpecialization: SpecializationFocus = 'writing'
): { state: AgentPerformanceEvaluatorState; agentId: string } {
  const record: AgentPerformanceRecord = {
    agentId,
    lifecycleState: 'active',
    currentSpecialization: initialSpecialization,
    performanceScores: new Map([
      ['speed', 50], ['quality', 50], ['reliability', 50], ['creativity', 50], ['collaboration', 50],
    ]),
    historicalScores: [],
    totalTasksCompleted: 0,
    totalTasksFailed: 0,
    averageResponseTimeMs: 0,
    lastActiveAt: Date.now(),
    cooldownUntil: null,
    specializationEvolutionCount: 0,
    retirementVotes: 0,
    consecutiveFailures: 0,
  }
  const newRecords = new Map(state.agentRecords)
  newRecords.set(agentId, record)
  return { state: { ...state, agentRecords: newRecords }, agentId }
}

export function transitionAgentState(
  state: AgentPerformanceEvaluatorState,
  agentId: string,
  newState: AgentLifecycleState
): AgentPerformanceEvaluatorState {
  const record = state.agentRecords.get(agentId)
  if (!record) return state
  const updatedRecord: AgentPerformanceRecord = {
    ...record,
    lifecycleState: newState,
    ...(newState === 'cooling_down' ? { cooldownUntil: Date.now() + 60000 } : {}),
    ...(newState === 'retired' ? { cooldownUntil: null } : {}),
  }
  const newRecords = new Map(state.agentRecords)
  newRecords.set(agentId, updatedRecord)
  return {
    ...state,
    agentRecords: newRecords,
    coolingDownAgents: newState === 'cooling_down'
      ? [...state.coolingDownAgents, agentId]
      : state.coolingDownAgents.filter(id => id !== agentId),
  }
}

export function recordTaskOutcome(
  state: AgentPerformanceEvaluatorState,
  agentId: string,
  success: boolean,
  responseTimeMs: number,
  qualityScore?: number
): AgentPerformanceEvaluatorState {
  const record = state.agentRecords.get(agentId)
  if (!record) return state
  const newRecords = new Map(state.agentRecords)
  const completed = record.totalTasksCompleted + (success ? 1 : 0)
  const failed = record.totalTasksFailed + (success ? 0 : 1)
  const consecutive = success ? 0 : record.consecutiveFailures + 1
  const newScores = new Map(record.performanceScores)
  const qualityDim = newScores.get('quality') ?? 50
  newScores.set('quality', success && qualityScore !== undefined
    ? Math.min(100, qualityDim * 0.7 + qualityScore * 0.3) : qualityDim * 0.95)
  newScores.set('speed', Math.min(100, Math.max(0, 100 - (responseTimeMs / 100))))
  newScores.set('reliability', (completed / (completed + failed + 1)) * 100)
  const newHistory = [...record.historicalScores]
  if (newHistory.length === 0 || Date.now() - newHistory[newHistory.length - 1].timestamp > 300000) {
    newHistory.push({
      timestamp: Date.now(),
      scores: {
        speed: newScores.get('speed') ?? 50,
        quality: newScores.get('quality') ?? 50,
        reliability: newScores.get('reliability') ?? 50,
        creativity: newScores.get('creativity') ?? 50,
        collaboration: newScores.get('collaboration') ?? 50,
      }
    })
  }
  newRecords.set(agentId, {
    ...record,
    performanceScores: newScores,
    historicalScores: newHistory,
    totalTasksCompleted: completed,
    totalTasksFailed: failed,
    averageResponseTimeMs: completed > 0 ? (record.averageResponseTimeMs * record.totalTasksCompleted + responseTimeMs) / completed : responseTimeMs,
    lastActiveAt: Date.now(),
    consecutiveFailures: consecutive,
  })
  return { ...state, agentRecords: newRecords }
}

export function recordVoteToRetire(
  state: AgentPerformanceEvaluatorState,
  agentId: string,
  fromAgentId: string
): AgentPerformanceEvaluatorState {
  const record = state.agentRecords.get(agentId)
  if (!record) return state
  const newRecords = new Map(state.agentRecords)
  const newVotes = record.retirementVotes + 1
  newRecords.set(agentId, { ...record, retirementVotes: newVotes })
  if (newVotes >= 3) {
    return transitionAgentState({ ...state, agentRecords: newRecords }, agentId, 'retired')
  }
  return { ...state, agentRecords: newRecords }
}

export function evolveAgentSpecialization(
  state: AgentPerformanceEvaluatorState,
  agentId: string,
  newSpecialization: SpecializationFocus
): AgentPerformanceEvaluatorState {
  const record = state.agentRecords.get(agentId)
  if (!record || record.lifecycleState !== 'active') return state
  const newRecords = new Map(state.agentRecords)
  newRecords.set(agentId, {
    ...record,
    currentSpecialization: newSpecialization,
    specializationEvolutionCount: record.specializationEvolutionCount + 1,
  })
  return { ...state, agentRecords: newRecords }
}

export function suggestSpecializationFromPerformance(
  state: AgentPerformanceEvaluatorState,
  agentId: string
): SpecializationFocus | null {
  const record = state.agentRecords.get(agentId)
  if (!record) return null
  let maxDim: PerformanceDimension = 'quality'
  let maxScore = 0
  for (const [dim, score] of Array.from(record.performanceScores.entries())) {
    if (score > maxScore) { maxScore = score; maxDim = dim }
  }
  const dimToFocus: Record<PerformanceDimension, SpecializationFocus> = {
    speed: 'writing', quality: 'editing', reliability: 'research',
    creativity: 'dialogue', collaboration: 'world_building',
  }
  const suggested = dimToFocus[maxDim]
  return suggested !== record.currentSpecialization ? suggested : null
}

export function evaluateAgentAgainstBenchmark(
  state: AgentPerformanceEvaluatorState,
  agentId: string
): { dimension: PerformanceDimension; status: 'below_min' | 'acceptable' | 'target' | 'excellent'; score: number }[] {
  const record = state.agentRecords.get(agentId)
  if (!record) return []
  const results: { dimension: PerformanceDimension; status: 'below_min' | 'acceptable' | 'target' | 'excellent'; score: number }[] = []
  for (const [dimension, benchmark] of Array.from(state.benchmarkThresholds.entries())) {
    const score = record.performanceScores.get(dimension) ?? 0
    let status: 'below_min' | 'acceptable' | 'target' | 'excellent'
    if (score < benchmark.min) status = 'below_min'
    else if (score < benchmark.target) status = 'acceptable'
    else if (score < benchmark.excellent) status = 'target'
    else status = 'excellent'
    results.push({ dimension, status, score })
  }
  return results
}

export function getOverallPerformanceScore(
  state: AgentPerformanceEvaluatorState,
  agentId: string
): number {
  const record = state.agentRecords.get(agentId)
  if (!record) return 0
  let total = 0
  for (const [, score] of Array.from(record.performanceScores.entries())) { total += score }
  return total / record.performanceScores.size
}

export function checkAndApplyCooldowns(
  state: AgentPerformanceEvaluatorState
): AgentPerformanceEvaluatorState {
  const now = Date.now()
  const newRecords = new Map(state.agentRecords)
  let newCooling = [...state.coolingDownAgents]
  for (const agentId of state.coolingDownAgents) {
    const record = newRecords.get(agentId)
    if (!record || !record.cooldownUntil) continue
    if (now >= record.cooldownUntil) {
      const newState = record.consecutiveFailures >= 5 ? 'retired' : 'active'
      newRecords.set(agentId, {
        ...record,
        lifecycleState: newState,
        cooldownUntil: null,
        consecutiveFailures: newState === 'active' ? 0 : record.consecutiveFailures,
      })
      newCooling = newCooling.filter(id => id !== agentId)
    }
  }
  return { ...state, agentRecords: newRecords, coolingDownAgents: newCooling }
}

export function recommendBestAgentForTask(
  state: AgentPerformanceEvaluatorState,
  specialization: SpecializationFocus,
  excludeIds: string[] = []
): string | null {
  let bestAgent: string | null = null
  let bestScore = -1
  for (const [agentId, record] of Array.from(state.agentRecords.entries())) {
    if (record.lifecycleState !== 'active') continue
    if (excludeIds.includes(agentId)) continue
    if (record.currentSpecialization !== specialization) continue
    const overall = getOverallPerformanceScore(state, agentId)
    if (overall > bestScore) { bestScore = overall; bestAgent = agentId }
  }
  return bestAgent
}

export function formatAgentPerformanceReport(
  state: AgentPerformanceEvaluatorState,
  agentId: string
): string {
  const record = state.agentRecords.get(agentId)
  if (!record) return `Agent ${agentId} not found`
  const lines = [
    `=== Performance Report: ${agentId} ===`,
    `Lifecycle: ${record.lifecycleState}`,
    `Specialization: ${record.currentSpecialization} (evolved ${record.specializationEvolutionCount}x)`,
    `Overall Score: ${getOverallPerformanceScore(state, agentId).toFixed(1)}/100`,
    `Tasks: ${record.totalTasksCompleted} completed | ${record.totalTasksFailed} failed`,
    `Avg Response: ${record.averageResponseTimeMs.toFixed(0)}ms`,
    `Consecutive Failures: ${record.consecutiveFailures}`,
    '',
    '--- Dimension Scores ---',
  ]
  for (const [dim, score] of Array.from(record.performanceScores.entries())) {
    const benchmark = state.benchmarkThresholds.get(dim)
    const marker = benchmark
      ? score >= benchmark.excellent ? '★' : score >= benchmark.target ? '●' : score >= benchmark.min ? '○' : '✗'
      : '·'
    lines.push(`  ${marker} ${dim}: ${score.toFixed(1)}`)
  }
  return lines.join('\n')
}

export function formatEvaluatorDashboard(state: AgentPerformanceEvaluatorState): string {
  const lines = [
    '=== Agent Performance Evaluator Dashboard ===',
    `Total Agents: ${state.agentRecords.size}`,
    `Active: ${Array.from(state.agentRecords.values()).filter(r => r.lifecycleState === 'active').length}`,
    `Cooling: ${state.coolingDownAgents.length}`,
    `Retired: ${Array.from(state.agentRecords.values()).filter(r => r.lifecycleState === 'retired').length}`,
    '',
  ]
  const sorted = Array.from(state.agentRecords.entries())
    .filter(([, r]) => r.lifecycleState === 'active')
    .sort((a, b) => getOverallPerformanceScore(state, a[0]) - getOverallPerformanceScore(state, b[0]))
    .reverse()
    .slice(0, 5)
  if (sorted.length > 0) {
    lines.push('--- Top 5 Active Agents ---')
    for (const [agentId, record] of sorted) {
      lines.push(`  ${agentId} (${record.currentSpecialization}): ${getOverallPerformanceScore(state, agentId).toFixed(1)}`)
    }
  }
  return lines.join('\n')
}