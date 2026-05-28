/**
 * PatternEvolver - V101
 * Pattern Library Self-Evolution Engine Based on Writing Session Outcomes
 * 
 * Inspired by:
 * - thunderbolt: pipeline architecture + feedback loops for continuous improvement
 * - nanobot: distributed mesh agents with autonomous specialization
 * - generic-agent: autonomous goal pursuit with self-improvement
 * - ruflo: hierarchical decomposition for multi-level pattern analysis
 * 
 * Analyzes writing session outcomes to evolve the pattern library:
 * - Tracks pattern usage frequency and effectiveness
 * - Identifies emerging patterns from successful writing
 * - Prunes underperforming patterns
 * - Self-tunes pattern weights based on session feedback
 */

import type { patternLibrary } from './PatternLibrary'
import type { WritingSessionState } from '../session/WritingSessionManager'

// =============================================================================
// Types
// =============================================================================

export interface PatternUsageRecord {
  patternId: string
  usedAt: number
  chapter: number
  qualityBefore: number   // 0-100 quality before using pattern
  qualityAfter: number    // 0-100 quality after using pattern
  effectivenessScore: number // calculated delta
  sessionId: string
}

export interface PatternEvolutionResult {
  patternId: string
  evolutionType: 'promote' | 'demote' | 'stable' | 'new' | 'pruned'
  previousWeight: number
  newWeight: number
  reason: string
  evidenceCount: number
}

export interface EvolutionMetrics {
  totalPatternsAnalyzed: number
  patternsPromoted: number
  patternsDemoted: number
  patternsPruned: number
  newPatternsDiscovered: number
  averageEffectivenessImprovement: number
}

export interface PatternEvolverConfig {
  promotionThreshold: number      // min effectiveness delta to promote (default: 15)
  demotionThreshold: number        // max negative delta before demotion (default: -10)
  pruneThreshold: number           // min usage before considering prune (default: 5)
  pruneMinEffectiveness: number    // max negative effectiveness to trigger prune (default: -15)
  minSamplesForEvolution: number  // min usage records before evolving (default: 3)
  maxPatternsToPromotePerRun: number // limit promotions per evolution cycle (default: 3)
  stabilityWindow: number          // recency window in ms (default: 7 days)
  maxPatternsToPrunePerRun: number // limit prunes per evolution cycle (default: 2)
}

export interface PatternEvolverState {
  config: PatternEvolverConfig
  usageRecords: PatternUsageRecord[]
  evolutionHistory: PatternEvolutionResult[]
  lastEvolutionTimestamp: number
  totalSessionsAnalyzed: number
}

export const DEFAULT_EVOLVER_CONFIG: PatternEvolverConfig = {
  promotionThreshold: 15,
  demotionThreshold: -10,
  pruneThreshold: 5,
  pruneMinEffectiveness: -15,
  minSamplesForEvolution: 3,
  maxPatternsToPromotePerRun: 3,
  stabilityWindow: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxPatternsToPrunePerRun: 2,
}

// =============================================================================
// Helper Functions
// =============================================================================

export function createEmptyEvolverState(config: Partial<PatternEvolverConfig> = {}): PatternEvolverState {
  return {
    config: { ...DEFAULT_EVOLVER_CONFIG, ...config },
    usageRecords: [],
    evolutionHistory: [],
    lastEvolutionTimestamp: Date.now(),
    totalSessionsAnalyzed: 0,
  }
}

export function calculateEffectivenessScore(
  qualityBefore: number,
  qualityAfter: number,
  recencyWeight: number = 1.0
): number {
  const delta = qualityAfter - qualityBefore
  // Apply recency weighting: more recent = higher weight
  // Normalize to 0-1 range where recencyWeight 1.0 = full weight
  return delta * recencyWeight
}

export function recordPatternUsage(
  state: PatternEvolverState,
  patternId: string,
  chapter: number,
  qualityBefore: number,
  qualityAfter: number,
  sessionId: string
): PatternEvolverState {
  const effectivenessScore = calculateEffectivenessScore(qualityBefore, qualityAfter)
  const record: PatternUsageRecord = {
    patternId,
    usedAt: Date.now(),
    chapter,
    qualityBefore,
    qualityAfter,
    effectivenessScore,
    sessionId,
  }
  return {
    ...state,
    usageRecords: [...state.usageRecords, record],
  }
}

export function getRecentUsageRecords(
  state: PatternEvolverState,
  patternId: string,
  windowMs?: number
): PatternUsageRecord[] {
  const window = windowMs ?? state.config.stabilityWindow
  const cutoff = Date.now() - window
  return state.usageRecords.filter(
    r => r.patternId === patternId && r.usedAt >= cutoff
  )
}

