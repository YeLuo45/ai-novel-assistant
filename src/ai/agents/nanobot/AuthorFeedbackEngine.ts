/**
 * AuthorFeedbackEngine — V335
 * Author Learning Loop: explicit/implicit feedback capture, rating patterns,
 * improvement tracking, writing behavior analysis.
 * Inspired by: thunderbolt (feedback pipeline), chatdev (analysis agents)
 */

export interface FeedbackEntry {
  timestamp: number
  type: 'explicit' | 'implicit' | 'correction' | 'revision'
  trigger: string
  quality: number        // 0-100
  delta: number         // change from previous
  context: string
}

export interface RatingPattern {
  averageQuality: number
  trend: 'improving' | 'stable' | 'declining'
  variance: number
  recentWindow: number  // avg of last 5
  peakQuality: number
  lowQuality: number
}

export interface ImprovementMetric {
  dimension: string
  beforeScore: number
  afterScore: number
  progress: number       // percentage
  sessionsUsed: number
}

export interface WritingBehavior {
  sessionFrequency: number   // sessions per day
  avgSessionDuration: number // minutes
  revisionRate: number      // revisions per session
  correctionFrequency: number
  preferredTimeSlot: string  // 'morning' | 'afternoon' | 'evening' | 'night'
  avgQualityByTimeSlot: Record<string, number>
}

export interface AuthorFeedbackState {
  entries: FeedbackEntry[]
  ratingPattern: RatingPattern | null
  improvements: ImprovementMetric[]
  behavior: WritingBehavior | null
  recentCorrections: string[]
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): AuthorFeedbackState {
  return {
    entries: [],
    ratingPattern: null,
    improvements: [],
    behavior: null,
    recentCorrections: [],
    typeAlias: {},
  }
}

// Record feedback entry
export function recordFeedback(
  state: AuthorFeedbackState,
  type: FeedbackEntry['type'],
  trigger: string,
  quality: number,
  context: string = ''
): AuthorFeedbackState {
  const prev = state.entries.length > 0 ? state.entries[state.entries.length - 1].quality : quality
  const entry: FeedbackEntry = {
    timestamp: Date.now(),
    type,
    trigger,
    quality,
    delta: quality - prev,
    context,
  }
  return { ...state, entries: [...state.entries, entry] }
}

// Record correction
export function recordCorrection(
  state: AuthorFeedbackState,
  correction: string
): AuthorFeedbackState {
  const recent = [...state.recentCorrections, correction].slice(-20)
  return { ...state, recentCorrections: recent }
}

// Compute rating pattern
export function computeRatingPattern(state: AuthorFeedbackState): AuthorFeedbackState {
  if (state.entries.length === 0) return state

  const qualities = state.entries.map(e => e.quality)
  const avg = qualities.reduce((a, b) => a + b, 0) / qualities.length
  const variance = qualities.reduce((s, q) => s + (q - avg) ** 2, 0) / qualities.length

  let trend: 'improving' | 'stable' | 'declining' = 'stable'
  if (qualities.length >= 5) {
    const first = qualities.slice(0, Math.floor(qualities.length / 2))
    const second = qualities.slice(Math.floor(qualities.length / 2))
    const firstAvg = first.reduce((a, b) => a + b, 0) / first.length
    const secondAvg = second.reduce((a, b) => a + b, 0) / second.length
    if (secondAvg - firstAvg > 5) trend = 'improving'
    else if (firstAvg - secondAvg > 5) trend = 'declining'
  }

  const recentWindow = qualities.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, qualities.length)

  const pattern: RatingPattern = {
    averageQuality: Math.round(avg * 10) / 10,
    trend,
    variance: Math.round(variance * 10) / 10,
    recentWindow: Math.round(recentWindow * 10) / 10,
    peakQuality: Math.max(...qualities),
    lowQuality: Math.min(...qualities),
  }

  return { ...state, ratingPattern: pattern }
}

// Track improvement
export function trackImprovement(
  state: AuthorFeedbackState,
  dimension: string,
  beforeScore: number,
  afterScore: number
): AuthorFeedbackState {
  const existing = state.improvements.findIndex(i => i.dimension === dimension)
  const metric: ImprovementMetric = {
    dimension,
    beforeScore,
    afterScore,
    progress: beforeScore > 0 ? Math.round(((afterScore - beforeScore) / beforeScore) * 100) : 0,
    sessionsUsed: 1,
  }

  const improvements = [...state.improvements]
  if (existing >= 0) {
    const prev = improvements[existing]
    metric.sessionsUsed = prev.sessionsUsed + 1
    metric.progress = prev.beforeScore > 0
      ? Math.round(((afterScore - prev.beforeScore) / prev.beforeScore) * 100)
      : 0
    improvements[existing] = metric
  } else {
    improvements.push(metric)
  }

  return { ...state, improvements }
}

