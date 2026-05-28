/**
 * NarrativeInsightAggregator Types - V97
 * Cross-Subsystem Insight Aggregation and Narrative Intelligence Integration
 * 
 * Aggregates insights from all narrative subsystems into actionable intelligence:
 * - Combines StoryWorldModel + NarrativeContextGraph + PlotContinuityEngine + AuthorDashboard
 * - Generates cross-subsystem insights that no single system can produce alone
 * - Provides unified narrative health assessment
 * - Tracks narrative complexity vs reader engagement correlation
 * - Generates actionable recommendations prioritized by impact
 * 
 * Inspired by thunderbolt pipeline + nanobot distributed mesh + ruflo hierarchical decomposition + chatdev multi-agent coordination.
 */

import type { SkillNode } from '../evolution/SkillGraph'
import type { StoryWorldState } from '../world/StoryWorldModel'
import type { NarrativeContextGraph, ContextNode, ContextConnection } from './NarrativeContextGraph'
import type { ContinuityReport } from './PlotContinuityEngine'
import type { AuthorDashboardState } from '../dashboard/AuthorDashboard'
import type { EngagementPrediction } from './ReaderExperienceSimulator'
import type { WriterPersona } from '../persona/WriterPersonaEngine'
import type { ArchipelagoAnalysis } from './StoryArchipelagoAnalyzer'
import type { NarrativeHealthScore } from './NarrativeIntelligenceCoordinator'

// =============================================================================
// Insight Aggregation Types
// ===============================================================================

export interface AggregatedInsight {
  id: string
  title: string
  description: string
  severity: 'critical' | 'major' | 'minor'
  sources: InsightSource[]                    // Which subsystems contributed to this insight
  evidence: InsightEvidence[]                // Factual basis for this insight
  recommendations: string[]
  estimatedImpact: number                    // 0-1 how much this affects overall narrative quality
  chapterRange: [number, number]            // Chapters this insight affects
  timestamp: number
  resolved: boolean
  resolution?: string
}

export interface InsightSource {
  subsystem: SubsystemType
  weight: number                             // 0-1 how much this subsystem contributed
  specificFinding: string                   // What this subsystem found
}

export interface InsightEvidence {
  type: 'graph_connection' | 'metric_value' | 'pattern_detection' | 'cross_reference'
  description: string
  nodeId?: string
  connectionId?: string
  value?: number
}

export type SubsystemType = 
  | 'story_world_model' 
  | 'narrative_context_graph' 
  | 'plot_continuity_engine'
  | 'author_dashboard'
  | 'reader_experience_simulator'
  | 'writer_persona_engine'
  | 'story_archipelago_analyzer'
  | 'narrative_intelligence_coordinator'

// =============================================================================
// Aggregation State Types
// ===============================================================================

export interface InsightAggregatorState {
  insights: AggregatedInsight[]
  lastAggregationTimestamp: number
  aggregationCount: number                   // How many times aggregation has run
  config: AggregatorConfig
}

export interface AggregatorConfig {
  maxInsights: number                        // Cap on number of active insights
  minSeverityForAlert: 'critical' | 'major' | 'minor'
  deduplicationWindow: number               // ms to consider duplicate insights
  impactThresholdForTracking: number        // Min impact to track
  autoResolveStaleInsightsAfter: number    // ms before auto-resolving old insights
}

export const DEFAULT_AGGREGATOR_CONFIG: AggregatorConfig = {
  maxInsights: 50,
  minSeverityForAlert: 'major',
  deduplicationWindow: 3600000,             // 1 hour
  impactThresholdForTracking: 0.3,
  autoResolveStaleInsightsAfter: 86400000   // 24 hours
}

// =============================================================================
// Integrated State Types
// ===============================================================================

export interface IntegratedNarrativeState {
  worldState: StoryWorldState
  contextGraph: NarrativeContextGraph
  continuityReport: ContinuityReport
  dashboard: AuthorDashboardState | null
  engagementPrediction: EngagementPrediction | null
  writerPersona: WriterPersona | null
  archipelagoAnalysis: ArchipelagoAnalysis | null
  healthScore: NarrativeHealthScore | null
  currentChapter: number
  timestamp: number
}

// =============================================================================
// Analysis Result Types
// ===============================================================================

