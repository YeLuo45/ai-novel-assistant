/**
 * Quality V2 Types - V58
 * Types for Feedback Network, Adaptive Quality Engine, and Retention Predictor
 */

export type QualityDimension = 'coherence' | 'expression' | 'creativity' | 'structure' | 'engagement'
export type RhythmPace = 'slow' | 'normal' | 'fast'
export type RiskLevel = 'low' | 'medium' | 'high'

export interface Suggestion {
  type: 'replace' | 'insert' | 'delete' | 'improve'
  text: string
  position: { start: number; end: number }
  reason: string
  priority: number  // 1-5, higher = more important
}

export interface FeedbackResult {
  agentId: string
  dimension: QualityDimension
  score: number          // 0-1
  suggestions: Suggestion[]
  confidence: number    // 0-1
  timestamp: number
}

export interface RhythmBreak {
  position: number
  type: 'pause' | 'rush' | 'skip'
  severity: 'minor' | 'major' | 'critical'
  description: string
}

export interface RhythmAnalysis {
  currentPace: RhythmPace
  rhythmScore: number
  breaks: RhythmBreak[]
  immersionLevel: number  // 0-1
  averageWordPerMinute: number
  peakPace: RhythmPace
  normalWordPerMinute: number
}

export interface RetentionPrediction {
  paragraphId: string
  retentionScore: number  // 0-1
  riskLevel: RiskLevel
  factors: string[]
  improvement: string
  startIndex: number
  endIndex: number
}

export interface AggregatedFeedback {
  dimension: QualityDimension
  averageScore: number
  topSuggestions: Suggestion[]
  confidence: number
  agentCount: number
}

export interface QualityTrend {
  dimension: QualityDimension
  scores: number[]
  trend: 'improving' | 'stable' | 'declining'
  delta: number
}

/**
 * Aggregate multiple feedback results for a dimension
 */
export function aggregateFeedback(results: FeedbackResult[]): AggregatedFeedback[] {
  const byDimension = new Map<QualityDimension, FeedbackResult[]>()

  for (const r of results) {
    if (!byDimension.has(r.dimension)) byDimension.set(r.dimension, [])
    byDimension.get(r.dimension)!.push(r)
  }

  const aggregated: AggregatedFeedback[] = []

  for (const [dim, dimResults] of byDimension) {
    const scores = dimResults.map(r => r.score)
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length

    // Collect top suggestions (sorted by priority)
    const allSuggestions: (Suggestion & { score: number })[] = []
    for (const r of dimResults) {
      for (const s of r.suggestions) {
        allSuggestions.push({ ...s, score: r.score })
      }
    }
    allSuggestions.sort((a, b) => b.priority - a.priority)
    const topSuggestions = allSuggestions.slice(0, 5).map(({ score: _s, ...s }) => s)

    // Confidence: average of agent confidences
    const confidence = dimResults.reduce((a, b) => a + b.confidence, 0) / dimResults.length

    aggregated.push({
      dimension: dim,
      averageScore: Math.round(averageScore * 100) / 100,
      topSuggestions,
      confidence: Math.round(confidence * 100) / 100,
      agentCount: dimResults.length
    })
  }

  return aggregated.sort((a, b) => b.averageScore - a.averageScore)
}

/**
 * Detect rhythm from word-per-minute data points
 */
