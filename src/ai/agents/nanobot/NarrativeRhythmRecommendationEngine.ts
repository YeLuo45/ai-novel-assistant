/**
 * NarrativeRhythmRecommendationEngine — V522
 * Narrative rhythm analysis, recommendation generation, and adaptation tracking.
 * Inspired by: thunderbolt-design (pipeline/feedback loops) + narrative flow patterns
 */

// ============================================================
// TYPES & INTERFACES
// ============================================================

export type RhythmSuggestion = 'accelerate' | 'decelerate' | 'maintain' | 'analyze'
export type RhythmState = 'rushing' | 'steady' | 'dragging' | 'balanced'
export type AdaptationStatus = 'pending' | 'applied' | 'rejected' | 'superseded' | 'completed'

export interface RhythmMetrics {
  entropyValue: number        // 0-1, narrative complexity
  speedValue: number          // words per minute equivalent
  densityValue: number        // 0-1, narrative density
  combinedScore: number       // 0-100, overall rhythm score
  rhythmState: RhythmState
  consistencyScore: number    // 0-1, how consistent the rhythm is
}

export interface RhythmRecommendation {
  id: string
  suggestion: RhythmSuggestion
  confidence: number          // 0-1
  reason: string
  targetAdjustment: number    // -100 to +100, adjustment amount
  priority: number            // 1-10, higher = more urgent
  createdAt: number
  metrics: RhythmMetrics
  tags: string[]              // e.g., ['entropy_spike', 'scene_transition', 'climax']
}

export interface AdaptationRecord {
  recommendationId: string
  status: AdaptationStatus
  appliedAt: number | null
  completedAt: number | null
  effectScore: number | null  // -100 to +100, measured effect after application
  rejectionReason: string | null
  notes: string
}

export interface AdaptationMetrics {
  totalRecommendations: number
  adoptionRate: number        // 0-1, percentage of recommendations applied
  averageEffectScore: number  // -100 to +100
  rejectionRate: number       // 0-1
  supersessionRate: number    // 0-1
  mostEffectiveSuggestion: RhythmSuggestion | null
  leastEffectiveSuggestion: RhythmSuggestion | null
}

export interface NarrativeRhythmState {
  metricsHistory: RhythmMetrics[]
  recommendations: RhythmRecommendation[]
  adaptations: AdaptationRecord[]
  adaptationMetrics: AdaptationMetrics
  lastAnalyzedAt: number
}

// ============================================================
// RHYTHM ANALYZER
// ============================================================

export interface RhythmAnalysisInput {
  entropyValue?: number       // 0-1, from NarrativeEntropyEngine
  speedValue?: number         // wpm equivalent, from NarrativeSpeedAnalysisEngine  
  densityValue?: number       // 0-1, from NarrativeDensityHeatmapEngine
  previousMetrics?: RhythmMetrics | null
}

export interface RhythmAnalysisResult {
  currentMetrics: RhythmMetrics
  analysisTimestamp: number
  alerts: string[]
  isAnomalous: boolean
  anomalyType: 'rushing' | 'dragging' | 'inconsistent' | null
}

/**
 * Normalize speed value to 0-1 scale (baseline ~250 wpm)
 */
export function normalizeSpeedValue(speedWpm: number, baselineWpm = 250): number {
  if (speedWpm <= 0) return 0
  const ratio = speedWpm / baselineWpm
  return Math.min(1, ratio)
}

/**
 * Calculate combined rhythm score from entropy, speed, and density
 * Score 0-100: 0 = very slow/chaotic, 100 = optimal pace
 */