export interface InsightAnalysis {
  totalInsights: number
  bySeverity: { critical: number; major: number; minor: number }
  bySubsystem: Map<SubsystemType, number>
  unresolvedCount: number
  averageImpact: number
  topInsights: AggregatedInsight[]
  stalenessReport: { fresh: number; aging: number; stale: number }
}

export interface CorrelationAnalysis {
  complexityEngagementCorrelation: number    // -1 to 1
  pacingQualityCorrelation: number          // -1 to 1
  characterGraphDensity: number             // connections per character
  threadResolutionRate: number              // 0-1 how often threads get resolved
  foreshadowPayoffRate: number             // 0-1 how often foreshadow is paid off
  subplotIntegrationScore: number          // 0-1 how well subplots connect to main plot
}

// =============================================================================
// Recommendation Types
// ===============================================================================

export interface PrioritizedRecommendation {
  recommendation: string
  priority: number                           // 1-10 (1 = highest)
  reason: string                            // Why this matters
  estimatedImpact: number                    // 0-1 potential improvement
  risk: 'high' | 'medium' | 'low'           // Risk of implementing
  relatedInsightIds: string[]               // Which insights this addresses
  chapterTarget: number                     // Which chapter to apply this
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create empty aggregator state
 */
export function createEmptyAggregatorState(): InsightAggregatorState {
  return {
    insights: [],
    lastAggregationTimestamp: 0,
    aggregationCount: 0,
    config: { ...DEFAULT_AGGREGATOR_CONFIG }
  }
}

/**
 * Create aggregated insight
 */
export function createAggregatedInsight(
  title: string,
  description: string,
  severity: 'critical' | 'major' | 'minor',
  sources: InsightSource[],
  evidence: InsightEvidence[],
  recommendations: string[],
  estimatedImpact: number,
  chapterRange: [number, number] = [0, 0]
): AggregatedInsight {
  return {
    id: `insight-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    description,
    severity,
    sources,
    evidence,
    recommendations,
    estimatedImpact,
    chapterRange,
    timestamp: Date.now(),
    resolved: false
  }
}

// =============================================================================
// Insight Generation Functions
// =============================================================================

/**
 * Generate cross-subsystem insights from integrated state
 */
export function generateCrossSubsystemInsights(
  state: IntegratedNarrativeState
): AggregatedInsight[] {
  const insights: AggregatedInsight[] = []

  // Insight 1: Character relationship graph vs plot continuity
  if (state.contextGraph && state.continuityReport) {
    const highCharConnections = Array.from(state.contextGraph.nodes.values())
      .filter(n => n.type === 'character' && n.connections.length > 5)
    const unresolvedContinuity = state.continuityReport.threadStates.unresolvedPayoffs.length

    if (highCharConnections.length > 0 && unresolvedContinuity > 10) {
      insights.push(createAggregatedInsight(
        'Complex character network with many unresolved threads',
        `Found ${highCharConnections.length} highly-connected characters but ${unresolvedContinuity} unresolved plot threads. Complex character relationships may be distracting from main plot resolution.`,
        unresolvedContinuity > 15 ? 'critical' : 'major',
        [
          { subsystem: 'narrative_context_graph', weight: 0.6, specificFinding: `${highCharConnections.length} nodes with >5 connections` },
          { subsystem: 'plot_continuity_engine', weight: 0.4, specificFinding: `${unresolvedContinuity} unresolved payoffs` }
        ],
        [
          { type: 'metric_value', description: `Character graph connections exceed threshold`, value: highCharConnections.length },
          { type: 'metric_value', description: 'Unresolved continuity payoffs', value: unresolvedContinuity }
        ],
        [
          'Consider resolving some subplot threads before adding more character complexity',
          'Use character relationship simplify to focus reader attention on main plot'
        ],
        0.7,
        [1, state.currentChapter]
      ))
    }
  }

  // Insight 2: Engagement vs narrative complexity mismatch
  if (state.engagementPrediction && state.archipelagoAnalysis) {
    const engagement = state.engagementPrediction.engagementScore
    const complexity = state.archipelagoAnalysis.complexityScore

    if (complexity > 80 && engagement < 60) {
      insights.push(createAggregatedInsight(
        'High narrative complexity overwhelms reader engagement',
        `Story complexity at ${complexity}/100 but reader engagement only at ${engagement}/100. The narrative may be too complex for the target audience.`,
        'critical',
        [
          { subsystem: 'story_archipelago_analyzer', weight: 0.5, specificFinding: `Complexity ${complexity}/100` },
          { subsystem: 'reader_experience_simulator', weight: 0.5, specificFinding: `Engagement ${engagement}/100` }
        ],
        [
          { type: 'metric_value', description: 'Complexity score', value: complexity },
          { type: 'metric_value', description: 'Engagement score', value: engagement }
        ],
        [
          'Reduce number of parallel subplots',
          'Simplify bridge connections between islands',
          'Ensure main plot is clearly distinguishable from subplots'
        ],
        0.85,
        [1, state.currentChapter]
      ))
    } else if (complexity < 40 && engagement > 85) {
      insights.push(createAggregatedInsight(
        'Narrative may be underutilizing potential complexity',
        `Engagement very high (${engagement}/100) but complexity low (${complexity}/100). Opportunity to add more depth without overwhelming readers.`,
        'minor',
        [
          { subsystem: 'story_archipelago_analyzer', weight: 0.5, specificFinding: `Low complexity ${complexity}/100` },
          { subsystem: 'reader_experience_simulator', weight: 0.5, specificFinding: `High engagement ${engagement}/100` }
        ],
        [],
        ['Consider expanding subplot development', 'Add more character backstory depth'],
        0.4,
        [1, state.currentChapter]
      ))
    }
  }

  // Insight 3: Writer persona vs reader engagement style mismatch
  if (state.writerPersona && state.engagementPrediction) {
    const persona = state.writerPersona
    const engagement = state.engagementPrediction.engagementScore

    if (persona.confidenceScore > 85 && engagement < 55) {
      insights.push(createAggregatedInsight(
        'Author voice strong but not connecting with readers',
        `Writer persona confidence at ${persona.confidenceScore}% but engagement only ${engagement}%. Author may be writing for themselves rather than audience.`,
        'major',
        [
          { subsystem: 'writer_persona_engine', weight: 0.6, specificFinding: `Confidence ${persona.confidenceScore}%` },
          { subsystem: 'reader_experience_simulator', weight: 0.4, specificFinding: `Engagement ${engagement}%` }
        ],
        [],
        ['Consider reader personas for target audience', 'Review emotional tone balance'],
        0.75,
        [1, state.currentChapter]
      ))
    }
  }

  // Insight 4: Foreshadowing without payoff
  if (state.continuityReport) {
    const unpaidForeshadow = state.continuityReport.threadStates.pendingForeshadowing
      .filter(f => !f.paidOff)
    const oldUnpaid = unpaidForeshadow.filter(f => 
      state.currentChapter - f.chapter > 20
    )

    if (oldUnpaid.length > 3) {
      insights.push(createAggregatedInsight(
        'Multiple foreshadowing elements left unpaid',
        `${oldUnpaid.length} foreshadowing elements from >20 chapters ago have not been paid off. This risks reader confusion or disappointment.`,
        'major',
        [
          { subsystem: 'plot_continuity_engine', weight: 1.0, specificFinding: `${oldUnpaid.length} stale foreshadow elements` }
        ],
        oldUnpaid.slice(0, 3).map(f => ({
          type: 'pattern_detection' as const,
          description: `Foreshadow: "${f.hintText}" from chapter ${f.chapter}`,
          value: f.strength
        })),
        ['Prioritize paying off oldest foreshadowing first', 'Consider whether these hints are still relevant'],
        0.65,
        [Math.min(...oldUnpaid.map(f => f.chapter)), state.currentChapter]
      ))
    }
  }

  // Insight 5: World state disconnected from narrative threads
  if (state.worldState && state.continuityReport) {
    const charCount = state.worldState.characterCount
    const activeThreads = state.continuityReport.threadStates.unresolvedPayoffs.length

    if (charCount > 0 && activeThreads > charCount * 5) {
      insights.push(createAggregatedInsight(
        'Narrative threads vastly outnumber tracked characters',
        `${activeThreads} active threads but only ${charCount} characters in world model. Thread proliferation without character grounding may lose readers.`,
        'major',
        [
          { subsystem: 'story_world_model', weight: 0.4, specificFinding: `${charCount} characters tracked` },
          { subsystem: 'plot_continuity_engine', weight: 0.6, specificFinding: `${activeThreads} unresolved threads` }
        ],
        [],
        ['Expand character tracking to cover more threads', 'Consolidate some threads under existing characters'],
        0.6,
        [1, state.currentChapter]
      ))
    }
  }

  // Insight 6: Over-connected context graph nodes
  if (state.contextGraph) {
    const overConnected = Array.from(state.contextGraph.nodes.values())
      .filter(n => n.connections.length > 15)
    
    if (overConnected.length > 0) {
      insights.push(createAggregatedInsight(
        `${overConnected.length} narrative element(s) have excessive connections`,
        `Nodes "${overConnected.map(n => n.label).join(', ')}" each have >15 connections. This concentration may create confusion about what's important.`,
        'minor',
        [
          { subsystem: 'narrative_context_graph', weight: 1.0, specificFinding: `${overConnected.length} over-connected nodes` }
        ],
        overConnected.map(n => ({
          type: 'graph_connection' as const,
          description: `${n.label} has ${n.connections.length} connections`,
          nodeId: n.id,
          value: n.connections.length
        })),
        ['Consider splitting overloaded nodes', 'Distribute narrative weight across more elements'],
        0.45,
        [1, state.currentChapter]
      ))
    }
  }

  return insights
}

