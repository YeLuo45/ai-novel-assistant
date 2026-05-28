/**
 * EvolutionAnalytics - V112
 * Advanced Evolution Analytics Engine with Cross-Module Insights
 * 
 * Inspired by:
 * - thunderbolt: pipeline architecture + parallel feedback loops
 * - chatdev: multi-agent coordination for cross-module analytics
 * - nanobot: distributed mesh for multi-source insight aggregation
 * - generic-agent: autonomous goal pursuit with self-assessment
 * 
 * Features:
 * - Cross-module analytics: combines evolution + quality + tool data
 * - Writer progress tracking over time
 * - Predictive insights for writer growth
 * - Comprehensive health dashboards
 */

import type { SelfEvolutionState } from '../evolution/SelfEvolutionEngine'
import type { StreamingQualityAnalyzerState } from '../quality/StreamingQualityAnalyzer'
import type { ToolEvolutionState } from '../analytics/ToolCallEvolutionEngine'

// =============================================================================
// Types
// =============================================================================

export interface WriterProgressRecord {
  date: string                   // YYYY-MM-DD
  sessionsCompleted: number
  totalWordsWritten: number
  averageQuality: number
  toolUsageCount: number
  evolutionCyclesRun: number
  skillMasteryAverage: number
  patternEffectivenessAverage: number
}

export interface WriterHealthScore {
  overall: number                // 0-100
  qualityComponent: number
  evolutionComponent: number
  toolEfficiencyComponent: number
  momentumComponent: number
}

export interface PredictiveInsight {
  insightId: string
  category: 'skill_gap' | 'pattern_opportunity' | 'tool_recommendation' | 'quality_warning' | 'motivation'
  title: string
  description: string
  confidence: number            // 0-1
  actionRecommendation?: string
}

export interface EvolutionAnalyticsState {
  dailyProgressRecords: WriterProgressRecord[]
  healthScoreHistory: WriterHealthScore[]
  predictiveInsights: PredictiveInsight[]
  lastSyncTimestamp: number
  totalDaysTracked: number
}

export interface EvolutionAnalyticsConfig {
  healthScoreWeights: {
    quality: number
    evolution: number
    toolEfficiency: number
    momentum: number
  }
  insightGenerationThreshold: number // min records before generating insights (default: 7)
  qualityGoodThreshold: number       // quality score for "good" (default: 75)
  qualityWarningThreshold: number    // quality score for warning (default: 50)
}

export const DEFAULT_EVOLUTION_ANALYTICS_CONFIG: EvolutionAnalyticsConfig = {
  healthScoreWeights: {
    quality: 0.35,
    evolution: 0.25,
    toolEfficiency: 0.20,
    momentum: 0.20,
  },
  insightGenerationThreshold: 7,
  qualityGoodThreshold: 75,
  qualityWarningThreshold: 50,
}

// =============================================================================
// State Management
// =============================================================================

export function createEmptyEvolutionAnalyticsState(): EvolutionAnalyticsState {
  return {
    dailyProgressRecords: [],
    healthScoreHistory: [],
    predictiveInsights: [],
    lastSyncTimestamp: Date.now(),
    totalDaysTracked: 0,
  }
}

// =============================================================================
// Health Score Calculation
// =============================================================================

export function calculateWriterHealthScore(
  evolutionState: SelfEvolutionState,
  qualityState: StreamingQualityAnalyzerState,
  toolState: ToolEvolutionState,
  config: EvolutionAnalyticsConfig = DEFAULT_EVOLUTION_ANALYTICS_CONFIG
): WriterHealthScore {
  // Quality component
  const qualitySummary = qualityState.sentenceHistory.length > 0
    ? qualityState.sentenceHistory.reduce((s, h) => s + h.qualityScore, 0) / qualityState.sentenceHistory.length
    : 50
  const qualityComponent = qualitySummary

  // Evolution component (based on cycle history)
  const evolutionHistory = evolutionState.cycleHistory
  let evolutionComponent = 50
  if (evolutionHistory.length > 0) {
    const latestHealth = evolutionHistory[evolutionHistory.length - 1].overallHealthScore
    evolutionComponent = latestHealth
  }

  // Tool efficiency component
  const toolEfficiencyReport = toolState.totalToolsUsed > 0
    ? (() => {
        const topTools = Array.from(toolState.efficiencyScores.values()).slice(0, 5)
        const avgEfficiency = topTools.length > 0
          ? topTools.reduce((s, t) => s + t.efficiencyScore, 0) / topTools.length
          : 50
        return avgEfficiency
      })()
    : 50

  // Momentum component (based on recent quality trend)
  const momentumComponent = qualityState.sentenceHistory.length >= 5
    ? (() => {
        const recent = qualityState.sentenceHistory.slice(-5)
        const avg = recent.reduce((s, h) => s + h.qualityScore, 0) / recent.length
        return avg
      })()
    : 50

  const overall = Math.round(
    qualityComponent * config.healthScoreWeights.quality +
    evolutionComponent * config.healthScoreWeights.evolution +
    toolEfficiencyComponent * config.healthScoreWeights.toolEfficiency +
    momentumComponent * config.healthScoreWeights.momentum
  )

  return {
    overall,
    qualityComponent: Math.round(qualityComponent),
    evolutionComponent: Math.round(evolutionComponent),
    toolEfficiencyComponent: Math.round(toolEfficiencyComponent),
    momentumComponent: Math.round(momentumComponent),
  }
}

