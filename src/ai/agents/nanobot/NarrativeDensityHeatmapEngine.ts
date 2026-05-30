/**
 * NarrativeDensityHeatmapEngine — V515
 * Narrative density calculation, 2D heatmap generation, and anomaly region detection.
 * Inspired by: NarrativeEntropyEngine (anomaly detection) + NarrativeSpeedAnalysisEngine (trajectory/metrics) + NarrativePacingHeatmap (heatmap visualization)
 */

import { tokenize } from './NarrativeEntropyEngine'

// ============================================================
// TYPES & INTERFACES
// ============================================================

export type DensityDimension = 'action' | 'dialogue' | 'description' | 'interior'

export interface DensityVector {
  action: number       // 0-100
  dialogue: number     // 0-100
  description: number  // 0-100
  interior: number     // 0-100
}

export interface DensityPoint {
  sceneIndex: number         // 0-based scene position
  vector: DensityVector
  overall: number            // weighted average 0-100
}

export interface HeatmapRow {
  sceneIndex: number
  sceneLabel: string
  vector: DensityVector
  overall: number
  isAnomalous: boolean
  anomalyType: 'high' | 'low' | null
  anomalyScore: number
}

export interface Heatmap2D {
  rows: HeatmapRow[]
  columns: DensityDimension[]
  maxValue: number
  minValue: number
  avgValue: number
}

export interface DensityThresholds {
  highUpper: number    // above this = overly dense
  lowLower: number      // below this = sparse
  deviationFactor: number // std dev multiplier for anomaly
}

export const DEFAULT_DENSITY_THRESHOLDS: DensityThresholds = {
  highUpper: 80,
  lowLower: 20,
  deviationFactor: 1.5
}

export interface AnomalyRegion {
  startScene: number
  endScene: number
  type: 'high_density' | 'low_density'
  severity: number  // 0-100
  avgDensity: number
  dimension: DensityDimension | 'overall'
  description: string
}

export interface DensityAnalysisReport {
  heatmap: Heatmap2D
  anomalies: AnomalyRegion[]
  overallHealth: number  // 0-100
  recommendations: string[]
  dimensionBreakdown: Record<DensityDimension, {
    avg: number
    stdDev: number
    trend: 'increasing' | 'decreasing' | 'stable'
  }>
}

export interface NarrativeDensityState {
  points: DensityPoint[]
  heatmap: Heatmap2D | null
  anomalies: AnomalyRegion[]
  report: DensityAnalysisReport | null
  thresholds: DensityThresholds
  sceneLabels: string[]
}

// ============================================================
// DENSITY CALCULATOR
// ============================================================

