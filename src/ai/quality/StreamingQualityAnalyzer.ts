/**
 * StreamingQualityAnalyzer - V108
 * Advanced Streaming Quality Analysis Engine with Real-Time Sentence-Level Tracking
 * 
 * Inspired by:
 * - thunderbolt: pipeline architecture + real-time feedback loops
 * - generic-agent: autonomous goal pursuit with self-monitoring
 * - chatdev: multi-agent coordination for quality assessment roles
 * 
 * Features:
 * - Real-time sentence-level quality tracking during streaming
 * - Writing quality trend analysis with peak/trough detection
 * - Per-sentence quality score history with rolling statistics
 * - Quality momentum detection (improving vs degrading)
 * - Anomaly detection for sudden quality drops
 */

import type { WritingSessionState } from '../session/WritingSessionManager'

// =============================================================================
// Types
// =============================================================================

export interface SentenceQuality {
  sentenceId: string
  text: string
  startOffset: number
  endOffset: number
  qualityScore: number      // 0-100
  qualityGrade: QualityGrade
  issues: QualityIssue[]
  timestamp: number
}

export type QualityGrade = 'excellent' | 'good' | 'acceptable' | 'poor'

export interface QualityIssue {
  type: QualityIssueType
  severity: 'critical' | 'warning' | 'info'
  description: string
  position: number
  length: number
  suggestion?: string
}

export type QualityIssueType =
  | 'grammar' | 'spelling' | 'punctuation' | 'capitalization'
  | 'wordiness' | 'redundancy' | 'clarity' | 'coherence'
  | 'dialogue_tag' | 'passive_voice' | 'filter_word'
  | 'telling' | 'adverb_overuse' | 'sentence_length'

export interface QualityTrend {
  direction: 'improving' | 'stable' | 'degrading'
  slope: number            // quality points per sentence
  confidence: number        // 0-1
  peakSentenceId: string | null
  troughSentenceId: string | null
  averageQuality: number
}

export interface QualityMomentum {
  current: number          // current momentum score
  previous: number         // previous momentum
  isAccelerating: boolean
  isDecelerating: boolean
  consecutiveImproving: number
  consecutiveDeclining: number
}

export interface QualityAnomaly {
  sentenceId: string
  qualityDrop: number       // drop from previous
  expectedQuality: number
  actualQuality: number
  severity: 'mild' | 'moderate' | 'severe'
}

export interface StreamingQualityAnalyzerState {
  sessionId: string
  sentenceHistory: SentenceQuality[]
  qualityTrends: Map<string, QualityTrend>  // keyed by chapter
  anomalies: QualityAnomaly[]
  lastAnalyzedOffset: number
  totalSentencesAnalyzed: number
}

export interface QualityAnalysisConfig {
  rollingWindowSize: number         // sentences to consider for trends (default: 10)
  momentumWindowSize: number        // sentences for momentum calc (default: 5)
  anomalyThreshold: number          // quality drop to flag as anomaly (default: 20)
  peakThreshold: number             // quality score for peak (default: 85)
  troughThreshold: number           // quality score for trough (default: 40)
  minConfidenceForTrend: number     // minimum confidence for trend detection (default: 0.6)
  maxSentenceLength: number         // max chars per sentence before warning (default: 200)
  qualityGrades: {
    excellent: number
    good: number
    acceptable: number
  }
}

export const DEFAULT_QUALITY_ANALYSIS_CONFIG: QualityAnalysisConfig = {
  rollingWindowSize: 10,
  momentumWindowSize: 5,
  anomalyThreshold: 20,
  peakThreshold: 85,
  troughThreshold: 40,
  minConfidenceForTrend: 0.6,
  maxSentenceLength: 200,
  qualityGrades: {
    excellent: 90,
    good: 70,
    acceptable: 50,
  },
}

// =============================================================================
// Quality Grade Helpers
// =============================================================================

export function getQualityGrade(score: number, config: QualityAnalysisConfig): QualityGrade {
  if (score >= config.qualityGrades.excellent) return 'excellent'
  if (score >= config.qualityGrades.good) return 'good'
  if (score >= config.qualityGrades.acceptable) return 'acceptable'
  return 'poor'
}