// =============================================================================
// Progress Tracking
// =============================================================================

export function recordDailyProgress(
  state: EvolutionAnalyticsState,
  sessionsCompleted: number,
  totalWordsWritten: number,
  averageQuality: number,
  toolUsageCount: number,
  evolutionCyclesRun: number,
  skillMasteryAverage: number,
  patternEffectivenessAverage: number
): EvolutionAnalyticsState {
  const today = new Date().toISOString().split('T')[0]

  // Check if we already have a record for today
  const existingIdx = state.dailyProgressRecords.findIndex(r => r.date === today)

  const newRecord: WriterProgressRecord = {
    date: today,
    sessionsCompleted,
    totalWordsWritten,
    averageQuality,
    toolUsageCount,
    evolutionCyclesRun,
    skillMasteryAverage,
    patternEffectivenessAverage,
  }

  const newRecords = existingIdx >= 0
    ? state.dailyProgressRecords.map((r, i) => i === existingIdx ? newRecord : r)
    : [...state.dailyProgressRecords, newRecord]

  return {
    ...state,
    dailyProgressRecords: newRecords,
    totalDaysTracked: newRecords.length,
    lastSyncTimestamp: Date.now(),
  }
}

// =============================================================================
// Insight Generation
// =============================================================================

export function generatePredictiveInsights(
  state: EvolutionAnalyticsState,
  evolutionState: SelfEvolutionState,
  qualityState: StreamingQualityAnalyzerState,
  toolState: ToolEvolutionState,
  config: EvolutionAnalyticsConfig = DEFAULT_EVOLUTION_ANALYTICS_CONFIG
): PredictiveInsight[] {
  const insights: PredictiveInsight[] = []

  // Need minimum records for meaningful insights
  if (state.dailyProgressRecords.length < config.insightGenerationThreshold) {
    return insights
  }

  // Quality warning: average quality declining
  if (qualityState.sentenceHistory.length >= 10) {
    const recent = qualityState.sentenceHistory.slice(-10)
    const avg = recent.reduce((s, h) => s + h.qualityScore, 0) / recent.length
    if (avg < config.qualityWarningThreshold) {
      insights.push({
        insightId: `quality_warning_${Date.now()}`,
        category: 'quality_warning',
        title: 'Quality Score Declining',
        description: `Average quality over recent sentences is ${avg.toFixed(0)}, below the ${config.qualityWarningThreshold} threshold`,
        confidence: 0.8,
        actionRecommendation: 'Consider taking a break or focusing on one aspect of writing',
      })
    }
  }

  // Skill gap detection
  const skillLevels = evolutionState.skillEvolverState.skillLevels
  if (skillLevels.size > 0) {
    const lowMasterySkills = Array.from(skillLevels.entries())
      .filter(([_, level]) => level.masteryScore < 40)
      .map(([skillId]) => skillId)

    if (lowMasterySkills.length > 0) {
      insights.push({
        insightId: `skill_gap_${Date.now()}`,
        category: 'skill_gap',
        title: 'Skill Gaps Detected',
        description: `${lowMasterySkills.length} skills are below 40% mastery: ${lowMasterySkills.join(', ')}`,
        confidence: 0.75,
        actionRecommendation: 'Focus practice sessions on these weaker areas',
      })
    }
  }

  // Tool recommendation
  const staleTools = Array.from(toolState.efficiencyScores.entries())
    .filter(([_, eff]) => Date.now() - eff.lastUsed > 7 * 24 * 60 * 60 * 1000)
    .map(([toolId]) => toolId)

  if (staleTools.length > 2) {
    insights.push({
      insightId: `tool_opportunity_${Date.now()}`,
      category: 'tool_recommendation',
      title: 'Tools Not Recently Used',
      description: `${staleTools.length} tools have not been used in over a week`,
      confidence: 0.6,
      actionRecommendation: 'Consider exploring these tools to expand your writing toolkit',
    })
  }

  // Pattern opportunity
  const evolutionHistory = evolutionState.patternEvolverState.evolutionHistory
  if (evolutionHistory.length > 0) {
    const recent = evolutionHistory.slice(-5)
    const promoted = recent.filter(e => e.evolutionType === 'promote').length
    if (promoted >= 3) {
      insights.push({
        insightId: `pattern_opp_${Date.now()}`,
        category: 'pattern_opportunity',
        title: 'Strong Pattern Performance',
        description: `${promoted} patterns have been promoted recently - consider applying them more often`,
        confidence: 0.7,
        actionRecommendation: 'Review your recently promoted patterns and use them in upcoming sessions',
      })
    }
  }

  // Motivation insight based on momentum
  if (qualityState.sentenceHistory.length >= 5) {
    const recent = qualityState.sentenceHistory.slice(-5)
    const trend = calculateSimpleTrend(recent.map(h => h.qualityScore))
    if (trend > 0) {
      insights.push({
        insightId: `motivation_pos_${Date.now()}`,
        category: 'motivation',
        title: 'Writing Momentum Positive',
        description: 'Your recent writing shows consistent quality improvement',
        confidence: 0.75,
        actionRecommendation: 'Great progress! Keep up the momentum',
      })
    } else if (trend < -5) {
      insights.push({
        insightId: `motivation_neg_${Date.now()}`,
        category: 'motivation',
        title: 'Writing Momentum Declining',
        description: 'Your recent writing shows declining quality trend',
        confidence: 0.7,
        actionRecommendation: 'Consider a short break or changing your writing environment',
      })
    }
  }

  return insights
}

