/**
 * AgentSelfRegulationSystem - V126
 * Autonomous Goal Pursuit with Self-Correction
 * 
 * Inspired by:
 * - generic-agent: autonomous goal pursuit and self-regulation
 * - claude-code: implicit breed/species for agent behavior adaptation
 * - ruflo: hierarchical task decomposition
 * 
 * Provides:
 * - Autonomous goal setting and pursuit
 * - Self-correction based on feedback
 * - Adaptive learning from past performance
 * - Goal decomposition into sub-goals
 * - Self-assessment and confidence scoring
 */

import type { AgentCoordinationSuiteState } from './AgentCoordinationSuite'

// =============================================================================
// Types
// =============================================================================

export type GoalStatus = 'active' | 'completed' | 'abandoned' | 'suspended'
export type CorrectionType = 'replan' | 'retry' | 'decompose' | 'escalate' | 'abandon'
export type ConfidenceLevel = 'low' | 'medium' | 'high'

export interface Goal {
  id: string
  description: string
  targetOutcome: string
  status: GoalStatus
  createdAt: number
  startedAt: number | null
  completedAt: number | null
  progress: number              // 0-100
  priority: number              // 1-10
  subGoals: string[]            // child goal IDs
  parentGoalId: string | null
  retries: number
  corrections: CorrectionRecord[]
  confidence: ConfidenceLevel
  estimatedTokens: number
  actualTokens: number
  tags: string[]
}

export interface CorrectionRecord {
  id: string
  type: CorrectionType
  reason: string
  timestamp: number
  triggeredBy: string           // agent or system
  success: boolean | null       // null = pending
  outcome: string | null
}

export interface SelfRegulationState {
  goals: Map<string, Goal>
  activeGoalId: string | null
  goalHistory: string[]          // completed/abandoned goal IDs
  correctionCount: number
  totalSelfCorrections: number
  adaptiveThresholds: AdaptiveThresholds
  learningBuffer: LearningEntry[]
  confidenceTrends: Map<string, number>  // goalId -> confidence score
}

export interface AdaptiveThresholds {
  confidenceLowThreshold: number      // below this = low confidence
  confidenceHighThreshold: number     // above this = high confidence  
  retryMaxCount: number
  progressStallThreshold: number      // % progress with no improvement
  stallCheckWindowMs: number
}

export interface LearningEntry {
  timestamp: number
  goalId: string
  pattern: string                // e.g., "decompose_when_complex"
  outcome: 'success' | 'failure'
  tokensSaved: number | null
  correctionApplied: CorrectionType | null
}

// =============================================================================
// Default Thresholds
// =============================================================================

export const DEFAULT_ADAPTIVE_THRESHOLDS: AdaptiveThresholds = {
  confidenceLowThreshold: 0.3,
  confidenceHighThreshold: 0.8,
  retryMaxCount: 3,
  progressStallThreshold: 5,      // 5% progress without improvement
  stallCheckWindowMs: 30000,       // 30 seconds
}

// =============================================================================
// State Management
// =============================================================================

export function createEmptySelfRegulationState(): SelfRegulationState {
  return {
    goals: new Map(),
    activeGoalId: null,
    goalHistory: [],
    correctionCount: 0,
    totalSelfCorrections: 0,
    adaptiveThresholds: { ...DEFAULT_ADAPTIVE_THRESHOLDS },
    learningBuffer: [],
    confidenceTrends: new Map(),
  }
}

// =============================================================================
// Goal Lifecycle
// =============================================================================

