/**
 * ReaderExperienceSimulator - V254
 * Simulates reader emotional journey and predicts drop-off points
 * Inspired by: claude-code (feedback loops) + ruflo (hierarchical decomposition)
 */

export type EmotionalValence = 'positive' | 'negative' | 'neutral' | 'mixed'
export type EngagementLevel = 'low' | 'medium' | 'high' | 'peak'

export interface ReaderMoment {
  momentId: string
  position: number
  valence: EmotionalValence
  intensity: number  // 0-100
  engagement: EngagementLevel
  description: string
}

export interface ReaderJourneyState {
  storyId: string | null
  moments: ReaderMoment[]
  currentPosition: number
  totalPositions: number
  averageEngagement: number
  peakMoments: string[]
  dropOffRiskZones: number[]
  overallSatisfaction: number
}

export interface ExperiencePrediction {
  predictedDropOffPosition: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  reasons: string[]
  suggestions: string[]
  engagementTrend: 'rising' | 'stable' | 'declining'
}

function createMomentId(): string {
  return 'moment_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

export function createEmptyReaderJourneyState(storyId: string = 'default'): ReaderJourneyState {
  return {
    storyId,
    moments: [],
    currentPosition: 0,
    totalPositions: 0,
    averageEngagement: 50,
    peakMoments: [],
    dropOffRiskZones: [],
    overallSatisfaction: 0,
  }
}

export function recordMoment(
  state: ReaderJourneyState,
  position: number,
  valence: EmotionalValence,
  intensity: number,
  description: string
): ReaderJourneyState {
  const engagement: EngagementLevel = intensity >= 80 ? 'peak' : intensity >= 60 ? 'high' : intensity >= 30 ? 'medium' : 'low'
  const moment: ReaderMoment = {
    momentId: createMomentId(),
    position,
    valence,
    intensity,
    engagement,
    description,
  }
  const newMoments = [...state.moments, moment]
  const total = newMoments.length
  const avgEngagement = newMoments.reduce((a, m) => a + m.intensity, 0) / total
  const peakIds = newMoments.filter(m => m.engagement === 'peak').map(m => m.momentId)

  // Detect drop-off risk zones: consecutive low engagement
  const dropOffZones: number[] = []
  for (let i = 1; i < newMoments.length; i++) {
    const prev = newMoments[i - 1]
    const curr = newMoments[i]
    if (prev.intensity < 40 && curr.intensity < 40 && prev.engagement === 'low' && curr.engagement === 'low') {
      if (!dropOffZones.includes(prev.position)) {
        dropOffZones.push(prev.position)
      }
    }
  }

  return {
    ...state,
    moments: newMoments,
    currentPosition: position,
    totalPositions: Math.max(state.totalPositions, position),
    averageEngagement: avgEngagement,
    peakMoments: peakIds,
    dropOffRiskZones: dropOffZones,
    overallSatisfaction: calculateSatisfaction(newMoments),
  }
}

function calculateSatisfaction(moments: ReaderMoment[]): number {
  if (!moments.length) return 0
  const valenceBonus = moments.filter(m => m.valence === 'positive').length * 5
  const valencePenalty = moments.filter(m => m.valence === 'negative').length * 2
  const peakBonus = moments.filter(m => m.engagement === 'peak').length * 10
  const base = moments.reduce((a, m) => a + m.intensity, 0) / moments.length
  return Math.min(100, Math.max(0, base + valenceBonus - valencePenalty + peakBonus))
}

export function predictDropOffRisk(state: ReaderJourneyState): ExperiencePrediction {
  if (state.moments.length < 3) {
    return {
      predictedDropOffPosition: -1,
      riskLevel: 'low',
      reasons: ['Insufficient data'],
      suggestions: ['Continue recording reader moments'],
      engagementTrend: 'stable',
    }
  }

  const recentMoments = state.moments.slice(-5)
  const recentAvg = recentMoments.reduce((a, m) => a + m.intensity, 0) / recentMoments.length
  const firstMoments = state.moments.slice(0, Math.min(3, state.moments.length))
  const earlyAvg = firstMoments.reduce((a, m) => a + m.intensity, 0) / firstMoments.length

  let trend: 'rising' | 'stable' | 'declining' = 'stable'
  if (recentAvg > earlyAvg * 1.1) trend = 'rising'
  else if (recentAvg < earlyAvg * 0.85) trend = 'declining'

  const reasons: string[] = []
  const suggestions: string[] = []

  if (trend === 'declining') {
    reasons.push('Reader engagement has been declining over recent segments')
    suggestions.push('Add a twist or climactic moment to re-engage the reader')
  }

  const consecutiveLow = recentMoments.filter(m => m.intensity < 40).length
  if (consecutiveLow >= 2) {
    reasons.push('Multiple consecutive low-engagement moments detected')
    suggestions.push('Consider tightening the pacing or adding conflict')
  }

  let riskLevel: ExperiencePrediction['riskLevel'] = 'low'
  if (consecutiveLow >= 3 || trend === 'declining') riskLevel = 'high'
  else if (consecutiveLow >= 2 || recentAvg < 40) riskLevel = 'medium'

  const lastMoment = state.moments[state.moments.length - 1]
  const predictedPosition = lastMoment ? lastMoment.position + 3 : -1

  return {
    predictedDropOffPosition: predictedPosition,
    riskLevel,
    reasons,
    suggestions,
    engagementTrend: trend,
  }
}

export function getEngagementAtPosition(state: ReaderJourneyState, position: number): number {
  const moment = state.moments.find(m => m.position === position)
  return moment ? moment.intensity : 0
}

export function getPeakMoments(state: ReaderJourneyState): ReaderMoment[] {
  return state.moments.filter(m => m.engagement === 'peak')
}

export function formatReaderJourneyReport(state: ReaderJourneyState): string {
  let s = '=== Reader Experience Journey ===\n'
  s += 'Story: ' + state.storyId + ' | Moments: ' + state.moments.length + '\n'
  s += 'Average Engagement: ' + state.averageEngagement.toFixed(1) + '%\n'
  s += 'Overall Satisfaction: ' + state.overallSatisfaction.toFixed(1) + '%\n'
  s += 'Peak Moments: ' + state.peakMoments.length + '\n'
  s += 'Drop-off Risk Zones: ' + state.dropOffRiskZones.length + '\n'

  const prediction = predictDropOffRisk(state)
  s += '\n--- Drop-off Prediction ---\n'
  s += 'Risk Level: ' + prediction.riskLevel + '\n'
  s += 'Trend: ' + prediction.engagementTrend + '\n'
  if (prediction.reasons.length) {
    s += 'Reasons: ' + prediction.reasons.join(', ') + '\n'
  }
  if (prediction.suggestions.length) {
    s += 'Suggestions: ' + prediction.suggestions.join(', ') + '\n'
  }

  return s
}

export function formatMomentTimeline(state: ReaderJourneyState): string {
  if (!state.moments.length) return 'No moments recorded'
  let s = '=== Moment Timeline ===\n'
  for (const m of state.moments) {
    const icon = m.valence === 'positive' ? '😊' : m.valence === 'negative' ? '😔' : '😐'
    s += 'Position ' + m.position + ': ' + icon + ' ' + m.intensity + '% (' + m.engagement + ')\n'
  }
  return s
}