export function detectRhythm(wpmHistory: number[]): RhythmAnalysis {
  if (wpmHistory.length === 0) {
    return {
      currentPace: 'normal',
      rhythmScore: 0.5,
      breaks: [],
      immersionLevel: 0.5,
      averageWordPerMinute: 0,
      peakPace: 'normal',
      normalWordPerMinute: 50
    }
  }

  const sum = wpmHistory.reduce((a, b) => a + b, 0)
  const averageWPM = sum / wpmHistory.length

  // Determine current pace (last 5 data points)
  const recent = wpmHistory.slice(-5)
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length

  let currentPace: RhythmPace = 'normal'
  if (recentAvg < averageWPM * 0.7) currentPace = 'slow'
  else if (recentAvg > averageWPM * 1.3) currentPace = 'fast'

  // Detect breaks
  const breaks: RhythmBreak[] = []
  for (let i = 1; i < wpmHistory.length; i++) {
    const ratio = wpmHistory[i] / (wpmHistory[i - 1] || 1)
    if (ratio < 0.3) {
      breaks.push({
        position: i,
        type: ratio < 0.1 ? 'skip' : 'pause',
        severity: ratio < 0.1 ? 'critical' : ratio < 0.2 ? 'major' : 'minor',
        description: `Sudden drop from ${wpmHistory[i - 1].toFixed(0)} to ${wpmHistory[i].toFixed(0)} WPM`
      })
    } else if (ratio > 3) {
      breaks.push({
        position: i,
        type: 'rush',
        severity: ratio > 5 ? 'major' : 'minor',
        description: `Rapid acceleration from ${wpmHistory[i - 1].toFixed(0)} to ${wpmHistory[i].toFixed(0)} WPM`
      })
    }
  }

  // Calculate rhythm score
  const variance = wpmHistory.reduce((acc, wpm) => acc + Math.pow(wpm - averageWPM, 2), 0) / wpmHistory.length
  const stdDev = Math.sqrt(variance)
  const coeffVariation = stdDev / (averageWPM || 1)
  const rhythmScore = Math.max(0, Math.min(1, 1 - coeffVariation))

  // Immersion level (higher is better, inverse of break severity)
  const breakScore = breaks.reduce((acc, b) => {
    switch (b.severity) {
      case 'critical': return acc - 0.3
      case 'major': return acc - 0.15
      case 'minor': return acc - 0.05
      default: return acc
    }
  }, 1)
  const immersionLevel = Math.max(0, breakScore)

  return {
    currentPace,
    rhythmScore: Math.round(rhythmScore * 100) / 100,
    breaks,
    immersionLevel: Math.round(immersionLevel * 100) / 100,
    averageWordPerMinute: Math.round(averageWPM),
    peakPace: currentPace,
    normalWordPerMinute: 50
  }
}

/**
 * Predict reader retention for a paragraph
 */
export function predictRetention(
  paragraphText: string,
  metrics: { coherence: number; engagement: number; pace: number }
): RetentionPrediction {
  const factors: string[] = []
  let retentionScore = 0.5

  // Text length factor
  const wordCount = paragraphText.split(/\s+/).length
  if (wordCount < 20) {
    factors.push('段落过短，可能缺乏深度')
    retentionScore -= 0.1
  } else if (wordCount > 300) {
    factors.push('段落过长，阅读疲劳风险')
    retentionScore -= 0.15
  } else {
    retentionScore += 0.1
  }

  // Coherence factor
  if (metrics.coherence < 0.4) {
    factors.push('连贯性不足')
    retentionScore -= 0.2
  } else if (metrics.coherence > 0.7) {
    retentionScore += 0.15
  }

  // Engagement factor
  if (metrics.engagement < 0.5) {
    factors.push('吸引力不足')
    retentionScore -= 0.15
  } else {
    retentionScore += 0.1
  }

  // Pace factor
  if (metrics.pace < 0.4) {
    factors.push('节奏过慢')
    retentionScore -= 0.1
  } else if (metrics.pace > 0.8) {
    factors.push('节奏过快')
    retentionScore -= 0.05
  } else {
    retentionScore += 0.1
  }

  retentionScore = Math.max(0, Math.min(1, retentionScore))

  let riskLevel: RiskLevel = 'low'
  if (retentionScore < 0.4) riskLevel = 'high'
  else if (retentionScore < 0.6) riskLevel = 'medium'

  const improvement = riskLevel === 'high'
    ? '建议拆分段落，增加过渡句，提高连贯性'
    : riskLevel === 'medium'
    ? '可适当增加情感描写或冲突元素'
    : '保持当前写作质量'

  return {
    paragraphId: `p_${hashCode(paragraphText)}`,
    retentionScore: Math.round(retentionScore * 100) / 100,
    riskLevel,
    factors,
    improvement,
    startIndex: 0,
    endIndex: paragraphText.length
  }
}

/**
 * Simple hash for paragraph ID
 */
function hashCode(text: string): number {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

/**
 * Calculate quality trend over time
 */
export function calculateQualityTrend(scores: number[]): QualityTrend {
  if (scores.length < 2) {
    return { dimension: 'coherence', scores, trend: 'stable', delta: 0 }
  }

  // Linear regression for trend
  const n = scores.length
  const xSum = (n * (n - 1)) / 2
  const ySum = scores.reduce((a, b) => a + b, 0)
  const xySum = scores.reduce((acc, y, x) => acc + x * y, 0)
  const xxSum = (n * (n - 1) * (2 * n - 1)) / 6

  const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum)
  const delta = slope * 10  // Normalize

  let trend: 'improving' | 'stable' | 'declining'
  if (delta > 0.05) trend = 'improving'
  else if (delta < -0.05) trend = 'declining'
  else trend = 'stable'

  return {
    dimension: 'coherence',
    scores,
    trend,
    delta: Math.round(delta * 100) / 100
  }
}