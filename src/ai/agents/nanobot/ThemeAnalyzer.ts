/**
 * ThemeAnalyzer — V365
 * Thematic depth tracking, motif detection, symbolic pattern recognition.
 * Inspired by: ruflo (hierarchical decomposition), generic-agent (pattern recognition)
 */

export interface Theme {
  id: string
  name: string
  occurrences: number
  locations: string[]
  associatedMotifs: string[]
  intensity: number  // 0-100
  evolution: ThemeArc[]
}

export interface ThemeArc {
  chapterId: string
  intensity: number
  notes?: string
}

export interface Motif {
  id: string
  symbol: string
  themeIds: string[]
  occurrences: number
  contexts: string[]
}

export interface ThemeAnalysis {
  primaryThemes: string[]
  dominantMotif: string | null
  thematicCoherence: number  // 0-100
  thematicDepth: number  // 0-100
  recommendations: string[]
}

export interface ThemeAnalyzerState {
  themes: Record<string, Theme>
  motifs: Record<string, Motif>
  analysis: ThemeAnalysis
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): ThemeAnalyzerState {
  return {
    themes: {},
    motifs: {},
    analysis: { primaryThemes: [], dominantMotif: null, thematicCoherence: 0, thematicDepth: 0, recommendations: [] },
    typeAlias: {},
  }
}

export function registerTheme(
  state: ThemeAnalyzerState,
  name: string,
  chapterId?: string,
  intensity: number = 50
): ThemeAnalyzerState {
  const id = `theme_${name.toLowerCase().replace(/\s+/g, '_')}`
  if (state.themes[id]) {
    const theme = state.themes[id]
    const occurrences = theme.occurrences + 1
    const locations = chapterId ? [...new Set([...theme.locations, chapterId])] : theme.locations
    const evolution: ThemeArc[] = chapterId ? [...theme.evolution, { chapterId, intensity }] : theme.evolution
    const avgIntensity = evolution.reduce((s, e) => s + e.intensity, 0) / evolution.length
    return { ...state, themes: { ...state.themes, [id]: { ...theme, occurrences, locations, evolution, intensity: avgIntensity } } }
  }
  const theme: Theme = {
    id, name, occurrences: 1, locations: chapterId ? [chapterId] : [],
    associatedMotifs: [], intensity, evolution: chapterId ? [{ chapterId, intensity }] : [],
  }
  return { ...state, themes: { ...state.themes, [id]: theme } }
}

export function registerMotif(
  state: ThemeAnalyzerState,
  symbol: string,
  themeName?: string,
  context?: string
): ThemeAnalyzerState {
  const id = `motif_${symbol.toLowerCase().replace(/\s+/g, '_')}`
  const themeId = themeName ? `theme_${themeName.toLowerCase().replace(/\s+/g, '_')}` : null
  const motif: Motif = {
    id, symbol, themeIds: themeId && state.themes[themeId] ? [themeId] : [],
    occurrences: 1, contexts: context ? [context] : [],
  }
  if (state.motifs[id]) {
    const existing = state.motifs[id]
    const occurrences = existing.occurrences + 1
    const contexts = context ? [...new Set([...existing.contexts, context])] : existing.contexts
    const themeIds = themeId && state.themes[themeId] ? [...new Set([...existing.themeIds, themeId])] : existing.themeIds
    return { ...state, motifs: { ...state.motifs, [id]: { ...existing, occurrences, contexts, themeIds } } }
  }
  return { ...state, motifs: { ...state.motifs, [id]: motif } }
}

export function analyzeThemes(state: ThemeAnalyzerState): ThemeAnalysis {
  const themes = Object.values(state.themes)
  const motifs = Object.values(state.motifs)
  if (themes.length === 0) {
    return { primaryThemes: [], dominantMotif: null, thematicCoherence: 0, thematicDepth: 0, recommendations: [] }
  }
  const primaryThemes = themes.sort((a, b) => b.occurrences - a.occurrences).slice(0, 3).map(t => t.name)
  const dominantMotif = motifs.length > 0 ? motifs.sort((a, b) => b.occurrences - a.occurrences)[0].symbol : null
  const thematicCoherence = Math.min(100, themes.filter(t => t.occurrences >= 3).length * 20 + motifs.filter(m => m.occurrences >= 2).length * 15)
  const thematicDepth = Math.min(100, Math.round(
    (themes.reduce((s, t) => s + t.associatedMotifs.length, 0) / Math.max(1, themes.length) * 25) +
    (themes.filter(t => t.evolution.length > 1).length / Math.max(1, themes.length) * 40) +
    (motifs.length / Math.max(1, themes.length) * 15) +
    20
  ))
  const recommendations: string[] = []
  if (thematicCoherence < 40) recommendations.push('Strengthen recurring themes across chapters')
  if (thematicDepth < 30) recommendations.push('Add symbolic motifs to deepen thematic resonance')
  if (primaryThemes.length < 2) recommendations.push('Develop more distinct primary themes')
  if (dominantMotif) recommendations.push(`Highlight recurring motif: "${dominantMotif}"`)
  return { primaryThemes, dominantMotif, thematicCoherence, thematicDepth, recommendations }
}

export function getThemeSummary(state: ThemeAnalyzerState, themeName: string) {
  const id = `theme_${themeName.toLowerCase().replace(/\s+/g, '_')}`
  const theme = state.themes[id]
  if (!theme) return null
  return {
    name: theme.name,
    occurrences: theme.occurrences,
    locations: theme.locations,
    associatedMotifs: theme.associatedMotifs,
    intensity: theme.intensity,
    arc: theme.evolution,
  }
}

export function compareThematicDepth(state: ThemeAnalyzerState, chapterId1: string, chapterId2: string) {
  const themes = Object.values(state.themes)
  const ch1Themes = themes.filter(t => t.locations.includes(chapterId1))
  const ch2Themes = themes.filter(t => t.locations.includes(chapterId2))
  return {
    deeperChapter: ch1Themes.length > ch2Themes.length ? chapterId1 : chapterId2,
    themeCountDiff: Math.abs(ch1Themes.length - ch2Themes.length),
    chapterThemes: { [chapterId1]: ch1Themes.length, [chapterId2]: ch2Themes.length },
  }
}
