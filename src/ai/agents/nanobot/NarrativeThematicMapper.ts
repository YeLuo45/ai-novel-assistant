/**
 * NarrativeThematicMapper — V417
 * Thematic mapping, motif tracking, symbolic pattern analysis across narrative.
 * Inspired by: ruflo (hierarchical decomposition), generic-agent (optimization), chatdev (pattern recognition)
 */

export type ThemeCategory = 'power_corruption' | 'redemption' | 'identity_quest' | 'nature_vs_civilization' | '个体_vs_集体' | 'truth_deception' | 'love_sacrifice' | 'order_chaos' | 'knowledge_ignorance' | 'freedom_fate'

export interface ThemeInstance {
  id: string
  category: ThemeCategory
  chapters: number[]  // chapters where this theme appears
  intensity: number  // 0-100 (how strongly present)
  manifestations: string[]  // specific instances
  progressionArc: 'rising' | 'falling' | 'stable' | 'cyclic'
}

export interface Motif {
  id: string
  symbol: string  // e.g., 'water', 'fire', 'shadow'
  appearances: Array<{ chapterId: string; context: string; meaning: string }>
  frequency: number
  associatedThemes: ThemeCategory[]
}

export interface ThematicMapReport {
  totalThemes: number
  dominantTheme: ThemeCategory | null
  motifCount: number
  underdevelopedThemes: ThemeCategory[]
  recommendations: string[]
}

export interface NarrativeThematicState {
  themes: ThemeInstance[]
  motifs: Motif[]
  report: ThematicMapReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeThematicState {
  return { themes: [], motifs: [], report: null, typeAlias: {} }
}

export function registerTheme(
  state: NarrativeThematicState,
  category: ThemeCategory,
  chapterId: number,
  manifestation: string,
  intensity: number = 60
): NarrativeThematicState {
  const existing = state.themes.find(t => t.category === category)
  if (existing) {
    const chapters = existing.chapters.includes(chapterId) ? existing.chapters : [...existing.chapters, chapterId].sort((a, b) => a - b)
    const manifestations = [...existing.manifestations, manifestation]
    const avgIntensity = Math.round([...existing.chapters.map((_, i) => existing.intensity), intensity].reduce((a, b) => a + b, 0) / (existing.chapters.length + 1))
    let progressionArc: ThemeInstance['progressionArc'] = 'stable'
    if (existing.chapters.length > 2) {
      const firstHalf = chapters.slice(0, Math.floor(chapters.length / 2))
      const secondHalf = chapters.slice(Math.floor(chapters.length / 2))
      const firstAvg = firstHalf.reduce((s, _, i) => s + existing.intensity, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((s, _, i) => s + intensity, 0) / secondHalf.length
      if (secondAvg > firstAvg + 10) progressionArc = 'rising'
      else if (secondAvg < firstAvg - 10) progressionArc = 'falling'
      else if (chapters.length > 4) progressionArc = 'cyclic'
    }
    const themes = state.themes.map(t => t.category === category ? { ...t, chapters, manifestations, intensity: avgIntensity, progressionArc } : t)
    return { ...state, themes }
  }
  
  const id = `theme_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const theme: ThemeInstance = { id, category, chapters: [chapterId], intensity, manifestations: [manifestation], progressionArc: 'rising' }
  return { ...state, themes: [...state.themes, theme] }
}

export function registerMotif(
  state: NarrativeThematicState,
  symbol: string,
  chapterId: string,
  context: string,
  meaning: string
): NarrativeThematicState {
  const existing = state.motifs.find(m => m.symbol.toLowerCase() === symbol.toLowerCase())
  if (existing) {
    const appearance = { chapterId, context, meaning }
    const appearances = [...existing.appearances.filter(a => !(a.chapterId === chapterId && a.context === context)), appearance]
    const motifs = state.motifs.map(m => m.symbol.toLowerCase() === symbol.toLowerCase() ? { ...m, appearances, frequency: appearances.length } : m)
    return { ...state, motifs }
  }
  
  const id = `motif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const motif: Motif = { id, symbol, appearances: [{ chapterId, context, meaning }], frequency: 1, associatedThemes: [] }
  return { ...state, motifs: [...state.motifs, motif] }
}

export function generateThematicReport(state: NarrativeThematicState): ThematicMapReport {
  if (state.themes.length === 0) {
    return { totalThemes: 0, dominantTheme: null, motifCount: 0, underdevelopedThemes: [], recommendations: [] }
  }
  
  const totalThemes = state.themes.length
  const dominant = [...state.themes].sort((a, b) => b.intensity - a.intensity)[0]
  const dominantTheme = dominant?.category || null
  const motifCount = state.motifs.length
  
  const underdevelopedThemes = state.themes.filter(t => t.chapters.length < 3).map(t => t.category)
  
  const recommendations: string[] = []
  if (underdevelopedThemes.length > totalThemes * 0.5) {
    recommendations.push(`${underdevelopedThemes.length} themes need more development`)
  }
  if (state.themes.filter(t => t.progressionArc === 'stable').length > totalThemes * 0.5) {
    recommendations.push('Many static themes - add progression for deeper engagement')
  }
  if (motifCount < totalThemes * 0.3) recommendations.push('Few motifs - add symbolic recurring elements')
  if (dominant && dominant.intensity > 85) recommendations.push(`"${dominantTheme}" is overwhelming - balance with secondary themes`)
  if (state.themes.some(t => t.progressionArc === 'cyclic')) recommendations.push('Some themes have cyclic patterns - good for layered meaning')
  if (totalThemes > 8) recommendations.push('Many themes - prioritize the main 3-4 for clarity')
  
  return { totalThemes, dominantTheme, motifCount, underdevelopedThemes, recommendations }
}

export function getThemeByCategory(state: NarrativeThematicState, category: ThemeCategory): ThemeInstance | null {
  return state.themes.find(t => t.category === category) || null
}

export function getMotifBySymbol(state: NarrativeThematicState, symbol: string): Motif | null {
  return state.motifs.find(m => m.symbol.toLowerCase() === symbol.toLowerCase()) || null
}
