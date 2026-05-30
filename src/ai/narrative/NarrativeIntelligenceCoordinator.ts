/**
 * NarrativeIntelligenceCoordinator Types - V93
 * Unified Narrative Intelligence Hub
 * 
 * Coordinates all narrative analysis subsystems into a single coherent intelligence layer:
 * - StoryWorldModel (entity state graph)
 * - PlotContinuityEngine (thread continuity)
 * - StoryArchipelagoAnalyzer (subplot archipelago)
 * - ReaderExperienceSimulator (reader engagement)
 * - WriterPersonaEngine (style matching)
 * 
 * Provides unified narrative intelligence with cross-subsystem insights,
 * inspired by thunderbolt's pipeline + nanobot's distributed agent mesh.
 */

import type { SkillNode } from '../evolution/SkillGraph'
import type { StoryWorldState } from '../world/StoryWorldModel'
import type { ContinuityReport } from '../narrative/PlotContinuityEngine'
import type { ArchipelagoAnalysis } from '../narrative/StoryArchipelagoAnalyzer'
import type { EngagementPrediction } from '../narrative/ReaderExperienceSimulator'
import type { WriterPersona } from '../persona/WriterPersonaEngine'

// ===============================================================================
// Coordination Types
// ===============================================================================

export interface NarrativeIntelligenceState {
  worldState: StoryWorldState
  continuityReport: ContinuityReport
  archipelagoAnalysis: ArchipelagoAnalysis
  engagementPrediction: EngagementPrediction | null
  writerPersona: WriterPersona | null
  currentChapter: number
  lastUpdated: number
}

export interface CrossSubsystemInsight {
  type: 'character-plot' | 'reader-author' | 'world-thread' | 'subplot-engagement' | 'style-content'
  severity: 'critical' | 'major' | 'minor'
  title: string
  description: string
  evidence: string[]
  affectedSubsystems: string[]
  recommendations: string[]
}

export interface NarrativeHealthScore {
  overall: number                      // 0-100
  worldHealth: number                 // 0-100
  continuityHealth: number           // 0-100
  engagementHealth: number           // 0-100
  styleHealth: number                // 0-100
  crossSubsystemScore: number        // 0-100
  bottlenecks: string[]              // Biggest issues
  strengths: string[]                // What's working well
}

export interface CoordinationConfig {
  minHealthThreshold: number          // Below this, alert user
  criticalInsightThreshold: number   // Above this severity, alert immediately
  autoUpdateIntervalMs: number      // How often to refresh
  crossSubsystemDepth: number        // How deep to analyze cross-subsystem
}

// ===============================================================================
// Configuration
// =============================================================================

export const DEFAULT_COORDINATION_CONFIG: CoordinationConfig = {
  minHealthThreshold: 60,
  criticalInsightThreshold: 80,
  autoUpdateIntervalMs: 5000,
  crossSubsystemDepth: 3
}

// ===============================================================================
// Factory Functions
// =============================================================================

/**
 * Create empty intelligence state
 */
export function createEmptyIntelligenceState(): NarrativeIntelligenceState {
  return {
    worldState: {
      id: 'empty',
      storyId: 'unknown',
      totalChapters: 0,
      characters: new Map(),
      locations: new Map(),
      items: new Map(),
      events: new Map(),
      rules: new Map(),
      timeline: [],
      characterCount: 0,
      locationCount: 0,
      itemCount: 0
    },
    continuityReport: {
      isClean: true,
      plotHoles: [],
      threadStates: {
        setupPromises: [],
        unresolvedPayoffs: [],
        pendingForeshadowing: [],
        satisfiedThreads: [],
        abandonedThreads: []
      },
      warnings: [],
      suggestions: [],
      overallHealthScore: 100
    },
    archipelagoAnalysis: {
      map: {
        islands: [],
        bridges: [],
        totalChapters: 0,
        mainPlotId: '',
        orphanedIslands: [],
        parallelSubplots: []
      },
      complexityScore: 0,
      mainPlotIndependence: 1,
      subplotDensity: 0,
      overConnectedIslands: [],
      underConnectedIslands: [],
      seepageEffects: [],
      recommendations: []
    },
    engagementPrediction: null,
    writerPersona: null,
    currentChapter: 0,
    lastUpdated: Date.now()
  }
}

// =============================================================================
// Cross-Subsystem Analysis
// =============================================================================

/**
 * Detect character-plot mismatches
 */
export function detectCharacterPlotMismatches(
  state: NarrativeIntelligenceState
): CrossSubsystemInsight[] {
  const insights: CrossSubsystemInsight[] = []

  if (!state.continuityReport.isClean) {
    const criticalHoles = state.continuityReport.plotHoles.filter(h => h.severity === 'critical')
    for (const hole of criticalHoles) {
      // Check if any character is involved
      for (const [charId, char] of Array.from(state.worldState.characters.entries())) {
        insights.push({
          type: 'character-plot',
          severity: 'critical',
          title: `Character "${char.name}" involved in critical plot hole`,
          description: hole.description,
          evidence: [hole.suggestion],
          affectedSubsystems: ['worldState', 'continuityEngine'],
          recommendations: [hole.suggestion]
        })
      }
    }
  }

  return insights
}

