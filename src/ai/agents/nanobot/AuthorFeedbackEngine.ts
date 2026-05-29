/**
 * AuthorFeedbackEngine — V315
 * Explicit and implicit feedback capture, rating patterns, improvement signal extraction.
 * Inspired by: claude-code (feedback), thunderbolt (pipeline feedback loops)
 */

export interface FeedbackEvent {
  timestamp: number
  type: 'rating' | 'correction' | 'skip' | 'revision' | 'highlight' | 'bookmark' | 'comment'
  target?: string       // chapter/scene/paragraph ID
  value: number         // 0-5 for ratings, 0-1 for binary feedback
  context?: string       // narrative context
  sessionId?: string
}

export interface FeedbackPattern {
  patternType: 'improving' | 'declining' | 'stable' | 'oscillating'
  confidence: number    // 0-1
  evidence: string[]
  trend: number         // slope of linear regression
  recentStrength: number // last 5 events average
}

export interface AuthorFeedbackState {
  feedbackHistory: FeedbackEvent[]
  patterns: Map<string, FeedbackPattern>
  sessionFeedback: Map<string, FeedbackEvent[]>
  improvementSignals: Map<string, number> // feature → signal strength 0-1
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): AuthorFeedbackState {
  return {
    feedbackHistory: [],
    patterns: new Map(),
    sessionFeedback: new Map(),
    improvementSignals: new Map(),
    typeAlias: {},
  }
}

// Capture explicit feedback (ratings, comments)
export function captureExplicitFeedback(
  state: AuthorFeedbackState,
  type: FeedbackEvent['type'],
  value: number,
  context?: string,
  sessionId?: string
): AuthorFeedbackState {
  const event: FeedbackEvent = {
    timestamp: Date.now(),
    type,
    value,
    context,
    sessionId,
  }
  return {
    ...state,
    feedbackHistory: [...state.feedbackHistory, event],
    sessionFeedback: sessionId
      ? (() => {
          const existing = state.sessionFeedback.get(sessionId) || []
          const updated = new Map(state.sessionFeedback)
          updated.set(sessionId, [...existing, event])
          return updated
        })()
      : state.sessionFeedback,
  }
}

// Capture implicit feedback (behavior patterns)
export function captureImplicitFeedback(
  state: AuthorFeedbackState,
  type: FeedbackEvent['type'],
  context?: string,
  sessionId?: string
): AuthorFeedbackState {
  // Implicit feedback gets value 0.5 (neutral) or inferred value
  return captureExplicitFeedback(state, type, 0.5, context, sessionId)
}

// Detect feedback patterns for a specific feedback type
export function detectFeedbackPattern(
  state: AuthorFeedbackState,
  feedbackType: FeedbackEvent['type']
): FeedbackPattern | null {
  const events = state.feedbackHistory.filter(e => e.type === feedbackType)
  if (events.length < 3) return null

  const values = events.map(e => e.value)
  const recent = values.slice(-5)
  const recentStrength = recent.reduce((s, v) => s + v, 0) / recent.length

  // Linear regression for trend
  const n = values.length
  const indices = values.map((_, i) => i)
  const sumX = indices.reduce((s, x) => s + x, 0)
  const sumY = values.reduce((s, y) => s + y, 0)
  const sumXY = indices.reduce((s, x, i) => s + x * values[i], 0)
  const sumXX = indices.reduce((s, x) => s + x * x, 0)
  const denom = n * sumXX - sumX * sumX
  const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0

  // Pattern classification
  let patternType: FeedbackPattern['patternType'] = 'stable'
  const absSlope = Math.abs(slope)
  const avg = sumY / n

  if (slope > 0.05) {
    patternType = absSlope > 0.15 ? 'improving' : 'stable'
  } else if (slope < -0.05) {
    patternType = absSlope > 0.15 ? 'declining' : 'stable'
  }

  // Detect oscillation
  let oscillations = 0
  for (let i = 1; i < recent.length; i++) {
    if ((recent[i] > avg && recent[i - 1] <= avg) ||
        (recent[i] < avg && recent[i - 1] >= avg)) {
      oscillations++
    }
  }
  if (oscillations >= 3) patternType = 'oscillating'

  const evidence: string[] = []
  if (patternType === 'improving') {
    evidence.push(`Trend slope: +${slope.toFixed(3)}`)
    evidence.push(`Recent avg: ${recentStrength.toFixed(2)} vs overall ${avg.toFixed(2)}`)
  } else if (patternType === 'declining') {
    evidence.push(`Trend slope: ${slope.toFixed(3)}`)
    evidence.push(`Recent avg: ${recentStrength.toFixed(2)} vs overall ${avg.toFixed(2)}`)
  } else if (patternType === 'oscillating') {
    evidence.push(`${oscillations} direction changes in recent events`)
  }

  return {
    patternType,
    confidence: Math.min(1, events.length / 10),
    evidence,
    trend: slope,
    recentStrength,
  }
}

