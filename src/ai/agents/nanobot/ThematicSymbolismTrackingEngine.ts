/**
 * ThematicSymbolismTrackingEngine — V523
 * Tracks symbolic motifs, thematic threads, and narrative imagery across the story.
 * Inspired by: thunderbolt (pipeline/feedback loops) + ruflo (hierarchical decomposition)
 */

export interface SymbolOccurrence {
  chapter: number
  page: number
  context: string
  emotionalResonance: number   // -50 to 50
  interpretation: string
}

export interface NarrativeSymbol {
  id: string
  name: string
  category: 'object' | 'color' | 'animal' | 'weather' | 'place' | 'action' | 'abstract'
  surfaceForms: string[]
  occurrences: SymbolOccurrence[]
  evolutionArc: number[]     // resonance at each chapter
  connectedThemes: string[]
  culturalassociations: string[]
  hiddenMeaning: string
  surfaceMeaning: string
}

export interface ThematicThread {
  id: string
  name: string
  description: string
  firstAppearance: { chapter: number, page: number, description: string }
  appearances: Array<{ chapter: number, page: number, description: string }>
  intensityOverTime: number[]  // 0-100 at each chapter
  dominantSymbols: string[]
  resolutionStatus: 'unresolved' | 'building' | 'near_resolution' | 'resolved'
  readerAwareness: 'unconscious' | 'suspected' | 'recognized' | 'fully_aware'
}

export interface ImageryLayer {
  id: string
  type: 'visual' | 'auditory' | 'tactile' | 'olfactory' | 'gustatory' | 'kinesthetic'
  elements: string[]
  dominantMood: string
  frequencyByChapter: number[]
}

export interface ThematicState {
  symbols: Record<string, NarrativeSymbol>
  themes: Record<string, ThematicThread>
  imagery: Record<string, ImageryLayer>
  dominantTheme: string | null
  symbolismDensity: number   // symbols per chapter
}

export function createEmptyState(): ThematicState {
  return {
    symbols: {},
    themes: {},
    imagery: {},
    dominantTheme: null,
    symbolismDensity: 0
  }
}

export function registerSymbol(state: ThematicState, symbolId: string, name: string, category: NarrativeSymbol['category'], surfaceForms: string[], hiddenMeaning: string, surfaceMeaning: string): ThematicState {
  if (state.symbols[symbolId]) return state
  
  return {
    ...state,
    symbols: {
      ...state.symbols,
      [symbolId]: {
        id: symbolId,
        name,
        category,
        surfaceForms,
        occurrences: [],
        evolutionArc: [],
        connectedThemes: [],
        culturalassociations: [],
        hiddenMeaning,
        surfaceMeaning
      }
    }
  }
}

export function recordSymbolOccurrence(state: ThematicState, symbolId: string, chapter: number, page: number, context: string, emotionalResonance: number, interpretation: string): ThematicState {
  const symbol = state.symbols[symbolId]
  if (!symbol) return state
  
  const occurrence: SymbolOccurrence = { chapter, page, context, emotionalResonance, interpretation }
  const updatedArc = [...symbol.evolutionArc]
  updatedArc[chapter] = (updatedArc[chapter] || 0) + Math.abs(emotionalResonance)
  
  return {
    ...state,
    symbols: {
      ...state.symbols,
      [symbolId]: {
        ...symbol,
        occurrences: [...symbol.occurrences, occurrence],
        evolutionArc: updatedArc
      }
    }
  }
}

export function establishThematicThread(state: ThematicState, themeId: string, name: string, description: string, chapter: number, page: number, description_text: string): ThematicState {
  if (state.themes[themeId]) return state
  
  return {
    ...state,
    themes: {
      ...state.themes,
      [themeId]: {
        id: themeId,
        name,
        description,
        firstAppearance: { chapter, page, description: description_text },
        appearances: [{ chapter, page, description: description_text }],
        intensityOverTime: [],
        dominantSymbols: [],
        resolutionStatus: 'unresolved',
        readerAwareness: 'unconscious'
      }
    }
  }
}

