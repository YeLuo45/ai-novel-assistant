export interface WritingSession {
  sessionId: string
  date: string
  wordsWritten: number
  timeSpentMinutes: number
  scenesCompleted: number
  qualityScore: number  // 0-100
}

export interface WritingAnalyticsState {
  sessions: WritingSession[]
  currentStreak: number  // days
  totalWords: number
  averageQuality: number  // 0-100
  productivityScore: number  // 0-100
}

function createSessionId(): string {
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function assessQuality(words: number, time: number, scenes: number): number {
  if (time === 0) return 0
  const wpm = words / time  // words per minute
  let score = 50

  // Good pace: 0.5-2 words per minute for creative writing
  if (wpm >= 0.5 && wpm <= 2) score += 20
  else if (wpm > 2 && wpm <= 5) score += 10
  else if (wpm < 0.5) score += 5

  // Scene completion bonus
  score += scenes * 5

  // Volume bonus/penalty
  if (words >= 500) score += 10
  if (words < 100) score -= 10

  return Math.max(0, Math.min(100, score))
}

export function createEmptyWritingAnalyticsState(): WritingAnalyticsState {
  return { sessions: [], currentStreak: 0, totalWords: 0, averageQuality: 0, productivityScore: 0 }
}

export function recordSession(
  state: WritingAnalyticsState,
  date: string,
  wordsWritten: number,
  timeSpentMinutes: number,
  scenesCompleted: number
): WritingAnalyticsState {
  const qualityScore = assessQuality(wordsWritten, timeSpentMinutes, scenesCompleted)

  const session: WritingSession = {
    sessionId: createSessionId(),
    date,
    wordsWritten,
    timeSpentMinutes,
    scenesCompleted,
    qualityScore,
  }

  const newSessions = [...state.sessions, session]
  const totalWords = newSessions.reduce((sum, s) => sum + s.wordsWritten, 0)
  const avgQuality = Math.round(newSessions.reduce((sum, s) => sum + s.qualityScore, 0) / newSessions.length)
  const totalTime = newSessions.reduce((sum, s) => sum + s.timeSpentMinutes, 0)

  // Calculate streak
  const dates = [...new Set(newSessions.map(s => s.date))].sort()
  let streak = 1
  for (let i = dates.length - 1; i > 0; i--) {
    const prev = new Date(dates[i-1])
    const curr = new Date(dates[i])
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    if (diff <= 1.5) streak++
    else break
  }

  // Productivity score: words per hour * quality factor
  const productivityScore = totalTime > 0
    ? Math.min(100, Math.round((totalWords / totalTime) * 10 * (avgQuality / 50)))
    : 0

  return {
    sessions: newSessions,
    currentStreak: streak,
    totalWords,
    averageQuality: avgQuality,
    productivityScore,
  }
}

export function getAverageWordsPerSession(state: WritingAnalyticsState): number {
  if (state.sessions.length === 0) return 0
  return Math.round(state.totalWords / state.sessions.length)
}

export function getProductivityScore(state: WritingAnalyticsState): number {
  return state.productivityScore
}

export function formatAnalyticsSummary(state: WritingAnalyticsState): string {
  let s = "=== Writing Analytics Summary ===" + "\n"
  s += "Sessions: " + state.sessions.length + "\n"
  s += "Total Words: " + state.totalWords + "\n"
  s += "Avg Quality: " + state.averageQuality + "\n"
  s += "Streak: " + state.currentStreak + " days" + "\n"
  return s
}

export function formatAnalyticsDashboard(state: WritingAnalyticsState): string {
  let s = "=== Writing Analytics Dashboard ===" + "\n"
  s += "Sessions: " + state.sessions.length + " | Total Words: " + state.totalWords + "\n"
  s += "Avg Quality: " + state.averageQuality + " | Streak: " + state.currentStreak + " days\n"
  s += "Productivity Score: " + state.productivityScore + "\n"

  if (state.sessions.length > 0) {
    const recent = state.sessions.slice(-5)
    s += "\n--- Recent Sessions ---" + "\n"
    for (const sess of recent) {
      s += "  " + sess.date + " " + sess.wordsWritten + " words, " + sess.scenesCompleted + " scenes, quality=" + sess.qualityScore + "\n"
    }
  }

  return s
}
