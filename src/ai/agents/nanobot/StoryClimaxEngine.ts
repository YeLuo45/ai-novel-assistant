export interface ClimaxEvent {
  eventId: string
  chapter: number
  intensity: number  // 0-100
  eventType: string
  buildUpScore: number
  payoffScore: number
}

export interface ClimaxDensityState {
  events: ClimaxEvent[]
  currentChapter: number
  totalChapters: number
  averageDensity: number  // peaks per chapter
  impactScore: number  // 0-100
}

function createEventId(): string {
  return 'climax_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function detectEventType(text: string): string {
  const lower = text.toLowerCase()
  if (lower.includes('battle') || lower.includes('fight')) return 'action'
  if (lower.includes('revelation') || lower.includes('truth')) return 'revelation'
  if (lower.includes('death') || lower.includes('loss')) return 'tragedy'
  if (lower.includes('love') || lower.includes('confession')) return 'romantic'
  if (lower.includes('betrayal')) return 'betrayal'
  if (lower.includes('choice') || lower.includes('decision')) return 'decision'
  return 'general'
}

function assessBuildUp(text: string): number {
  const lower = text.toLowerCase()
  let score = 50
  if (lower.includes('rising')) score += 20
  if (lower.includes('building')) score += 15
  if (lower.includes('tension')) score += 15
  if (lower.includes('ominous')) score += 10
  return Math.min(100, score)
}

function assessPayoff(text: string): number {
  const lower = text.toLowerCase()
  let score = 50
  if (lower.includes('climax') || lower.includes('peak')) score += 20
  if (lower.includes('confrontation')) score += 15
  if (lower.includes('finally')) score += 10
  return Math.min(100, score)
}

export function createEmptyClimaxDensityState(totalChapters: number = 10): ClimaxDensityState {
  return { events: [], currentChapter: 0, totalChapters, averageDensity: 0, impactScore: 0 }
}

export function recordClimaxEvent(
  state: ClimaxDensityState,
  chapter: number,
  text: string
): ClimaxDensityState {
  const event: ClimaxEvent = {
    eventId: createEventId(),
    chapter,
    intensity: Math.min(100, assessBuildUp(text) + assessPayoff(text)),
    eventType: detectEventType(text),
    buildUpScore: assessBuildUp(text),
    payoffScore: assessPayoff(text),
  }

  const newEvents = [...state.events, event]
  const density = newEvents.length / Math.max(state.currentChapter, 1)
  const avgIntensity = newEvents.reduce((sum, e) => sum + e.intensity, 0) / newEvents.length

  return {
    ...state,
    events: newEvents,
    currentChapter: Math.max(state.currentChapter, chapter),
    averageDensity: Math.round(density * 100) / 100,
    impactScore: Math.round(avgIntensity),
  }
}

export function getClimaxAtChapter(state: ClimaxDensityState, chapter: number): ClimaxEvent | null {
  return state.events.find(e => e.chapter === chapter) || null
}

export function getClimaxCount(state: ClimaxDensityState): number {
  return state.events.length
}

export function calculateImpactScore(state: ClimaxDensityState): number {
  if (state.events.length === 0) return 0
  const intensityAvg = state.events.reduce((sum, e) => sum + e.intensity, 0) / state.events.length
  const densityBonus = Math.min(20, state.events.length * 2)
  return Math.min(100, Math.round(intensityAvg + densityBonus))
}

export function formatClimaxSummary(state: ClimaxDensityState): string {
  let s = "=== Climax Summary ===" + "\n"
  s += "Events: " + state.events.length + "\n"
  s += "Impact Score: " + state.impactScore + "\n"
  s += "Average Density: " + state.averageDensity + " peaks/chapter" + "\n"
  return s
}

export function formatClimaxDashboard(state: ClimaxDensityState): string {
  let s = "=== Climax Dashboard ===" + "\n"
  s += "Chapter: " + state.currentChapter + "/" + state.totalChapters + "\n"
  s += "Total Climaxes: " + state.events.length + " | Impact: " + state.impactScore + "\n"
  s += "Density: " + state.averageDensity + " peaks/chapter" + "\n"

  if (state.events.length > 0) {
    s += "\n--- Event Types ---" + "\n"
    const typeCounts: Record<string, number> = {}
    for (const e of state.events) {
      typeCounts[e.eventType] = (typeCounts[e.eventType] || 0) + 1
    }
    for (const [type, count] of Object.entries(typeCounts)) {
      s += "  " + type + ": " + count + "\n"
    }
  }

  return s
}