export function createGoal(
  state: SelfRegulationState,
  description: string,
  targetOutcome: string,
  options?: {
    priority?: number
    parentGoalId?: string
    estimatedTokens?: number
    tags?: string[]
  }
): { state: SelfRegulationState; goalId: string } {
  const id = `goal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  const goal: Goal = {
    id,
    description,
    targetOutcome,
    status: 'active',
    createdAt: Date.now(),
    startedAt: null,
    completedAt: null,
    progress: 0,
    priority: options?.priority ?? 5,
    subGoals: [],
    parentGoalId: options?.parentGoalId ?? null,
    retries: 0,
    corrections: [],
    confidence: 'medium',
    estimatedTokens: options?.estimatedTokens ?? 10000,
    actualTokens: 0,
    tags: options?.tags ?? [],
  }

  const newGoals = new Map(state.goals)
  newGoals.set(id, goal)

  // If has parent, update parent's subGoals
  if (options?.parentGoalId) {
    const parent = newGoals.get(options.parentGoalId)
    if (parent) {
      newGoals.set(options.parentGoalId, {
        ...parent,
        subGoals: [...parent.subGoals, id],
      })
    }
  }

  return {
    state: { ...state, goals: newGoals },
    goalId: id,
  }
}

export function startGoal(state: SelfRegulationState, goalId: string): SelfRegulationState {
  const goal = state.goals.get(goalId)
  if (!goal) return state

  const newGoals = new Map(state.goals)
  newGoals.set(goalId, { ...goal, startedAt: Date.now() })

  return {
    ...state,
    goals: newGoals,
    activeGoalId: goalId,
  }
}

export function updateGoalProgress(
  state: SelfRegulationState,
  goalId: string,
  progressDelta: number
): SelfRegulationState {
  const goal = state.goals.get(goalId)
  if (!goal) return state

  const newProgress = Math.min(100, Math.max(0, goal.progress + progressDelta))
  const newConfidence = calculateConfidence(newProgress, goal.corrections.length, goal.retries)

  const newGoals = new Map(state.goals)
  newGoals.set(goalId, {
    ...goal,
    progress: newProgress,
    confidence: newConfidence,
  })

  // Update confidence trend
  const newTrends = new Map(state.confidenceTrends)
  newTrends.set(goalId, newProgress)

  return {
    ...state,
    goals: newGoals,
    confidenceTrends: newTrends,
  }
}

export function completeGoal(state: SelfRegulationState, goalId: string): SelfRegulationState {
  const goal = state.goals.get(goalId)
  if (!goal) return state

  const completedGoal: Goal = {
    ...goal,
    status: 'completed',
    completedAt: Date.now(),
    progress: 100,
  }

  const newGoals = new Map(state.goals)
  newGoals.set(goalId, completedGoal)

  return {
    ...state,
    goals: newGoals,
    activeGoalId: state.activeGoalId === goalId ? null : state.activeGoalId,
    goalHistory: [...state.goalHistory, goalId].slice(-100),
  }
}

export function abandonGoal(state: SelfRegulationState, goalId: string, reason: string): SelfRegulationState {
  const goal = state.goals.get(goalId)
  if (!goal) return state

  const newGoals = new Map(state.goals)
  newGoals.set(goalId, {
    ...goal,
    status: 'abandoned',
    completedAt: Date.now(),
  })

  // Add correction record
  const correction: CorrectionRecord = {
    id: `corr_${Date.now()}`,
    type: 'abandon',
    reason,
    timestamp: Date.now(),
    triggeredBy: 'self-regulation',
    success: false,
    outcome: reason,
  }

  const updatedGoal = { ...newGoals.get(goalId)!, corrections: [...newGoals.get(goalId)!.corrections, correction] }
  newGoals.set(goalId, updatedGoal)

  return {
    ...state,
    goals: newGoals,
    activeGoalId: state.activeGoalId === goalId ? null : state.activeGoalId,
    goalHistory: [...state.goalHistory, goalId].slice(-100),
  }
}

// =============================================================================
// Self-Correction
// =============================================================================

export function applyCorrection(
  state: SelfRegulationState,
  goalId: string,
  correction: Omit<CorrectionRecord, 'id' | 'timestamp'>
): SelfRegulationState {
  const goal = state.goals.get(goalId)
  if (!goal) return state

  const fullCorrection: CorrectionRecord = {
    ...correction,
    id: `corr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
  }

  const newGoals = new Map(state.goals)
  newGoals.set(goalId, {
    ...goal,
    corrections: [...goal.corrections, fullCorrection],
    retries: correction.type === 'retry' ? goal.retries + 1 : goal.retries,
  })

  // Record learning
  const learningEntry: LearningEntry = {
    timestamp: Date.now(),
    goalId,
    pattern: detectPattern(correction.type),
    outcome: correction.success === true ? 'success' : 'failure',
    tokensSaved: null,
    correctionApplied: correction.type,
  }

  return {
    ...state,
    goals: newGoals,
    correctionCount: state.correctionCount + 1,
    totalSelfCorrections: state.totalSelfCorrections + 1,
    learningBuffer: [...state.learningBuffer, learningEntry].slice(-200),
  }
}

