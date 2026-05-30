/**
 * AuthorDashboard Types - V83
 * Unified Author Analytics and Story Intelligence Dashboard
 * 
 * Integrates:
 * - WritingSessionManager (session orchestration)
 * - ReaderExperienceSimulator (reader prediction)
 * - NarrativeCoherenceChecker (story QA)
 * - SkillGraph (author skill tracking)
 * 
 * Provides authors with actionable intelligence:
 * - Real-time writing session monitoring
 * - Reader engagement prediction
 * - Story quality scores
 * - Skill development tracking
 */

import type { WritingSessionState, PhaseMetrics } from '../session/WritingSessionManager'
import type { EmotionalState, EngagementPrediction, PacingAnalysis, FatigueReport, ReaderProfile } from '../narrative/ReaderExperienceSimulator'
import type { SkillNode } from '../evolution/SkillGraph'
import type { InconsistencyReport } from '../narrative/NarrativeCoherenceChecker'

// ===============================================================================
// Dashboard Types
// ===============================================================================

export type DashboardView = 'overview' | 'session' | 'reader' | 'quality' | 'skills'

export interface AuthorDashboardState {
  currentSession: WritingSessionState | null
  readerPrediction: EngagementPrediction | null
  pacingAnalysis: PacingAnalysis | null
  fatigueReport: FatigueReport | null
  activeCharacters: string[]
  sessionMetrics: PhaseMetrics | null
  readerEngagementHistory: number[]
  lastUpdated: number
}

export interface DashboardConfig {
  readerProfiles: ReaderProfile[]
  focusSkillAreas: string[]
  autoTrackSession: boolean
  simulateReaders: boolean
  realTimeUpdates: boolean
}

export interface AuthorInsight {
  id: string
  type: 'warning' | 'tip' | 'achievement' | 'alert'
  category: 'session' | 'reader' | 'quality' | 'skill'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  timestamp: number
  actionable: boolean
  suggestedAction?: string
}

export interface DashboardSummary {
  overallHealthScore: number      // 0-100 composite
  sessionHealth: number           // 0-100
  readerHealth: number            // 0-100
  qualityHealth: number           // 0-100
  skillHealth: number             // 0-100
  activeInsights: AuthorInsight[]
  recentAchievements: string[]
  pendingWarnings: string[]
}

// ===============================================================================
// Session Analytics
// ===============================================================================

export interface SessionAnalytics {
  currentPhase: string
  sessionDuration: number         // minutes
  wordsWritten: number
  averageWordRate: number         // words per minute
  qualityTrend: number[]          // last N quality scores
  energyLevel: 'high' | 'medium' | 'low' | 'depleted'
  recommendedBreak: boolean
  breakSuggestion: string
  currentMomentum: number
  stagnationRisk: boolean
  toolCallCount: number
  lastToolCallTime: number | null
}

// ===============================================================================
// Reader Analytics
// ===============================================================================

export interface ReaderAnalytics {
  simulatedProfiles: number
  averageEngagement: number        // 0-100
  predictedCompletionRate: number  // 0-1
  likelyDropPoints: number[]       // chapter numbers
  criticalFatigueZones: number[]   // chapters at risk
  hookEffectiveness: number         // 0-100
  pacingScore: number             // 0-100
  recommendedAdjustments: string[]
}

// ===============================================================================
// Quality Analytics
// ===============================================================================

export interface QualityAnalytics {
  coherenceScore: number           // 0-100
  characterConsistency: number     // 0-100
  plotConsistency: number         // 0-100
  pacingQuality: number           // 0-100
  activeIssues: InconsistencyReport[]
  criticalIssues: InconsistencyReport[]
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F'
}

// ===============================================================================
// Skill Analytics
// ===============================================================================

export interface SkillAnalytics {
  topSkills: Array<{ name: string; level: number; trend: 'up' | 'stable' | 'down' }>
  weakestSkills: Array<{ name: string; gap: number }>
  skillHealthScores: Map<string, number>
  recommendedFocus: string[]
  recentlyImproved: string[]
}