export function calculatePatternStatistics(
  state: PatternEvolverState,
  patternId: string
): {
  usageCount: number
  recentUsageCount: number
  averageEffectiveness: number
  trend: 'improving' | 'declining' | 'stable'
  lastUsed: number | null
} {
  const records = state.usageRecords.filter(r => r.patternId === patternId)
  const recentRecords = getRecentUsageRecords(state, patternId)

  if (records.length === 0) {
    return {
      usageCount: 0,
      recentUsageCount: 0,
      averageEffectiveness: 0,
      trend: 'stable',
      lastUsed: null,
    }
  }

  const averageEffectiveness = records.reduce((sum, r) => sum + r.effectivenessScore, 0) / records.length

  // Calculate trend by comparing recent vs older effectiveness
  const halfPoint = Math.floor(records.length / 2)
  const olderRecords = records.slice(0, halfPoint)
  const recentGroup = records.slice(halfPoint)

  let trend: 'improving' | 'declining' | 'stable' = 'stable'
  if (olderRecords.length > 0 && recentGroup.length > 0) {
    const olderAvg = olderRecords.reduce((sum, r) => sum + r.effectivenessScore, 0) / olderRecords.length
    const recentAvg = recentGroup.reduce((sum, r) => sum + r.effectivenessScore, 0) / recentGroup.length
    const diff = recentAvg - olderAvg
    if (diff > 5) trend = 'improving'
    else if (diff < -5) trend = 'declining'
  }

  return {
    usageCount: records.length,
    recentUsageCount: recentRecords.length,
    averageEffectiveness,
    trend,
    lastUsed: records.length > 0 ? records[records.length - 1].usedAt : null,
  }
}

export function shouldPromotePattern(
  stats: ReturnType<typeof calculatePatternStatistics>,
  config: PatternEvolverConfig
): boolean {
  return (
    stats.recentUsageCount >= config.minSamplesForEvolution &&
    stats.averageEffectiveness >= config.promotionThreshold &&
    stats.trend === 'improving'
  )
}

export function shouldDemotePattern(
  stats: ReturnType<typeof calculatePatternStatistics>,
  config: PatternEvolverConfig
): boolean {
  return (
    stats.recentUsageCount >= config.minSamplesForEvolution &&
    stats.averageEffectiveness <= config.demotionThreshold
  )
}

export function shouldPrunePattern(
  stats: ReturnType<typeof calculatePatternStatistics>,
  config: PatternEvolverConfig
): boolean {
  return (
    stats.usageCount >= config.pruneThreshold &&
    stats.averageEffectiveness <= config.pruneMinEffectiveness
  )
}

export function evolvePatterns(
  state: PatternEvolverState,
  patterns: any,
  sessions: WritingSessionState[]
): {
  evolvedState: PatternEvolverState
  evolutionResults: PatternEvolutionResult[]
  metrics: EvolutionMetrics
} {
  const results: PatternEvolutionResult[] = []
  let promoted = 0
  let demoted = 0
  let pruned = 0
  let newPatterns = 0

  // Update state with new session data
  let evolvedState = { ...state, totalSessionsAnalyzed: state.totalSessionsAnalyzed + sessions.length }

  // Record pattern usage from sessions
  for (const session of sessions) {
    for (const toolCall of session.activeContext?.recentToolCalls ?? []) {
      const patternId = (toolCall as any).patternId
      if (patternId && typeof (toolCall as any).qualityScore === 'number') {
        evolvedState = recordPatternUsage(
          evolvedState,
          patternId,
          session.currentChapter ?? 1,
          (toolCall as any).qualityBefore ?? 50,
          (toolCall as any).qualityScore,
          session.sessionId
        )
      }
    }
  }

  // Get all pattern IDs that have usage records
  const patternIdsWithUsageSet = new Set(evolvedState.usageRecords.map(r => r.patternId))

  // Analyze each pattern with usage
  for (const patternId of patternIdsWithUsageSet) {
    const stats = calculatePatternStatistics(evolvedState, patternId)
    const pattern = patterns.patterns.find(p => p.id === patternId)

    if (!pattern) continue

    if (shouldPrunePattern(stats, evolvedState.config) && pruned < evolvedState.config.maxPatternsToPrunePerRun) {
      const result: PatternEvolutionResult = {
        patternId,
        evolutionType: 'pruned',
        previousWeight: pattern.weight,
        newWeight: 0,
        reason: `Pruned: avg effectiveness ${stats.averageEffectiveness.toFixed(1)} below threshold ${evolvedState.config.pruneMinEffectiveness}`,
        evidenceCount: stats.usageCount,
      }
      results.push(result)
      pruned++
    } else if (shouldDemotePattern(stats, evolvedState.config)) {
      const newWeight = Math.max(0.1, pattern.weight * 0.7)
      const result: PatternEvolutionResult = {
        patternId,
        evolutionType: 'demote',
        previousWeight: pattern.weight,
        newWeight,
        reason: `Demoted: avg effectiveness ${stats.averageEffectiveness.toFixed(1)} below threshold ${evolvedState.config.demotionThreshold}`,
        evidenceCount: stats.usageCount,
      }
      results.push(result)
      demoted++
    } else if (shouldPromotePattern(stats, evolvedState.config) && promoted < evolvedState.config.maxPatternsToPromotePerRun) {
      const newWeight = Math.min(2.0, pattern.weight * 1.3)
      const result: PatternEvolutionResult = {
        patternId,
        evolutionType: 'promote',
        previousWeight: pattern.weight,
        newWeight,
        reason: `Promoted: avg effectiveness ${stats.averageEffectiveness.toFixed(1)} above threshold ${evolvedState.config.promotionThreshold}, trend ${stats.trend}`,
        evidenceCount: stats.usageCount,
      }
      results.push(result)
      promoted++
    }
  }

  // Detect new patterns from successful sessions
  const successfulSessions = sessions.filter(s => {
    const lastQuality = s.phaseHistory?.[s.phaseHistory.length - 1]?.qualityScore
    return lastQuality && lastQuality > 75
  })

  for (const session of successfulSessions) {
    const newPatternCandidates = (session as any).newPatternsDiscovered as string[] | undefined
    if (newPatternCandidates) {
      for (const candidate of newPatternCandidates) {
        if (!Array.from(patternIdsWithUsage).includes(candidate)) {
          const result: PatternEvolutionResult = {
            patternId: candidate,
            evolutionType: 'new',
            previousWeight: 0,
            newWeight: 1.0,
            reason: `Discovered in successful session ${session.id}`,
            evidenceCount: 1,
          }
          results.push(result)
          newPatterns++
          patternIdsWithUsage.add(candidate) // prevent duplicates
        }
      }
    }
  }

  evolvedState = {
    ...evolvedState,
    evolutionHistory: [...evolvedState.evolutionHistory, ...results],
    lastEvolutionTimestamp: Date.now(),
  }

  const metrics: EvolutionMetrics = {
    totalPatternsAnalyzed: patternIdsWithUsageSet.size,
    patternsPromoted: promoted,
    patternsDemoted: demoted,
    patternsPruned: pruned,
    newPatternsDiscovered: newPatterns,
    averageEffectivenessImprovement: results.length > 0
      ? results.filter(r => r.evolutionType === 'promote').reduce((sum, r) => sum + (r.newWeight - r.previousWeight), 0) / Math.max(1, promoted)
      : 0,
  }

  return { evolvedState, evolutionResults: results, metrics }
}