// =============================================================================
// Insight Deduplication Functions
// =============================================================================

/**
 * Remove duplicate or near-duplicate insights
 */
export function deduplicateInsights(
  insights: AggregatedInsight[],
  windowMs: number = 3600000
): AggregatedInsight[] {
  const seen = new Map<string, AggregatedInsight>()

  for (const insight of insights) {
    // Create dedup key from title + severity + chapter range
    const key = `${insight.title}|${insight.severity}|${insight.chapterRange.join('-')}`

    const existing = seen.get(key)
    if (!existing) {
      seen.set(key, insight)
    } else {
      // Merge evidence and sources
      const merged: AggregatedInsight = {
        ...existing,
        evidence: [...existing.evidence, ...insight.evidence],
        sources: [
          ...existing.sources,
          ...insight.sources.map(s => ({ ...s, weight: s.weight * 0.5 }))
        ],
        recommendations: [...new Set([...existing.recommendations, ...insight.recommendations])]
      }
      seen.set(key, merged)
    }
  }

  return Array.from(seen.values())
}

// =============================================================================
// Insight Resolution Functions
// =============================================================================

/**
 * Mark insight as resolved
 */
export function resolveInsight(
  state: InsightAggregatorState,
  insightId: string,
  resolution: string
): InsightAggregatorState {
  const insights = state.insights.map(i =>
    i.id === insightId
      ? { ...i, resolved: true, resolution }
      : i
  )
  return { ...state, insights }
}