// ===============================================================================
// Dashboard Factory
// ===============================================================================

/**
 * Create empty dashboard state
 */
export function createEmptyDashboardState(): AuthorDashboardState {
  return {
    currentSession: null,
    readerPrediction: null,
    pacingAnalysis: null,
    fatigueReport: null,
    activeCharacters: [],
    sessionMetrics: null,
    readerEngagementHistory: [],
    lastUpdated: Date.now()
  }
}

/**
 * Create default dashboard config
 */
export function createDefaultDashboardConfig(): DashboardConfig {
  return {
    readerProfiles: [],
    focusSkillAreas: ['plotting', 'character', 'dialogue', 'worldbuilding', 'prose'],
    autoTrackSession: true,
    simulateReaders: true,
    realTimeUpdates: false
  }
}

/**
 * Calculate overall health score from sub-scores
 */
export function calculateOverallHealthScore(
  sessionScore: number,
  readerScore: number,
  qualityScore: number,
  skillScore: number
): number {
  // Weighted average with quality being most important
  const weights = { session: 0.2, reader: 0.25, quality: 0.35, skill: 0.2 }
  return Math.round(
    sessionScore * weights.session +
    readerScore * weights.reader +
    qualityScore * weights.quality +
    skillScore * weights.skill
  )
}

/**
 * Generate dashboard summary from analytics
 */
