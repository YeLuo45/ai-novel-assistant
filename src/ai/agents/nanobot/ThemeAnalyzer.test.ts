import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  registerTheme,
  registerMotif,
  analyzeThemes,
  getThemeSummary,
  compareThematicDepth,
} from './ThemeAnalyzer'

describe('createEmptyState', () => {
  it('should create empty theme state', () => {
    const s = createEmptyState()
    expect(s.themes).toEqual({})
    expect(s.motifs).toEqual({})
    expect(s.typeAlias).toEqual({})
  })
})

describe('registerTheme', () => {
  it('should register a theme', () => {
    let s = createEmptyState()
    s = registerTheme(s, 'Redemption', 'ch1', 70)
    expect(Object.keys(s.themes).length).toBe(1)
    const theme = Object.values(s.themes)[0]
    expect(theme.name).toBe('Redemption')
    expect(theme.occurrences).toBe(1)
    expect(theme.intensity).toBe(70)
  })

  it('should increment occurrences for existing theme', () => {
    let s = createEmptyState()
    s = registerTheme(s, 'Redemption', 'ch1', 50)
    s = registerTheme(s, 'Redemption', 'ch2', 70)
    expect(Object.values(s.themes)[0].occurrences).toBe(2)
  })

  it('should track locations', () => {
    let s = createEmptyState()
    s = registerTheme(s, 'Redemption', 'ch1')
    s = registerTheme(s, 'Redemption', 'ch2')
    expect(Object.values(s.themes)[0].locations).toContain('ch1')
    expect(Object.values(s.themes)[0].locations).toContain('ch2')
  })
})

describe('registerMotif', () => {
  it('should register a motif', () => {
    let s = createEmptyState()
    s = registerMotif(s, 'Fire', 'Redemption')
    expect(Object.keys(s.motifs).length).toBe(1)
    const motif = Object.values(s.motifs)[0]
    expect(motif.symbol).toBe('Fire')
    expect(motif.occurrences).toBe(1)
  })

  it('should link motif to theme', () => {
    let s = createEmptyState()
    s = registerTheme(s, 'Redemption', 'ch1')
    s = registerMotif(s, 'Fire', 'Redemption', 'burning building')
    const motif = Object.values(s.motifs)[0]
    expect(motif.themeIds.length).toBeGreaterThan(0)
    expect(motif.contexts).toContain('burning building')
  })
})

describe('analyzeThemes', () => {
  it('should return empty analysis for no themes', () => {
    const s = createEmptyState()
    const analysis = analyzeThemes(s)
    expect(analysis.primaryThemes).toEqual([])
    expect(analysis.thematicCoherence).toBe(0)
  })

  it('should identify primary themes', () => {
    let s = createEmptyState()
    s = registerTheme(s, 'Redemption', 'ch1', 70)
    s = registerTheme(s, 'Redemption', 'ch2', 80)
    s = registerTheme(s, 'Redemption', 'ch3', 90)
    s = registerTheme(s, 'Betrayal', 'ch1', 60)
    s = registerTheme(s, 'Betrayal', 'ch2', 65)
    s = registerTheme(s, 'Love', 'ch1', 50)
    const analysis = analyzeThemes(s)
    expect(analysis.primaryThemes).toContain('Redemption')
    expect(analysis.primaryThemes.length).toBe(3)
  })

  it('should calculate coherence and depth', () => {
    let s = createEmptyState()
    s = registerTheme(s, 'Revenge', 'ch1', 50)
    s = registerTheme(s, 'Revenge', 'ch2', 60)
    s = registerTheme(s, 'Revenge', 'ch3', 70)
    s = registerMotif(s, 'Knife', 'Revenge', 'scene1')
    const analysis = analyzeThemes(s)
    expect(analysis.thematicCoherence).toBeGreaterThan(0)
    expect(analysis.thematicDepth).toBeGreaterThan(0)
  })
})

describe('getThemeSummary', () => {
  it('should return null for unknown theme', () => {
    const s = createEmptyState()
    expect(getThemeSummary(s, 'Unknown')).toBeNull()
  })

  it('should return theme summary', () => {
    let s = createEmptyState()
    s = registerTheme(s, 'Redemption', 'ch1', 80)
    s = registerTheme(s, 'Redemption', 'ch2', 85)
    const summary = getThemeSummary(s, 'Redemption')
    expect(summary).not.toBeNull()
    expect(summary!.name).toBe('Redemption')
    expect(summary!.occurrences).toBe(2)
  })
})

describe('compareThematicDepth', () => {
  it('should compare chapters', () => {
    let s = createEmptyState()
    s = registerTheme(s, 'Redemption', 'ch1', 70)
    s = registerTheme(s, 'Revenge', 'ch1', 80)
    s = registerTheme(s, 'Redemption', 'ch2', 60)
    const result = compareThematicDepth(s, 'ch1', 'ch2')
    expect(result.deeperChapter).toBe('ch1')
    expect(result.chapterThemes.ch1).toBe(2)
  })
})
