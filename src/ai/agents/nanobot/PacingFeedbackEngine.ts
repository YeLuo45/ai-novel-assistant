export interface PacingEvent {
  eventId: string
  chapter: number
  pacingScore: number  // 0-100
  engagementLevel: number  // 0-100
  feedback: string
}

export interface PacingFeedbackState {
  events: PacingEvent[]
  currentChapter: number
  averagePacing: number
  engagementTrend: 'improving' | 'declining' | 'stable'
  retentionScore: number  // 0-100
}

function createEventId(): string {
  return 'pace_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function assessPacing(text: string): number {
  const words = text.split(' ')
  let score = 50

  // Longer sentences tend to be slower/detailed pacing
  if (words.length > 30) score += 15  // descriptive pacing
  if (words.length < 10) score -= 10  // very fast

  const lower = text.toLowerCase()
  if (lower.includes('suddenly') || lower.includes('immediately')) score += 10  // fast pacing
  if (lower.includes('meanwhile') || lower.includes('gradually')) score -= 10  // slow
  if (lower.includes('chapter') || lower.includes('scene')) score -= 15  // transition/slow

  return Math.max(0, Math.min(100, score))
}

function assessEngagement(text: string): number {
  const lower = text.toLowerCase()
  let score = 50

  if (lower.includes('mystery') || lower.includes('secret')) score += 20
  if (lower.includes('danger') || lower.includes('threat')) score += 15
  if (lower.includes('question') || lower.includes('why')) score += 15
  if (lower.includes('revelation') || lower.includes('discovered')) score += 20
  if (lower.includes('quiet') || lower.includes('peaceful')) score -= 20

  return Math.max(0, Math.min(100, score))
}

function determineTrend(events: PacingEvent[]): 'improving' | 'declining' | 'stable' {
  if (events.length < 3) return 'stable'
  const recent = events.slice(-3).map(e => e.engagementLevel)
  const first = recent[0]
  const last = recent[recent.length - 1]
  if (last > first + 10) return 'improving'
  if (last < first - 10) return 'declining'
  return 'stable'
}

export function createEmptyPacingFeedbackState(): PacingFeedbackState {
  return { events: [], currentChapter: 0, averagePacing: 0, engagementTrend: 'stable', retentionScore: 0 }
}

export function recordPacingEvent(
  state: PacingFeedbackState,
  chapter: number,
  text: string,
  feedback: string
): PacingFeedbackState {
  const pacingScore = assessPacing(text)
  const engagementLevel = assessEngagement(text)

  const event: PacingEvent = {
    eventId: createEventId(),
    chapter,
    pacingScore,
    engagementLevel,
    feedback,
  }

  const newEvents = [...state.events, event]

  const avgPacing = Math.round(newEvents.reduce((sum, e) => sum + e.pacingScore, 0) / newEvents.length)
  const avgEngagement = newEvents.reduce((sum, e) => sum + e.engagementLevel, 0) / newEvents.length
  const trend = determineTrend(newEvents)
  const retentionScore = Math.min(100, Math.round(avgEngagement * 0.7 + avgPacing * 0.3))

  return {
    ...state,
    events: newEvents,
    currentChapter: Math.max(state.currentChapter, chapter),
    averagePacing: avgPacing,
    engagementTrend: trend,
    retentionScore,
  }
}

export function getPacingAtChapter(state: PacingFeedbackState, chapter: number): PacingEvent | null {
  return state.events.find(e => e.chapter === chapter) || null
}

export function getRetentionScore(state: PacingFeedbackState): number {
  return state.retentionScore
}

export function formatPacingSummary(state: PacingFeedbackState): string {
  let s = "=== Pacing Summary ===" + "\n"
  s += "Events: " + state.events.length + "\n"
  s += "Avg Pacing: " + state.averagePacing + "\n"
  s += "Retention Score: " + state.retentionScore + "\n"
  return s
}

export function formatPacingDashboard(state: PacingFeedbackState): string {
  let s = "=== Pacing Dashboard ===" + "\n"
  s += "Chapter: " + state.currentChapter + "\n"
  s += "Avg Pacing: " + state.averagePacing + " | Trend: " + state.engagementTrend + "\n"
  s += "Retention Score: " + state.retentionScore + "\n"

  if (state.events.length > 0) {
    s += "\n--- Recent Events ---" + "\n"
    for (const e of state.events.slice(-3)) {
      s += "  Ch " + e.chapter + " pacing=" + e.pacingScore + " engagement=" + e.engagementLevel + "\n"
    }
  }

  return s
}
