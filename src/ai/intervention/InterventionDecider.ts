/**
 * InterventionManager - V107
 * Intelligent Intervention Decision System Based on Session State
 * 
 * Inspired by:
 * - thunderbolt: pipeline architecture + feedback loops for adaptive interventions
 * - chatdev: role specialization + multi-agent coordination for role-based interventions
 * - nanobot: distributed mesh agents with autonomous specialization
 * - generic-agent: autonomous goal pursuit with adaptive tool selection
 * 
 * Makes intelligent decisions about when and how to intervene in writing sessions:
 * - Detects stagnation and quality degradation
 * - Recommends intervention types based on session state
 * - Triggers automatic interventions at appropriate thresholds
 */

import type { WritingSessionState } from '../session/WritingSessionManager'

// =============================================================================
// Types
// =============================================================================

export type InterventionType =
  | 'encouragement'      // Positive feedback to maintain momentum
  | 'redirect'           // Redirect attention to different aspect
  | 'suggestion'         // Offer concrete writing suggestions
  | 'pause'             // Recommend a break
  | 'challenge'          // Introduce a challenge to break through
  | 'simplify'          // Simplify the current task
  | 'celebrate'          // Celebrate milestones and progress

export type InterventionUrgency = 'low' | 'medium' | 'high'

export interface InterventionTrigger {
  type: InterventionType
  urgency: InterventionUrgency
  reason: string
  targetMetric?: string
  threshold?: number
}

export interface InterventionDecision {
  shouldIntervene: boolean
  interventionType: InterventionType | null
  urgency: InterventionUrgency
  confidence: number      // 0-1
  reasoning: string
  suggestedAction?: string
  trigger?: InterventionTrigger
}

export interface InterventionHistory {
  timestamp: number
  sessionId: string
  interventionType: InterventionType
  effectivenessScore: number // -10 to +10
  qualityBefore: number
  qualityAfter: number
  reason: string
}

export interface InterventionConfig {
  stagnationThreshold: number         // stagnation count before intervention (default: 3)
  qualityDeclineThreshold: number      // quality drop percentage to trigger (default: 15)
  energyLowThreshold: number         // energy level below which to intervene (default: 30)
  interventionCooldownMs: number     // min time between interventions (default: 5 min)
  momentumLowThreshold: number      // momentum below which to intervene (default: 40)
  toolOveruseThreshold: number       // tool calls per minute above which to intervene (default: 10)
  qualityVolatilityThreshold: number // stddev threshold for quality volatility (default: 20)
  celebrationThreshold: number       // quality level for celebration (default: 85)
  milestoneWordCount: number         // words written milestone for celebration (default: 1000)
}

export interface InterventionState {
  config: InterventionConfig
  interventionHistory: InterventionHistory[]
  lastInterventionTimestamp: number
  totalInterventionsTriggered: number
  consecutiveLowMomentumCount: number
}

export const DEFAULT_INTERVENTION_CONFIG: InterventionConfig = {
  stagnationThreshold: 3,
  qualityDeclineThreshold: 15,
  energyLowThreshold: 30,
  interventionCooldownMs: 5 * 60 * 1000,
  momentumLowThreshold: 40,
  toolOveruseThreshold: 10,
  qualityVolatilityThreshold: 20,
  celebrationThreshold: 85,
  milestoneWordCount: 1000,
}

export function createEmptyInterventionState(config?: Partial<InterventionConfig>): InterventionState {
  return {
    config: { ...DEFAULT_INTERVENTION_CONFIG, ...config },
    interventionHistory: [],
    lastInterventionTimestamp: 0,
    totalInterventionsTriggered: 0,
    consecutiveLowMomentumCount: 0,
  }
}

export function calculateQualityVolatility(session: WritingSessionState): number {
  if (session.rollingQualityScores.length < 2) return 0

  const scores = session.rollingQualityScores
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length
  const squaredDiffs = scores.map(s => Math.pow(s - mean, 2))
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / scores.length
  return Math.sqrt(variance)
}

export function detectQualityDecline(session: WritingSessionState, config: InterventionConfig): number {
  if (session.rollingQualityScores.length < 3) return 0

  const scores = session.rollingQualityScores
  const recentAvg = (scores[scores.length - 1] + scores[scores.length - 2]) / 2
  const olderAvg = (scores[0] + scores[1] + scores[2]) / 3
  const declinePercent = ((olderAvg - recentAvg) / olderAvg) * 100

  return declinePercent >= config.qualityDeclineThreshold ? declinePercent : 0
}

