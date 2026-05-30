/**
 * SelfEvolutionEngine - V105
 * Unified Self-Evolution Engine Coordinating Pattern and Skill Evolution
 * 
 * Inspired by:
 * - thunderbolt: pipeline architecture + feedback loops for continuous improvement
 * - nanobot: distributed mesh agents with autonomous specialization
 * - chatdev: role specialization + multi-agent coordination
 * - generic-agent: autonomous goal pursuit with self-improvement
 * - ruflo: hierarchical decomposition for multi-level analysis
 * 
 * This is the TOP-LEVEL evolution coordinator that integrates:
 * - PatternEvolver: pattern library self-evolution
 * - SkillEvolutionEngine: skill graph self-evolution
 * - PatternLibrary: the actual pattern repository
 * - WritingSessionState: session data for analysis
 */

import type { PatternEvolverState } from './PatternEvolver'
import { createEmptyEvolverState, evolvePatterns } from './PatternEvolver'
import { createEmptySkillEvolutionState, evolveSkillFromSessions, getSkillRecommendations } from './SkillEvolutionEngine'
import type { WritingSessionState } from '../session/WritingSessionManager'

// =============================================================================
// Types
// =============================================================================

export interface EvolutionCycleResult {
  cycleNumber: number
  timestamp: number
  patternEvolution: {
    patternsPromoted: number
    patternsDemoted: number
    patternsPruned: number
    newPatternsDiscovered: number
    averageEffectivenessImprovement: number
  }
  skillEvolution: {
    skillsImproved: number
    totalXpGained: number
    skillLevelsReached: number
  }
  recommendations: string[]
  overallHealthScore: number
}

export interface SelfEvolutionConfig {
  patternEvolverEnabled: boolean
  skillEvolutionEnabled: boolean
  autoPruneInactivePatterns: boolean
  autoPromoteHighPerformers: boolean
  minSessionsPerCycle: number
  cycleIntervalMs: number
  maxPatternsPerCycle: number
  maxSkillsPerCycle: number
  lowMasteryThreshold: number
  highMasteryThreshold: number
}

export const DEFAULT_SELF_EVOLUTION_CONFIG: SelfEvolutionConfig = {
  patternEvolverEnabled: true,
  skillEvolutionEnabled: true,
  autoPruneInactivePatterns: true,
  autoPromoteHighPerformers: true,
  minSessionsPerCycle: 3,
  cycleIntervalMs: 24 * 60 * 60 * 1000, // 1 day
  maxPatternsPerCycle: 5,
  maxSkillsPerCycle: 3,
  lowMasteryThreshold: 40,
  highMasteryThreshold: 75,
}

export interface SelfEvolutionState {
  config: SelfEvolutionConfig
  patternEvolverState: PatternEvolverState
  skillEvolverState: SkillEvolutionState
  cycleHistory: EvolutionCycleResult[]
  currentCycleNumber: number
  lastCycleTimestamp: number
  totalSessionsAnalyzed: number
}

export function createEmptySelfEvolutionState(config?: Partial<SelfEvolutionConfig>): SelfEvolutionState {
  return {
    config: { ...DEFAULT_SELF_EVOLUTION_CONFIG, ...config },
    patternEvolverState: createEmptyEvolverState(),
    skillEvolverState: createEmptySkillEvolutionState(),
    cycleHistory: [],
    currentCycleNumber: 0,
    lastCycleTimestamp: Date.now(),
    totalSessionsAnalyzed: 0,
  }
}

// =============================================================================
// Core Evolution Logic
// =============================================================================