// Extract improvement signals from feedback
export function extractImprovementSignals(
  state: AuthorFeedbackState,
  featureScope: string = 'general'
): Map<string, number> {
  const signals = new Map<string, number>()

  const feedbackTypes: FeedbackEvent['type'][] = [
    'rating', 'correction', 'revision', 'highlight'
  ]

  for (const ftype of feedbackTypes) {
    const pattern = detectFeedbackPattern(state, ftype)
    if (pattern) {
      // Signal strength based on confidence and trend direction
      const baseStrength = pattern.confidence
      const trendBonus = pattern.patternType === 'improving'
        ? 0.2
        : pattern.patternType === 'declining'
          ? -0.2
          : 0
      const signal = Math.max(0, Math.min(1, baseStrength + trendBonus))
      signals.set(`${featureScope}.${ftype}`, signal)
    }
  }

  return signals
}

// Get improvement recommendations based on feedback patterns
export function getImprovementRecommendations(
  state: AuthorFeedbackState,
  topK: number = 3
): string[] {
  const recommendations: { feature: string; signal: number }[] = []

  for (const [feature, signal] of Array.from(state.improvementSignals.entries())) {
    if (signal < 0.6) {
      recommendations.push({ feature, signal })
    }
  }

  recommendations.sort((a, b) => a.signal - b.signal)
  return recommendations.slice(0, topK).map(r => r.feature)
}

// Get feedback summary for a session
export function getSessionFeedbackSummary(
  state: AuthorFeedbackState,
  sessionId: string
): {
  totalEvents: number
  averageValue: number
  dominantType: FeedbackEvent['type'] | null
  patterns: string[]
} {
  const events = state.sessionFeedback.get(sessionId) || []
  if (events.length === 0) {
    return { totalEvents: 0, averageValue: 0, dominantType: null, patterns: [] }
  }

  const averageValue = events.reduce((s, e) => s + e.value, 0) / events.length

  const typeCounts = new Map<FeedbackEvent['type'], number>()
  for (const e of events) {
    typeCounts.set(e.type, (typeCounts.get(e.type) || 0) + 1)
  }
  let dominantType: FeedbackEvent['type'] | null = null
  let maxCount = 0
  for (const [t, count] of typeCounts.entries()) {
    if (count > maxCount) {
      maxCount = count
      dominantType = t
    }
  }

  const patterns: string[] = []
  const pattern = detectFeedbackPattern(state, dominantType || 'rating')
  if (pattern) {
    patterns.push(`${pattern.patternType} (confidence: ${(pattern.confidence * 100).toFixed(0)}%)`)
  }

  return {
    totalEvents: events.length,
    averageValue,
    dominantType,
    patterns,
  }
}

// Calculate feedback quality score
export function calculateFeedbackQuality(
  state: AuthorFeedbackState,
  recentN: number = 20
): number {
  const recent = state.feedbackHistory.slice(-recentN)
  if (recent.length === 0) return 0

  // Quality based on: diversity of feedback types, consistency, recency
  const typeSet = new Set(recent.map(e => e.type))
  const diversity = typeSet.size / 6 // 6 types max

  // Variance in values
  const avg = recent.reduce((s, e) => s + e.value, 0) / recent.length
  const variance = recent.reduce((s, e) => s + Math.pow(e.value - avg, 2), 0) / recent.length
  const consistency = 1 - Math.min(1, Math.sqrt(variance) / 2)

  // Recency weight (more recent = higher quality signal)
  const now = Date.now()
  const avgAge = recent.reduce((s, e) => s + (now - e.timestamp), 0) / recent.length
  const recency = Math.max(0, 1 - avgAge / (7 * 24 * 60 * 60 * 1000)) // 7 day window

  return Math.round((diversity * 0.3 + consistency * 0.4 + recency * 0.3) * 100)
}

// Update patterns for all feedback types
export function updatePatterns(state: AuthorFeedbackState): AuthorFeedbackState {
  const feedbackTypes: FeedbackEvent['type'][] = [
    'rating', 'correction', 'skip', 'revision', 'highlight', 'bookmark', 'comment'
  ]

  const newPatterns = new Map(state.patterns)
  for (const ftype of feedbackTypes) {
    const pattern = detectFeedbackPattern(state, ftype)
    if (pattern) {
      newPatterns.set(ftype, pattern)
    }
  }

  return { ...state, patterns: newPatterns }
}

// Merge feedback from multiple sessions
export function mergeSessionFeedback(
  targetState: AuthorFeedbackState,
  sourceStates: AuthorFeedbackState[]
): AuthorFeedbackState {
  let merged = { ...targetState }

  for (const src of sourceStates) {
    merged = {
      ...merged,
      feedbackHistory: [...merged.feedbackHistory, ...src.feedbackHistory],
    }
  }

  // Rebuild session feedback maps
  const sessionFeedback = new Map<string, FeedbackEvent[]>()
  for (const src of sourceStates) {
    for (const [sid, events] of Array.from(src.sessionFeedback.entries())) {
      const existing = sessionFeedback.get(sid) || []
      sessionFeedback.set(sid, [...existing, ...events])
    }
  }

  return {
    ...merged,
    sessionFeedback: new Map([...Array.from(merged.sessionFeedback.entries()), ...Array.from(sessionFeedback.entries())]),
  }
}