// =============================================================================
// Sentence Quality Analysis
// =============================================================================

export function analyzeSentenceQuality(
  text: string,
  sentenceId: string,
  startOffset: number,
  endOffset: number,
  config: QualityAnalysisConfig = DEFAULT_QUALITY_ANALYSIS_CONFIG
): SentenceQuality {
  const issues: QualityIssue[] = []

  // Check sentence length
  if (text.length > config.maxSentenceLength) {
    issues.push({
      type: 'sentence_length',
      severity: 'warning',
      description: `Sentence is ${text.length} characters (recommended max: ${config.maxSentenceLength})`,
      position: startOffset,
      length: text.length,
      suggestion: 'Consider breaking this sentence into shorter sentences',
    })
  }

  // Check for filter words (common "telling" indicators)
  const filterWords = ['felt', 'felt like', 'seemed', 'looked', 'appeared', 'was feeling', 'were feeling']
  for (const word of filterWords) {
    if (text.toLowerCase().includes(word)) {
      issues.push({
        type: 'filter_word',
        severity: 'warning',
        description: `Filter word detected: "${word}"`,
        position: text.toLowerCase().indexOf(word) + startOffset,
        length: word.length,
        suggestion: 'Show the emotion through action or physical description instead',
      })
    }
  }

  // Check for adverb overuse
  const adverbs = text.match(/\b\w+ly\b/g) || []
  if (adverbs.length > 3) {
    issues.push({
      type: 'adverb_overuse',
      severity: 'info',
      description: `${adverbs.length} adverbs found - consider reducing`,
      position: startOffset,
      length: text.length,
      suggestion: 'Replace adverbs with stronger verbs',
    })
  }

  // Check passive voice (simple heuristic)
  if (/\b(was|were|been|being)\s+\w+ed\b/i.test(text)) {
    issues.push({
      type: 'passive_voice',
      severity: 'info',
      description: 'Possible passive voice detected',
      position: startOffset,
      length: text.length,
      suggestion: 'Consider using active voice',
    })
  }

  // Check dialogue tags (said, asked, etc.)
  const dialogueTagMatch = text.match(/said|asked|replied|whispered|shouted|exclaimed/i)
  if (dialogueTagMatch) {
    issues.push({
      type: 'dialogue_tag',
      severity: 'info',
      description: `Dialogue tag "${dialogueTagMatch[0]}" could be stronger`,
      position: dialogueTagMatch.index! + startOffset,
      length: dialogueTagMatch[0].length,
      suggestion: 'Use action beats or vary the tags',
    })
  }

  // Calculate quality score based on issues
  let qualityScore = 100
  for (const issue of issues) {
    if (issue.severity === 'critical') qualityScore -= 20
    else if (issue.severity === 'warning') qualityScore -= 10
    else if (issue.severity === 'info') qualityScore -= 5
  }
  qualityScore = Math.max(0, qualityScore)

  return {
    sentenceId,
    text,
    startOffset,
    endOffset,
    qualityScore,
    qualityGrade: getQualityGrade(qualityScore, config),
    issues,
    timestamp: Date.now(),
  }
}

// =============================================================================
// Trend Analysis
// =============================================================================