export function calculateCombinedScore(
  entropyValue: number,
  speedValue: number,
  densityValue: number
): number {
  // Optimal rhythm: moderate entropy (~0.5), moderate speed (~0.7), moderate density (~0.5)
  const entropyScore = 1 - Math.abs(entropyValue - 0.5) * 2  // 1.0 at 0.5, 0 at 0 or 1
  const speedScore = speedValue < 0.5 
    ? speedValue * 1.4  // Penalize very slow speeds
    : speedValue > 0.75 
      ? Math.max(0.2, 1 - (speedValue - 0.75) * 2.5)  // Penalize too fast, but keep minimum
      : 1 - Math.abs(speedValue - 0.7) * 1.5  // Optimal around 0.7
  const densityScore = 1 - Math.abs(densityValue - 0.5) * 2

  const combined = (entropyScore * 0.35 + speedScore * 0.4 + densityScore * 0.25) * 100
  return Math.max(0, Math.min(100, combined))
}

/**
 * Determine rhythm state from metrics
 */
export function determineRhythmState(metrics: RhythmMetrics): RhythmState {
  const { speedValue, combinedScore, consistencyScore } = metrics

  if (speedValue > 0.85 && combinedScore > 70) return 'rushing'
  if (speedValue < 0.4 && combinedScore < 40) return 'dragging'
  if (consistencyScore > 0.7 && combinedScore > 50) return 'balanced'
  return 'steady'
}

/**
 * Calculate consistency score (how stable the rhythm has been)
 */
export function calculateConsistencyScore(metricsHistory: RhythmMetrics[]): number {
  if (metricsHistory.length < 2) return 1.0
  
  const recent = metricsHistory.slice(-5)
  const combinedScores = recent.map(m => m.combinedScore)
  const mean = combinedScores.reduce((a, b) => a + b, 0) / combinedScores.length
  const variance = combinedScores.reduce((a, b) => a + (b - mean) ** 2, 0) / combinedScores.length
  const stdDev = Math.sqrt(variance)
  
  // Convert to 0-1 scale: lower variance = higher consistency
  const consistency = Math.max(0, 1 - (stdDev / 30))
  return consistency
}

/**
 * Analyze current narrative rhythm state
 */
export function analyzeRhythm(input: RhythmAnalysisInput): RhythmAnalysisResult {
  const entropyValue = input.entropyValue ?? 0.5
  const speedValue = normalizeSpeedValue(input.speedValue ?? 175)
  const densityValue = input.densityValue ?? 0.5

  const combinedScore = calculateCombinedScore(entropyValue, speedValue, densityValue)
  const metricsHistory = input.previousMetrics ? [input.previousMetrics] : []
  const consistencyScore = calculateConsistencyScore(metricsHistory)

  const currentMetrics: RhythmMetrics = {
    entropyValue,
    speedValue,
    densityValue,
    combinedScore,
    rhythmState: determineRhythmState({
      entropyValue,
      speedValue,
      densityValue,
      combinedScore,
      rhythmState: 'balanced',
      consistencyScore
    }),
    consistencyScore
  }

  const alerts: string[] = []
  let isAnomalous = false
  let anomalyType: RhythmAnalysisResult['anomalyType'] = null

  // Detect rushing (too fast)
  if (speedValue > 0.8 && combinedScore > 65) {
    isAnomalous = true
    anomalyType = 'rushing'
    alerts.push('Narrative pace is too fast - readers may feel rushed')
  }

  // Detect dragging (too slow)
  if (speedValue < 0.35 && combinedScore < 45) {
    isAnomalous = true
    anomalyType = 'dragging'
    alerts.push('Narrative pace is too slow - readers may lose interest')
  }

  // Detect inconsistent rhythm
  if (consistencyScore < 0.4) {
    isAnomalous = true
    anomalyType = 'inconsistent'
    alerts.push('Rhythm inconsistency detected - consider stabilizing pacing')
  }

  // High entropy + low speed = dense prose
  if (entropyValue > 0.75 && speedValue < 0.5) {
    alerts.push('Dense prose detected - consider breaking up complexity')
  }

  // Low entropy + high speed = simple but rapid
  if (entropyValue < 0.25 && speedValue > 0.7) {
    alerts.push('Simple rapid pacing - may lack depth in key moments')
  }

  return {
    currentMetrics,
    analysisTimestamp: Date.now(),
    alerts,
    isAnomalous,
    anomalyType
  }
}