function detectPattern(correctionType: CorrectionType): string {
  switch (correctionType) {
    case 'replan': return 'replan_when_blocked'
    case 'retry': return 'retry_when_failed'
    case 'decompose': return 'decompose_when_complex'
    case 'escalate': return 'escalate_when_stuck'
    case 'abandon': return 'abandon_when_impossible'
    default: return 'unknown'
  }
}

// =============================================================================
// Autonomous Decision Making
// =============================================================================

export function assessAndCorrect(state: SelfRegulationState, goalId: string): SelfRegulationState {
  const goal = state.goals.get(goalId)
  if (!goal || goal.status !== 'active') return state

  let newState = state

  // Check confidence level
  if (goal.confidence === 'low') {
    // Need to correct - either retry, decompose, or escalate
    if (goal.retries < state.adaptiveThresholds.retryMaxCount) {
      newState = applyCorrection(newState, goalId, {
        type: 'retry',
        reason: 'Low confidence, attempting retry',
        triggeredBy: 'self-regulation',
        success: null,
        outcome: null,
      })
    } else if (goal.subGoals.length === 0 && goal.progress < 50) {
      // Decompose into sub-goals
      newState = decomposeGoal(newState, goalId)
    } else {
      // Escalate
      newState = applyCorrection(newState, goalId, {
        type: 'escalate',
        reason: 'Max retries exceeded, escalating',
        triggeredBy: 'self-regulation',
        success: null,
        outcome: null,
      })
    }
  }

  // Check for progress stall
  newState = checkProgressStall(newState, goalId)

  return newState
}

function checkProgressStall(state: SelfRegulationState, goalId: string): SelfRegulationState {
  const goal = state.goals.get(goalId)
  if (!goal || !goal.startedAt) return state

  const timeSinceStart = Date.now() - goal.startedAt
  if (timeSinceStart < state.adaptiveThresholds.stallCheckWindowMs) return state

  // Check if progress has been stagnant
  const trend = state.confidenceTrends.get(goalId)
  if (trend !== undefined && trend === goal.progress && goal.progress < 90) {
    // Progress stalled - decompose or replan
    return applyCorrection(state, goalId, {
      type: 'replan',
      reason: `Progress stalled at ${goal.progress}% for ${state.adaptiveThresholds.stallCheckWindowMs / 1000}s`,
      triggeredBy: 'self-regulation',
      success: null,
      outcome: null,
    })
  }

  return state
}

function decomposeGoal(state: SelfRegulationState, parentGoalId: string): SelfRegulationState {
  const parent = state.goals.get(parentGoalId)
  if (!parent) return state

  // Create 2-3 sub-goals
  const subGoalCount = 3
  const subGoalDescriptions = [
    `Phase 1: Foundation - ${parent.description.substring(0, 30)}...`,
    `Phase 2: Core - ${parent.description.substring(0, 30)}...`,
    `Phase 3: Completion - ${parent.description.substring(0, 30)}...`,
  ]

  let newState = state
  const subGoalIds: string[] = []

  for (let i = 0; i < subGoalCount; i++) {
    const result = createGoal(newState, subGoalDescriptions[i], parent.targetOutcome, {
      parentGoalId,
      priority: parent.priority - 1,
      tags: [...parent.tags, 'sub-goal'],
    })
    newState = result.state
    subGoalIds.push(result.goalId)
  }

  // Apply correction
  newState = applyCorrection(newState, parentGoalId, {
    type: 'decompose',
    reason: `Decomposed into ${subGoalCount} sub-goals`,
    triggeredBy: 'self-regulation',
    success: null,
    outcome: `Created ${subGoalIds.length} sub-goals`,
  })

  return newState
}

// =============================================================================
// Confidence Calculation
// =============================================================================

function calculateConfidence(progress: number, corrections: number, retries: number): ConfidenceLevel {
  // Simple confidence model
  const baseScore = progress / 100
  const correctionPenalty = corrections * 0.1
  const retryPenalty = retries * 0.15

  const score = Math.max(0, Math.min(1, baseScore - correctionPenalty - retryPenalty))

  if (score >= 0.8) return 'high'
  if (score >= 0.3) return 'medium'
  return 'low'
}

