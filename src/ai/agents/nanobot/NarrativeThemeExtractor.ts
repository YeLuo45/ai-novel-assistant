export interface ThemeEntry {
  themeId: string
  theme: string
  occurrences: number
  chapters: number[]
  coherenceScore: number  // 0-100 how consistently this theme appears
  dominantChapter: number  // chapter where this theme is most prominent
}

export interface NarrativeThemeState {
  themes: ThemeEntry[]
  currentChapter: number
  dominantThemes: string[]  // themes that appear in most chapters
  thematicCoherence: number  // 0-100 overall thematic coherence
  themeCount: number
}

function createThemeId(): string {
  return 'theme_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

export function createEmptyNarrativeThemeState(): NarrativeThemeState {
  return { themes: [], currentChapter: 0, dominantThemes: [], thematicCoherence: 100, themeCount: 0 }
}

export function extractTheme(
  state: NarrativeThemeState,
  chapter: number,
  theme: string
): NarrativeThemeState {
  const existing = state.themes.find(t => t.theme === theme)
  let newThemes: ThemeEntry[]

  if (existing) {
    newThemes = state.themes.map(t => {
      if (t.theme === theme) {
        const newOccurrences = t.occurrences + 1
        const newChapters = [...t.chapters, chapter]
        const dominantChapter = newChapters.length > 0 ? newChapters[Math.floor(newChapters.length / 2)] : chapter
        return {
          ...t,
          occurrences: newOccurrences,
          chapters: newChapters,
          dominantChapter,
          coherenceScore: Math.min(100, Math.round(newOccurrences * 10)),
        }
      }
      return t
    })
  } else {
    const newEntry: ThemeEntry = {
      themeId: createThemeId(),
      theme,
      occurrences: 1,
      chapters: [chapter],
      coherenceScore: 10,
      dominantChapter: chapter,
    }
    newThemes = [...state.themes, newEntry]
  }

  // Calculate dominant themes (themes in >= 50% of chapters)
  const chapterSpan = state.currentChapter > 0 ? state.currentChapter : 1
  const dominant = newThemes
    .filter(t => t.occurrences >= Math.ceil(chapterSpan * 0.5))
    .map(t => t.theme)

  // Calculate thematic coherence
  const avgCoherence = newThemes.reduce((s, t) => s + t.coherenceScore, 0) / Math.max(1, newThemes.length)

  return {
    themes: newThemes,
    currentChapter: chapter,
    dominantThemes: dominant,
    thematicCoherence: Math.round(avgCoherence),
    themeCount: newThemes.length,
  }
}

export function getThemeByName(state: NarrativeThemeState, theme: string): ThemeEntry | undefined {
  return state.themes.find(t => t.theme === theme)
}

export function getTopThemes(state: NarrativeThemeState, count: number = 5): ThemeEntry[] {
  return [...state.themes].sort((a, b) => b.occurrences - a.occurrences).slice(0, count)
}

export function formatNarrativeThemeSummary(state: NarrativeThemeState): string {
  let s = "=== Narrative Theme Summary ===" + "\n"
  s += "Total Themes: " + state.themeCount + "\n"
  s += "Thematic Coherence: " + state.thematicCoherence + "\n"
  s += "Dominant Themes: " + state.dominantThemes.length + "\n"
  return s
}

export function formatNarrativeThemeDashboard(state: NarrativeThemeState): string {
  let s = "=== Narrative Theme Dashboard ===" + "\n"
  s += "Chapter: " + state.currentChapter + " | Coherence: " + state.thematicCoherence + "\n"
  s += "Total Themes: " + state.themeCount + " | Dominant: " + state.dominantThemes.length + "\n"

  if (state.themes.length > 0) {
    s += "\n--- Top Themes ---" + "\n"
    for (const t of getTopThemes(state, 5)) {
      s += "  " + t.theme + " x" + t.occurrences + " [coherence=" + t.coherenceScore + "]" + "\n"
    }
  }

  if (state.dominantThemes.length > 0) {
    s += "\n--- Dominant Themes ---" + "\n"
    for (const theme of state.dominantThemes) {
      s += "  " + theme + "\n"
    }
  }

  return s
}