export function generateDashboardSummary(
  state: AuthorDashboardState,
  sessionAnalytics: SessionAnalytics | null,
  readerAnalytics: ReaderAnalytics | null,
  qualityAnalytics: QualityAnalytics | null,
  skillAnalytics: SkillAnalytics | null
): DashboardSummary {
  const insights: AuthorInsight[] = []
  const achievements: string[] = []
  const warnings: string[] = []

  // Session insights
  if (sessionAnalytics) {
    if (sessionAnalytics.stagnationRisk) {
      insights.push({
        id: `session_stagnation_${Date.now()}`,
        type: 'warning',
        category: 'session',
        title: 'Stagnation Risk Detected',
        description: 'Quality has been declining for several measurements. Consider changing pace or taking a break.',
        priority: 'high',
        timestamp: Date.now(),
        actionable: true,
        suggestedAction: 'Try switching to a different scene type or take a 5-minute break'
      })
    }

    if (sessionAnalytics.energyLevel === 'depleted') {
      insights.push({
        id: `session_energy_${Date.now()}`,
        type: 'alert',
        category: 'session',
        title: 'Energy Depleted',
        description: 'Your writing energy is critically low. Continued writing may reduce quality.',
        priority: 'high',
        timestamp: Date.now(),
        actionable: true,
        suggestedAction: 'Take a 15-30 minute break before continuing'
      })
    }

    if (sessionAnalytics.recommendedBreak) {
      insights.push({
        id: `session_break_${Date.now()}`,
        type: 'tip',
        category: 'session',
        title: 'Break Recommended',
        description: sessionAnalytics.breakSuggestion,
        priority: 'medium',
        timestamp: Date.now(),
        actionable: true,
        suggestedAction: sessionAnalytics.breakSuggestion
      })
    }

    if (sessionAnalytics.currentMomentum > 80) {
      achievements.push('High writing momentum achieved')
    }
  }

  // Reader insights
  if (readerAnalytics) {
    if (readerAnalytics.predictedCompletionRate < 0.5) {
      insights.push({
        id: `reader_dropout_${Date.now()}`,
        type: 'warning',
        category: 'reader',
        title: 'High Dropout Risk',
        description: `Predicted completion rate is ${(readerAnalytics.predictedCompletionRate * 100).toFixed(0)}%. Consider reviewing pacing and hooks.`,
        priority: 'high',
        timestamp: Date.now(),
        actionable: true,
        suggestedAction: 'Review chapter hooks and pacing in chapters ' + readerAnalytics.likelyDropPoints.join(', ')
      })
    }

    if (readerAnalytics.criticalFatigueZones.length > 0) {
      insights.push({
        id: `reader_fatigue_${Date.now()}`,
        type: 'alert',
        category: 'reader',
        title: 'Reader Fatigue Zones Detected',
        description: `Chapters ${readerAnalytics.criticalFatigueZones.join(', ')} may cause reader fatigue.`,
        priority: 'high',
        timestamp: Date.now(),
        actionable: true,
        suggestedAction: 'Add variation or scene breaks in flagged chapters'
      })
    }

    if (readerAnalytics.hookEffectiveness > 80) {
      achievements.push('Strong hook effectiveness detected')
    }
  }

  // Quality insights
  if (qualityAnalytics) {
    if (qualityAnalytics.criticalIssues.length > 0) {
      insights.push({
        id: `quality_critical_${Date.now()}`,
        type: 'alert',
        category: 'quality',
        title: `${qualityAnalytics.criticalIssues.length} Critical Quality Issues`,
        description: qualityAnalytics.criticalIssues[0].description,
        priority: 'high',
        timestamp: Date.now(),
        actionable: true,
        suggestedAction: `Review ${qualityAnalytics.criticalIssues[0].type} consistency in chapter ${qualityAnalytics.criticalIssues[0].chapter}`
      })
    }

    if (qualityAnalytics.overallGrade === 'A') {
      achievements.push('Story quality grade: A')
    } else if (qualityAnalytics.overallGrade === 'B') {
      achievements.push('Story quality grade: B')
    }
  }

  // Skill insights
  if (skillAnalytics) {
    if (skillAnalytics.recentlyImproved.length > 0) {
      achievements.push(`Skill improved: ${skillAnalytics.recentlyImproved[0]}`)
    }

    for (const weakest of skillAnalytics.weakestSkills.slice(0, 2)) {
      insights.push({
        id: `skill_gap_${weakest.name}_${Date.now()}`,
        type: 'tip',
        category: 'skill',
        title: `Skill Gap: ${weakest.name}`,
        description: `Consider focusing more on ${weakest.name} development.`,
        priority: 'medium',
        timestamp: Date.now(),
        actionable: true,
        suggestedAction: `Practice ${weakest.name} with focused exercises`
      })
    }
  }

  // Sort insights by priority
  insights.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  // Calculate health scores
  const sessionHealth = sessionAnalytics
    ? Math.round(100 - (sessionAnalytics.stagnationRisk ? 30 : 0) - (sessionAnalytics.energyLevel === 'depleted' ? 40 : 0))
    : 50
  const readerHealth = readerAnalytics
    ? Math.round(readerAnalytics.averageEngagement * readerAnalytics.predictedCompletionRate)
    : 50
  const qualityHealth = qualityAnalytics ? qualityAnalytics.coherenceScore : 50
  const skillHealth = skillAnalytics
    ? Math.round(Array.from(skillAnalytics.skillHealthScores.values()).reduce((a, b) => a + b, 0) / Math.max(1, skillAnalytics.skillHealthScores.size) * 100)
    : 50

  return {
    overallHealthScore: calculateOverallHealthScore(sessionHealth, readerHealth, qualityHealth, skillHealth),
    sessionHealth,
    readerHealth,
    qualityHealth,
    skillHealth,
    activeInsights: insights,
    recentAchievements: achievements,
    pendingWarnings: warnings
  }
}

/**
 * Format dashboard summary for display
 */
export function formatDashboardSummary(summary: DashboardSummary): string {
  const lines = [
    `=== Author Dashboard Summary ===`,
    `Overall Health: ${summary.overallHealthScore}/100`,
    `  Session: ${summary.sessionHealth}/100`,
    `  Reader: ${summary.readerHealth}/100`,
    `  Quality: ${summary.qualityHealth}/100`,
    `  Skills: ${summary.skillHealth}/100`,
    ``,
    `Insights (${summary.activeInsights.length}):`
  ]

  for (const insight of summary.activeInsights.slice(0, 5)) {
    const icon = insight.type === 'alert' ? '🚨' : insight.type === 'warning' ? '⚠️' : insight.type === 'tip' ? '💡' : '🏆'
    lines.push(`  ${icon} [${insight.priority}] ${insight.title}: ${insight.description}`)
  }

  if (summary.recentAchievements.length > 0) {
    lines.push(``, `Achievements:`)
    for (const ach of summary.recentAchievements) {
      lines.push(`  🏆 ${ach}`)
    }
  }

  return lines.join('\n')
}