/**
 * Auto-resolve stale insights
 */
export function autoResolveStaleInsights(
  state: InsightAggregatorState,
  maxAgeMs: number = 86400000
): InsightAggregatorState {
  const now = Date.now()
  const insights = state.insights.map(i => {
    if (i.resolved) return i
    if (now - i.timestamp > maxAgeMs) {
      return { ...i, resolved: true, resolution: 'Auto-resolved after staleness threshold' }
    }
    return i
  })
  return { ...state, insights }
}

// =============================================================================
// Analysis Functions
// =============================================================================

/**
 * Analyze current insight landscape
 */
export function analyzeInsights(
  insights: AggregatedInsight[]
): InsightAnalysis {
  const unresolved = insights.filter(i => !i.resolved)
  const now = Date.now()

  const bySeverity = {
    critical: unresolved.filter(i => i.severity === 'critical').length,
    major: unresolved.filter(i => i.severity === 'major').length,
    minor: unresolved.filter(i => i.severity === 'minor').length
  }

  const bySubsystem = new Map<SubsystemType, number>()
  for (const insight of unresolved) {
    for (const source of insight.sources) {
      bySubsystem.set(source.subsystem, (bySubsystem.get(source.subsystem) || 0) + 1)
    }
  }

  const stalenessReport = {
    fresh: unresolved.filter(i => now - i.timestamp < 3600000).length,
    aging: unresolved.filter(i => now - i.timestamp >= 3600000 && now - i.timestamp < 86400000).length,
    stale: unresolved.filter(i => now - i.timestamp >= 86400000).length
  }

  return {
    totalInsights: unresolved.length,
    bySeverity,
    bySubsystem,
    unresolvedCount: unresolved.length,
    averageImpact: unresolved.length > 0
      ? unresolved.reduce((s, i) => s + i.estimatedImpact, 0) / unresolved.length
      : 0,
    topInsights: unresolved
      .sort((a, b) => b.estimatedImpact - a.estimatedImpact)
      .slice(0, 5),
    stalenessReport
  }
}