export function shouldCelebrate(session: WritingSessionState, config: InterventionConfig): boolean {
  return session.currentQualityScore >= config.celebrationThreshold
}

export function shouldTriggerIntervention(
  session: WritingSessionState,
  state: InterventionState
): { shouldIntervene: boolean; reason: string } {
  const config = state.config
  const now = Date.now()

  // Cooldown check
  if (now - state.lastInterventionTimestamp < config.interventionCooldownMs) {
    return { shouldIntervene: false, reason: 'Cooldown period active' }
  }

  // Stagnation check
  if (session.stagnationCount >= config.stagnationThreshold) {
    return { shouldIntervene: true, reason: `Stagnation detected: ${session.stagnationCount} stagnant phases` }
  }

  // Energy check
  if (session.energyLevel < config.energyLowThreshold) {
    return { shouldIntervene: true, reason: `Low energy: ${session.energyLevel}` }
  }

  // Momentum check
  const momentum = session.currentMomentum ?? 70
  if (momentum < config.momentumLowThreshold) {
    return { shouldIntervene: true, reason: `Low momentum: ${momentum}` }
  }

  // Quality decline check
  const qualityDecline = detectQualityDecline(session, config)
  if (qualityDecline > 0) {
    return { shouldIntervene: true, reason: `Quality decline: ${qualityDecline.toFixed(1)}%` }
  }

  // Tool overuse check
  const toolRate = session.totalToolCalls / ((now - session.startTime) / 60000)
  if (toolRate > config.toolOveruseThreshold) {
    return { shouldIntervene: true, reason: `Tool overuse: ${toolRate.toFixed(1)}/min` }
  }

  return { shouldIntervene: false, reason: 'Session healthy' }
}

export function decideInterventionType(
  session: WritingSessionState,
  state: InterventionState
): InterventionDecision {
  const config = state.config

  // Check celebration first
  if (shouldCelebrate(session, config)) {
    return {
      shouldIntervene: true,
      interventionType: 'celebrate',
      urgency: 'low',
      confidence: 0.95,
      reasoning: 'Quality score exceeds celebration threshold',
      suggestedAction: 'Acknowledge excellent progress and maintain current approach',
    }
  }

  // Check stagnation
  if (session.stagnationCount >= config.stagnationThreshold) {
    const stagnationLevel = session.stagnationCount - config.stagnationThreshold
    const urgency: InterventionUrgency = stagnationLevel >= 2 ? 'high' : 'medium'

    return {
      shouldIntervene: true,
      interventionType: stagnationLevel >= 3 ? 'simplify' : 'challenge',
      urgency,
      confidence: 0.85,
      reasoning: `Stagnation level ${session.stagnationCount} suggests ${stagnationLevel >= 3 ? 'task simplification' : 'challenge introduction'}`,
      suggestedAction: stagnationLevel >= 3
        ? 'Break current task into smaller, more manageable pieces'
        : 'Introduce a new constraint or angle to break through',
      trigger: {
        type: stagnationLevel >= 3 ? 'simplify' : 'challenge',
        urgency,
        reason: `Stagnation count ${session.stagnationCount}`,
        targetMetric: 'stagnationCount',
        threshold: config.stagnationThreshold,
      },
    }
  }

  // Check energy
  if (session.energyLevel < config.energyLowThreshold) {
    return {
      shouldIntervene: true,
      interventionType: 'pause',
      urgency: session.energyLevel < 15 ? 'high' : 'medium',
      confidence: 0.9,
      reasoning: `Energy critically low at ${session.energyLevel}`,
      suggestedAction: 'Take a short break to recharge',
      trigger: {
        type: 'pause',
        urgency: session.energyLevel < 15 ? 'high' : 'medium',
        reason: `Energy level ${session.energyLevel}`,
        targetMetric: 'energyLevel',
        threshold: config.energyLowThreshold,
      },
    }
  }

  // Check momentum
  const momentum = session.currentMomentum ?? 70
  if (momentum < config.momentumLowThreshold) {
    return {
      shouldIntervene: true,
      interventionType: 'encouragement',
      urgency: 'medium',
      confidence: 0.75,
      reasoning: `Momentum low at ${momentum}`,
      suggestedAction: 'Provide positive feedback and suggest small wins',
      trigger: {
        type: 'encouragement',
        urgency: 'medium',
        reason: `Momentum ${momentum} below threshold ${config.momentumLowThreshold}`,
        targetMetric: 'momentum',
        threshold: config.momentumLowThreshold,
      },
    }
  }

  // Check quality decline
  const qualityDecline = detectQualityDecline(session, config)
  if (qualityDecline > 0) {
    return {
      shouldIntervene: true,
      interventionType: 'redirect',
      urgency: 'medium',
      confidence: 0.8,
      reasoning: `Quality declining ${qualityDecline.toFixed(1)}%`,
      suggestedAction: 'Redirect focus to a different aspect of the story',
      trigger: {
        type: 'redirect',
        urgency: 'medium',
        reason: `Quality decline ${qualityDecline.toFixed(1)}%`,
        targetMetric: 'quality',
        threshold: config.qualityDeclineThreshold,
      },
    }
  }

  return {
    shouldIntervene: false,
    interventionType: null,
    urgency: 'low',
    confidence: 1.0,
    reasoning: 'Session is healthy, no intervention needed',
  }
}

