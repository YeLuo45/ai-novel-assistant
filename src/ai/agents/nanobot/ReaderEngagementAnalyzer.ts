/**
 * ReaderEngagementAnalyzer — V329
 * Real-time reader engagement tracking, attention patterns, drop-off detection.
 * Inspired by: thunderbolt (real-time feedback), chatdev (role-based analysis)
 */

export interface EngagementMetrics {
  attentionScore: number    // 0-100 current reader attention
  retentionRate: number     // 0-1 will continue reading
  scrollDepth: number       // 0-1 how far they scrolled
  interactionRate: number  // interactions per minute
  sentimentScore: number    // -1 to 1 reader sentiment
}

export interface AttentionSegment {
  segmentId: string
  startPosition: number
  endPosition: number
  avgAttention: number
  peakAttention: number
  dropOffPoint?: number
  reReadCount: number      // times reader went back
}

export interface DropOffPattern {
  chapterId: string
  position: number
  severity: 'mild' | 'moderate' | 'severe'
  likelyCause: string
  suggestions: string[]
}

export interface ReaderEngagementState {
  currentMetrics: EngagementMetrics
  attentionHistory: { timestamp: number; score: number }[]
  attentionSegments: Map<string, AttentionSegment>
  dropOffPatterns: DropOffPattern[]
  engagementBaseline: number
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): ReaderEngagementState {
  return {
    currentMetrics: {
      attentionScore: 70,
      retentionRate: 0.8,
      scrollDepth: 0,
      interactionRate: 0,
      sentimentScore: 0,
    },
    attentionHistory: [],
    attentionSegments: new Map(),
    dropOffPatterns: [],
    engagementBaseline: 70,
    typeAlias: {},
  }
}

// Update engagement metrics from reader behavior
export function updateEngagementMetrics(
  state: ReaderEngagementState,
  scrollDepth: number,
  interactionRate: number,
  sentiment: number,
  avgTimeOnPage: number
): ReaderEngagementState {
  // Calculate attention from multiple signals
  const scrollWeight = 0.3
  const interactionWeight = 0.3
  const sentimentWeight = 0.2
  const timeWeight = 0.2

  const timeScore = avgTimeOnPage > 30 ? 100 : (avgTimeOnPage / 30) * 100

  const attentionScore = Math.round(
    scrollDepth * 100 * scrollWeight +
    Math.min(interactionRate / 5, 1) * 100 * interactionWeight +
    ((sentiment + 1) / 2) * 100 * sentimentWeight +
    timeScore * timeWeight
  )

  const retentionRate = attentionScore > 60 ? 0.9 : attentionScore > 40 ? 0.7 : 0.4

  const metrics: EngagementMetrics = {
    attentionScore,
    retentionRate,
    scrollDepth,
    interactionRate,
    sentimentScore: sentiment,
  }

  const updatedHistory = [
    ...state.attentionHistory.slice(-29),
    { timestamp: Date.now(), score: attentionScore },
  ]

  return {
    ...state,
    currentMetrics: metrics,
    attentionHistory: updatedHistory,
  }
}

// Record attention for a segment
export function recordAttentionSegment(
  state: ReaderEngagementState,
  segmentId: string,
  startPosition: number,
  endPosition: number,
  peakAttention: number,
  reReadCount: number = 0
): ReaderEngagementState {
  const avgHistory = state.attentionHistory.length > 0
    ? state.attentionHistory.reduce((s, h) => s + h.score, 0) / state.attentionHistory.length
    : state.engagementBaseline

  const segment: AttentionSegment = {
    segmentId,
    startPosition,
    endPosition,
    avgAttention: avgHistory,
    peakAttention,
    reReadCount,
  }

  const newSegments = new Map(state.attentionSegments)
  newSegments.set(segmentId, segment)

  return { ...state, attentionSegments: newSegments }
}

// Detect drop-off pattern
export function detectDropOff(
  state: ReaderEngagementState,
  chapterId: string,
  position: number
): DropOffPattern | null {
  const recentHistory = state.attentionHistory.slice(-5)
  if (recentHistory.length < 3) return null

  const avg = recentHistory.reduce((s, h) => s + h.score, 0) / recentHistory.length
  if (avg > 50) return null  // no significant drop

  let severity: DropOffPattern['severity']
  let likelyCause: string
  let suggestions: string[]

  if (avg < 20) {
    severity = 'severe'
    likelyCause = 'Content likely too dense or confusing at this point'
    suggestions = ['Simplify sentences', 'Add dialogue to break up exposition', 'Check for technical jargon']
  } else if (avg < 35) {
    severity = 'moderate'
    likelyCause = 'Reader attention dropped significantly'
    suggestions = ['Add scene break', 'Introduce a character reaction', 'Consider shorter paragraphs']
  } else {
    severity = 'mild'
    likelyCause = 'Minor attention dip - possibly natural reading rhythm'
    suggestions = ['Monitor but no immediate action needed']
  }

  const pattern: DropOffPattern = { chapterId, position, severity, likelyCause, suggestions }
  return pattern
}