/**
 * Generate correlation analysis between subsystems
 */
export function generateCorrelationAnalysis(
  state: IntegratedNarrativeState
): CorrelationAnalysis {
  let complexityEngagementCorrelation = 0
  let pacingQualityCorrelation = 0
  let characterGraphDensity = 0
  let threadResolutionRate = 0
  let foreshadowPayoffRate = 0
  let subplotIntegrationScore = 0

  if (state.archipelagoAnalysis && state.engagementPrediction) {
    const c = state.archipelagoAnalysis.complexityScore / 100
    const e = state.engagementPrediction.engagementScore / 100
    complexityEngagementCorrelation = c > 0.5 && e > 0.5 ? 0.3 : c > 0.7 && e < 0.6 ? -0.6 : 0.1
  }

  if (state.contextGraph && state.worldState) {
    const totalConnections = Array.from(state.contextGraph.connections.values()).length
    characterGraphDensity = state.worldState.characterCount > 0
      ? totalConnections / state.worldState.characterCount
      : 0
  }

  if (state.continuityReport) {
    const ts = state.continuityReport.threadStates
    const total = ts.setupPromises.length
    const resolved = ts.satisfiedThreads.length
    threadResolutionRate = total > 0 ? resolved / total : 1

    const foreshadowTotal = ts.pendingForeshadowing.length
    const paidForeshadow = ts.pendingForeshadowing.filter(f => f.paidOff).length
    foreshadowPayoffRate = foreshadowTotal > 0 ? paidForeshadow / foreshadowTotal : 1
  }

  if (state.archipelagoAnalysis) {
    subplotIntegrationScore = state.archipelagoAnalysis.mainPlotIndependence
  }

  return {
    complexityEngagementCorrelation,
    pacingQualityCorrelation,
    characterGraphDensity: Math.min(10, characterGraphDensity),
    threadResolutionRate,
    foreshadowPayoffRate,
    subplotIntegrationScore
  }
}

// =============================================================================
// Recommendation Functions
// =============================================================================

/**
 * Generate prioritized recommendations from insights
 */
export function generatePrioritizedRecommendations(
  insights: AggregatedInsight[],
  state: IntegratedNarrativeState
): PrioritizedRecommendation[] {
  const recommendations: PrioritizedRecommendation[] = []

  for (const insight of insights) {
    if (insight.resolved) continue

    for (const rec of insight.recommendations) {
      recommendations.push({
        recommendation: rec,
        priority: Math.round((1 - insight.estimatedImpact) * 9 + 1),
        reason: `Addresses: ${insight.title}`,
        estimatedImpact: insight.estimatedImpact * 0.8,
        risk: insight.severity === 'critical' ? 'high' : insight.severity === 'major' ? 'medium' : 'low',
        relatedInsightIds: [insight.id],
        chapterTarget: insight.chapterRange[1] || state.currentChapter
      })
    }
  }

  // Sort by priority and return
  return (recommendations as PrioritizedRecommendation[]).sort((a, b) => a.priority - b.priority)
}

// =============================================================================
// Aggregation Functions
// =============================================================================

/**
 * Run full aggregation cycle
 */