export function updateThreadIntensity(state: ThematicState, themeId: string, chapter: number, intensity: number): ThematicState {
  const theme = state.themes[themeId]
  if (!theme) return state
  
  const intensityOverTime = [...theme.intensityOverTime]
  intensityOverTime[chapter] = intensity
  
  let resolutionStatus: ThematicThread['resolutionStatus'] = theme.resolutionStatus
  if (intensity > 95) resolutionStatus = 'near_resolution'
  else if (intensity > 80) resolutionStatus = 'building'
  else if (intensity > 0) resolutionStatus = 'unresolved'
  
  return {
    ...state,
    themes: {
      ...state.themes,
      [themeId]: {
        ...theme,
        intensityOverTime,
        resolutionStatus
      }
    }
  }
}

export function linkSymbolToTheme(state: ThematicState, symbolId: string, themeId: string): ThematicState {
  const symbol = state.symbols[symbolId]
  const theme = state.themes[themeId]
  if (!symbol || !theme) return state
  
  if (symbol.connectedThemes.includes(themeId)) return state
  
  return {
    ...state,
    symbols: {
      ...state.symbols,
      [symbolId]: {
        ...symbol,
        connectedThemes: [...symbol.connectedThemes, themeId]
      }
    },
    themes: {
      ...state.themes,
      [themeId]: {
        ...theme,
        dominantSymbols: [...theme.dominantSymbols, symbolId]
      }
    }
  }
}

export function trackImageryLayer(state: ThematicState, layerId: string, type: ImageryLayer['type'], elements: string[], dominantMood: string): ThematicState {
  if (state.imagery[layerId]) return state
  
  return {
    ...state,
    imagery: {
      ...state.imagery,
      [layerId]: {
        id: layerId,
        type,
        elements,
        dominantMood,
        frequencyByChapter: []
      }
    }
  }
}

export function recordImageryElement(state: ThematicState, layerId: string, element: string, chapter: number): ThematicState {
  const layer = state.imagery[layerId]
  if (!layer) return state
  
  const frequencyByChapter = [...layer.frequencyByChapter]
  frequencyByChapter[chapter] = (frequencyByChapter[chapter] || 0) + 1
  
  if (!layer.elements.includes(element)) {
    return {
      ...state,
      imagery: {
        ...state.imagery,
        [layerId]: {
          ...layer,
          elements: [...layer.elements, element],
          frequencyByChapter
        }
      }
    }
  }
  
  return {
    ...state,
    imagery: {
      ...state.imagery,
      [layerId]: {
        ...layer,
        frequencyByChapter
      }
    }
  }
}

export function identifyDominantTheme(state: ThematicState): ThematicState {
  const themeObjects = Object.values(state.themes)
  if (themeObjects.length === 0) return { ...state, dominantTheme: null }
  
  let dominant = themeObjects[0]
  let maxIntensity = 0
  
  for (const theme of themeObjects) {
    const maxIntensity_theme = theme.intensityOverTime.reduce((max, val) => Math.max(max, val || 0), 0)
    if (maxIntensity_theme > maxIntensity) {
      maxIntensity = maxIntensity_theme
      dominant = theme
    }
  }
  
  return { ...state, dominantTheme: dominant.id }
}

export function calculateSymbolismDensity(state: ThematicState): number {
  const totalSymbols = Object.values(state.symbols).reduce((sum, s) => sum + s.occurrences.length, 0)
  const maxChapter = Object.values(state.symbols).reduce((max, s) => {
    const sMax = s.occurrences.reduce((m, o) => Math.max(m, o.chapter), 0)
    return Math.max(max, sMax)
  }, 0)
  
  if (maxChapter === 0) return 0
  return Math.round((totalSymbols / (maxChapter + 1)) * 10) / 10
}

export function getSymbolById(state: ThematicState, symbolId: string): NarrativeSymbol | null {
  return state.symbols[symbolId] || null
}

export function getThemeById(state: ThematicState, themeId: string): ThematicThread | null {
  return state.themes[themeId] || null
}

export function getSymbolsByCategory(state: ThematicState, category: NarrativeSymbol['category']): NarrativeSymbol[] {
  return Object.values(state.symbols).filter(s => s.category === category)
}

export function getThematicSummary(state: ThematicState): {
  totalSymbols: number
  totalThemes: number
  dominantTheme: string | null
  resolvedThemes: number
  symbolismDensity: number
} {
  const resolvedThemes = Object.values(state.themes).filter(t => t.resolutionStatus === 'resolved').length
  return {
    totalSymbols: Object.keys(state.symbols).length,
    totalThemes: Object.keys(state.themes).length,
    dominantTheme: state.dominantTheme,
    resolvedThemes,
    symbolismDensity: calculateSymbolismDensity(state)
  }
}