/**
 * ReaderEngagementAnalyzer — V349
 * Real-time reader engagement analysis, anomaly detection, emotional
 * response tracking, and engagement prediction.
 * Inspired by: thunderbolt (real-time feedback loops), chatdev (role analysis)
 */

export interface EngagementPoint {
  timestamp: number
  scrollDepth: number      // 0-100
  readingTime: number      // seconds on page
  interactionCount: number
  emotionalResponse: number // -100 to +100
  skipRate?: number        // 0-100
}

export interface EngagementState {
  readerId: string
  sessionStart: number
  points: EngagementPoint[]
  engagementScore: number  // 0-100
  avgReadingTime: number
  avgScrollDepth: number
  dropoutRisk: 'low' | 'medium' | 'high'
  anomalyAlerts: AnomalyAlert[]
  typeAlias: Record<string, unknown>
}

export interface AnomalyAlert {
  type: 'sudden_drop' | 'gradual_decline' | 'engagement_spike' | 'high_skip_rate'
  severity: number  // 0-100
  timestamp: number
  description: string
}

export function createEmptyState(readerId?: string): EngagementState {
  return {
    readerId: readerId || `reader_${Date.now()}`,
    sessionStart: Date.now(),
    points: [],
    engagementScore: 0,
    avgReadingTime: 0,
    avgScrollDepth: 0,
    dropoutRisk: 'low',
    anomalyAlerts: [],
    typeAlias: {},
  }
}

export function recordEngagement(
  state: EngagementState,
  scrollDepth: number,
  readingTime: number,
  interactionCount: number,
  emotionalResponse: number,
  skipRate?: number
): EngagementState {
  const point: EngagementPoint = {
    timestamp: Date.now(),
    scrollDepth,
    readingTime,
    interactionCount,
    emotionalResponse,
    skipRate,
  }
  const points = [...state.points, point]
  const engagementScore = calculateEngagementScore(points)
  const avgReadingTime = points.reduce((s, p) => s + p.readingTime, 0) / points.length
  const avgScrollDepth = points.reduce((s, p) => s + p.scrollDepth, 0) / points.length
  const anomalyAlerts = detectAnomalies(state.anomalyAlerts, points)
  const dropoutRisk = assessDropoutRisk(points)
  return { ...state, points, engagementScore, avgReadingTime, avgScrollDepth, anomalyAlerts, dropoutRisk }
}

export function calculateEngagementScore(points: EngagementPoint[]): number {
  if (points.length === 0) return 0
  const recent = points.slice(-10)
  const scrollAvg = recent.reduce((s, p) => s + p.scrollDepth, 0) / recent.length
  const timeBonus = Math.min(20, recent.reduce((s, p) => s + p.readingTime, 0) / 60)
  const interactionBonus = Math.min(15, recent.reduce((s, p) => s + p.interactionCount, 0) * 2)
  const emotionalBonus = (recent.reduce((s, p) => s + p.emotionalResponse, 0) / recent.length + 100) / 4
  return Math.min(100, Math.round(scrollAvg * 0.4 + timeBonus + interactionBonus + emotionalBonus))
}

export function detectAnomalies(existingAlerts: AnomalyAlert[], points: EngagementPoint[]): AnomalyAlert[] {
  if (points.length < 5) return existingAlerts
  const recent = points.slice(-10)
  const scrollVals = recent.map(p => p.scrollDepth)
  const avg = scrollVals.reduce((a, b) => a + b, 0) / scrollVals.length
  const last = scrollVals[scrollVals.length - 1]
  const alerts: AnomalyAlert[] = [...existingAlerts]
  if (last < avg * 0.5 && avg > 30) {
    const existing = alerts.find(a => a.type === 'sudden_drop' && a.timestamp > Date.now() - 60000)
    if (!existing) {
      alerts.push({
        type: 'sudden_drop',
        severity: Math.min(100, Math.round((avg - last) / avg * 100)),
        timestamp: Date.now(),
        description: `Sudden scroll depth drop: ${last.toFixed(0)}% from avg ${avg.toFixed(0)}%`,
      })
    }
  }
  if (scrollVals.length >= 5) {
    const first5 = scrollVals.slice(0, Math.floor(scrollVals.length / 2))
    const last5 = scrollVals.slice(Math.floor(scrollVals.length / 2))
    const firstAvg = first5.reduce((a, b) => a + b, 0) / first5.length
    const lastAvg = last5.reduce((a, b) => a + b, 0) / last5.length
    if (lastAvg < firstAvg * 0.6 && firstAvg > 40) {
      const existing = alerts.find(a => a.type === 'gradual_decline')
      if (!existing) {
        alerts.push({
          type: 'gradual_decline',
          severity: Math.min(100, Math.round((firstAvg - lastAvg) / firstAvg * 100)),
          timestamp: Date.now(),
          description: `Gradual decline: ${lastAvg.toFixed(0)}% vs earlier ${firstAvg.toFixed(0)}%`,
        })
      }
    }
  }
  return alerts.slice(-20)
}