// Analyze writing behavior
export function analyzeWritingBehavior(state: AuthorFeedbackState): AuthorFeedbackState {
  if (state.entries.length === 0) return state

  // Group by time slots (simplified: use hour of day)
  const byHour: Record<number, number[]> = {}
  for (const entry of state.entries) {
    const hour = new Date(entry.timestamp).getHours()
    if (!byHour[hour]) byHour[hour] = []
    byHour[hour].push(entry.quality)
  }

  const avgBySlot: Record<string, number> = {}
  const slotMap: Record<number, string> = {}
  for (const h of Object.keys(byHour)) {
    const hour = parseInt(h)
    const slot = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night'
    slotMap[hour] = slot
    if (!avgBySlot[slot]) avgBySlot[slot] = []
    avgBySlot[slot].push(...byHour[hour])
  }

  const finalAvgBySlot: Record<string, number> = {}
  for (const slot of Object.keys(avgBySlot)) {
    const vals = avgBySlot[slot]
    finalAvgBySlot[slot] = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
  }

  const revisionCount = state.entries.filter(e => e.type === 'revision').length
  const correctionCount = state.entries.filter(e => e.type === 'correction').length

  const behavior: WritingBehavior = {
    sessionFrequency: Math.round((state.entries.length / 7) * 10) / 10, // per day
    avgSessionDuration: 30, // placeholder
    revisionRate: Math.round((revisionCount / Math.max(1, state.entries.length)) * 100) / 100,
    correctionFrequency: correctionCount,
    preferredTimeSlot: Object.entries(finalAvgBySlot).sort((a, b) => b[1] - a[1])[0]?.[0] || 'evening',
    avgQualityByTimeSlot: finalAvgBySlot,
  }

  return { ...state, behavior }
}

// Get improvement summary
export function getImprovementSummary(state: AuthorFeedbackState): {
  totalDimensions: number
  improving: number
  declining: number
  bestDimension: string | null
  worstDimension: string | null
} {
  const improving = state.improvements.filter(i => i.progress > 0).length
  const declining = state.improvements.filter(i => i.progress < 0).length

  let best: string | null = null
  let worst: string | null = null
  if (state.improvements.length > 0) {
    const sorted = [...state.improvements].sort((a, b) => b.progress - a.progress)
    best = sorted[0].dimension
    worst = sorted[sorted.length - 1].dimension
  }

  return {
    totalDimensions: state.improvements.length,
    improving,
    declining,
    bestDimension: best,
    worstDimension: worst,
  }
}

// Detect quality anomalies
export function detectQualityAnomalies(state: AuthorFeedbackState): {
  suddenDrop: boolean
  suddenRise: boolean
  persistentDecline: boolean
} {
  const qualities = state.entries.map(e => e.quality)

  let suddenDrop = false
  let suddenRise = false
  let persistentDecline = false

  if (qualities.length >= 3) {
    const recent = qualities.slice(-3)
    const first = qualities[0]
    // Sudden drop: last is much lower than previous
    if (qualities.length >= 2 && recent[2] < recent[1] - 15) suddenDrop = true
    if (qualities.length >= 2 && recent[2] > recent[1] + 15) suddenRise = true
    // Persistent: all last 3 below average
    const avg = qualities.reduce((a, b) => a + b, 0) / qualities.length
    if (recent.every(q => q < avg - 10)) persistentDecline = true
  }

  return { suddenDrop, suddenRise, persistentDecline }
}

// Generate feedback recommendations
export function generateFeedbackRecommendations(state: AuthorFeedbackState): string[] {
  const recommendations: string[] = []

  if (!state.ratingPattern) return recommendations

  if (state.ratingPattern.trend === 'declining') {
    recommendations.push('Quality trend declining — consider reviewing your recent writing approach')
    recommendations.push('Take a break and return with fresh perspective')
  }

  if (state.ratingPattern.variance > 200) {
    recommendations.push('High quality variance — focus on consistency in your writing sessions')
  }

  const anomalies = detectQualityAnomalies(state)
  if (anomalies.suddenDrop) {
    recommendations.push('Sudden quality drop detected — identify what changed in your process')
  }
  if (anomalies.persistentDecline) {
    recommendations.push('Persistent decline — consider seeking feedback from readers')
  }

  if (state.improvements.length > 0) {
    const summary = getImprovementSummary(state)
    if (summary.worstDimension) {
      recommendations.push(`Focus on improving: ${summary.worstDimension}`)
    }
  }

  if (state.entries.length < 5) {
    recommendations.push('Keep writing — need more data for personalized feedback')
  }

  return recommendations
}
