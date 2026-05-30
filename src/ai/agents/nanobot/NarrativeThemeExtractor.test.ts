import { describe, it, expect } from 'vitest'
import {
  createEmptyNarrativeThemeState,
  extractTheme,
  getThemeByName,
  getTopThemes,
  formatNarrativeThemeSummary,
  formatNarrativeThemeDashboard,
} from './NarrativeThemeExtractor'

describe('createEmptyNarrativeThemeState', () => {
  it('should create empty state', () => {
    const state = createEmptyNarrativeThemeState()
    expect(state.themes.length).toBe(0)
    expect(state.thematicCoherence).toBe(100)
    expect(state.themeCount).toBe(0)
  })
})

describe('extractTheme', () => {
  it('should add a new theme', () => {
    let state = createEmptyNarrativeThemeState()
    state = extractTheme(state, 1, 'love')
    expect(state.themes.length).toBe(1)
    expect(state.themes[0].theme).toBe('love')
    expect(state.currentChapter).toBe(1)
  })

  it('should increment occurrences for existing theme', () => {
    let state = createEmptyNarrativeThemeState()
    state = extractTheme(state, 1, 'love')
    state = extractTheme(state, 3, 'love')
    expect(state.themes[0].occurrences).toBe(2)
    expect(state.themes[0].chapters).toContain(1)
    expect(state.themes[0].chapters).toContain(3)
  })

  it('should update coherence score', () => {
    let state = createEmptyNarrativeThemeState()
    state = extractTheme(state, 1, 'love')
    state = extractTheme(state, 2, 'love')
    state = extractTheme(state, 3, 'love')
    expect(state.themes[0].coherenceScore).toBe(30)
  })

  it('should track multiple themes', () => {
    let state = createEmptyNarrativeThemeState()
    state = extractTheme(state, 1, 'love')
    state = extractTheme(state, 2, 'betrayal')
    state = extractTheme(state, 3, 'love')
    expect(state.themeCount).toBe(2)
  })
})

describe('getThemeByName', () => {
  it('should find theme by name', () => {
    let state = createEmptyNarrativeThemeState()
    state = extractTheme(state, 1, 'love')
    const found = getThemeByName(state, 'love')
    expect(found).toBeDefined()
    expect(found?.theme).toBe('love')
  })

  it('should return undefined for unknown theme', () => {
    const state = createEmptyNarrativeThemeState()
    expect(getThemeByName(state, 'unknown')).toBeUndefined()
  })
})

describe('getTopThemes', () => {
  it('should return themes sorted by occurrences', () => {
    let state = createEmptyNarrativeThemeState()
    state = extractTheme(state, 1, 'love')
    state = extractTheme(state, 2, 'betrayal')
    state = extractTheme(state, 3, 'love')
    state = extractTheme(state, 4, 'love')
    const top = getTopThemes(state, 2)
    expect(top[0].theme).toBe('love')
    expect(top.length).toBe(2)
  })
})

describe('formatNarrativeThemeSummary', () => {
  it('should show theme count', () => {
    let state = createEmptyNarrativeThemeState()
    state = extractTheme(state, 1, 'love')
    const summary = formatNarrativeThemeSummary(state)
    expect(summary).toContain('Total Themes: 1')
  })

  it('should show thematic coherence', () => {
    let state = createEmptyNarrativeThemeState()
    state = extractTheme(state, 1, 'love')
    const summary = formatNarrativeThemeSummary(state)
    expect(summary).toContain('Thematic Coherence:')
  })

  it('should show dominant theme count', () => {
    let state = createEmptyNarrativeThemeState()
    state = extractTheme(state, 1, 'love')
    state = extractTheme(state, 2, 'love')
    state = extractTheme(state, 3, 'love')
    const summary = formatNarrativeThemeSummary(state)
    expect(summary).toContain('Dominant Themes: 1')
  })
})

describe('formatNarrativeThemeDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptyNarrativeThemeState()
    state = extractTheme(state, 4, 'love')
    const dashboard = formatNarrativeThemeDashboard(state)
    expect(dashboard).toContain('Chapter: 4')
  })

  it('should show top themes', () => {
    let state = createEmptyNarrativeThemeState()
    state = extractTheme(state, 1, 'love')
    state = extractTheme(state, 2, 'betrayal')
    const dashboard = formatNarrativeThemeDashboard(state)
    expect(dashboard).toContain('love')
    expect(dashboard).toContain('betrayal')
  })

  it('should show coherence score', () => {
    let state = createEmptyNarrativeThemeState()
    state = extractTheme(state, 1, 'love')
    const dashboard = formatNarrativeThemeDashboard(state)
    expect(dashboard).toContain('Coherence:')
  })
})