/**
 * Detect reader-author style mismatches
 */
export function detectReaderAuthorMismatches(
  state: NarrativeIntelligenceState
): CrossSubsystemInsight[] {
  const insights: CrossSubsystemInsight[] = []

  if (state.engagementPrediction && state.writerPersona) {
    // If engagement is low but writer persona is confident, style may be misaligned
    if (state.engagementPrediction.engagementScore < 50 && state.writerPersona.confidenceScore > 70) {
      insights.push({
        type: 'reader-author',
        severity: 'major',
        title: 'Low engagement despite confident author style',
        description: `Engagement at ${state.engagementPrediction.engagementScore.toFixed(0)}% but author style confidence at ${state.writerPersona.confidenceScore}%`,
        evidence: [
          `Predicted finish probability: ${(state.engagementPrediction.predictedFinishProbability * 100).toFixed(0)}%`,
          `Engagement score: ${state.engagementPrediction.engagementScore.toFixed(0)}%`
        ],
        affectedSubsystems: ['readerExperienceSimulator', 'writerPersonaEngine'],
        recommendations: ['Consider adjusting pacing or emotional tone to match reader expectations']
      })
    }

    // Remove pacing check since EngagementPrediction doesn't have pacingScore
  }

  return insights
}

/**
 * Detect world-thread inconsistencies
 */
export function detectWorldThreadInconsistencies(
  state: NarrativeIntelligenceState
): CrossSubsystemInsight[] {
  const insights: CrossSubsystemInsight[] = []

  // Orphaned islands vs forgotten characters
  const orphaned = state.archipelagoAnalysis.map.orphanedIslands
  if (orphaned.length > 0) {
    insights.push({
      type: 'world-thread',
      severity: 'major',
      title: `${orphaned.length} subplot island(s) disconnected from main plot`,
      description: 'These subplots may create world state inconsistencies',
      evidence: orphaned.map(id => `Island: ${id}`),
      affectedSubsystems: ['archipelagoAnalyzer', 'worldModel'],
      recommendations: ['Consider adding bridges to main plot or resolving these subplots']
    })
  }

  // Character not mentioned in world but active in threads
  const activeThreads = state.continuityReport.threadStates.unresolvedPayoffs.length
  if (activeThreads > 10 && state.worldState.characterCount < 5) {
    insights.push({
      type: 'world-thread',
      severity: 'minor',
      title: 'Many active threads but few characters tracked',
      description: 'Thread complexity may exceed world modeling depth',
      evidence: [`${activeThreads} unresolved payoffs, ${state.worldState.characterCount} tracked characters`],
      affectedSubsystems: ['continuityEngine', 'worldModel'],
      recommendations: ['Consider expanding character tracking for complex threads']
    })
  }

  return insights
}

/**
 * Generate all cross-subsystem insights
 */
export function generateCrossSubsystemInsights(
  state: NarrativeIntelligenceState
): CrossSubsystemInsight[] {
  const insights: CrossSubsystemInsight[] = []

  insights.push(...detectCharacterPlotMismatches(state))
  insights.push(...detectReaderAuthorMismatches(state))
  insights.push(...detectWorldThreadInconsistencies(state))

  // Subplot-engagement correlation
  if (state.archipelagoAnalysis.complexityScore > 70 && state.engagementPrediction) {
    if (state.engagementPrediction.engagementScore < 60) {
      insights.push({
        type: 'subplot-engagement',
        severity: 'major',
        title: 'High story complexity may be overwhelming readers',
        description: `Complexity ${state.archipelagoAnalysis.complexityScore}/100 but engagement only ${state.engagementPrediction.engagementScore.toFixed(0)}%`,
        evidence: [
          `${state.archipelagoAnalysis.map.islands.length} islands, ${state.archipelagoAnalysis.map.bridges.length} bridges`,
          `${state.archipelagoAnalysis.overConnectedIslands.length} over-connected islands`
        ],
        affectedSubsystems: ['archipelagoAnalyzer', 'readerExperienceSimulator'],
        recommendations: ['Consider simplifying subplot connections or reducing parallel storylines']
      })
    }
  }

  // Sort by severity
  return insights.sort((a, b) => {
    const order = { critical: 0, major: 1, minor: 2 }
    return order[a.severity] - order[b.severity]
  })
}

// =============================================================================
// Health Score Calculation
// =============================================================================

/**
 * Calculate comprehensive narrative health score
 */