export function applyEvolutionToPatterns(
  patterns: any,
  results: PatternEvolutionResult[]
): any {
  const patternWeightMap = new Map(results.map(r => [r.patternId, { type: r.evolutionType, weight: r.newWeight }]))

  const updatedPatterns = patterns.patterns.map(p => {
    const evolution = patternWeightMap.get(p.id)
    if (!evolution) return p

    if (evolution.type === 'pruned') {
      return { ...p, weight: 0, isActive: false }
    }
    return { ...p, weight: evolution.weight }
  })

  // Add new patterns
  const newPatternResults = results.filter(r => r.evolutionType === 'new')
  for (const result of newPatternResults) {
    if (!updatedPatterns.find(p => p.id === result.patternId)) {
      updatedPatterns.push({
        id: result.patternId,
        name: result.patternId,
        category: 'discovered',
        weight: result.newWeight,
        isActive: true,
        description: `Auto-discovered pattern: ${result.reason}`,
        examples: [],
        compatibilityNotes: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    }
  }

  return { ...patterns, patterns: updatedPatterns }
}

export function getEvolutionRecommendations(
  state: PatternEvolverState,
  patterns: any
): string[] {
  const recommendations: string[] = []

  for (const pattern of patterns.patterns) {
    if (!pattern.isActive) {
      recommendations.push(`Consider removing inactive pattern: ${pattern.name}`)
      continue
    }

    const stats = calculatePatternStatistics(state, pattern.id)
    if (stats.usageCount === 0) {
      recommendations.push(`Pattern "${pattern.name}" has never been used - consider removing or repositioning`)
    } else if (stats.trend === 'declining') {
      recommendations.push(`Pattern "${pattern.name}" shows declining effectiveness - review usage context`)
    } else if (stats.trend === 'improving' && stats.recentUsageCount >= state.config.minSamplesForEvolution) {
      recommendations.push(`Pattern "${pattern.name}" improving and well-used - consider promoting`)
    }
  }

  return recommendations
}

export function formatEvolutionSummary(
  state: PatternEvolverState,
  results: PatternEvolutionResult[],
  metrics: EvolutionMetrics
): string {
  const lines = [
    '=== Pattern Evolution Summary ===',
    `Sessions Analyzed: ${state.totalSessionsAnalyzed}`,
    `Total Patterns Analyzed: ${metrics.totalPatternsAnalyzed}`,
    '',
    `Promoted: ${metrics.patternsPromoted}`,
    `Demoted: ${metrics.patternsDemoted}`,
    `Pruned: ${metrics.patternsPruned}`,
    `New Patterns Discovered: ${metrics.newPatternsDiscovered}`,
    '',
  ]

  if (results.length > 0) {
    lines.push('--- Recent Evolutions ---')
    for (const result of results.slice(-5)) {
      const arrow = result.evolutionType === 'promote' ? '↑' : result.evolutionType === 'demote' ? '↓' : result.evolutionType === 'pruned' ? '✗' : '◆'
      lines.push(`${arrow} ${result.patternId}: ${result.previousWeight.toFixed(2)} → ${result.newWeight.toFixed(2)}`)
      lines.push(`   Reason: ${result.reason}`)
    }
  }

  return lines.join('\n')
}