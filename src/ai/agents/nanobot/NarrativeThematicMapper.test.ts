import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  registerTheme,
  registerMotif,
  generateThematicReport,
  getThemeByCategory,
  getMotifBySymbol,
} from './NarrativeThematicMapper'

describe('createEmptyState', () => {
  it('should create empty thematic state', () => {
    const s = createEmptyState()
    expect(s.themes).toEqual([])
    expect(s.motifs).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('registerTheme', () => {
  it('should register a new theme', () => {
    let s = createEmptyState()
    s = registerTheme(s, 'power_corruption', 1, 'King becomes tyrant', 80)
    expect(s.themes.length).toBe(1)
    expect(s.themes[0].category).toBe('power_corruption')
    expect(s.themes[0].chapters).toContain(1)
  })

  it('should extend existing theme', () => {
    let s = createEmptyState()
    s = registerTheme(s, 'power_corruption', 1, 'King becomes tyrant', 80)
    s = registerTheme(s, 'power_corruption', 5, 'Queen plotting', 70)
    expect(s.themes.length).toBe(1)
    expect(s.themes[0].chapters.length).toBe(2)
    expect(s.themes[0].manifestations.length).toBe(2)
  })
})

describe('registerMotif', () => {
  it('should register a motif', () => {
    let s = createEmptyState()
    s = registerMotif(s, 'water', 'ch1', 'Ocean scene', 'rebirth')
    expect(s.motifs.length).toBe(1)
    expect(s.motifs[0].symbol).toBe('water')
    expect(s.motifs[0].frequency).toBe(1)
  })

  it('should extend existing motif', () => {
    let s = createEmptyState()
    s = registerMotif(s, 'water', 'ch1', 'Ocean', 'rebirth')
    s = registerMotif(s, 'water', 'ch5', 'River', 'purification')
    expect(s.motifs.length).toBe(1)
    expect(s.motifs[0].frequency).toBe(2)
  })
})

describe('generateThematicReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateThematicReport(s)
    expect(report.totalThemes).toBe(0)
    expect(report.dominantTheme).toBeNull()
  })

  it('should identify dominant theme', () => {
    let s = createEmptyState()
    s = registerTheme(s, 'power_corruption', 1, 'King', 80)
    s = registerTheme(s, 'redemption', 1, 'Hero', 50)
    const report = generateThematicReport(s)
    expect(report.dominantTheme).toBe('power_corruption')
  })
})

describe('getThemeByCategory', () => {
  it('should return theme by category', () => {
    let s = createEmptyState()
    s = registerTheme(s, 'truth_deception', 2, 'Lies exposed', 65)
    const theme = getThemeByCategory(s, 'truth_deception')
    expect(theme).not.toBeNull()
    expect(theme!.category).toBe('truth_deception')
  })

  it('should return null for unknown category', () => {
    const s = createEmptyState()
    expect(getThemeByCategory(s, 'power_corruption')).toBeNull()
  })
})

describe('getMotifBySymbol', () => {
  it('should return motif by symbol', () => {
    let s = createEmptyState()
    s = registerMotif(s, 'fire', 'ch1', 'Bonfire', 'passion')
    const motif = getMotifBySymbol(s, 'fire')
    expect(motif).not.toBeNull()
    expect(motif!.symbol).toBe('fire')
  })

  it('should be case insensitive', () => {
    let s = createEmptyState()
    s = registerMotif(s, 'Shadow', 'ch1', 'Darkness', 'unknown')
    expect(getMotifBySymbol(s, 'shadow')).not.toBeNull()
  })
})
