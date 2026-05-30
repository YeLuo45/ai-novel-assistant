/**
 * NarrativeQualityScoringEngine — V521
 * Multi-Dimensional Narrative Quality Assessment Engine
 * 
 * Inspired by: autonomous evaluation architecture from generic-agent-design
 * Core capabilities:
 * - QualityDimensionScorer: Evaluate multiple quality dimensions
 * - OverallQualityCalculator: Weighted average computation
 * - QualityImprovementSuggestor: Priority-ranked improvement suggestions
 */

import {
  NarrativeQualityScorerState,
  SceneAssessment,
  NarrativeMetrics,
  DetailedScoring,
  QualityDimension,
  QualityGrade,
  createEmptyScorerState,
  scoreNarrative,
  formatSceneAssessment,
  formatScorerDashboard,
  calculatePacingScore,
  calculateCoherenceScore,
  calculateCharacterizationScore,
  calculateDialogueScore,
  calculateWorldBuildingScore,
  calculateEmotionalImpactScore,
  calculateProseStyleScore,
} from './NarrativeQualityScorer'

// ============================================================
// QUALITY DIMENSION SCORER
// ============================================================

export interface DimensionScore {
  dimension: QualityDimension
  score: number
  confidence: number
  evidence: string[]
}

export interface QualityScoringResult {
  dimensions: DimensionScore[]
  metrics: NarrativeMetrics
  overallScore: number
  grade: QualityGrade
  timestamp: number
}

/**
 * Score a single quality dimension with detailed analysis
 */
export function scoreDimension(
  content: string,
  dimension: QualityDimension
): DimensionScore {
  let result: { score: number; confidence: number; evidence: string[] }

  switch (dimension) {
    case 'pacing':
      result = calculatePacingScore(content)
      break
    case 'coherence':
      result = calculateCoherenceScore(content)
      break
    case 'characterization':
      result = calculateCharacterizationScore(content)
      break
    case 'dialogue':
      result = calculateDialogueScore(content)
      break
    case 'worldBuilding':
      result = calculateWorldBuildingScore(content)
      break
    case 'emotionalImpact':
      result = calculateEmotionalImpactScore(content)
      break
    case 'proseStyle':
      result = calculateProseStyleScore(content)
      break
    default:
      result = { score: 0, confidence: 0, evidence: ['Unknown dimension'] }
  }

  return {
    dimension,
    score: result.score,
    confidence: result.confidence,
    evidence: result.evidence,
  }
}

/**
 * Score all quality dimensions for a narrative content
 */
export function scoreAllDimensions(content: string): QualityScoringResult {
  const dimensions: QualityDimension[] = [
    'pacing',
    'coherence',
    'characterization',
    'dialogue',
    'worldBuilding',
    'emotionalImpact',
    'proseStyle',
  ]

  const scored = dimensions.map(d => scoreDimension(content, d))

  const metrics: NarrativeMetrics = {
    pacingScore: scored[0].score,
    coherenceScore: scored[1].score,
    characterizationScore: scored[2].score,
    dialogueScore: scored[3].score,
    worldBuildingScore: scored[4].score,
    emotionalImpactScore: scored[5].score,
    proseStyleScore: scored[6].score,
  }

  // Calculate overall score using weighted average
  const weights: Record<QualityDimension, number> = {
    pacing: 0.15,
    coherence: 0.18,
    characterization: 0.17,
    dialogue: 0.12,
    worldBuilding: 0.10,
    emotionalImpact: 0.15,
    proseStyle: 0.13,
  }

  let weightedSum = 0
  let weightTotal = 0
  for (const dim of dimensions) {
    const score = metrics[`${dim}Score` as keyof NarrativeMetrics] as number
    weightedSum += score * weights[dim]
    weightTotal += weights[dim]
  }
  const overallScore = Math.round(weightedSum / weightTotal)

  const grade = scoreToGrade(overallScore)

  return {
    dimensions: scored,
    metrics,
    overallScore,
    grade,
    timestamp: Date.now(),
  }
}

