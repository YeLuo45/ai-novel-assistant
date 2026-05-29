export interface SymbolOccurrence {
  occurrenceId: string
  chapter: number
  context: string
  intensity: number  // 0-100
}

export interface SymbolEntry {
  symbol: string
  occurrences: SymbolOccurrence[]
  frequency: number
  consistencyScore: number  // 0-100
  thematicPhase: string  // e.g., 'introduction', 'development', 'climax', 'resolution'
}

export interface SymbolMotifState {
  symbols: Map<string, SymbolEntry>
  currentChapter: number
  averageConsistency: number
  motifGroups: string[][]
}

function createOccurrenceId(): string {
  return 'occ_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function assessConsistency(occurrences: SymbolOccurrence[]): number {
  if (occurrences.length < 2) return 100

  let totalDeviation = 0
  const avgIntensity = occurrences.reduce((s, o) => s + o.intensity, 0) / occurrences.length

  for (const occ of occurrences) {
    totalDeviation += Math.abs(occ.intensity - avgIntensity)
  }

  const avgDeviation = totalDeviation / occurrences.length
  return Math.max(0, Math.round(100 - avgDeviation))
}

function determinePhase(occurrences: SymbolOccurrence[], currentChapter: number): string {
  if (occurrences.length === 0) return 'introduction'

  const lastOcc = occurrences[occurrences.length - 1]
  const chaptersSinceLast = currentChapter - lastOcc.chapter

  if (chaptersSinceLast > 5) return 'dormant'
  if (occurrences.length === 1) return 'introduction'

  const avgIntensity = occurrences.reduce((s, o) => s + o.intensity, 0) / occurrences.length
  const recentAvg = occurrences.slice(-3).reduce((s, o) => s + o.intensity, 0) / Math.min(3, occurrences.length)

  if (recentAvg > avgIntensity * 1.3) return 'climax'
  if (recentAvg > avgIntensity * 0.8) return 'development'
  return 'fading'
}

export function createEmptySymbolMotifState(): SymbolMotifState {
  return { symbols: new Map(), currentChapter: 0, averageConsistency: 100, motifGroups: [] }
}

export function trackSymbol(
  state: SymbolMotifState,
  symbol: string,
  chapter: number,
  context: string,
  intensity: number
): SymbolMotifState {
  const newSymbols = new Map(state.symbols)

  const occurrence: SymbolOccurrence = {
    occurrenceId: createOccurrenceId(),
    chapter,
    context,
    intensity,
  }

  if (newSymbols.has(symbol)) {
    const entry = newSymbols.get(symbol)!
    const newOccurrences = [...entry.occurrences, occurrence]
    const entryConsistency = assessConsistency(newOccurrences)
    newSymbols.set(symbol, {
      ...entry,
      occurrences: newOccurrences,
      frequency: newOccurrences.length,
      consistencyScore: entryConsistency,
      thematicPhase: determinePhase(newOccurrences, chapter),
    })
  } else {
    newSymbols.set(symbol, {
      symbol,
      occurrences: [occurrence],
      frequency: 1,
      consistencyScore: 100,
      thematicPhase: 'introduction',
    })
  }

  const avgConsistency = [...newSymbols.values()].reduce((s, e) => s + e.consistencyScore, 0) / newSymbols.size

  return {
    ...state,
    symbols: newSymbols,
    currentChapter: Math.max(state.currentChapter, chapter),
    averageConsistency: Math.round(avgConsistency),
  }
}

export function createMotifGroup(
  state: SymbolMotifState,
  symbols: string[]
): SymbolMotifState {
  return {
    ...state,
    motifGroups: [...state.motifGroups, symbols],
  }
}

export function getSymbolInfo(state: SymbolMotifState, symbol: string): SymbolEntry | null {
  return state.symbols.get(symbol) || null
}

export function getFrequentSymbols(state: SymbolMotifState, minFrequency: number): SymbolEntry[] {
  return [...state.symbols.values()].filter(e => e.frequency >= minFrequency)
}

export function formatSymbolSummary(state: SymbolMotifState): string {
  let s = "=== Symbol & Motif Summary ===" + "\n"
  s += "Symbols: " + state.symbols.size + "\n"
  s += "Motif Groups: " + state.motifGroups.length + "\n"
  s += "Avg Consistency: " + state.averageConsistency + "\n"
  return s
}

export function formatSymbolDashboard(state: SymbolMotifState): string {
  let s = "=== Symbol & Motif Dashboard ===" + "\n"
  s += "Chapter: " + state.currentChapter + "\n"
  s += "Symbols: " + state.symbols.size + " | Motif Groups: " + state.motifGroups.length + " | Consistency: " + state.averageConsistency + "\n"

  if (state.symbols.size > 0) {
    s += "\n--- Top Symbols ---" + "\n"
    const sorted = [...state.symbols.values()].sort((a, b) => b.frequency - a.frequency).slice(0, 5)
    for (const entry of sorted) {
      s += "  " + entry.symbol + " x" + entry.frequency + " [" + entry.thematicPhase + "] consistency=" + entry.consistencyScore + "\n"
    }
  }

  return s
}
