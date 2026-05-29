/**
 * SymbolDensityAnalyzer — V375
 * Symbolic pattern detection, motif frequency analysis, recurring imagery tracking.
 * Inspired by: ruflo (hierarchical decomposition), generic-agent (pattern recognition), thunderbolt (feedback loops)
 */

export interface SymbolInstance {
  id: string
  symbol: string
  chapterId: string
  position: number
  context: string
  interpretedMeaning?: string
}

export interface SymbolCluster {
  symbol: string
  occurrences: number
  chapters: string[]
  avgPosition: number
  density: number  // occurrences per 1000 words estimate
  thematicAssociations: string[]
  evolution: string[]  // how meaning evolves
}

export interface SymbolDensityState {
  instances: SymbolInstance[]
  clusters: Record<string, SymbolCluster>
  thematicMap: Record<string, string[]>  // theme → related symbols
  dominantSymbol: string | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): SymbolDensityState {
  return { instances: [], clusters: {}, thematicMap: {}, dominantSymbol: null, typeAlias: {} }
}

export function registerSymbol(
  state: SymbolDensityState,
  symbol: string,
  chapterId: string,
  position: number,
  context: string,
  theme?: string
): SymbolDensityState {
  const id = `sym_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const instance: SymbolInstance = { id, symbol, chapterId, position, context }
  const instances = [...state.instances, instance]
  
  // Update cluster
  const existingCluster = state.clusters[symbol] || {
    symbol, occurrences: 0, chapters: [], avgPosition: 0, density: 0,
    thematicAssociations: [], evolution: [],
  }
  const chapters = [...new Set([...existingCluster.chapters, chapterId])]
  const occurrences = existingCluster.occurrences + 1
  const avgPosition = (existingCluster.avgPosition * existingCluster.occurrences + position) / occurrences
  const density = occurrences / Math.max(1, chapters.length)  // per chapter
  const thematicAssociations = theme ? [...new Set([...existingCluster.thematicAssociations, theme])] : existingCluster.thematicAssociations
  
  const cluster: SymbolCluster = { symbol, occurrences, chapters, avgPosition, density, thematicAssociations, evolution: existingCluster.evolution }
  const clusters = { ...state.clusters, [symbol]: cluster }
  
  // Update thematic map
  let thematicMap = state.thematicMap
  if (theme) {
    const existing = thematicMap[theme] || []
    thematicMap = { ...thematicMap, [theme]: [...new Set([...existing, symbol])] }
  }
  
  // Find dominant symbol
  const clusterValues = Object.values(clusters)
  const dominantSymbol = clusterValues.length > 0 ? clusterValues.sort((a, b) => b.occurrences - a.occurrences)[0].symbol : null
  
  return { ...state, instances, clusters, thematicMap, dominantSymbol }
}

export function interpretSymbol(
  state: SymbolDensityState,
  symbol: string,
  meaning: string
): SymbolDensityState {
  if (!state.clusters[symbol]) return state
  const cluster = state.clusters[symbol]
  const evolution = [...cluster.evolution, meaning]
  const updatedCluster = { ...cluster, evolution }
  return { ...state, clusters: { ...state.clusters, [symbol]: updatedCluster } }
}

export function getSymbolCluster(state: SymbolDensityState, symbol: string): SymbolCluster | null {
  return state.clusters[symbol] || null
}

export function getChapterSymbols(state: SymbolDensityState, chapterId: string): SymbolInstance[] {
  return state.instances.filter(i => i.chapterId === chapterId)
}

export function findSymbolPatterns(state: SymbolDensityState): {
  repeatedSymbols: string[]
  growingSymbols: string[]  // appearing in later chapters
  fadingSymbols: string[]  // appearing in earlier chapters
  isolatedSymbols: string[]
} {
  const clusterValues = Object.values(state.clusters)
  const repeatedSymbols = clusterValues.filter(c => c.occurrences >= 3).map(c => c.symbol)
  const isolatedSymbols = clusterValues.filter(c => c.occurrences === 1).map(c => c.symbol)
  
  // Analyze chapter order for growth/fade
  const chapterAppearances: Record<string, number[]> = {}
  for (const inst of state.instances) {
    const chNum = parseInt(inst.chapterId.replace(/[^0-9]/g, '')) || 0
    if (!chapterAppearances[inst.symbol]) chapterAppearances[inst.symbol] = []
    chapterAppearances[inst.symbol].push(chNum)
  }
  
  const growingSymbols: string[] = []
  const fadingSymbols: string[] = []
  
  for (const [sym, appearances] of Object.entries(chapterAppearances)) {
    if (appearances.length < 2) continue
    const sorted = [...appearances].sort((a, b) => a - b)
    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2))
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2))
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
    if (secondAvg > firstAvg + 1) growingSymbols.push(sym)
    if (firstAvg > secondAvg + 1) fadingSymbols.push(sym)
  }
  
  return { repeatedSymbols, growingSymbols, fadingSymbols, isolatedSymbols }
}

export function compareSymbolDensity(state: SymbolDensityState, ch1: string, ch2: string): {
  richerSymbolism: string
  symbolCountDiff: number
  uniqueInCh1: string[]
  uniqueInCh2: string[]
} {
  const ch1Symbols = new Set(state.instances.filter(i => i.chapterId === ch1).map(i => i.symbol))
  const ch2Symbols = new Set(state.instances.filter(i => i.chapterId === ch2).map(i => i.symbol))
  const uniqueInCh1 = [...ch1Symbols].filter(s => !ch2Symbols.has(s))
  const uniqueInCh2 = [...ch2Symbols].filter(s => !ch1Symbols.has(s))
  return {
    richerSymbolism: ch1Symbols.size > ch2Symbols.size ? ch1 : ch2,
    symbolCountDiff: Math.abs(ch1Symbols.size - ch2Symbols.size),
    uniqueInCh1,
    uniqueInCh2,
  }
}