// Record drop-off pattern
export function recordDropOff(
  state: ReaderEngagementState,
  pattern: DropOffPattern
): ReaderEngagementState {
  return {
    ...state,
    dropOffPatterns: [...state.dropOffPatterns, pattern].slice(-20),
  }
}

// Analyze attention trend
export function analyzeAttentionTrend(
  state: ReaderEngagementState,
  windowSize: number = 10
): {
  trend: 'improving' | 'stable' | 'declining'
  changeRate: number
  prediction: string
} {
  const history = state.attentionHistory.slice(-windowSize)
  if (history.length < 3) {
    return { trend: 'stable', changeRate: 0, prediction: 'Insufficient data for trend analysis' }
  }

  const first = history[0].score
  const last = history[history.length - 1].score
  const changeRate = (last - first) / history.length

  let trend: 'improving' | 'stable' | 'declining'
  if (changeRate > 1) trend = 'improving'
  else if (changeRate < -1) trend = 'declining'
  else trend = 'stable'

  let prediction: string
  if (trend === 'declining' && last < 40) {
    prediction = 'Engagement likely to continue dropping without intervention'
  } else if (trend === 'improving' && last > 80) {
    prediction = 'Strong engagement - reader is highly absorbed'
  } else {
    prediction = 'Engagement expected to remain stable'
  }

  return { trend, changeRate, prediction }
}

// Compare with baseline
export function compareWithBaseline(
  state: ReaderEngagementState
): {
  vsBaseline: number    // difference from baseline
  percentOfBaseline: number
  status: 'above' | 'at' | 'below'
} {
  const current = state.currentMetrics.attentionScore
  const baseline = state.engagementBaseline
  const vsBaseline = current - baseline
  const percentOfBaseline = Math.round((current / baseline) * 100)
  const status: 'above' | 'at' | 'below' = vsBaseline > 5 ? 'above' : vsBaseline < -5 ? 'below' : 'at'

  return { vsBaseline, percentOfBaseline, status }
}

// Get engagement summary
export function getEngagementSummary(
  state: ReaderEngagementState
): {
  currentScore: number
  trend: string
  retentionRisk: boolean
  topIssue: string | null
  recommendation: string
} {
  const trend = analyzeAttentionTrend(state)
  const baseline = compareWithBaseline(state)
  
  let retentionRisk = false
  if (state.currentMetrics.retentionRate < 0.6) retentionRisk = true
  if (baseline.status === 'below') retentionRisk = true

  let topIssue: string | null = null
  if (state.dropOffPatterns.length > 0) {
    const severe = state.dropOffPatterns.find(p => p.severity === 'severe')
    if (severe) topIssue = severe.likelyCause
  }

  let recommendation: string
  if (retentionRisk && topIssue) {
    recommendation = `High risk: ${topIssue}. Consider: ${state.dropOffPatterns[state.dropOffPatterns.length - 1]?.suggestions[0] || 'review content at drop-off points'}`
  } else if (trend.trend === 'declining') {
    recommendation = 'Attention declining. Add engaging elements or reduce complexity.'
  } else if (baseline.status === 'above') {
    recommendation = 'Above baseline engagement. Maintain current pacing and style.'
  } else {
    recommendation = 'Engagement stable. Continue monitoring.'
  }

  return {
    currentScore: state.currentMetrics.attentionScore,
    trend: trend.trend,
    retentionRisk,
    topIssue,
    recommendation,
  }
}

// Detect engagement anomaly
export function detectEngagementAnomaly(
  state: ReaderEngagementState
): { anomaly: boolean; type: string | null; details: string } {
  const recent = state.attentionHistory.slice(-10)
  if (recent.length < 5) return { anomaly: false, type: null, details: '' }

  // Calculate standard deviation
  const mean = recent.reduce((s, h) => s + h.score, 0) / recent.length
  const variance = recent.reduce((s, h) => s + Math.pow(h.score - mean, 2), 0) / recent.length
  const stdDev = Math.sqrt(variance)

  if (stdDev > 20) {
    return {
      anomaly: true,
      type: 'high_variance',
      details: `Attention scores fluctuating wildly (std dev: ${Math.round(stdDev)}). May indicate inconsistent content quality.`,
    }
  }

  // Check for sudden drop
  if (recent.length >= 3) {
    const last = recent[recent.length - 1].score
    const prev = recent[recent.length - 2].score
    if (last < prev - 30) {
      return {
        anomaly: true,
        type: 'sudden_drop',
        details: `Sudden attention drop from ${prev} to ${last}. Check recent content for issues.`,
      }
    }
  }

  return { anomaly: false, type: null, details: '' }
}

// Get attention heatmap data
export function getAttentionHeatmapData(
  state: ReaderEngagementState
): { position: number; attention: number; isDropOff: boolean }[] {
  const result: { position: number; attention: number; isDropOff: boolean }[] = []

  for (const [id, segment] of state.attentionSegments) {
    const dropOff = state.dropOffPatterns.find(p => p.chapterId === id.split(':')[0])
    result.push({
      position: segment.startPosition,
      attention: segment.avgAttention,
      isDropOff: !!dropOff,
    })
  }

  return result.sort((a, b) => a.position - b.position)
}
