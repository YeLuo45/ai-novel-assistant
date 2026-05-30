/**
 * NarrativeThemeTracker — V469
 * Theme tracking, motif frequency analysis, thematic coherence across narrative.
 * Inspired by: ruflo (hierarchical layers), chatdev (coherence), generic-agent (validation)
 */

export interface ThemePresence {
  id: string
  themeName: string
  chapterAppearances: number[]
  coherenceScore: number  // 0-100
  strengthTrend: 'rising' | 'stable' | 'fading'
  relatedThemes: string[]
}

export interface ThemeReport {
  totalThemes: number
  avgCoherence: number
  dominantTheme: string | null
  recommendations: string[]
}

export interface NarrativeThemeTrackerState {
  themes: ThemePresence[]
  report: ThemeReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeThemeTrackerState {
  return { themes: [], report: null, typeAlias: {} }
}

export function registerTheme(
  state: NarrativeThemeTrackerState,
  themeName: string,
  chapter: number
): NarrativeThemeTrackerState {
  const existing = state.themes.find(t => t.themeName === themeName)
  if (existing) {
    const themes = state.themes.map(t => {
      if (t.themeName !== themeName) return t
      const appearances = [...t.chapterAppearances, chapter].sort((a, b) => a - b)
      const coherenceScore = Math.min(100, 50 + appearances.length * 8)
      const first = appearances[0]
      const last = appearances[appearances.length - 1]
      let trend: 'rising' | 'stable' | 'fading' = 'stable'
      if (appearances.length >= 3) {
        const recent = appearances.slice(-3)
        const older = appearances.slice(-6, -3)
        if (recent.length > older.length) trend = 'rising'
        else if (recent.length < older.length) trend = 'fading'
      }
      return { ...t, chapterAppearances: appearances, coherenceScore, strengthTrend: trend }
    })
    return { ...state, themes }
  }
  const id = `theme_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const presence: ThemePresence = { id, themeName, chapterAppearances: [chapter], coherenceScore: 50, strengthTrend: 'stable', relatedThemes: [] }
  return { ...state, themes: [...state.themes, presence] }
}

export function linkThemes(state: NarrativeThemeTrackerState, theme1: string, theme2: string): NarrativeThemeTrackerState {
  const themes = state.themes.map(t => {
    if (t.themeName === theme1) return { ...t, relatedThemes: [...new Set([...t.relatedThemes, theme2])] }
    if (t.themeName === theme2) return { ...t, relatedThemes: [...new Set([...t.relatedThemes, theme1])] }
    return t
  })
  return { ...state, themes }
}

export function generateThemeReport(state: NarrativeThemeTrackerState): ThemeReport {
  if (state.themes.length === 0) {
    return { totalThemes: 0, avgCoherence: 100, dominantTheme: null, recommendations: [] }
  }
  const totalThemes = state.themes.length
  const avgCoherence = Math.round(state.themes.reduce((s, t) => s + t.coherenceScore, 0) / totalThemes)
  const dominantTheme = state.themes.sort((a, b) => b.chapterAppearances.length - a.chapterAppearances.length)[0]?.themeName || null
  const recommendations: string[] = []
  if (avgCoherence < 50) recommendations.push('Low theme coherence - revisit thematic elements')
  if (state.themes.filter(t => t.strengthTrend === 'fading').length > totalThemes * 0.4) recommendations.push('Many fading themes - strengthen before ending')
  if (state.themes.some(t => t.relatedThemes.length === 0)) recommendations.push('Some themes are isolated - link related themes')
  if (dominantTheme && state.themes.find(t => t.themeName === dominantTheme)?.strengthTrend === 'fading') {
    recommendations.push(`Main theme '${dominantTheme}' is fading - reinforce before climax`)
  }
  return { totalThemes, avgCoherence, dominantTheme, recommendations }
}

export function getThemeByName(state: NarrativeThemeTrackerState, themeName: string): ThemePresence | null {
  return state.themes.find(t => t.themeName === themeName) || null
}