function calculateSimpleTrend(scores: number[]): number {
  if (scores.length < 2) return 0
  const n = scores.length
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  for (let i = 0; i < n; i++) {
    sumX += i
    sumY += scores[i]
    sumXY += i * scores[i]
    sumX2 += i * i
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  return slope
}

// =============================================================================
// Summary and Formatting
// =============================================================================

export function getEvolutionAnalyticsSummary(state: EvolutionAnalyticsState): {
  daysTracked: number
  totalSessions: number
  averageQuality: number
  overallHealthTrend: 'improving' | 'stable' | 'declining'
  activeInsights: number
} {
  const daysTracked = state.dailyProgressRecords.length
  const totalSessions = state.dailyProgressRecords.reduce((s, r) => s + r.sessionsCompleted, 0)
  const averageQuality = daysTracked > 0
    ? state.dailyProgressRecords.reduce((s, r) => s + r.averageQuality, 0) / daysTracked
    : 0

  let overallHealthTrend: 'improving' | 'stable' | 'declining' = 'stable'
  if (state.healthScoreHistory.length >= 3) {
    const recent = state.healthScoreHistory.slice(-3)
    const trend = calculateSimpleTrend(recent.map(h => h.overall))
    if (trend > 2) overallHealthTrend = 'improving'
    else if (trend < -2) overallHealthTrend = 'declining'
  }

  return {
    daysTracked,
    totalSessions,
    averageQuality: Math.round(averageQuality),
    overallHealthTrend,
    activeInsights: state.predictiveInsights.length,
  }
}

export function formatEvolutionAnalyticsReport(state: EvolutionAnalyticsState): string {
  const summary = getEvolutionAnalyticsSummary(state)

  const lines = [
    '=== Evolution Analytics Report ===',
    `Days Tracked: ${summary.daysTracked}`,
    `Total Sessions: ${summary.totalSessions}`,
    `Average Quality: ${summary.averageQuality}`,
    `Health Trend: ${summary.overallHealthTrend}`,
    '',
  ]

  if (summary.activeInsights > 0) {
    lines.push(`--- Active Insights (${summary.activeInsights}) ---`)
    for (const insight of state.predictiveInsights.slice(0, 5)) {
      lines.push(`[${insight.category.toUpperCase()}] ${insight.title}`)
      lines.push(`  ${insight.description}`)
    }
  }

  if (state.healthScoreHistory.length > 0) {
    lines.push('')
    lines.push('--- Health Score History ---')
    const recent = state.healthScoreHistory.slice(-5)
    for (const hs of recent) {
      const date = new Date().toISOString().split('T')[0]
      lines.push(`Overall: ${hs.overall} (Q:${hs.qualityComponent} E:${hs.evolutionComponent} T:${hs.toolEfficiencyComponent} M:${hs.momentumComponent})`)
    }
  }

  return lines.join('\n')
}