export function assessDropoutRisk(points: EngagementPoint[]): 'low' | 'medium' | 'high' {
  if (points.length < 3) return 'low'
  const recent = points.slice(-5)
  if (recent.length < 3) return 'low'
  const scrollAvg = recent.reduce((s, p) => s + p.scrollDepth, 0) / recent.length
  const timeAvg = recent.reduce((s, p) => s + p.readingTime, 0) / recent.length
  if (scrollAvg < 20 || timeAvg < 5) return 'high'
  if (scrollAvg < 40 || timeAvg < 15) return 'medium'
  return 'low'
}

export function getEngagementTrend(state: EngagementState): 'improving' | 'stable' | 'declining' {
  if (state.points.length < 6) return 'stable'
  const half = Math.floor(state.points.length / 2)
  const first = state.points.slice(0, half)
  const second = state.points.slice(half)
  const firstAvg = first.reduce((s, p) => s + p.scrollDepth, 0) / first.length
  const secondAvg = second.reduce((s, p) => s + p.scrollDepth, 0) / second.length
  const diff = secondAvg - firstAvg
  if (diff > 5) return 'improving'
  if (diff < -5) return 'declining'
  return 'stable'
}

export function predictLikelihoodToFinish(state: EngagementState): number {
  if (state.points.length === 0) return 0
  const currentDepth = state.points[state.points.length - 1].scrollDepth
  const avgTime = state.avgReadingTime
  const risk = state.dropoutRisk === 'high' ? 0.5 : state.dropoutRisk === 'medium' ? 0.75 : 1.0
  const depthFactor = Math.max(0, currentDepth - 30) / 70
  const timeFactor = Math.min(1, avgTime / 30)
  return Math.min(95, Math.round(depthFactor * timeFactor * risk * 100))
}

export function getRecommendedInterventions(state: EngagementState): string[] {
  const interventions: string[] = []
  if (state.dropoutRisk === 'high') interventions.push('Consider adding interactive elements')
  if (state.avgScrollDepth < 40) interventions.push('Review content structure - low scroll engagement')
  if (state.anomalyAlerts.some(a => a.type === 'gradual_decline')) {
    interventions.push('Address gradual engagement decline - add compelling content')
  }
  if (getEngagementTrend(state) === 'declining') {
    interventions.push('Engagement trending down - consider narrative hook insertion')
  }
  const highSkip = state.points.filter(p => (p.skipRate || 0) > 50).length
  if (highSkip > 2) interventions.push('High skip rate detected - review pacing')
  return interventions
}

export function compareReaders(state1: EngagementState, state2: EngagementState): {
  moreEngaged: string
  engagementDiff: number
  insights: string[]
} {
  const diff = state1.engagementScore - state2.engagementScore
  const moreEngaged = diff > 0 ? state1.readerId : state2.readerId
  const insights: string[] = []
  if (Math.abs(diff) > 20) {
    insights.push(`${moreEngaged} shows significantly higher engagement`)
  }
  if (state1.dropoutRisk !== state2.dropoutRisk) {
    insights.push(`Dropout risk differs: ${state1.readerId}=${state1.dropoutRisk}, ${state2.readerId}=${state2.dropoutRisk}`)
  }
  return { moreEngaged, engagementDiff: Math.abs(diff), insights }
}

export function getSessionSummary(state: EngagementState) {
  return {
    readerId: state.readerId,
    duration: Date.now() - state.sessionStart,
    totalPoints: state.points.length,
    engagementScore: state.engagementScore,
    dropoutRisk: state.dropoutRisk,
    anomalyCount: state.anomalyAlerts.length,
    predictedFinishLikelihood: predictLikelihoodToFinish(state),
    trend: getEngagementTrend(state),
  }
}