export function runEvolutionCycle(
  state: SelfEvolutionState,
  sessions: WritingSessionState[],
  patterns: any
): { evolvedState: SelfEvolutionState; result: EvolutionCycleResult } {
  const cycleNumber = state.currentCycleNumber + 1
  const recommendations: string[] = []

  // Filter sessions by minimum count
  if (sessions.length < state.config.minSessionsPerCycle) {
    return {
      evolvedState: state,
      result: {
        cycleNumber,
        timestamp: Date.now(),
        patternEvolution: { patternsPromoted: 0, patternsDemoted: 0, patternsPruned: 0, newPatternsDiscovered: 0, averageEffectivenessImprovement: 0 },
        skillEvolution: { skillsImproved: 0, totalXpGained: 0, skillLevelsReached: 0 },
        recommendations: ['Not enough sessions for evolution cycle'],
        overallHealthScore: 50,
      },
    }
  }

  // Pattern evolution
  let evolvedPatternState = state.patternEvolverState
  let patternMetrics = { patternsPromoted: 0, patternsDemoted: 0, patternsPruned: 0, newPatternsDiscovered: 0, averageEffectivenessImprovement: 0 }

  if (state.config.patternEvolverEnabled) {
    const { evolvedState: eps, evolutionResults, metrics } = evolvePatterns(
      state.patternEvolverState,
      patterns,
      sessions
    )
    evolvedPatternState = eps
    patternMetrics = {
      patternsPromoted: metrics.patternsPromoted,
      patternsDemoted: metrics.patternsDemoted,
      patternsPruned: metrics.patternsPruned,
      newPatternsDiscovered: metrics.newPatternsDiscovered,
      averageEffectivenessImprovement: metrics.averageEffectivenessImprovement,
    }

    for (const result of evolutionResults) {
      if (result.evolutionType === 'promote') {
        recommendations.push(`Pattern "${result.patternId}" promoted (weight ${result.previousWeight.toFixed(2)} → ${result.newWeight.toFixed(2)})`)
      } else if (result.evolutionType === 'pruned') {
        recommendations.push(`Pattern "${result.patternId}" pruned due to low effectiveness`)
      }
    }
  }

  // Skill evolution
  let evolvedSkillState = state.skillEvolverState
  let skillMetrics = { skillsImproved: 0, totalXpGained: 0, skillLevelsReached: 0 }

  if (state.config.skillEvolutionEnabled) {
    evolvedSkillState = evolveSkillFromSessions(state.skillEvolverState, sessions)

    // Count skills that reached higher mastery
    const skillsImproved = Array.from(evolvedSkillState.skillLevels.entries()).filter(([skillId, level]) => {
      const oldLevel = state.skillEvolverState.skillLevels.get(skillId)
      return oldLevel ? level.masteryScore > oldLevel.masteryScore : false
    }).length

    skillMetrics = {
      skillsImproved,
      totalXpGained: evolvedSkillState.progressionRecords.reduce((sum, r) => sum + r.xpGained, 0),
      skillLevelsReached: evolvedSkillState.skillLevels.size,
    }

    // Skill recommendations
    const skillRecs = getSkillRecommendations(evolvedSkillState)
    for (const rec of skillRecs.slice(0, 3)) {
      recommendations.push(`[Skill] ${rec.skillName}: ${rec.reason} (${rec.suggestedPractice})`)
    }
  }

  // Overall health score (weighted average)
  const patternHealth = 50 + (patternMetrics.patternsPromoted * 5) - (patternMetrics.patternsPruned * 3)
  const skillHealth = Math.min(100, evolvedSkillState.skillLevels.size * 10)
  const overallHealthScore = Math.round((patternHealth * 0.4 + skillHealth * 0.6))

  const result: EvolutionCycleResult = {
    cycleNumber,
    timestamp: Date.now(),
    patternEvolution: patternMetrics,
    skillEvolution: skillMetrics,
    recommendations,
    overallHealthScore,
  }

  const evolvedState: SelfEvolutionState = {
    ...state,
    config: state.config,
    patternEvolverState: evolvedPatternState,
    skillEvolverState: evolvedSkillState,
    cycleHistory: [...state.cycleHistory, result],
    currentCycleNumber: cycleNumber,
    lastCycleTimestamp: Date.now(),
    totalSessionsAnalyzed: state.totalSessionsAnalyzed + sessions.length,
  }

  return { evolvedState, result }
}