const DIALOGUE_INDICATORS = /["'""«»""'']([^""«»""''])+["'""«»""'']/g
const ACTION_INDICATORS = /\b(rushed|sprinted|grabbed|struck|attacked|ran|cried|shouted|whispered|laughed|breath|gasp|heart)\b/gi
const DESCRIPTION_INDICATORS = /\b(saw|noticed|observed|described|around her|wall|floor|ceiling|sky|light|color|shape|size|old|young|tall|short)\b/gi
const INTERIOR_INDICATORS = /\b(thought|wondered|remembered|felt|believed|hoped|feared|knew|sensed|realized|decided|remember)\b/gi

/**
 * Calculate density vector for a text segment
 */
export function calculateDensityVector(text: string): DensityVector {
  const words = tokenize(text)
  const wordCount = words.length
  if (wordCount === 0) {
    return { action: 0, dialogue: 0, description: 0, interior: 0 }
  }

  // Count dialogue by quotation marks (simple heuristic)
  const dialogueMatches = (text.match(DIALOGUE_INDICATORS) || []).length
  const dialogueScore = Math.min(100, (dialogueMatches / Math.max(1, wordCount / 50)) * 100)

  // Count action verbs
  const actionMatches = (text.match(ACTION_INDICATORS) || []).length
  const actionScore = Math.min(100, (actionMatches / Math.max(1, wordCount / 30)) * 100)

  // Count description words
  const descriptionMatches = (text.match(DESCRIPTION_INDICATORS) || []).length
  const descriptionScore = Math.min(100, (descriptionMatches / Math.max(1, wordCount / 25)) * 100)

  // Count interior thoughts
  const interiorMatches = (text.match(INTERIOR_INDICATORS) || []).length
  const interiorScore = Math.min(100, (interiorMatches / Math.max(1, wordCount / 35)) * 100)

  return {
    action: Math.round(actionScore),
    dialogue: Math.round(dialogueScore),
    description: Math.round(descriptionScore),
    interior: Math.round(interiorScore)
  }
}

/**
 * Calculate overall density from vector (weighted average)
 */
export function calculateOverallDensity(vector: DensityVector): number {
  // Weights: action and dialogue are more "dense" (eventful), description and interior are "lighter"
  const weights = { action: 0.3, dialogue: 0.3, description: 0.2, interior: 0.2 }
  const total = weights.action + weights.dialogue + weights.description + weights.interior
  const weighted =
    vector.action * weights.action +
    vector.dialogue * weights.dialogue +
    vector.description * weights.description +
    vector.interior * weights.interior
  return Math.round(weighted / total)
}

/**
 * Calculate density for multiple scenes (segments)
 */
export function calculateSceneDensities(scenes: string[]): DensityPoint[] {
  return scenes.map((scene, index) => {
    const vector = calculateDensityVector(scene)
    const overall = calculateOverallDensity(vector)
    return { sceneIndex: index, vector, overall }
  })
}

/**
 * Calculate statistics for a dimension across all points
 */
export function calculateDimensionStats(
  points: DensityPoint[],
  dimension: DensityDimension
): { avg: number; stdDev: number } {
  if (points.length === 0) return { avg: 0, stdDev: 0 }

  const values = points.map(p => p.vector[dimension])
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length
  return { avg: Math.round(avg), stdDev: Math.round(Math.sqrt(variance)) }
}

/**
 * Calculate trend for a dimension
 */
export function calculateDimensionTrend(
  points: DensityPoint[],
  dimension: DensityDimension,
  window: number = 5
): 'increasing' | 'decreasing' | 'stable' {
  if (points.length < 2) return 'stable'

  const values = points.map(p => p.vector[dimension])
  const recent = values.slice(-window)
  const halfLen = Math.floor(recent.length / 2)

  if (halfLen === 0) return 'stable'

  const firstHalf = recent.slice(0, halfLen)
  const secondHalf = recent.slice(halfLen)

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

  const diff = secondAvg - firstAvg
  if (diff > 5) return 'increasing'
  if (diff < -5) return 'decreasing'
  return 'stable'
}

// ============================================================
// HEATMAP GENERATOR
// ============================================================

const DIMENSIONS: DensityDimension[] = ['action', 'dialogue', 'description', 'interior']

/**
 * Generate 2D heatmap data from density points
 */
export function generateHeatmap2D(
  points: DensityPoint[],
  sceneLabels: string[],
  thresholds: DensityThresholds = DEFAULT_DENSITY_THRESHOLDS
): Heatmap2D {
  if (points.length === 0) {
    return {
      rows: [],
      columns: [...DIMENSIONS],
      maxValue: 0,
      minValue: 0,
      avgValue: 0
    }
  }

  // Calculate rolling statistics for anomaly detection
  const overalls = points.map(p => p.overall)
  const avgOverall = overalls.reduce((a, b) => a + b, 0) / overalls.length
  const variance = overalls.reduce((sum, v) => sum + Math.pow(v - avgOverall, 2), 0) / overalls.length
  const stdDev = Math.sqrt(variance)

  const rows: HeatmapRow[] = points.map((point, i) => {
    const label = sceneLabels[i] || `Scene ${i + 1}`

    // Determine if this point is anomalous
    let isAnomalous = false
    let anomalyType: 'high' | 'low' | null = null
    let anomalyScore = 0

    if (point.overall > thresholds.highUpper) {
      isAnomalous = true
      anomalyType = 'high'
      anomalyScore = Math.min(100, ((point.overall - thresholds.highUpper) / thresholds.highUpper) * 100)
    } else if (point.overall < thresholds.lowLower) {
      isAnomalous = true
      anomalyType = 'low'
      anomalyScore = Math.min(100, ((thresholds.lowLower - point.overall) / thresholds.lowLower) * 100)
    } else if (stdDev > 0) {
      const deviation = Math.abs(point.overall - avgOverall) / stdDev
      if (deviation > thresholds.deviationFactor) {
        isAnomalous = true
        anomalyType = point.overall > avgOverall ? 'high' : 'low'
        anomalyScore = Math.min(100, ((deviation - thresholds.deviationFactor) / thresholds.deviationFactor) * 100)
      }
    }

    return {
      sceneIndex: point.sceneIndex,
      sceneLabel: label,
      vector: point.vector,
      overall: point.overall,
      isAnomalous,
      anomalyType,
      anomalyScore: Math.round(anomalyScore)
    }
  })

  const maxValue = Math.max(...rows.map(r => r.overall))
  const minValue = Math.min(...rows.map(r => r.overall))

  return {
    rows,
    columns: [...DIMENSIONS],
    maxValue,
    minValue,
    avgValue: Math.round(avgOverall)
  }
}

// ============================================================
// ANOMALY REGION DETECTOR
// ============================================================

/**
 * Detect consecutive anomalous regions in the heatmap
 */
export function detectAnomalyRegions(
  heatmap: Heatmap2D,
  thresholds: DensityThresholds = DEFAULT_DENSITY_THRESHOLDS,
  minConsecutive: number = 2
): AnomalyRegion[] {
  const regions: AnomalyRegion[] = []
  let consecutiveAnomalous: HeatmapRow[] = []

  for (const row of heatmap.rows) {
    if (row.isAnomalous) {
      consecutiveAnomalous.push(row)
    } else {
      if (consecutiveAnomalous.length >= minConsecutive) {
        const region = createAnomalyRegion(consecutiveAnomalous, thresholds)
        regions.push(region)
      }
      consecutiveAnomalous = []
    }
  }

  // Handle trailing anomalies
  if (consecutiveAnomalous.length >= minConsecutive) {
    const region = createAnomalyRegion(consecutiveAnomalous, thresholds)
    regions.push(region)
  }

  return regions
}

function createAnomalyRegion(rows: HeatmapRow[], thresholds: DensityThresholds): AnomalyRegion {
  const startScene = rows[0].sceneIndex
  const endScene = rows[rows.length - 1].sceneIndex
  const avgDensity = Math.round(rows.reduce((sum, r) => sum + r.overall, 0) / rows.length)

  // Determine region type based on majority
  const highCount = rows.filter(r => r.anomalyType === 'high').length
  const lowCount = rows.filter(r => r.anomalyType === 'low').length
  const type: 'high_density' | 'low_density' = highCount >= lowCount ? 'high_density' : 'low_density'

  const severity = Math.round(rows.reduce((sum, r) => sum + r.anomalyScore, 0) / rows.length)

  // Find dominant dimension
  const dimensionAverages: Record<DensityDimension, number> = {
    action: rows.reduce((sum, r) => sum + r.vector.action, 0) / rows.length,
    dialogue: rows.reduce((sum, r) => sum + r.vector.dialogue, 0) / rows.length,
    description: rows.reduce((sum, r) => sum + r.vector.description, 0) / rows.length,
    interior: rows.reduce((sum, r) => sum + r.vector.interior, 0) / rows.length
  }
  let dominantDim: DensityDimension = 'action'
  let maxAvg = -1
  for (const [dim, avg] of Object.entries(dimensionAverages)) {
    if (avg > maxAvg) {
      maxAvg = avg
      dominantDim = dim as DensityDimension
    }
  }

  const description = type === 'high_density'
    ? `High density region (avg: ${avgDensity}) dominated by ${dominantDim} - consider expanding or adding transitions`
    : `Low density region (avg: ${avgDensity}) lacking ${dominantDim} - consider adding more content`

  return {
    startScene,
    endScene,
    type,
    severity: Math.min(100, severity),
    avgDensity,
    dimension: dominantDim,
    description
  }
}

// ============================================================
// ANALYSIS & REPORT GENERATION
// ============================================================

/**
 * Calculate overall health score based on density distribution
 */
export function calculateOverallHealth(points: DensityPoint[], thresholds: DensityThresholds): number {
  if (points.length === 0) return 50

  const overalls = points.map(p => p.overall)
  const avg = overalls.reduce((a, b) => a + b, 0) / overalls.length

  // Optimal range is 40-70
  const optimalMidpoint = 55
  const deviation = Math.abs(avg - optimalMidpoint)
  const healthScore = Math.max(0, 100 - deviation * 2)

  // Penalize if too many anomalies
  const stdDev = Math.sqrt(overalls.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / overalls.length)
  const penalty = Math.min(30, stdDev)

  return Math.round(Math.max(0, Math.min(100, healthScore - penalty)))
}

/**
 * Generate recommendations based on density analysis
 */
export function generateRecommendations(
  heatmap: Heatmap2D,
  anomalies: AnomalyRegion[],
  dimensionBreakdown: DensityAnalysisReport['dimensionBreakdown']
): string[] {
  const recommendations: string[] = []

  if (anomalies.length > 0) {
    const highRegions = anomalies.filter(a => a.type === 'high_density')
    const lowRegions = anomalies.filter(a => a.type === 'low_density')

    if (highRegions.length > 0) {
      recommendations.push(`${highRegions.length} high-density region(s) detected - consider adding scene transitions`)
    }
    if (lowRegions.length > 0) {
      recommendations.push(`${lowRegions.length} low-density region(s) detected - consider expanding scenes`)
    }
  }

  for (const dim of DIMENSIONS) {
    const stats = dimensionBreakdown[dim]
    if (stats.avg < 15) {
      recommendations.push(`Low ${dim} density - consider adding more ${dim} moments`)
    }
    if (stats.avg > 85) {
      recommendations.push(`Very high ${dim} density - balance with other dimensions`)
    }
    if (stats.trend === 'decreasing' && stats.avg < 30) {
      recommendations.push(`${dim} is declining - monitor for insufficient pacing variety`)
    }
    if (stats.trend === 'increasing' && stats.avg > 70) {
      recommendations.push(`${dim} is increasing throughout - ensure balanced narrative`)
    }
  }

  if (heatmap.avgValue < 30) {
    recommendations.push('Overall density is very low - narrative may feel empty or rushed')
  }
  if (heatmap.avgValue > 80) {
    recommendations.push('Overall density is very high - consider slowing down for reader comprehension')
  }

  if (recommendations.length === 0) {
    recommendations.push('Density distribution is healthy - maintain current narrative balance')
  }

  return recommendations
}

/**
 * Perform complete density analysis on scenes
 */
export function analyzeNarrativeDensity(
  scenes: string[],
  sceneLabels?: string[],
  thresholds: DensityThresholds = DEFAULT_DENSITY_THRESHOLDS
): DensityAnalysisReport {
  const labels = sceneLabels || scenes.map((_, i) => `Scene ${i + 1}`)
  const points = calculateSceneDensities(scenes)
  const heatmap = generateHeatmap2D(points, labels, thresholds)
  const anomalies = detectAnomalyRegions(heatmap, thresholds)

  // Calculate dimension breakdowns
  const dimensionBreakdown: Record<DensityDimension, DensityAnalysisReport['dimensionBreakdown'][DensityDimension]> = {} as any
  for (const dim of DIMENSIONS) {
    dimensionBreakdown[dim] = {
      avg: calculateDimensionStats(points, dim).avg,
      stdDev: calculateDimensionStats(points, dim).stdDev,
      trend: calculateDimensionTrend(points, dim)
    }
  }

  const overallHealth = calculateOverallHealth(points, thresholds)
  const recommendations = generateRecommendations(heatmap, anomalies, dimensionBreakdown)

  return {
    heatmap,
    anomalies,
    overallHealth,
    recommendations,
    dimensionBreakdown
  }
}

// ============================================================
// STATE MANAGEMENT
// ============================================================

export function createEmptyDensityState(thresholds?: Partial<DensityThresholds>): NarrativeDensityState {
  return {
    points: [],
    heatmap: null,
    anomalies: [],
    report: null,
    thresholds: { ...DEFAULT_DENSITY_THRESHOLDS, ...thresholds },
    sceneLabels: []
  }
}

export function addDensityPoint(state: NarrativeDensityState, point: DensityPoint, label?: string): NarrativeDensityState {
  const labels = label
    ? [...state.sceneLabels, label]
    : [...state.sceneLabels, `Scene ${state.points.length + 1}`]

  return {
    ...state,
    points: [...state.points, point],
    sceneLabels: labels
  }
}

export function setDensityPoints(
  state: NarrativeDensityState,
  points: DensityPoint[],
  labels?: string[]
): NarrativeDensityState {
  return {
    ...state,
    points,
    sceneLabels: labels || state.sceneLabels.slice(0, points.length)
  }
}

export function runDensityAnalysis(state: NarrativeDensityState): NarrativeDensityState {
  if (state.points.length === 0) return state

  const scenes = state.points.map((_, i) => '')
  const report = analyzeNarrativeDensity(
    scenes,
    state.sceneLabels,
    state.thresholds
  )

  // Rebuild report with actual points
  const fullReport = analyzeNarrativeDensity(
    state.points.map(p => `scene ${p.sceneIndex}`),
    state.sceneLabels,
    state.thresholds
  )

  return {
    ...state,
    heatmap: fullReport.heatmap,
    anomalies: fullReport.anomalies,
    report: fullReport
  }
}

export function updateThresholds(
  state: NarrativeDensityState,
  thresholds: Partial<DensityThresholds>
): NarrativeDensityState {
  return {
    ...state,
    thresholds: { ...state.thresholds, ...thresholds }
  }
}

export function clearDensityState(state: NarrativeDensityState): NarrativeDensityState {
  return createEmptyDensityState(state.thresholds)
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

export function getHeatmapRow(heatmap: Heatmap2D, sceneIndex: number): HeatmapRow | null {
  return heatmap.rows.find(r => r.sceneIndex === sceneIndex) || null
}

export function getAnomaliesInRange(
  anomalies: AnomalyRegion[],
  startScene: number,
  endScene: number
): AnomalyRegion[] {
  return anomalies.filter(
    a => a.startScene >= startScene && a.endScene <= endScene
  )
}

export function getDimensionHeatmapColumn(
  heatmap: Heatmap2D,
  dimension: DensityDimension
): Array<{ sceneIndex: number; value: number }> {
  return heatmap.rows.map(row => ({
    sceneIndex: row.sceneIndex,
    value: row.vector[dimension]
  }))
}

export function findHotspots(heatmap: Heatmap2D, threshold: number = 70): HeatmapRow[] {
  return heatmap.rows.filter(r => r.overall >= threshold)
}

export function findColdspots(heatmap: Heatmap2D, threshold: number = 30): HeatmapRow[] {
  return heatmap.rows.filter(r => r.overall <= threshold)
}