// ============================================================
// RECOMMENDATION ENGINE
// ============================================================

export interface RecommendationThresholds {
  rushUpper: number         // speed above this = rushing warning
  rushScoreLower: number    // combined score above this = rushing
  dragUpper: number         // speed below this = dragging warning  
  dragScoreUpper: number    // combined score below this = dragging
  stableEntropyRange: [number, number]  // [low, high] for stable rhythm
}

export const DEFAULT_RECOMMENDATION_THRESHOLDS: RecommendationThresholds = {
  rushUpper: 0.6,
  rushScoreLower: 80,
  dragUpper: 0.35,
  dragScoreUpper: 45,
  stableEntropyRange: [0.25, 0.75]
}

/**
 * Calculate priority based on how urgent the adjustment is needed
 */
export function calculatePriority(
  suggestion: RhythmSuggestion,
  confidence: number,
  isAnomalous: boolean,
  anomalyType: RhythmAnalysisResult['anomalyType']
): number {
  let priority = 5  // base priority

  if (isAnomalous && anomalyType) {
    priority += 3  // anomalies get higher priority
  }

  switch (suggestion) {
    case 'accelerate':
      priority += confidence > 0.7 ? 2 : 1
      break
    case 'decelerate':
      priority += confidence > 0.7 ? 2 : 1
      break
    case 'maintain':
      priority -= 2  // maintain is low priority
      break
    case 'analyze':
      priority += 1  // analyze is curiosity-driven
      break
  }

  return Math.max(1, Math.min(10, priority))
}

/**
 * Calculate target adjustment amount (-100 to +100)
 * Positive = speed up, Negative = slow down
 */
export function calculateTargetAdjustment(
  suggestion: RhythmSuggestion,
  metrics: RhythmMetrics
): number {
  switch (suggestion) {
    case 'accelerate':
      return Math.round(20 + (1 - metrics.speedValue) * 50)
    case 'decelerate':
      return Math.round(-20 - metrics.speedValue * 40)
    case 'maintain':
      return Math.round((0.5 - metrics.speedValue) * 20)
    case 'analyze':
      return 0
  }
}

/**
 * Generate rhythm recommendation based on analysis
 */