export function shouldRunEvolutionCycle(state: SelfEvolutionState): boolean {
  const now = Date.now()
  const timeSinceLastCycle = now - state.lastCycleTimestamp

  // Run if interval has passed
  if (timeSinceLastCycle >= state.config.cycleIntervalMs) {
    return true
  }

  // Run if we have enough new sessions
  // (Note: totalSessionsAnalyzed is incremented in runEvolutionCycle)
  // So we check if there might be new sessions since last cycle
  return false
}

export function getEvolutionStatus(state: SelfEvolutionState): {
  cycleCount: number
  totalSessionsAnalyzed: number
  activePatterns: number
  trackedSkills: number
  lastCycleAgo: number
  healthScore: number
} {
  const lastCycleAgo = Date.now() - state.lastCycleTimestamp

  // Get active pattern count
  const activePatterns = state.patternEvolverState.usageRecords.length > 0
    ? new Set(state.patternEvolverState.usageRecords.map(r => r.patternId)).size
    : 0

  return {
    cycleCount: state.currentCycleNumber,
    totalSessionsAnalyzed: state.totalSessionsAnalyzed,
    activePatterns,
    trackedSkills: state.skillEvolverState.skillLevels.size,
    lastCycleAgo,
    healthScore: state.cycleHistory.length > 0
      ? state.cycleHistory[state.cycleHistory.length - 1].overallHealthScore
      : 50,
  }
}

export function getPrioritizedRecommendations(state: SelfEvolutionState): string[] {
  const recs: string[] = []

  // From pattern evolution
  const recentPatternEvals = state.patternEvolverState.evolutionHistory.slice(-5)
  for (const evaluation of recentPatternEvals) {
    if (evaluation.evolutionType === 'demote') {
      recs.push(`Review pattern "${evaluation.patternId}" - effectiveness declining: ${evaluation.reason}`)
    }
  }

  // From skill evolution
  const skillRecs = getSkillRecommendations(state.skillEvolverState)
  for (const rec of skillRecs.slice(0, 5)) {
    if (rec.priority === 'high') {
      recs.push(`Focus on ${rec.skillName}: ${rec.reason}`)
    }
  }

  // Sort by priority (pattern issues first)
  return recs
}

export function formatSelfEvolutionSummary(state: SelfEvolutionState): string {
  const lines = [
    '=== Self-Evolution Summary ===',
    `Cycles Run: ${state.currentCycleNumber}`,
    `Total Sessions Analyzed: ${state.totalSessionsAnalyzed}`,
    `Tracked Skills: ${state.skillEvolverState.skillLevels.size}`,
    '',
  ]

  if (state.cycleHistory.length > 0) {
    const lastCycle = state.cycleHistory[state.cycleHistory.length - 1]
    lines.push('--- Last Evolution Cycle ---')
    lines.push(`Overall Health: ${lastCycle.overallHealthScore}/100`)
    lines.push(`Patterns: ${lastCycle.patternEvolution.patternsPromoted}↑ ${lastCycle.patternEvolution.patternsDemoted}↓ ${lastCycle.patternEvolution.patternsPruned}✗`)
    lines.push(`Skills: ${lastCycle.skillEvolution.skillsImproved} improved, ${lastCycle.skillEvolution.totalXpGained} XP gained`)
    lines.push('')
  }

  lines.push('--- Recent Recommendations ---')
  const recs = getPrioritizedRecommendations(state)
  if (recs.length === 0) {
    lines.push('No recommendations')
  } else {
    for (const rec of recs.slice(0, 5)) {
      lines.push(`• ${rec}`)
    }
  }

  lines.push('')
  lines.push('--- Skill Levels ---')
  for (const [skillId, level] of Array.from(state.skillEvolverState.skillLevels.entries())) {
    lines.push(`${skillId}: Lv${level.level} (${level.masteryScore.toFixed(0)} mastery)`)
  }
  if (state.skillEvolverState.skillLevels.size === 0) {
    lines.push('No skills tracked yet')
  }

  return lines.join('\n')
}

