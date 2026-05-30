/**
 * NarrativeSymbolicEngine — V429
 * Symbolic motif tracking, recurring imagery analysis, thematic symbolism engine across narrative.
 * Inspired by: ruflo (hierarchical decomposition), chatdev (pattern recognition), thunderbolt (feedback loops)
 */

export type SymbolicCategory = 'elemental' | 'animal' | 'color' | 'object' | 'weather' | 'architectural' | 'bodily' | 'celestial'

export interface SymbolicMarker {
  id: string
  symbol: string  // e.g., 'water', 'raven', 'red'
  category: SymbolicCategory
  chaptersAppeared: number[]
  frequency: number
  meaningEvolution: string[]  // how meaning evolved
  intensityByChapter: Array<{ chapter: number; intensity: number }>
}

export interface SymbolicReport {
  totalSymbols: number
  dominantCategory: SymbolicCategory | null
  highFrequencySymbols: string[]
  underdevelopedSymbols: string[]
  recommendations: string[]
}

export interface NarrativeSymbolicState {
  markers: SymbolicMarker[]
  report: SymbolicReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeSymbolicState {
  return { markers: [], report: null, typeAlias: {} }
}

export function registerSymbol(
  state: NarrativeSymbolicState,
  symbol: string,
  category: SymbolicCategory,
  chapter: number,
  intensity: number = 60
): NarrativeSymbolicState {
  const existing = state.markers.find(m => m.symbol.toLowerCase() === symbol.toLowerCase())
  if (existing) {
    const chapters = existing.chaptersAppeared.includes(chapter) ? existing.chaptersAppeared : [...existing.chaptersAppeared, chapter].sort((a, b) => a - b)
    const intensityByChapter = [...existing.intensityByChapter.filter(ic => ic.chapter !== chapter), { chapter, intensity }]
    const frequency = chapters.length
    let meaningEvolution = existing.meaningEvolution
    if (intensity > 80 && existing.intensityByChapter[existing.intensityByChapter.length - 1]?.intensity < 50) {
      meaningEvolution = [...meaningEvolution, `Transformed at chapter ${chapter}`]
    }
    const markers = state.markers.map(m => m.symbol.toLowerCase() === symbol.toLowerCase() ? { ...m, chaptersAppeared: chapters, frequency, intensityByChapter, meaningEvolution } : m)
    return { ...state, markers }
  }
  
  const id = `symbol_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const marker: SymbolicMarker = { id, symbol, category, chaptersAppeared: [chapter], frequency: 1, meaningEvolution: [], intensityByChapter: [{ chapter, intensity }] }
  return { ...state, markers: [...state.markers, marker] }
}

export function generateSymbolicReport(state: NarrativeSymbolicState): SymbolicReport {
  if (state.markers.length === 0) {
    return { totalSymbols: 0, dominantCategory: null, highFrequencySymbols: [], underdevelopedSymbols: [], recommendations: [] }
  }
  
  const totalSymbols = state.markers.length
  
  // Category distribution
  const catCounts: Record<SymbolicCategory, number> = { elemental: 0, animal: 0, color: 0, object: 0, weather: 0, architectural: 0, bodily: 0, celestial: 0 }
  for (const m of state.markers) catCounts[m.category]++
  const dominantCategory = (Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as SymbolicCategory) || null
  
  const highFrequencySymbols = state.markers.filter(m => m.frequency >= 3).map(m => m.symbol)
  const underdevelopedSymbols = state.markers.filter(m => m.frequency < 2).map(m => m.symbol)
  
  const recommendations: string[] = []
  if (underdevelopedSymbols.length > totalSymbols * 0.5) {
    recommendations.push(`${underdevelopedSymbols.length} symbols need more appearances - develop them`)
  }
  if (highFrequencySymbols.length > totalSymbols * 0.3) {
    recommendations.push('Many high-frequency symbols - good for recurring motifs')
  }
  if (dominantCategory && catCounts[dominantCategory] > totalSymbols * 0.4) {
    recommendations.push(`${dominantCategory} symbolism dominates - add variety`)
  }
  if (state.markers.some(m => m.meaningEvolution.length === 0 && m.frequency > 3)) {
    recommendations.push('Some symbols never evolved - add transformation moments')
  }
  if (state.markers.length > 15) recommendations.push('Many symbols - focus on the most meaningful 5-7')
  if (highFrequencySymbols.length === 0 && totalSymbols > 5) {
    recommendations.push('No high-frequency symbols - add recurring motifs for cohesion')
  }
  
  return { totalSymbols, dominantCategory, highFrequencySymbols, underdevelopedSymbols, recommendations }
}

export function getSymbolByName(state: NarrativeSymbolicState, symbol: string): SymbolicMarker | null {
  return state.markers.find(m => m.symbol.toLowerCase() === symbol.toLowerCase()) || null
}

export function getSymbolByCategory(state: NarrativeSymbolicState, category: SymbolicCategory): SymbolicMarker[] {
  return state.markers.filter(m => m.category === category)
}

export function compareSymbolFrequency(state: NarrativeSymbolicState, symbol1: string, symbol2: string): {
  moreFrequent: string
  freq1: number
  freq2: number
} {
  const s1 = state.markers.find(m => m.symbol.toLowerCase() === symbol1.toLowerCase())
  const s2 = state.markers.find(m => m.symbol.toLowerCase() === symbol2.toLowerCase())
  if (!s1 || !s2) return { moreFrequent: symbol1, freq1: 0, freq2: 0 }
  return { moreFrequent: s1.frequency > s2.frequency ? symbol1 : symbol2, freq1: s1.frequency, freq2: s2.frequency }
}