export function calculateNarrativeHealthScore(
  state: NarrativeIntelligenceState
): NarrativeHealthScore {
  // World health
  const worldStats = {
    characterCount: state.worldState.characterCount,
    locationCount: state.worldState.locationCount,
    itemCount: state.worldState.itemCount
  }
  const worldHealth = worldStats.characterCount > 0
    ? Math.min(100, 50 + worldStats.locationCount * 2 + worldStats.itemCount)
    : 50

  // Continuity health
  const continuityHealth = state.continuityReport.overallHealthScore

  // Engagement health
  const engagementHealth = state.engagementPrediction
    ? state.engagementPrediction.engagementScore
    : 50

  // Style health (persona confidence)
  const styleHealth = state.writerPersona?.confidenceScore ?? 50

  // Cross-subsystem score
  const insights = generateCrossSubsystemInsights(state)
  const criticalInsights = insights.filter(i => i.severity === 'critical')
  const majorInsights = insights.filter(i => i.severity === 'major')
  const crossSubsystemScore = Math.max(0,
    100 - criticalInsights.length * 25 - majorInsights.length * 10
  )

  // Overall
  const overall = Math.round(
    worldHealth * 0.2 +
    continuityHealth * 0.3 +
    engagementHealth * 0.2 +
    styleHealth * 0.1 +
    crossSubsystemScore * 0.2
  )

  // Bottlenecks and strengths
  const bottlenecks: string[] = []
  const strengths: string[] = []

  if (worldHealth < 60) bottlenecks.push('World state underdeveloped')
  else strengths.push('World state well-developed')

  if (continuityHealth < 60) bottlenecks.push('Continuity issues detected')
  else strengths.push('Continuity clean')

  if (engagementHealth < 60) bottlenecks.push('Reader engagement low')
  else strengths.push('Reader engagement healthy')

  if (criticalInsights.length > 0) bottlenecks.push(`${criticalInsights.length} critical cross-subsystem issues`)
  if (majorInsights.length > 0) bottlenecks.push(`${majorInsights.length} major cross-subsystem issues`)

  return {
    overall: Math.min(100, Math.max(0, overall)),
    worldHealth: Math.round(worldHealth),
    continuityHealth: Math.round(continuityHealth),
    engagementHealth: Math.round(engagementHealth),
    styleHealth: Math.round(styleHealth),
    crossSubsystemScore: Math.round(crossSubsystemScore),
    bottlenecks,
    strengths
  }
}

/**
 * Check if health score needs alert
 */
export function needsAlert(
  health: NarrativeHealthScore,
  config: CoordinationConfig = DEFAULT_COORDINATION_CONFIG
): { level: 'none' | 'warning' | 'critical'; reasons: string[] } {
  const reasons: string[] = []

  if (health.overall < config.minHealthThreshold) {
    reasons.push(`Overall health ${health.overall} below threshold ${config.minHealthThreshold}`)
  }

  for (const insight of generateCrossSubsystemInsights(createEmptyIntelligenceState())) {
    if (insight.severity === 'critical') {
      reasons.push(`Critical insight: ${insight.title}`)
    }
  }

  if (reasons.length === 0) return { level: 'none', reasons: [] }
  if (reasons.some(r => r.includes('critical'))) return { level: 'critical', reasons }
  return { level: 'warning', reasons }
}

// =============================================================================
// Format Functions
// =============================================================================

/**
 * Format health score summary
 */
export function formatHealthSummary(health: NarrativeHealthScore): string {
  const lines = [
    `=== Narrative Health Score ===`,
    `Overall: ${health.overall}/100`,
    ``,
    `Subsystems:`,
    `  World: ${health.worldHealth}/100`,
    `  Continuity: ${health.continuityHealth}/100`,
    `  Engagement: ${health.engagementHealth}/100`,
    `  Style: ${health.styleHealth}/100`,
    `  Cross-Subsystem: ${health.crossSubsystemScore}/100`,
    ``
  ]

  if (health.strengths.length > 0) {
    lines.push(`Strengths:`)
    for (const s of health.strengths) {
      lines.push(`  ✅ ${s}`)
    }
    lines.push('')
  }

  if (health.bottlenecks.length > 0) {
    lines.push(`Bottlenecks:`)
    for (const b of health.bottlenecks) {
      lines.push(`  ⚠️ ${b}`)
    }
  }

  return lines.join('\n')
}

/**
 * Format insights summary
 */
export function formatInsightsSummary(insights: CrossSubsystemInsight[]): string {
  if (insights.length === 0) {
    return '✅ No critical cross-subsystem issues detected'
  }

  const lines = [`=== Cross-Subsystem Insights (${insights.length}) ===`]
  for (const insight of insights) {
    const icon = insight.severity === 'critical' ? '🔴' : insight.severity === 'major' ? '🟡' : '🟢'
    lines.push(``, `${icon} [${insight.severity}] ${insight.title}`)
    lines.push(`   ${insight.description}`)
    if (insight.recommendations.length > 0) {
      lines.push(`   💡 ${insight.recommendations[0]}`)
    }
  }

  return lines.join('\n')
}

/**
 * Format complete intelligence summary
 */
export function formatIntelligenceSummary(
  state: NarrativeIntelligenceState,
  health: NarrativeHealthScore
): string {
  const lines = [
    `=== Narrative Intelligence Report ===`,
    ``,
    `Chapter: ${state.currentChapter}`,
    `Last Updated: ${new Date(state.lastUpdated).toLocaleTimeString()}`,
    ``,
    formatHealthSummary(health),
    ``
  ]

  const insights = generateCrossSubsystemInsights(state)
  if (insights.length > 0) {
    lines.push(formatInsightsSummary(insights))
  }

  return lines.join('\n')
}