// =============================================================================
// Adaptive Learning
// =============================================================================

export function learnFromOutcome(
  state: SelfRegulationState,
  goalId: string,
  success: boolean,
  tokensSaved?: number
): SelfRegulationState {
  const goal = state.goals.get(goalId)
  if (!goal) return state

  // Update the last correction's success field
  if (goal.corrections.length > 0) {
    const lastCorrection = goal.corrections[goal.corrections.length - 1]
    const newCorrections = [...goal.corrections]
    newCorrections[newCorrections.length - 1] = { ...lastCorrection, success }

    const newGoals = new Map(state.goals)
    newGoals.set(goalId, { ...goal, corrections: newCorrections })

    const newLearningBuffer = [...state.learningBuffer]
    if (newLearningBuffer.length > 0) {
      const lastEntry = newLearningBuffer[newLearningBuffer.length - 1]
      newLearningBuffer[newLearningBuffer.length - 1] = {
        ...lastEntry,
        outcome: success ? 'success' : 'failure',
        tokensSaved: tokensSaved ?? null,
      }
    }

    return {
      ...state,
      goals: newGoals,
      learningBuffer: newLearningBuffer,
    }
  }

  return state
}

export function getMostEffectivePattern(state: SelfRegulationState): string | null {
  if (state.learningBuffer.length === 0) return null

  // Analyze success rates by pattern
  const patternStats: Record<string, { success: number; total: number }> = {}

  for (const entry of state.learningBuffer) {
    if (!entry.pattern) continue
    if (!patternStats[entry.pattern]) {
      patternStats[entry.pattern] = { success: 0, total: 0 }
    }
    patternStats[entry.pattern].total++
    if (entry.outcome === 'success') {
      patternStats[entry.pattern].success++
    }
  }

  let bestPattern: string | null = null
  let bestRate = 0

  for (const [pattern, stats] of Object.entries(patternStats)) {
    if (stats.total >= 3) {
      const rate = stats.success / stats.total
      if (rate > bestRate) {
        bestRate = rate
        bestPattern = pattern
      }
    }
  }

  return bestPattern
}

// =============================================================================
// Formatters
// =============================================================================

export function formatGoalSummary(state: SelfRegulationState, goalId: string): string {
  const goal = state.goals.get(goalId)
  if (!goal) return `Goal ${goalId} not found`

  const lines = [
    `=== Goal: ${goal.description.substring(0, 50)} ===`,
    `Status: ${goal.status} | Progress: ${goal.progress}%`,
    `Confidence: ${goal.confidence} | Retries: ${goal.retries}`,
    `Corrections: ${goal.corrections.length} | Sub-goals: ${goal.subGoals.length}`,
    `Tokens: ${goal.actualTokens} / ${goal.estimatedTokens}`,
    goal.status === 'active' ? `Active: ${state.activeGoalId === goalId ? 'YES' : 'NO'}` : `Completed: ${new Date(goal.completedAt!).toLocaleString()}`,
  ]

  return lines.join('\n')
}

export function formatSelfRegulationDashboard(state: SelfRegulationState): string {
  const activeGoals = Array.from(state.goals.values()).filter(g => g.status === 'active')
  const completedGoals = Array.from(state.goals.values()).filter(g => g.status === 'completed')

  const lines = [
    '=== Self-Regulation Dashboard ===',
    `Active Goals: ${activeGoals.length} | Completed: ${completedGoals.length}`,
    `Total Corrections: ${state.totalSelfCorrections}`,
    `Learning Entries: ${state.learningBuffer.length}`,
    '',
    '--- Active Goals ---',
  ]

  for (const goal of activeGoals.slice(0, 5)) {
    lines.push(`  [${goal.priority}] ${goal.description.substring(0, 40)} - ${goal.progress}% (${goal.confidence})`)
  }

  if (state.learningBuffer.length > 0) {
    const mostEffective = getMostEffectivePattern(state)
    if (mostEffective) {
      lines.push('')
      lines.push(`Most Effective Pattern: ${mostEffective}`)
    }
  }

  return lines.join('\n')
}