// ============================================================
// OVERALL QUALITY CALCULATOR
// ============================================================

export interface WeightedScore {
  dimension: QualityDimension
  rawScore: number
  weight: number
  weightedContribution: number
}

export interface QualityAggregation {
  weightedScores: WeightedScore[]
  totalWeightedScore: number
  averageUnweightedScore: number
  scoreSpread: number  // difference between max and min dimension scores
  lowestDimension: QualityDimension
  highestDimension: QualityDimension
  confidenceLevel: number  // 0-1 based on confidence of individual scores
}

/**
 * Calculate grade from numeric score
 */
export function scoreToGrade(score: number): QualityGrade {
  if (score >= 90) return 'outstanding'
  if (score >= 75) return 'excellent'
  if (score >= 60) return 'meetsExpectations'
  if (score >= 40) return 'belowExpectations'
  return 'failing'
}

/**
 * Calculate weighted scores with detailed breakdown
 */
export function calculateWeightedScores(
  metrics: NarrativeMetrics,
  weights?: Map<QualityDimension, number>
): QualityAggregation {
  const defaultWeights = new Map<QualityDimension, number>([
    ['pacing', 0.15],
    ['coherence', 0.18],
    ['characterization', 0.17],
    ['dialogue', 0.12],
    ['worldBuilding', 0.10],
    ['emotionalImpact', 0.15],
    ['proseStyle', 0.13],
  ])

  const activeWeights = weights || defaultWeights

  const dimensions: QualityDimension[] = [
    'pacing',
    'coherence',
    'characterization',
    'dialogue',
    'worldBuilding',
    'emotionalImpact',
    'proseStyle',
  ]

  const weightedScores: WeightedScore[] = dimensions.map(dim => {
    const rawScore = metrics[`${dim}Score` as keyof NarrativeMetrics] as number
    const weight = activeWeights.get(dim) || 0
    return {
      dimension: dim,
      rawScore,
      weight,
      weightedContribution: rawScore * weight,
    }
  })

  const totalWeightedScore = weightedScores.reduce(
    (sum, ws) => sum + ws.weightedContribution,
    0
  )

  const averageUnweightedScore =
    weightedScores.reduce((sum, ws) => sum + ws.rawScore, 0) / dimensions.length

  const scores = weightedScores.map(ws => ws.rawScore)
  const scoreSpread = Math.max(...scores) - Math.min(...scores)

  const lowest = weightedScores.reduce((min, ws) =>
    ws.rawScore < min.rawScore ? ws : min
  )
  const highest = weightedScores.reduce((max, ws) =>
    ws.rawScore > max.rawScore ? ws : max
  )

  // Confidence based on content length and score consistency
  const confidences = weightedScores.map(ws => ws.weight * 1) // simplified
  const confidenceLevel = Math.min(1, confidences.reduce((a, b) => a + b, 0))

  return {
    weightedScores,
    totalWeightedScore: Math.round(totalWeightedScore),
    averageUnweightedScore: Math.round(averageUnweightedScore),
    scoreSpread: Math.round(scoreSpread),
    lowestDimension: lowest.dimension,
    highestDimension: highest.dimension,
    confidenceLevel: Math.round(confidenceLevel * 100) / 100,
  }
}

/**
 * Calculate overall quality score with confidence indicator
 */
export function calculateOverallQuality(
  content: string,
  customWeights?: Map<QualityDimension, number>
): {
  overallScore: number
  grade: QualityGrade
  aggregation: QualityAggregation
  confidenceLevel: number
} {
  const scoringResult = scoreAllDimensions(content)
  const aggregation = calculateWeightedScores(scoringResult.metrics, customWeights)

  return {
    overallScore: aggregation.totalWeightedScore,
    grade: scoreToGrade(aggregation.totalWeightedScore),
    aggregation,
    confidenceLevel: aggregation.confidenceLevel,
  }
}

