/**
 * NarrativeMetaCognitionEngine — V505
 * Self-reflective story generation with pattern analysis and improvement feedback loops.
 * Inspired by: generic-agent (L0-L4 autonomous reasoning) + thunderbolt (feedback loops) + nanobot (distributed mesh)
 */

export type CognitionLevel = 'surface' | 'pattern' | 'causal' | 'thematic' | 'meta'
export type ImprovementAction = 'adjust_pacing' | 'deepen_character' | 'increase_tension' | 'resolve_plot' | 'enhance_dialogue' | 'balance_description'
export type PatternType = 'narrative' | 'character' | 'dialogue' | 'description' | 'emotional' | 'structural'

export interface NarrativePattern {
  id: string
  type: PatternType
  name: string
  frequency: number  // how often this pattern appears
  avgQualityScore: number  // 0-100, based on reader engagement
  effectivenessTrend: 'improving' | 'stable' | 'declining'
  firstAppeared: number
  lastAppeared: number
}

export interface GenerationInsight {
  id: string
  level: CognitionLevel
  description: string
  confidence: number  // 0-100
  actionable: boolean
  improvementSuggestions: ImprovementAction[]
  relatedPatterns: string[]  // pattern IDs
  timestamp: number
}

export interface SelfReflection {
  id: string
  cycleNumber: number
  insights: GenerationInsight[]
  performanceMetrics: {
    avgEngagementScore: number
    pacingQuality: number
    characterConsistency: number
    plotCoherence: number
    emotionalResonance: number
  }
  adjustmentsMade: ImprovementAction[]
  effectivenessRating: number  // 0-100
  timestamp: number
}

export interface MetaCognitionState {
  patterns: Record<string, NarrativePattern>
  insights: GenerationInsight[]
  reflections: SelfReflection[]
  cognitionHistory: { level: CognitionLevel, count: number }[]
  currentCycle: number
  overallQualityScore: number
  improvementCount: number
  avgAdjustmentEffectiveness: number
}

export function createEmptyState(): MetaCognitionState {
  return {
    patterns: {},
    insights: [],
    reflections: [],
    cognitionHistory: [
      { level: 'surface', count: 0 },
      { level: 'pattern', count: 0 },
      { level: 'causal', count: 0 },
      { level: 'thematic', count: 0 },
      { level: 'meta', count: 0 }
    ],
    currentCycle: 0,
    overallQualityScore: 50,
    improvementCount: 0,
    avgAdjustmentEffectiveness: 0
  }
}

export function registerPattern(
  state: MetaCognitionState,
  type: PatternType,
  name: string
): MetaCognitionState {
  const id = `pattern_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const pattern: NarrativePattern = {
    id,
    type,
    name,
    frequency: 0,
    avgQualityScore: 50,
    effectivenessTrend: 'stable',
    firstAppeared: Date.now(),
    lastAppeared: Date.now()
  }
  return { ...state, patterns: { ...state.patterns, [id]: pattern } }
}

export function incrementPatternUsage(
  state: MetaCognitionState,
  patternId: string,
  qualityScore: number
): MetaCognitionState {
  const pattern = state.patterns[patternId]
  if (!pattern) return state

  const newFreq = pattern.frequency + 1
  const newAvg = ((pattern.avgQualityScore * pattern.frequency) + qualityScore) / newFreq

  // Determine trend
  let trend: 'improving' | 'stable' | 'declining' = 'stable'
  if (newAvg > pattern.avgQualityScore * 1.1) trend = 'improving'
  else if (newAvg < pattern.avgQualityScore * 0.9) trend = 'declining'

  return {
    ...state,
    patterns: {
      ...state.patterns,
      [patternId]: {
        ...pattern,
        frequency: newFreq,
        avgQualityScore: Math.round(newAvg),
        effectivenessTrend: trend,
        lastAppeared: Date.now()
      }
    }
  }
}

export function generateInsight(
  state: MetaCognitionState,
  level: CognitionLevel,
  description: string,
  confidence: number,
  improvementSuggestions: ImprovementAction[]
): MetaCognitionState {
  const id = `insight_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const insight: GenerationInsight = {
    id,
    level,
    description,
    confidence: Math.max(0, Math.min(100, confidence)),
    actionable: improvementSuggestions.length > 0,
    improvementSuggestions,
    relatedPatterns: [],
    timestamp: Date.now()
  }

  const updatedHistory = state.cognitionHistory.map(c =>
    c.level === level ? { ...c, count: c.count + 1 } : c
  )

  return {
    ...state,
    insights: [...state.insights, insight],
    cognitionHistory: updatedHistory
  }
}

