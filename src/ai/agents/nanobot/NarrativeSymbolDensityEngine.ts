// NarrativeSymbolDensityEngine - V304: Symbol & motif density tracking across narrative
// Inspired by: nanobot (mesh density) + thunderbolt (pattern tracking)

export type SymbolCategory = 'object' | 'color' | 'animal' | 'weather' | 'place' | 'action' | 'abstract'
export type SymbolFunction = 'foreshadow' | 'characterize' | 'theme' | 'mood' | 'plot' | 'contrast'

export interface SymbolInstance {
  id: string
  name: string
  category: SymbolCategory
  chapter: number
  context: string
  meaning: string
  function: SymbolFunction
  intensity: number  // 0-100, how prominently it appears
}

export interface SymbolDensityState {
  instances: SymbolInstance[]
  currentChapter: number
  symbolCounts: { [key: string]: number }
  categoryDistribution: { [key in SymbolCategory]: number }
  densityScore: number  // 0-100, overall symbol richness
}

export function createEmptySymbolDensityState(): SymbolDensityState {
  return {
    instances: [],
    currentChapter: 0,
    symbolCounts: {},
    categoryDistribution: { object: 0, color: 0, animal: 0, weather: 0, place: 0, action: 0, abstract: 0 },
    densityScore: 50,
  }
}

function createSymbolId(): string {
  return 'sym_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function detectCategory(text: string): SymbolCategory {
  const lower = text.toLowerCase()
  const objects = ['ring', 'key', 'door', 'window', 'mirror', 'candle', 'blade']
  const colors = ['red', 'blue', 'green', 'black', 'white', 'gold', 'silver']
  const animals = ['bird', 'wolf', 'snake', 'horse', 'raven', 'lion', 'bear']
  const weather = ['rain', 'storm', 'snow', 'fog', 'wind', 'thunder', 'mist']
  const places = ['forest', 'mountain', 'river', 'city', 'home', 'bridge', 'tower']
  const actions = ['fall', 'rise', 'burn', 'freeze', 'break', 'mend', 'fade']

  if (objects.some(o => lower.includes(o))) return 'object'
  if (colors.some(c => lower.includes(c))) return 'color'
  if (animals.some(a => lower.includes(a))) return 'animal'
  if (weather.some(w => lower.includes(w))) return 'weather'
  if (places.some(p => lower.includes(p))) return 'place'
  if (actions.some(a => lower.includes(a))) return 'action'
  return 'abstract'
}

function detectFunction(text: string): SymbolFunction {
  const lower = text.toLowerCase()
  if (lower.includes('foreshadow') || lower.includes('predict')) return 'foreshadow'
  if (lower.includes('character') || lower.includes('personality')) return 'characterize'
  if (lower.includes('theme') || lower.includes('meaning')) return 'theme'
  if (lower.includes('mood') || lower.includes('atmosphere')) return 'mood'
  if (lower.includes('plot') || lower.includes('event')) return 'plot'
  return 'contrast'
}

export function registerSymbol(
  state: SymbolDensityState,
  chapter: number,
  name: string,
  context: string,
  meaning: string,
  intensity: number = 50
): SymbolDensityState {
  const category = detectCategory(name)
  const func = detectFunction(context)

  const instance: SymbolInstance = {
    id: createSymbolId(),
    name,
    category,
    chapter,
    context,
    meaning,
    function: func,
    intensity: Math.min(100, Math.max(0, intensity)),
  }

  const newInstances = [...state.instances, instance]
  
  const symbolCounts = { ...state.symbolCounts }
  symbolCounts[name] = (symbolCounts[name] || 0) + 1
  
  const categoryDistribution = { ...state.categoryDistribution }
  categoryDistribution[category]++

  const densityScore = Math.min(100, Math.round(newInstances.length * 2 + Object.keys(symbolCounts).length * 3))

  return {
    instances: newInstances,
    currentChapter: Math.max(state.currentChapter, chapter),
    symbolCounts,
    categoryDistribution,
    densityScore,
  }
}

export function getSymbolInstances(state: SymbolDensityState, name: string): SymbolInstance[] {
  return state.instances.filter(i => i.name === name)
}

export function getSymbolsByCategory(state: SymbolDensityState, category: SymbolCategory): SymbolInstance[] {
  return state.instances.filter(i => i.category === category)
}

export function getSymbolFrequency(state: SymbolDensityState, name: string): number {
  return state.symbolCounts[name] || 0
}

export function getMostFrequentSymbols(state: SymbolDensityState, limit: number = 5): Array<{name: string; count: number}> {
  return Object.entries(state.symbolCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export function formatSymbolDensitySummary(state: SymbolDensityState): string {
  let s = "=== Narrative Symbol Density Summary ===\n"
  s += "Instances: " + state.instances.length + "\n"
  s += "Unique Symbols: " + Object.keys(state.symbolCounts).length + "\n"
  s += "Density Score: " + state.densityScore + "\n"
  return s
}

export function formatSymbolDensityDashboard(state: SymbolDensityState): string {
  let s = "=== Narrative Symbol Density Dashboard ===\n"
  s += "Chapter: " + state.currentChapter + " | Instances: " + state.instances.length + "\n"
  s += "Unique Symbols: " + Object.keys(state.symbolCounts).length + " | Density: " + state.densityScore + "\n"

  if (state.instances.length > 0) {
    s += "\n--- Category Distribution ---\n"
    for (const [cat, count] of Object.entries(state.categoryDistribution)) {
      if (count > 0) s += "  " + cat + ": " + count + "\n"
    }

    s += "\n--- Most Frequent Symbols ---\n"
    for (const sym of getMostFrequentSymbols(state, 5)) {
      s += "  " + sym.name + ": " + sym.count + "x\n"
    }

    s += "\n--- Recent Symbol Instances ---\n"
    for (const inst of state.instances.slice(-4)) {
      s += "  Ch" + inst.chapter + " [" + inst.category + "] " + inst.name + " - " + inst.meaning + "\n"
    }
  }
  return s
}