import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  registerTheme,
  linkThemes,
  generateThemeReport,
  getThemeByName,
} from './NarrativeThemeTracker'

describe('createEmptyState', () => {
  it('should create empty state', () => {
    const s = createEmptyState()
    expect(s.themes).toEqual([])
  })
})

describe('registerTheme', () => {
  it('should register new theme', () => {
    let s = createEmptyState()
    s = registerTheme(s, 'love', 5)
    expect(s.themes.length).toBe(1)
    expect(s.themes[0].themeName).toBe('love')
    expect(s.themes[0].coherenceScore).toBe(50)
  })

  it('should accumulate appearances', () => {
    let s = createEmptyState()
    s = registerTheme(s, 'love', 5)
    s = registerTheme(s, 'love', 10)
    s = registerTheme(s, 'love', 15)
    expect(s.themes[0].chapterAppearances.length).toBe(3)
    expect(s.themes[0].coherenceScore).toBeGreaterThan(50)
  })
})

describe('linkThemes', () => {
  it('should link two themes', () => {
    let s = createEmptyState()
    s = registerTheme(s, 'love', 5)
    s = registerTheme(s, 'sacrifice', 10)
    s = linkThemes(s, 'love', 'sacrifice')
    const love = getThemeByName(s, 'love')
    const sacrifice = getThemeByName(s, 'sacrifice')
    expect(love!.relatedThemes).toContain('sacrifice')
    expect(sacrifice!.relatedThemes).toContain('love')
  })
})

describe('generateThemeReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateThemeReport(s)
    expect(report.totalThemes).toBe(0)
    expect(report.dominantTheme).toBeNull()
  })

  it('should identify dominant theme', () => {
    let s = createEmptyState()
    s = registerTheme(s, 'love', 5)
    s = registerTheme(s, 'love', 10)
    s = registerTheme(s, 'love', 15)
    s = registerTheme(s, 'war', 20)
    const report = generateThemeReport(s)
    expect(report.dominantTheme).toBe('love')
    expect(report.totalThemes).toBe(2)
  })
})

describe('getThemeByName', () => {
  it('should return theme', () => {
    let s = createEmptyState()
    s = registerTheme(s, 'love', 5)
    const theme = getThemeByName(s, 'love')
    expect(theme).not.toBeNull()
    expect(theme!.themeName).toBe('love')
  })

  it('should return null for missing', () => {
    let s = createEmptyState()
    expect(getThemeByName(s, 'nonexistent')).toBeNull()
  })
})