// ============================================================
// QUALITY IMPROVEMENT SUGGESTOR
// ============================================================

export type SuggestionPriority = 'critical' | 'high' | 'medium' | 'low'

export interface QualitySuggestion {
  dimension: QualityDimension
  priority: SuggestionPriority
  suggestion: string
  expectedImprovement: number  // estimated score improvement
  actionability: number  // 0-1, how actionable the suggestion is
}

export interface SuggestionReport {
  suggestions: QualitySuggestion[]
  totalExpectedImprovement: number
  prioritizedActions: QualitySuggestion[]
  quickWins: QualitySuggestion[]  // high impact, easy to implement
  longTermGoals: QualitySuggestion[]
}

/**
 * Determine priority based on score and potential improvement
 */
export function getSuggestionPriority(
  score: number,
  dimension: QualityDimension
): SuggestionPriority {
  if (score < 40) return 'critical'
  if (score < 60) return 'high'
  if (score < 75) return 'medium'
  return 'low'
}

/**
 * Estimate expected improvement for a suggestion
 */
export function estimateImprovement(
  score: number,
  dimension: QualityDimension
): number {
  if (score >= 80) return 0
  if (score >= 70) return Math.max(5, 80 - score) * 0.3
  if (score >= 50) return Math.max(10, 60 - score) * 0.5
  return Math.max(15, 50 - score) * 0.7
}

/**
 * Calculate actionability score (0-1)
 */
export function calculateActionability(
  dimension: QualityDimension,
  score: number
): number {
  // Easy to fix: prose style, pacing (sentence structure)
  // Hard to fix: characterization, emotional impact (requires deeper rewriting)
  const easyDimensions: QualityDimension[] = ['proseStyle', 'pacing', 'coherence']
  const mediumDimensions: QualityDimension[] = ['dialogue', 'worldBuilding']
  const hardDimensions: QualityDimension[] = ['characterization', 'emotionalImpact']

  let baseActionability = 0.5
  if (easyDimensions.includes(dimension)) baseActionability = 0.85
  if (mediumDimensions.includes(dimension)) baseActionability = 0.65
  if (hardDimensions.includes(dimension)) baseActionability = 0.45

  // Lower scores are actually harder to fix meaningfully
  if (score < 30) baseActionability *= 0.7
  else if (score < 50) baseActionability *= 0.85

  return Math.round(baseActionability * 100) / 100
}

/**
 * Generate specific, actionable suggestion text
 */
export function generateSuggestionText(
  dimension: QualityDimension,
  score: number
): string {
  const suggestions: Record<QualityDimension, string[]> = {
    pacing: [
      score < 50
        ? 'Vary sentence length significantly - mix short punchy sentences with longer descriptive ones'
        : 'Refine pacing rhythm to create better scene transitions',
      'Add action beats and paragraph breaks to control reading speed',
      'Review scene beats - ensure high-intensity moments are followed by breathers',
    ],
    coherence: [
      score < 50
        ? 'Strengthen logical connections between sentences using transitional phrases'
        : 'Fine-tune scene flow for smoother progression',
      'Check pronoun consistency - ensure clear subject references throughout',
      'Use "however", "therefore", "meanwhile" to guide reader through narrative logic',
    ],
    characterization: [
      score < 50
        ? 'Add distinctive dialogue patterns for each character'
        : 'Deepen character voice and mannerisms',
      'Include more internal thoughts and reactions',
      'Show character emotions through actions, not just telling',
    ],
    dialogue: [
      score < 50
        ? 'Vary dialogue tags - avoid overusing "said"'
        : 'Strengthen natural conversation flow',
      'Include questions and emotional responses in dialogue',
      'Use subtext - characters should mean more than they explicitly say',
    ],
    worldBuilding: [
      score < 50
        ? 'Add more sensory details - sight, sound, smell, touch, taste'
        : 'Enhance environmental richness',
      'Include specific location references and spatial context',
      'Ground scenes with concrete objects and atmospheric details',
    ],
    emotionalImpact: [
      score < 50
        ? 'Incorporate higher-intensity emotional vocabulary'
        : 'Deepen emotional resonance of key moments',
      'Use sentence length to build emotional tension',
      'Create emotional contrast between scenes',
    ],
    proseStyle: [
      score < 50
        ? 'Increase vocabulary variety - reduce repetitive word usage'
        : 'Polish prose rhythm and flow',
      "Apply show don't tell principles more consistently",
      'Strengthen opening sentences for immediate reader engagement',
    ],
  }

  const dimSuggestions = suggestions[dimension]
  if (score < 40) return dimSuggestions[0]
  if (score < 60) return dimSuggestions[1]
  return dimSuggestions[2]
}