export function recordIntervention(
  state: InterventionState,
  sessionId: string,
  interventionType: InterventionType,
  qualityBefore: number,
  qualityAfter: number
): InterventionState {
  const entry: InterventionHistory = {
    timestamp: Date.now(),
    sessionId,
    interventionType,
    effectivenessScore: qualityAfter - qualityBefore,
    qualityBefore,
    qualityAfter,
    reason: `Intervention: ${interventionType}`,
  }

  return {
    ...state,
    interventionHistory: [...state.interventionHistory, entry],
    lastInterventionTimestamp: Date.now(),
    totalInterventionsTriggered: state.totalInterventionsTriggered + 1,
  }
}

export function getInterventionEffectiveness(
  state: InterventionState,
  interventionType?: InterventionType
): {
  count: number
  averageEffectiveness: number
  averageQualityDelta: number
  mostEffectiveType: InterventionType | null
} {
  const relevant = interventionType
    ? state.interventionHistory.filter(i => i.interventionType === interventionType)
    : state.interventionHistory

  if (relevant.length === 0) {
    return { count: 0, averageEffectiveness: 0, averageQualityDelta: 0, mostEffectiveType: null }
  }

  const avgEffectiveness = relevant.reduce((s, i) => s + i.effectivenessScore, 0) / relevant.length
  const avgQualityDelta = relevant.reduce((s, i) => s + (i.qualityAfter - i.qualityBefore), 0) / relevant.length

  // Find most effective type
  const byType = new Map<InterventionType, number>()
  for (const entry of relevant) {
    byType.set(entry.interventionType, (byType.get(entry.interventionType) ?? 0) + entry.effectivenessScore)
  }

  let mostEffectiveType: InterventionType | null = null
  let maxScore = -Infinity
  for (const [type, score] of Array.from(byType.entries())) {
    if (score > maxScore) {
      maxScore = score
      mostEffectiveType = type
    }
  }

  return {
    count: relevant.length,
    averageEffectiveness: avgEffectiveness,
    averageQualityDelta: avgQualityDelta,
    mostEffectiveType,
  }
}

export function getInterventionRecommendations(state: InterventionState): string[] {
  const recommendations: string[] = []

  if (state.consecutiveLowMomentumCount >= 3) {
    recommendations.push('Multiple low momentum sessions detected - consider adjusting session goals')
  }

  const effectiveness = getInterventionEffectiveness(state)
  if (effectiveness.mostEffectiveType) {
    recommendations.push(`Most effective intervention type: ${effectiveness.mostEffectiveType}`)
  }

  const recentInterventions = state.interventionHistory.filter(
    i => Date.now() - i.timestamp < 7 * 24 * 60 * 60 * 1000
  )
  if (recentInterventions.length > 10) {
    recommendations.push('High intervention frequency - consider addressing root causes')
  }

  return recommendations
}

export function formatInterventionSummary(state: InterventionState): string {
  const lines = [
    '=== Intervention Summary ===',
    `Total Interventions: ${state.totalInterventionsTriggered}`,
    `Active Patterns: ${state.consecutiveLowMomentumCount}`,
    '',
  ]

  const effectiveness = getInterventionEffectiveness(state)
  lines.push(`Interventions Analyzed: ${effectiveness.count}`)
  lines.push(`Average Effectiveness: ${effectiveness.averageEffectiveness.toFixed(2)}`)
  if (effectiveness.mostEffectiveType) {
    lines.push(`Most Effective Type: ${effectiveness.mostEffectiveType}`)
  }

  lines.push('')
  lines.push('--- Recent Interventions ---')
  const recent = state.interventionHistory.slice(-5)
  for (const entry of recent) {
    const arrow = entry.effectivenessScore >= 0 ? '↑' : '↓'
    lines.push(`${arrow} ${entry.interventionType} (${entry.qualityBefore} → ${entry.qualityAfter})`)
  }

  return lines.join('\n')
}