export function generateRecommendation(
  analysis: RhythmAnalysisResult,
  thresholds: RecommendationThresholds = DEFAULT_RECOMMENDATION_THRESHOLDS,
  tags: string[] = []
): RhythmRecommendation {
  const { currentMetrics, isAnomalous, anomalyType } = analysis
  const { speedValue, combinedScore, entropyValue } = currentMetrics

  let suggestion: RhythmSuggestion
  let confidence: number
  let reason: string

  // Decision logic - use AND to require BOTH conditions for the recommendation
  if (speedValue > thresholds.rushUpper && combinedScore > thresholds.rushScoreLower) {
    suggestion = 'decelerate'
    confidence = Math.min(1, (speedValue - thresholds.rushUpper) / 0.15 + 0.3)
    reason = `Current pace too fast (speed=${(speedValue * 100).toFixed(0)}%, score=${combinedScore.toFixed(0)}). Decelerate to improve readability.`
  } else if (speedValue < thresholds.dragUpper && combinedScore < thresholds.dragScoreUpper) {
    suggestion = 'accelerate'
    confidence = Math.min(1, (thresholds.dragUpper - speedValue) / 0.2 + 0.3)
    reason = `Current pace too slow (speed=${(speedValue * 100).toFixed(0)}%, score=${combinedScore.toFixed(0)}). Accelerate to maintain engagement.`
  } else if (
    entropyValue >= thresholds.stableEntropyRange[0] &&
    entropyValue <= thresholds.stableEntropyRange[1] &&
    !isAnomalous
  ) {
    suggestion = 'maintain'
    confidence = 0.85
    reason = `Rhythm is well-balanced (entropy=${(entropyValue * 100).toFixed(0)}%, speed=${(speedValue * 100).toFixed(0)}%). Continue current approach.`
  } else {
    suggestion = 'analyze'
    confidence = 0.5
    reason = `Rhythm metrics are mixed - further analysis needed before recommending adjustments.`
  }

  const priority = calculatePriority(suggestion, confidence, isAnomalous, anomalyType)
  const targetAdjustment = calculateTargetAdjustment(suggestion, currentMetrics)

  return {
    id: `rhythm_rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    suggestion,
    confidence: Math.min(1, Math.max(0, confidence)),
    reason,
    targetAdjustment: Math.max(-100, Math.min(100, targetAdjustment)),
    priority,
    createdAt: Date.now(),
    metrics: currentMetrics,
    tags
  }
}

// ============================================================
// ADAPTATION TRACKER
// ============================================================

export function createEmptyAdaptationMetrics(): AdaptationMetrics {
  return {
    totalRecommendations: 0,
    adoptionRate: 0,
    averageEffectScore: 0,
    rejectionRate: 0,
    supersessionRate: 0,
    mostEffectiveSuggestion: null,
    leastEffectiveSuggestion: null
  }
}

export function createEmptyRhythmState(): NarrativeRhythmState {
  return {
    metricsHistory: [],
    recommendations: [],
    adaptations: [],
    adaptationMetrics: createEmptyAdaptationMetrics(),
    lastAnalyzedAt: Date.now()
  }
}

/**
 * Record a recommendation in the state
 */
export function recordRecommendation(
  state: NarrativeRhythmState,
  recommendation: RhythmRecommendation
): NarrativeRhythmState {
  return {
    ...state,
    recommendations: [...state.recommendations, recommendation]
  }
}

/**
 * Apply a recommendation (mark as applied)
 */
export function applyRecommendation(
  state: NarrativeRhythmState,
  recommendationId: string,
  notes: string = ''
): NarrativeRhythmState {
  const adaptations = [...state.adaptations]
  const existingIndex = adaptations.findIndex(
    a => a.recommendationId === recommendationId
  )

  if (existingIndex >= 0) {
    adaptations[existingIndex] = {
      ...adaptations[existingIndex],
      status: 'applied',
      appliedAt: Date.now(),
      notes
    }
  } else {
    adaptations.push({
      recommendationId,
      status: 'applied',
      appliedAt: Date.now(),
      completedAt: null,
      effectScore: null,
      rejectionReason: null,
      notes
    })
  }

  return {
    ...state,
    adaptations
  }
}

/**
 * Reject a recommendation
 */
export function rejectRecommendation(
  state: NarrativeRhythmState,
  recommendationId: string,
  reason: string
): NarrativeRhythmState {
  const adaptations = [...state.adaptations]
  const existingIndex = adaptations.findIndex(
    a => a.recommendationId === recommendationId
  )

  if (existingIndex >= 0) {
    adaptations[existingIndex] = {
      ...adaptations[existingIndex],
      status: 'rejected',
      rejectionReason: reason,
      appliedAt: adaptations[existingIndex].appliedAt ?? null
    }
  } else {
    adaptations.push({
      recommendationId,
      status: 'rejected',
      appliedAt: null,
      completedAt: null,
      effectScore: null,
      rejectionReason: reason,
      notes: ''
    })
  }

  return {
    ...state,
    adaptations
  }
}

/**
 * Complete a recommendation with effect score
 */
export function completeRecommendation(
  state: NarrativeRhythmState,
  recommendationId: string,
  effectScore: number,
  notes: string = ''
): NarrativeRhythmState {
  const adaptations = state.adaptations.map(a => {
    if (a.recommendationId === recommendationId) {
      return {
        ...a,
        status: 'completed' as AdaptationStatus,
        completedAt: Date.now(),
        effectScore: Math.max(-100, Math.min(100, effectScore)),
        notes: notes || a.notes
      }
    }
    return a
  })

  return {
    ...state,
    adaptations
  }
}

/**
 * Mark recommendation as superseded by a newer one
 */
export function supersedeRecommendation(
  state: NarrativeRhythmState,
  recommendationId: string,
  supersedingId: string
): NarrativeRhythmState {
  let adaptations = state.adaptations
  const existingIndex = adaptations.findIndex(
    a => a.recommendationId === recommendationId
  )

  if (existingIndex >= 0) {
    adaptations = adaptations.map(a => {
      if (a.recommendationId === recommendationId) {
        return {
          ...a,
          status: 'superseded' as AdaptationStatus,
          notes: a.notes 
            ? `${a.notes} [Superseded by ${supersedingId}]`
            : `[Superseded by ${supersedingId}]`
        }
      }
      return a
    })
  } else {
    // No existing adaptation record, create one
    adaptations = [...adaptations, {
      recommendationId,
      status: 'superseded' as AdaptationStatus,
      appliedAt: null,
      completedAt: null,
      effectScore: null,
      rejectionReason: null,
      notes: `[Superseded by ${supersedingId}]`
    }]
  }

  return {
    ...state,
    adaptations
  }
}

/**
 * Calculate adaptation metrics from current state
 */
export function calculateAdaptationMetrics(
  recommendations: RhythmRecommendation[],
  adaptations: AdaptationRecord[]
): AdaptationMetrics {
  const totalRecommendations = recommendations.length
  if (totalRecommendations === 0) {
    return createEmptyAdaptationMetrics()
  }

  const appliedAdaptations = adaptations.filter(a => 
    a.status === 'applied' || a.status === 'completed'
  )
  const rejectedAdaptations = adaptations.filter(a => a.status === 'rejected')
  const supersededAdaptations = adaptations.filter(a => a.status === 'superseded')

  const adoptionRate = totalRecommendations > 0
    ? appliedAdaptations.length / totalRecommendations
    : 0
  const rejectionRate = totalRecommendations > 0
    ? rejectedAdaptations.length / totalRecommendations
    : 0
  const supersessionRate = totalRecommendations > 0
    ? supersededAdaptations.length / totalRecommendations
    : 0

  // Calculate effect scores by suggestion type
  const effectScoresBySuggestion: Record<RhythmSuggestion, number[]> = {
    accelerate: [],
    decelerate: [],
    maintain: [],
    analyze: []
  }

  for (const adaptation of adaptations) {
    if (adaptation.effectScore !== null) {
      const recommendation = recommendations.find(r => r.id === adaptation.recommendationId)
      if (recommendation) {
        effectScoresBySuggestion[recommendation.suggestion].push(adaptation.effectScore)
      }
    }
  }

  const averageEffectScore = (() => {
    const allScores: number[] = []
    for (const scores of Object.values(effectScoresBySuggestion)) {
      allScores.push(...scores)
    }
    return allScores.length > 0
      ? allScores.reduce((a, b) => a + b, 0) / allScores.length
      : 0
  })()

  // Find most and least effective suggestions
  let mostEffective: RhythmSuggestion | null = null
  let leastEffective: RhythmSuggestion | null = null
  let maxAvg = -Infinity
  let minAvg = Infinity

  for (const [suggestion, scores] of Object.entries(effectScoresBySuggestion)) {
    if (scores.length > 0) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      if (avg > maxAvg) {
        maxAvg = avg
        mostEffective = suggestion as RhythmSuggestion
      }
      if (avg < minAvg) {
        minAvg = avg
        leastEffective = suggestion as RhythmSuggestion
      }
    }
  }

  return {
    totalRecommendations,
    adoptionRate,
    averageEffectScore,
    rejectionRate,
    supersessionRate,
    mostEffectiveSuggestion: mostEffective,
    leastEffectiveSuggestion: leastEffective
  }
}

/**
 * Add metrics to history
 */
export function addMetricsToHistory(
  state: NarrativeRhythmState,
  metrics: RhythmMetrics
): NarrativeRhythmState {
  return {
    ...state,
    metricsHistory: [...state.metricsHistory.slice(-49), metrics],  // keep last 50
    lastAnalyzedAt: Date.now()
  }
}

// ============================================================
// QUERY FUNCTIONS
// ============================================================

export function getLatestMetrics(state: NarrativeRhythmState): RhythmMetrics | null {
  if (state.metricsHistory.length === 0) return null
  return state.metricsHistory[state.metricsHistory.length - 1]
}

export function getActiveRecommendations(state: NarrativeRhythmState): RhythmRecommendation[] {
  const activeStatuses: AdaptationStatus[] = ['pending', 'applied']
  return state.recommendations.filter(rec => {
    const adaptation = state.adaptations.find(a => a.recommendationId === rec.id)
    return !adaptation || activeStatuses.includes(adaptation.status)
  })
}

export function getRecommendationById(
  state: NarrativeRhythmState,
  recommendationId: string
): RhythmRecommendation | null {
  return state.recommendations.find(r => r.id === recommendationId) ?? null
}

export function getAdaptationByRecommendationId(
  state: NarrativeRhythmState,
  recommendationId: string
): AdaptationRecord | null {
  return state.adaptations.find(a => a.recommendationId === recommendationId) ?? null
}

export function getRecentRecommendations(
  state: NarrativeRhythmState,
  count: number = 10
): RhythmRecommendation[] {
  return [...state.recommendations]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, count)
}

export function getRecommendationsBySuggestion(
  state: NarrativeRhythmState,
  suggestion: RhythmSuggestion
): RhythmRecommendation[] {
  return state.recommendations.filter(r => r.suggestion === suggestion)
}

export function getAdaptationSummary(state: NarrativeRhythmState): {
  total: number
  applied: number
  rejected: number
  superseded: number
  pending: number
  adoptionRatePercent: string
} {
  const total = state.adaptations.length
  const applied = state.adaptations.filter(a => a.status === 'applied' || a.status === 'completed').length
  const rejected = state.adaptations.filter(a => a.status === 'rejected').length
  const superseded = state.adaptations.filter(a => a.status === 'superseded').length
  const pending = total - applied - rejected - superseded

  return {
    total,
    applied,
    rejected,
    superseded,
    pending,
    adoptionRatePercent: total > 0 ? `${((applied / total) * 100).toFixed(1)}%` : 'N/A'
  }
}

// ============================================================
// FULL PIPELINE FUNCTION
// ============================================================

/**
 * Run complete rhythm analysis and recommendation pipeline
 */
export function analyzeAndRecommend(
  state: NarrativeRhythmState,
  input: RhythmAnalysisInput,
  tags: string[] = []
): {
    state: NarrativeRhythmState
    analysis: RhythmAnalysisResult
    recommendation: RhythmRecommendation
  } {
  // Step 1: Analyze current rhythm
  const analysis = analyzeRhythm(input)

  // Step 2: Generate recommendation
  const recommendation = generateRecommendation(analysis, DEFAULT_RECOMMENDATION_THRESHOLDS, tags)

  // Step 3: Update state with metrics and recommendation
  let newState = addMetricsToHistory(state, analysis.currentMetrics)
  newState = recordRecommendation(newState, recommendation)

  // Step 4: Update adaptation metrics
  newState = {
    ...newState,
    adaptationMetrics: calculateAdaptationMetrics(newState.recommendations, newState.adaptations)
  }

  return { state: newState, analysis, recommendation }
}

/**
 * Process a writing session result and update adaptation tracking
 */
export function processSessionResult(
  state: NarrativeRhythmState,
  recommendationId: string,
  effectScore: number,
  notes: string = ''
): NarrativeRhythmState {
  let newState = completeRecommendation(state, recommendationId, effectScore, notes)
  newState = {
    ...newState,
    adaptationMetrics: calculateAdaptationMetrics(newState.recommendations, newState.adaptations)
  }
  return newState
}