export function performSelfReflection(
  state: MetaCognitionState,
  metrics: {
    avgEngagementScore: number
    pacingQuality: number
    characterConsistency: number
    plotCoherence: number
    emotionalResonance: number
  },
  adjustmentsMade: ImprovementAction[]
): MetaCognitionState {
  const cycleNumber = state.currentCycle + 1

  const performanceMetrics = {
    avgEngagementScore: Math.max(0, Math.min(100, metrics.avgEngagementScore)),
    pacingQuality: Math.max(0, Math.min(100, metrics.pacingQuality)),
    characterConsistency: Math.max(0, Math.min(100, metrics.characterConsistency)),
    plotCoherence: Math.max(0, Math.min(100, metrics.plotCoherence)),
    emotionalResonance: Math.max(0, Math.min(100, metrics.emotionalResonance))
  }

  const effectivenessRating = Math.round(
    (performanceMetrics.avgEngagementScore +
     performanceMetrics.pacingQuality +
     performanceMetrics.characterConsistency +
     performanceMetrics.plotCoherence +
     performanceMetrics.emotionalResonance) / 5
  )

  // Select top insights from recent pool
  const recentInsights = state.insights
    .filter(i => Date.now() - i.timestamp < 3600000)  // last hour
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5)

  const reflection: SelfReflection = {
    id: `refl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    cycleNumber,
    insights: recentInsights,
    performanceMetrics,
    adjustmentsMade,
    effectivenessRating,
    timestamp: Date.now()
  }

  // Update overall quality
  const newOverallScore = state.overallQualityScore
    ? (state.overallQualityScore * state.currentCycle + effectivenessRating) / (state.currentCycle + 1)
    : effectivenessRating

  const newImprovementCount = state.improvementCount + adjustmentsMade.length

  // Calculate avg adjustment effectiveness
  const totalEffectiveness = state.avgAdjustmentEffectiveness * state.improvementCount + effectivenessRating
  const newAvgEffectiveness = totalEffectiveness / newImprovementCount

  return {
    ...state,
    reflections: [...state.reflections, reflection],
    currentCycle: cycleNumber,
    overallQualityScore: Math.round(newOverallScore),
    improvementCount: newImprovementCount,
    avgAdjustmentEffectiveness: Math.round(newAvgEffectiveness)
  }
}

export function getTopPatterns(state: MetaCognitionState, limit: number = 10): NarrativePattern[] {
  return Object.values(state.patterns)
    .sort((a, b) => b.frequency - a.frequency || b.avgQualityScore - a.avgQualityScore)
    .slice(0, limit)
}

export function getPatternsByType(state: MetaCognitionState, type: PatternType): NarrativePattern[] {
  return Object.values(state.patterns).filter(p => p.type === type)
}

export function getCognitionLevelDistribution(state: MetaCognitionState): Record<CognitionLevel, number> {
  const dist: Record<CognitionLevel, number> = {
    surface: 0, pattern: 0, causal: 0, thematic: 0, meta: 0
  }
  for (const c of state.cognitionHistory) {
    dist[c.level] = c.count
  }
  return dist
}

export function getInsightsAtLevel(state: MetaCognitionState, level: CognitionLevel): GenerationInsight[] {
  return state.insights.filter(i => i.level === level)
}

export function getRecentReflections(state: MetaCognitionState, limit: number = 5): SelfReflection[] {
  return [...state.reflections]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit)
}

export function getImprovementRecommendations(state: MetaCognitionState): ImprovementAction[] {
  if (state.reflections.length === 0) return []

  const recentReflections = getRecentReflections(state, 3)
  const recommendations: ImprovementAction[] = []

  for (const refl of recentReflections) {
    // Suggest improvements based on low scores
    if (refl.performanceMetrics.pacingQuality < 60) recommendations.push('adjust_pacing')
    if (refl.performanceMetrics.characterConsistency < 60) recommendations.push('deepen_character')
    if (refl.performanceMetrics.avgEngagementScore < 50) recommendations.push('increase_tension')
    if (refl.performanceMetrics.plotCoherence < 60) recommendations.push('resolve_plot')
    if (refl.performanceMetrics.emotionalResonance < 50) recommendations.push('enhance_dialogue')
  }

  // Deduplicate while preserving order
  const seen = new Set<ImprovementAction>()
  return recommendations.filter(r => {
    if (seen.has(r)) return false
    seen.add(r)
    return true
  })
}

export function calculateQualityImprovement(state: MetaCognitionState): number {
  if (state.reflections.length < 2) return 0

  const first = state.reflections[0].effectivenessRating
  const last = state.reflections[state.reflections.length - 1].effectivenessRating

  return Math.round(((last - first) / first) * 100)
}

export function getPatternEffectiveness(state: MetaCognitionState, patternId: string): number {
  const pattern = state.patterns[patternId]
  if (!pattern) return 0

  // Effectiveness = quality * frequency * trend multiplier
  const trendMultiplier: Record<string, number> = { improving: 1.2, stable: 1.0, declining: 0.8 }
  return Math.round(pattern.avgQualityScore * Math.log(pattern.frequency + 1) * trendMultiplier[pattern.effectivenessTrend])
}

export function linkInsightToPattern(state: MetaCognitionState, insightId: string, patternId: string): MetaCognitionState {
  const insightIndex = state.insights.findIndex(i => i.id === insightId)
  if (insightIndex === -1) return state

  const insight = state.insights[insightIndex]
  if (insight.relatedPatterns.includes(patternId)) return state

  const updatedInsight = {
    ...insight,
    relatedPatterns: [...insight.relatedPatterns, patternId]
  }

  const updatedInsights = [...state.insights]
  updatedInsights[insightIndex] = updatedInsight

  return { ...state, insights: updatedInsights }
}

export function getMetaCognitionSummary(state: MetaCognitionState): {
  totalPatterns: number,
  totalInsights: number,
  totalReflections: number,
  currentQualityScore: number,
  improvementProgress: number,
  topCognitionLevel: CognitionLevel
} {
  const topCog = state.cognitionHistory.reduce((prev, curr) =>
    curr.count > prev.count ? curr : prev, { level: 'surface' as CognitionLevel, count: 0 })

  return {
    totalPatterns: Object.keys(state.patterns).length,
    totalInsights: state.insights.length,
    totalReflections: state.reflections.length,
    currentQualityScore: state.overallQualityScore,
    improvementProgress: calculateQualityImprovement(state),
    topCognitionLevel: topCog.level
  }
}