/**
 * Generate improvement suggestions for narrative content
 */
export function generateSuggestions(content: string): SuggestionReport {
  const scoringResult = scoreAllDimensions(content)
  const suggestions: QualitySuggestion[] = []

  for (const dimScore of scoringResult.dimensions) {
    if (dimScore.score < 80) {
      // Only suggest for dimensions below excellent
      const priority = getSuggestionPriority(dimScore.score, dimScore.dimension)
      const expectedImprovement = estimateImprovement(
        dimScore.score,
        dimScore.dimension
      )
      const actionability = calculateActionability(
        dimScore.dimension,
        dimScore.score
      )
      const suggestion = generateSuggestionText(
        dimScore.dimension,
        dimScore.score
      )

      suggestions.push({
        dimension: dimScore.dimension,
        priority,
        suggestion,
        expectedImprovement: Math.round(expectedImprovement * 10) / 10,
        actionability,
      })
    }
  }

  // Sort by priority (critical first) then by expected improvement
  const priorityOrder: Record<SuggestionPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  }

  suggestions.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff
    return b.expectedImprovement - a.expectedImprovement
  })

  const totalExpectedImprovement = suggestions.reduce(
    (sum, s) => sum + s.expectedImprovement,
    0
  )

  const prioritizedActions = suggestions.filter(
    s => s.priority === 'critical' || s.priority === 'high'
  )

  const quickWins = suggestions.filter(
    s => s.actionability >= 0.7 && s.priority !== 'low'
  )

  const longTermGoals = suggestions.filter(s => s.actionability < 0.6)

  return {
    suggestions,
    totalExpectedImprovement: Math.round(totalExpectedImprovement * 10) / 10,
    prioritizedActions,
    quickWins,
    longTermGoals,
  }
}

/**
 * Format suggestion report as readable text
 */
export function formatSuggestionReport(report: SuggestionReport): string {
  const lines = [
    '=== Quality Improvement Suggestions ===',
    `Total Expected Improvement: +${report.totalExpectedImprovement.toFixed(1)} points`,
    '',
  ]

  if (report.quickWins.length > 0) {
    lines.push('--- QUICK WINS (High Impact, Easy Fix) ---')
    for (const s of report.quickWins) {
      lines.push(`  [${s.priority.toUpperCase()}] ${s.dimension}: ${s.suggestion}`)
      lines.push(`    Expected: +${s.expectedImprovement.toFixed(1)} | Actionability: ${(s.actionability * 100).toFixed(0)}%`)
    }
    lines.push('')
  }

  if (report.prioritizedActions.length > 0) {
    lines.push('--- PRIORITIZED ACTIONS ---')
    for (const s of report.prioritizedActions) {
      lines.push(`  [${s.priority.toUpperCase()}] ${s.dimension}: ${s.suggestion}`)
    }
    lines.push('')
  }

  if (report.longTermGoals.length > 0) {
    lines.push('--- LONG-TERM GOALS ---')
    for (const s of report.longTermGoals) {
      lines.push(`  [${s.priority.toUpperCase()}] ${s.dimension}: ${s.suggestion}`)
    }
  }

  return lines.join('\n')
}

// ============================================================
// COMBINED ENGINE
// ============================================================

