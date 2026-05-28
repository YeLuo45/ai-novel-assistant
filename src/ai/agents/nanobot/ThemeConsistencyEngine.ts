export interface ThemeOccurrence {
  occurrenceId: string
  chapter: number
  context: string
  intensity: number  // 0-100
}

export interface ThemeState {
  theme: string
  occurrences: ThemeOccurrence[]
  consistencyScore: number  // 0-100
  variationCount: number
}

export interface ThemeConsistencyState {
  themes: Map<string, ThemeState>
  currentChapter: number
  overallConsistency: number  // 0-100
}

function createOccurrenceId(): string {
  return 'theme_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function assessConsistency(occurrences: ThemeOccurrence[]): number {
  if (occurrences.length < 2) return 100
  const intensities = occurrences.map(o => o.intensity)
  const range = Math.max(...intensities) - Math.min(...intensities)
  return Math.max(0, 100 - range * 0.5)
}

function countVariations(occurrences: ThemeOccurrence[]): number {
  if (occurrences.length < 3) return 0
  let variations = 0
  for (let i = 1; i < occurrences.length; i++) {
    const diff = Math.abs(occurrences[i].intensity - occurrences[i-1].intensity)
    if (diff > 30) variations++
  }
  return variations
}

export function createEmptyThemeConsistencyState(): ThemeConsistencyState {
  return { themes: new Map(), currentChapter: 0, overallConsistency: 100 }
}

export function recordThemeOccurrence(
  state: ThemeConsistencyState,
  theme: string,
  chapter: number,
  context: string,
  intensity: number
): ThemeConsistencyState {
  const newThemes = new Map(state.themes)

  let themeState = newThemes.get(theme)
  if (!themeState) {
    themeState = { theme, occurrences: [], consistencyScore: 100, variationCount: 0 }
  }

  const occurrence: ThemeOccurrence = {
    occurrenceId: createOccurrenceId(),
    chapter,
    context,
    intensity,
  }

  const newOccurrences = [...themeState.occurrences, occurrence]
  const newThemeState: ThemeState = {
    ...themeState,
    occurrences: newOccurrences,
    consistencyScore: assessConsistency(newOccurrences),
    variationCount: countVariations(newOccurrences),
  }

  newThemes.set(theme, newThemeState)

  // Recalculate overall consistency
  const allThemes = [...newThemes.values()]
  const avgConsistency = allThemes.length > 0
    ? Math.round(allThemes.reduce((sum, t) => sum + t.consistencyScore, 0) / allThemes.length)
    : 100

  return {
    ...state,
    themes: newThemes,
    currentChapter: Math.max(state.currentChapter, chapter),
    overallConsistency: avgConsistency,
  }
}

export function getThemeOccurrences(state: ThemeConsistencyState, theme: string): ThemeOccurrence[] {
  return state.themes.get(theme)?.occurrences || []
}

export function getThemeConsistencyScore(state: ThemeConsistencyState, theme: string): number {
  return state.themes.get(theme)?.consistencyScore || 0
}

export function formatThemeSummary(state: ThemeConsistencyState): string {
  let s = "=== Theme Consistency Summary ===" + "\n"
  s += "Themes Tracked: " + state.themes.size + "\n"
  s += "Overall Consistency: " + state.overallConsistency + "\n"
  s += "Chapter: " + state.currentChapter + "\n"
  return s
}

export function formatThemeDashboard(state: ThemeConsistencyState): string {
  let s = "=== Theme Dashboard ===" + "\n"
  s += "Overall Consistency: " + state.overallConsistency + "\n"

  if (state.themes.size > 0) {
    s += "\n--- Theme Status ---" + "\n"
    for (const [, ts] of state.themes) {
      s += "  " + ts.theme + ": " + ts.occurrences.length + " occurrences, consistency=" + ts.consistencyScore
      if (ts.variationCount > 0) s += ", variations=" + ts.variationCount
      s += "\n"
    }
  }

  return s
}