/**
 * Calculate session analytics from session state
 */
export function calculateSessionAnalytics(state: WritingSessionState | null, metrics: PhaseMetrics | null): SessionAnalytics | null {
  if (!state) return null

  const now = Date.now()
  const sessionDuration = state.sessionStartTime
    ? Math.round((now - state.sessionStartTime) / 60000)
    : 0

  let energyLevel: SessionAnalytics['energyLevel'] = 'medium'
  if (metrics) {
    if (metrics.durationMs > 90 * 60000) energyLevel = 'depleted'
    else if (metrics.durationMs > 60 * 60000) energyLevel = 'low'
    else if (metrics.durationMs < 30 * 60000) energyLevel = 'high'
  }

  return {
    currentPhase: state.currentPhase,
    sessionDuration,
    wordsWritten: state.totalWordsWritten,
    averageWordRate: sessionDuration > 0 ? Math.round(state.totalWordsWritten / sessionDuration) : 0,
    qualityTrend: state.qualityHistory.slice(-10),
    energyLevel,
    recommendedBreak: energyLevel === 'depleted' || energyLevel === 'low',
    breakSuggestion: energyLevel === 'depleted'
      ? 'Take a 20-30 minute break to recharge'
      : energyLevel === 'low'
      ? 'Consider a 5-10 minute break'
      : 'You have good energy - keep writing!',
    currentMomentum: state.currentMomentum,
    stagnationRisk: state.stagnationCount > 2,
    toolCallCount: state.toolCallCount,
    lastToolCallTime: state.lastToolCallTime
  }
}

/**
 * Calculate reader analytics from predictions
 */
export function calculateReaderAnalytics(
  engagementHistory: number[],
  pacingAnalysis: PacingAnalysis | null,
  fatigueReport: FatigueReport | null
): ReaderAnalytics | null {
  if (engagementHistory.length === 0) return null

  const averageEngagement = Math.round(
    engagementHistory.reduce((a, b) => a + b, 0) / engagementHistory.length
  )

  const lastEngagement = engagementHistory[engagementHistory.length - 1]
  const predictedCompletionRate = lastEngagement / 100

  // Find likely drop points (engagement < 30%)
  const likelyDropPoints = engagementHistory
    .map((e, i) => ({ engagement: e, index: i }))
    .filter(x => x.engagement < 30)
    .map(x => x.index + 1)

  // Critical fatigue zones
  const criticalFatigueZones = fatigueReport?.affectedChapters || []

  // Hook effectiveness estimate (based on early engagement)
  const earlyEngagement = engagementHistory.slice(0, Math.min(3, engagementHistory.length))
  const hookEffectiveness = earlyEngagement.length > 0
    ? Math.round(earlyEngagement.reduce((a, b) => a + b, 0) / earlyEngagement.length)
    : 50

  const pacingScore = pacingAnalysis?.pacingScore || 50

  const recommendedAdjustments: string[] = []
  if (pacingAnalysis && pacingAnalysis.issues.length > 0) {
    recommendedAdjustments.push(...pacingAnalysis.issues.slice(0, 2))
  }
  if (criticalFatigueZones.length > 0) {
    recommendedAdjustments.push('Break up fatigue zones with scene changes or pacing variation')
  }

  return {
    simulatedProfiles: 1,
    averageEngagement,
    predictedCompletionRate,
    likelyDropPoints,
    criticalFatigueZones,
    hookEffectiveness,
    pacingScore,
    recommendedAdjustments
  }
}

/**
 * Generate insight ID
 */
export function generateInsightId(category: AuthorInsight['category'], title: string): string {
  return `${category}_${title.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`
}