export interface NarrativeQualityEngineState {
  scoringHistory: QualityScoringResult[]
  suggestionHistory: SuggestionReport[]
  averageScores: Map<QualityDimension, number>
  totalContentsAnalyzed: number
}

/**
 * Create empty engine state
 */
export function createEmptyEngineState(): NarrativeQualityEngineState {
  return {
    scoringHistory: [],
    suggestionHistory: [],
    averageScores: new Map(),
    totalContentsAnalyzed: 0,
  }
}

/**
 * Add a scoring result to history
 */
export function addScoringResult(
  state: NarrativeQualityEngineState,
  result: QualityScoringResult
): NarrativeQualityEngineState {
  const scoringHistory = [...state.scoringHistory, result]
  const totalContentsAnalyzed = state.totalContentsAnalyzed + 1

  // Update averages
  const averageScores = new Map(state.averageScores)
  for (const dim of result.dimensions) {
    const currentAvg = averageScores.get(dim.dimension) || dim.score
    averageScores.set(
      dim.dimension,
      (currentAvg * state.totalContentsAnalyzed + dim.score) / totalContentsAnalyzed
    )
  }

  return {
    ...state,
    scoringHistory,
    averageScores,
    totalContentsAnalyzed,
  }
}

/**
 * Add a suggestion report to history
 */
export function addSuggestionReport(
  state: NarrativeQualityEngineState,
  report: SuggestionReport
): NarrativeQualityEngineState {
  return {
    ...state,
    suggestionHistory: [...state.suggestionHistory, report],
  }
}

/**
 * Analyze narrative content and return comprehensive quality report
 */
export function analyzeNarrativeQuality(
  content: string,
  state?: NarrativeQualityEngineState
): {
  scoringResult: QualityScoringResult
  suggestionReport: SuggestionReport
  state: NarrativeQualityEngineState
} {
  const currentState = state || createEmptyEngineState()
  const scoringResult = scoreAllDimensions(content)
  const suggestionReport = generateSuggestions(content)

  const newState = addScoringResult(
    addSuggestionReport(currentState, suggestionReport),
    scoringResult
  )

  return {
    scoringResult,
    suggestionReport,
    state: newState,
  }
}

/**
 * Format comprehensive quality report
 */
export function formatQualityReport(
  scoringResult: QualityScoringResult,
  suggestionReport: SuggestionReport
): string {
  const lines = [
    '╔══════════════════════════════════════════════════════════╗',
    '║          NARRATIVE QUALITY SCORING REPORT                 ║',
    '╚══════════════════════════════════════════════════════════╝',
    '',
    `Overall Score: ${scoringResult.overallScore}/100 (${scoringResult.grade})`,
    `Analyzed at: ${new Date(scoringResult.timestamp).toISOString()}`,
    '',
    '--- Dimension Breakdown ---',
  ]

  for (const dim of scoringResult.dimensions) {
    const stars = '★'.repeat(Math.floor(dim.score / 20))
    const empty = '☆'.repeat(5 - Math.floor(dim.score / 20))
    lines.push(
      `  ${dim.dimension}: ${dim.score}/100 ${stars}${empty} [conf: ${(dim.confidence * 100).toFixed(0)}%]`
    )
    if (dim.evidence.length > 0) {
      lines.push(`    Evidence: ${dim.evidence.slice(0, 2).join('; ')}`)
    }
  }

  lines.push('')
  lines.push('--- Improvement Suggestions ---')
  for (const s of suggestionReport.suggestions.slice(0, 5)) {
    lines.push(
      `  [${s.priority.toUpperCase()}] ${s.dimension}: ${s.suggestion}`
    )
  }

  return lines.join('\n')
}

// Re-export useful types and functions from NarrativeQualityScorer
export {
  NarrativeQualityScorerState,
  SceneAssessment,
  NarrativeMetrics,
  DetailedScoring,
  QualityDimension,
  QualityGrade,
  createEmptyScorerState,
  scoreNarrative,
  formatSceneAssessment,
  formatScorerDashboard,
}