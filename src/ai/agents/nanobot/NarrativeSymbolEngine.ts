/**
 * NarrativeSymbolEngine — V483
 * Symbol tracking, recurring motif detection, symbolic density and layered meaning analysis.
 * Inspired by: chatdev (layered synthesis), ruflo (hierarchy), generic-agent (optimization)
 */

export interface SymbolOccurrence {
  id: string
  chapter: number
  context: string  // contextual note
  emotionalWeight: number  // -100 to 100
  layer: 'surface' | 'thematic' | 'personal'  // interpretation depth
}

export interface SymbolTracker {
  symbolName: string
  occurrences: SymbolOccurrence[]
  frequencyScore: number  // 0-100
  thematicDepth: number  // 0-100
  associatedThemes: string[]
}

export interface SymbolReport {
  totalSymbols: number
  avgFrequency: number
  avgThematicDepth: number
  recommendations: string[]
}

export interface NarrativeSymbolEngineState {
  symbols: SymbolTracker[]
  report: SymbolReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeSymbolEngineState {
  return { symbols: [], report: null, typeAlias: {} }
}

export function trackSymbol(
  state: NarrativeSymbolEngineState,
  symbolName: string,
  chapter: number,
  context: string,
  emotionalWeight: number,
  layer: SymbolOccurrence['layer'] = 'surface'
): NarrativeSymbolEngineState {
  const existing = state.symbols.find(s => s.symbolName === symbolName)
  if (existing) {
    const occurrence: SymbolOccurrence = { id: `occ_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, chapter, context, emotionalWeight: Math.max(-100, Math.min(100, emotionalWeight)), layer }
    const symbols = state.symbols.map(s => {
      if (s.symbolName !== symbolName) return s
      const occurrences = [...s.occurrences, occurrence]
      const frequencyScore = Math.min(100, occurrences.length * 12)
      const thematicDepth = Math.min(100, Math.round(s.occurrences.filter(o => o.layer === 'thematic').length * 20 + s.occurrences.filter(o => o.layer === 'personal').length * 15))
      return { ...s, occurrences, frequencyScore, thematicDepth }
    })
    return { ...state, symbols }
  }
  const occurrence: SymbolOccurrence = { id: `occ_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, chapter, context, emotionalWeight: Math.max(-100, Math.min(100, emotionalWeight)), layer }
  const tracker: SymbolTracker = { symbolName, occurrences: [occurrence], frequencyScore: 12, thematicDepth: 0, associatedThemes: [] }
  return { ...state, symbols: [...state.symbols, tracker] }
}

export function linkSymbolTheme(state: NarrativeSymbolEngineState, symbolName: string, theme: string): NarrativeSymbolEngineState {
  const symbols = state.symbols.map(s => s.symbolName === symbolName ? { ...s, associatedThemes: [...new Set([...s.associatedThemes, theme])] } : s)
  return { ...state, symbols }
}

export function generateSymbolReport(state: NarrativeSymbolEngineState): SymbolReport {
  if (state.symbols.length === 0) {
    return { totalSymbols: 0, avgFrequency: 0, avgThematicDepth: 0, recommendations: [] }
  }
  const totalSymbols = state.symbols.length
  const avgFrequency = Math.round(state.symbols.reduce((s, sym) => s + sym.frequencyScore, 0) / totalSymbols)
  const avgThematicDepth = Math.round(state.symbols.reduce((s, sym) => s + sym.thematicDepth, 0) / totalSymbols)
  const recommendations: string[] = []
  if (avgFrequency < 30) recommendations.push('Low symbol frequency - consider recurring motifs for depth')
  if (avgThematicDepth < 40) recommendations.push('Shallow symbolic layering - develop thematic interpretation')
  if (state.symbols.filter(s => s.associatedThemes.length === 0).length > totalSymbols * 0.5) {
    recommendations.push('Many unthemed symbols - link symbols to narrative themes')
  }
  if (avgFrequency > 80) recommendations.push('Strong symbolic density - well-developed motif network')
  return { totalSymbols, avgFrequency, avgThematicDepth, recommendations }
}

export function getSymbolByName(state: NarrativeSymbolEngineState, symbolName: string): SymbolTracker | null {
  return state.symbols.find(s => s.symbolName === symbolName) || null
}