export function runAggregation(
  state: InsightAggregatorState,
  integratedState: IntegratedNarrativeState
): InsightAggregatorState {
  // Generate new cross-subsystem insights
  const newInsights = generateCrossSubsystemInsights(integratedState)

  // Deduplicate against existing
  const deduplicated = deduplicateInsights(
    [...state.insights.filter(i => !i.resolved), ...newInsights],
    state.config.deduplicationWindow
  )

  // Auto-resolve stale
  const autoResolved = autoResolveStaleInsights(
    { ...state, insights: deduplicated },
    state.config.autoResolveStaleInsightsAfter
  )

  // Enforce max insights cap
  const sortedInsights = autoResolved.insights
    .sort((a, b) => b.estimatedImpact - a.estimatedImpact)
  const cappedInsights = sortedInsights.slice(0, state.config.maxInsights)

  return {
    ...autoResolved,
    insights: cappedInsights,
    lastAggregationTimestamp: Date.now(),
    aggregationCount: state.aggregationCount + 1
  }
}

// =============================================================================
// Format Functions
// =============================================================================

/**
 * Format insight analysis summary
 */
export function formatInsightAnalysis(analysis: InsightAnalysis): string {
  const lines = [
    `=== Insight Analysis ===`,
    `Total Active: ${analysis.totalInsights}`,
    `  Critical: ${analysis.bySeverity.critical} | Major: ${analysis.bySeverity.major} | Minor: ${analysis.bySeverity.minor}`,
    `Unresolved: ${analysis.unresolvedCount} | Avg Impact: ${(analysis.averageImpact * 100).toFixed(0)}%`,
    ``
  ]

  if (analysis.topInsights.length > 0) {
    lines.push(`Top Insights:`)
    for (const insight of analysis.topInsights.slice(0, 5)) {
      const icon = insight.severity === 'critical' ? '🔴' : insight.severity === 'major' ? '🟡' : '🟢'
      lines.push(`  ${icon} ${insight.title} (impact: ${(insight.estimatedImpact * 100).toFixed(0)}%)`)
    }
    lines.push('')
  }

  lines.push(`Staleness: Fresh ${analysis.stalenessReport.fresh} | Aging ${analysis.stalenessReport.aging} | Stale ${analysis.stalenessReport.stale}`)

  return lines.join('\n')
}

/**
 * Format correlation analysis
 */
export function formatCorrelationAnalysis(analysis: CorrelationAnalysis): string {
  return [
    `=== Correlation Analysis ===`,
    `Complexity-Engagement: ${analysis.complexityEngagementCorrelation > 0 ? '+' : ''}${(analysis.complexityEngagementCorrelation * 100).toFixed(0)}%`,
    `Character Graph Density: ${analysis.characterGraphDensity.toFixed(1)} conns/char`,
    `Thread Resolution Rate: ${(analysis.threadResolutionRate * 100).toFixed(0)}%`,
    `Foreshadow Payoff Rate: ${(analysis.foreshadowPayoffRate * 100).toFixed(0)}%`,
    `Subplot Integration: ${(analysis.subplotIntegrationScore * 100).toFixed(0)}%`
  ].join('\n')
}

/**
 * Format prioritized recommendations
 */
export function formatPrioritizedRecommendations(recs: PrioritizedRecommendation[]): string {
  if (recs.length === 0) return '✅ No pending recommendations'

  const lines = [`=== Prioritized Recommendations ===`]
  for (const rec of recs.slice(0, 10)) {
    const priorityIcon = rec.priority <= 3 ? '🔴' : rec.priority <= 6 ? '🟡' : '🟢'
    lines.push(``, `${priorityIcon} [P${rec.priority}] ${rec.recommendation}`)
    lines.push(`   Reason: ${rec.reason}`)
    lines.push(`   Impact: ${(rec.estimatedImpact * 100).toFixed(0)}% | Risk: ${rec.risk}`)
  }

  return lines.join('\n')
}

/**
 * Format complete aggregator state summary
 */
export function formatAggregatorSummary(
  state: InsightAggregatorState,
  analysis: InsightAnalysis,
  correlations: CorrelationAnalysis,
  recommendations: PrioritizedRecommendation[]
): string {
  const lines = [
    `=== Narrative Insight Aggregator ===`,
    `Aggregation #${state.aggregationCount} | Last: ${state.lastAggregationTimestamp ? new Date(state.lastAggregationTimestamp).toLocaleTimeString() : 'Never'}`,
    ``,
    formatInsightAnalysis(analysis),
    ``,
    formatCorrelationAnalysis(correlations),
    ``,
    formatPrioritizedRecommendations(recommendations)
  ]

  return lines.join('\n')
}