export function calculateQualityTrend(
  history: SentenceQuality[],
  config: QualityAnalysisConfig = DEFAULT_QUALITY_ANALYSIS_CONFIG
): QualityTrend {
  if (history.length < 3) {
    return {
      direction: 'stable',
      slope: 0,
      confidence: 0,
      peakSentenceId: null,
      troughSentenceId: null,
      averageQuality: history.length > 0
        ? history.reduce((s, h) => s + h.qualityScore, 0) / history.length
        : 50,
    }
  }

  const window = history.slice(-config.rollingWindowSize)
  const n = window.length

  // Simple linear regression for slope
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  for (let i = 0; i < n; i++) {
    sumX += i
    sumY += window[i].qualityScore
    sumXY += i * window[i].qualityScore
    sumX2 += i * i
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const avgQuality = sumY / n

  // Calculate confidence (R² proxy)
  const yMean = avgQuality
  let ssTot = 0, ssRes = 0
  for (let i = 0; i < n; i++) {
    ssTot += Math.pow(window[i].qualityScore - yMean, 2)
    ssRes += Math.pow(window[i].qualityScore - (slope * i + yMean), 2)
  }
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0
  const confidence = Math.max(0, Math.min(1, rSquared))

  // Find peak and trough
  let peakSentenceId: string | null = null
  let troughSentenceId: string | null = null
  let peakScore = -Infinity
  let troughScore = Infinity

  for (const s of window) {
    if (s.qualityScore > peakScore) {
      peakScore = s.qualityScore
      peakSentenceId = s.sentenceId
    }
    if (s.qualityScore < troughScore) {
      troughScore = s.qualityScore
      troughSentenceId = s.sentenceId
    }
  }

  let direction: 'improving' | 'stable' | 'degrading'
  if (slope > 2 && confidence >= config.minConfidenceForTrend) {
    direction = 'improving'
  } else if (slope < -2 && confidence >= config.minConfidenceForTrend) {
    direction = 'degrading'
  } else {
    direction = 'stable'
  }

  return {
    direction,
    slope,
    confidence,
    peakSentenceId,
    troughSentenceId,
    averageQuality: avgQuality,
  }
}

// =============================================================================
// Momentum Analysis
// =============================================================================

export function calculateQualityMomentum(
  history: SentenceQuality[],
  config: QualityAnalysisConfig = DEFAULT_QUALITY_ANALYSIS_CONFIG
): QualityMomentum {
  if (history.length < 2) {
    return {
      current: 50,
      previous: 50,
      isAccelerating: false,
      isDecelerating: false,
      consecutiveImproving: 0,
      consecutiveDeclining: 0,
    }
  }

  const window = history.slice(-config.momentumWindowSize)
  const recentQuality = window.slice(-2)
  const current = recentQuality[recentQuality.length - 1]?.qualityScore ?? 50
  const previous = recentQuality[0]?.qualityScore ?? current

  // Count consecutive improving/declining
  let consecutiveImproving = 0
  let consecutiveDeclining = 0

  for (let i = history.length - 1; i >= Math.max(0, history.length - 5); i--) {
    if (i === 0) break
    if (history[i].qualityScore > history[i - 1].qualityScore) {
      consecutiveImproving++
    } else if (history[i].qualityScore < history[i - 1].qualityScore) {
      consecutiveDeclining++
    }
  }

  return {
    current,
    previous,
    isAccelerating: consecutiveImproving >= 3,
    isDecelerating: consecutiveDeclining >= 3,
    consecutiveImproving,
    consecutiveDeclining,
  }
}

// =============================================================================
// Anomaly Detection
// =============================================================================

export function detectQualityAnomalies(
  history: SentenceQuality[],
  config: QualityAnalysisConfig = DEFAULT_QUALITY_ANALYSIS_CONFIG
): QualityAnomaly[] {
  const anomalies: QualityAnomaly[] = []

  if (history.length < 2) return anomalies

  const recent = history.slice(-10)
  for (let i = 1; i < recent.length; i++) {
    const prev = recent[i - 1]
    const curr = recent[i]
    const drop = prev.qualityScore - curr.qualityScore

    if (drop >= config.anomalyThreshold) {
      let severity: 'mild' | 'moderate' | 'severe'
      if (drop >= 40) severity = 'severe'
      else if (drop >= 30) severity = 'moderate'
      else severity = 'mild'

      anomalies.push({
        sentenceId: curr.sentenceId,
        qualityDrop: drop,
        expectedQuality: prev.qualityScore,
        actualQuality: curr.qualityScore,
        severity,
      })
    }
  }

  return anomalies
}

// =============================================================================
// State Management
// =============================================================================

export function createEmptyAnalyzerState(sessionId: string): StreamingQualityAnalyzerState {
  return {
    sessionId,
    sentenceHistory: [],
    qualityTrends: new Map(),
    anomalies: [],
    lastAnalyzedOffset: 0,
    totalSentencesAnalyzed: 0,
  }
}

export function addSentenceQuality(
  state: StreamingQualityAnalyzerState,
  text: string,
  sentenceId: string,
  startOffset: number,
  endOffset: number,
  chapterId: string = 'main',
  config: QualityAnalysisConfig = DEFAULT_QUALITY_ANALYSIS_CONFIG
): StreamingQualityAnalyzerState {
  const quality = analyzeSentenceQuality(text, sentenceId, startOffset, endOffset, config)

  const newHistory = [...state.sentenceHistory, quality]

  // Update trend for chapter
  const trend = calculateQualityTrend(newHistory, config)
  const newTrends = new Map(state.qualityTrends)
  newTrends.set(chapterId, trend)

  // Detect anomalies
  const anomalies = detectQualityAnomalies(newHistory, config)

  return {
    ...state,
    sentenceHistory: newHistory,
    qualityTrends: newTrends,
    anomalies,
    lastAnalyzedOffset: endOffset,
    totalSentencesAnalyzed: state.totalSentencesAnalyzed + 1,
  }
}

// =============================================================================
// Summary and Formatting
// =============================================================================

export function getQualitySummary(state: StreamingQualityAnalyzerState): {
  totalSentences: number
  averageQuality: number
  qualityDistribution: Record<QualityGrade, number>
  trendSummary: string
  momentumSummary: string
  anomalyCount: number
} {
  const totalSentences = state.sentenceHistory.length

  const distribution: Record<QualityGrade, number> = {
    excellent: 0,
    good: 0,
    acceptable: 0,
    poor: 0,
  }

  for (const s of state.sentenceHistory) {
    distribution[s.qualityGrade]++
  }

  const averageQuality = totalSentences > 0
    ? state.sentenceHistory.reduce((s, h) => s + h.qualityScore, 0) / totalSentences
    : 50

  const trend = calculateQualityTrend(state.sentenceHistory)
  const trendSummary = trend.direction === 'improving'
    ? `Improving (${trend.slope.toFixed(1)}/sentence, ${(trend.confidence * 100).toFixed(0)}% confidence)`
    : trend.direction === 'degrading'
    ? `Degrading (${trend.slope.toFixed(1)}/sentence, ${(trend.confidence * 100).toFixed(0)}% confidence)`
    : 'Stable'

  const momentum = calculateQualityMomentum(state.sentenceHistory)
  const momentumSummary = momentum.isAccelerating
    ? 'Accelerating (+momentum)'
    : momentum.isDecelerating
    ? 'Decelerating (-momentum)'
    : 'Steady'

  return {
    totalSentences,
    averageQuality,
    qualityDistribution: distribution,
    trendSummary,
    momentumSummary,
    anomalyCount: state.anomalies.length,
  }
}

export function formatQualityAnalysisReport(state: StreamingQualityAnalyzerState): string {
  const summary = getQualitySummary(state)

  const lines = [
    '=== Streaming Quality Analysis Report ===',
    `Total Sentences: ${summary.totalSentences}`,
    `Average Quality: ${summary.averageQuality.toFixed(1)}`,
    `Quality Distribution:`,
    `  Excellent: ${summary.qualityDistribution.excellent}`,
    `  Good: ${summary.qualityDistribution.good}`,
    `  Acceptable: ${summary.qualityDistribution.acceptable}`,
    `  Poor: ${summary.qualityDistribution.poor}`,
    '',
    `Trend: ${summary.trendSummary}`,
    `Momentum: ${summary.momentumSummary}`,
    `Anomalies Detected: ${summary.anomalyCount}`,
    '',
  ]

  if (state.anomalies.length > 0) {
    lines.push('--- Anomalies ---')
    for (const anomaly of state.anomalies.slice(-5)) {
      lines.push(`[${anomaly.severity.toUpperCase()}] Drop of ${anomaly.qualityDrop.toFixed(0)} pts: ${anomaly.expectedQuality.toFixed(0)} → ${anomaly.actualQuality.toFixed(0)}`)
    }
  }

  return lines.join('\n')
}