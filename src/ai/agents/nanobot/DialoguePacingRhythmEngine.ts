// DialoguePacingRhythmEngine - V303: Dialogue pacing rhythm analysis & conversation flow patterns
// Inspired by: thunderbolt (rhythm patterns) + nanobot (flow analysis)

export type ConversationRhythm = 'staccato' | 'flowing' | 'interrupted' | 'overlapping' | 'measured'
export type DialoguePace = 'rapid' | 'moderate' | 'slow' | 'paused'

export interface DialogueExchange {
  exchangeId: string
  chapter: number
  speakers: string[]
  turnCount: number
  avgTurnLength: number  // words per turn
  rhythm: ConversationRhythm
  pace: DialoguePace
  tensionLevel: number   // 0-100
  subtextDensity: number // 0-1, ratio of loaded vs literal lines
}

export interface DialoguePacingState {
  exchanges: DialogueExchange[]
  currentChapter: number
  dominantRhythm: ConversationRhythm
  avgTension: number
  conversationPatterns: Array<{pattern: string; count: number; chapters: number[]}>
}

export function createEmptyDialoguePacingState(): DialoguePacingState {
  return {
    exchanges: [],
    currentChapter: 0,
    dominantRhythm: 'flowing',
    avgTension: 0,
    conversationPatterns: [],
  }
}

function createExchangeId(): string {
  return 'exchange_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function detectRhythm(turnCount: number, avgTurnLength: number, tensionLevel: number): ConversationRhythm {
  if (turnCount > 10 && avgTurnLength < 15) return 'staccato'
  if (avgTurnLength > 50 && tensionLevel > 60) return 'interrupted'
  if (turnCount > 8 && tensionLevel > 70) return 'overlapping'
  if (avgTurnLength > 40 && tensionLevel < 40) return 'measured'
  return 'flowing'
}

function detectPace(avgTurnLength: number, turnCount: number): DialoguePace {
  if (avgTurnLength < 10 && turnCount > 6) return 'rapid'
  if (avgTurnLength > 60) return 'slow'
  if (avgTurnLength > 40) return 'paused'
  return 'moderate'
}

export function analyzeDialogueExchange(
  state: DialoguePacingState,
  chapter: number,
  speakers: string[],
  dialogueLines: Array<{speaker: string; wordCount: number; tension: number; hasSubtext: boolean}>
): DialoguePacingState {
  const turnCount = dialogueLines.length
  const avgTurnLength = Math.round(dialogueLines.reduce((s, l) => s + l.wordCount, 0) / Math.max(1, turnCount))
  const tensionLevel = Math.round(dialogueLines.reduce((s, l) => s + l.tension, 0) / Math.max(1, turnCount))
  const subtextLines = dialogueLines.filter(l => l.hasSubtext).length
  const subtextDensity = Math.round(subtextLines / Math.max(1, turnCount) * 100) / 100

  const rhythm = detectRhythm(turnCount, avgTurnLength, tensionLevel)
  const pace = detectPace(avgTurnLength, turnCount)

  const exchange: DialogueExchange = {
    exchangeId: createExchangeId(),
    chapter,
    speakers,
    turnCount,
    avgTurnLength,
    rhythm,
    pace,
    tensionLevel,
    subtextDensity,
  }

  const newExchanges = [...state.exchanges, exchange]
  const totalTension = newExchanges.reduce((s, e) => s + e.tensionLevel, 0)
  const avgTension = Math.round(totalTension / newExchanges.length)

  const rhythmCounts: { [key in ConversationRhythm]: number } = {
    staccato: 0, flowing: 0, interrupted: 0, overlapping: 0, measured: 0
  }
  for (const ex of newExchanges) rhythmCounts[ex.rhythm]++
  const dominantRhythm = (Object.entries(rhythmCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'flowing') as ConversationRhythm

  const patterns = [...state.conversationPatterns]
  patterns.push({ pattern: rhythm + ' ' + pace, count: 1, chapters: [chapter] })

  return {
    exchanges: newExchanges,
    currentChapter: Math.max(state.currentChapter, chapter),
    dominantRhythm,
    avgTension,
    conversationPatterns: patterns.slice(-10),
  }
}

export function getExchangesByChapter(state: DialoguePacingState, chapter: number): DialogueExchange[] {
  return state.exchanges.filter(e => e.chapter === chapter)
}

export function getExchangesByRhythm(state: DialoguePacingState, rhythm: ConversationRhythm): DialogueExchange[] {
  return state.exchanges.filter(e => e.rhythm === rhythm)
}

export function getHighTensionExchanges(state: DialoguePacingState, threshold: number = 70): DialogueExchange[] {
  return state.exchanges.filter(e => e.tensionLevel >= threshold)
}

export function formatDialoguePacingSummary(state: DialoguePacingState): string {
  let s = "=== Dialogue Pacing Summary ===\n"
  s += "Exchanges: " + state.exchanges.length + "\n"
  s += "Dominant Rhythm: " + state.dominantRhythm + "\n"
  s += "Avg Tension: " + state.avgTension + "\n"
  return s
}

export function formatDialoguePacingDashboard(state: DialoguePacingState): string {
  let s = "=== Dialogue Pacing Dashboard ===\n"
  s += "Chapter: " + state.currentChapter + " | Exchanges: " + state.exchanges.length + "\n"
  s += "Dominant Rhythm: " + state.dominantRhythm + " | Avg Tension: " + state.avgTension + "\n"

  if (state.exchanges.length > 0) {
    s += "\n--- Rhythm Distribution ---\n"
    const rhythmCounts: { [key: string]: number } = { staccato: 0, flowing: 0, interrupted: 0, overlapping: 0, measured: 0 }
    for (const ex of state.exchanges) rhythmCounts[ex.rhythm]++
    for (const [rhythm, count] of Object.entries(rhythmCounts)) {
      if (count > 0) s += "  " + rhythm + ": " + count + "\n"
    }

    s += "\n--- Recent Exchanges ---\n"
    for (const ex of state.exchanges.slice(-3)) {
      s += "  Ch" + ex.chapter + ": " + ex.turnCount + " turns " + ex.rhythm + " (" + ex.tensionLevel + " tension)\n"
    }
  }
  return s
}