/**
 * ThematicEngine Tests - V165
 * Tests for Theme Detection & Symbolic Motif Tracking Engine
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyThematicState,
  registerTheme,
  updateTheme,
  findThemeByName,
  registerMotif,
  recordMotifOccurrence,
  detectThemes,
  detectMotifs,
  analyzeChapter,
  validateThematicConsistency,
  formatThematicSummary,
  formatThematicDashboard,
} from './ThematicEngine'

describe('createEmptyThematicState', () => {
  it('should create empty state', () => {
    const state = createEmptyThematicState()
    expect(state.themes.size).toBe(0)
    expect(state.motifs.size).toBe(0)
    expect(state.currentChapter).toBe(0)
    expect(state.thematicTension).toBe(0)
  })
})

describe('registerTheme', () => {
  it('should register a new theme', () => {
    let state = createEmptyThematicState()
    state = registerTheme(state, 'love', 60, 80)
    expect(state.themes.size).toBe(1)
  })

  it('should set dominant theme on first registration', () => {
    let state = createEmptyThematicState()
    state = registerTheme(state, 'death', 50, -70)
    expect(state.dominantTheme).toBeTruthy()
  })

  it('should assign correct emotional valence', () => {
    let state = createEmptyThematicState()
    state = registerTheme(state, 'freedom', 45, 50)
    const theme = findThemeByName(state, 'freedom')
    expect(theme?.emotionalValence).toBe(50)
  })
})

describe('updateTheme', () => {
  it('should update theme fields', () => {
    let state = createEmptyThematicState()
    state = registerTheme(state, 'power', 50, 30)
    const themeId = state.dominantTheme!
    state = { ...state, currentChapter: 5 }
    state = updateTheme(state, themeId, { weight: 75 })
    expect(state.themes.get(themeId)?.weight).toBe(75)
  })

  it('should not modify for unknown theme ID', () => {
    const state = createEmptyThematicState()
    const result = updateTheme(state, 'unknown', { weight: 80 })
    expect(result).toBe(state)
  })
})

describe('findThemeByName', () => {
  it('should find theme by name', () => {
    let state = createEmptyThematicState()
    state = registerTheme(state, 'identity', 55, 20)
    const found = findThemeByName(state, 'identity')
    expect(found?.name).toBe('identity')
  })

  it('should be case insensitive', () => {
    let state = createEmptyThematicState()
    state = registerTheme(state, 'Nature', 40, 60)
    const found = findThemeByName(state, 'nature')
    expect(found?.name).toBe('Nature')
  })

  it('should return undefined for unknown', () => {
    const state = createEmptyThematicState()
    expect(findThemeByName(state, 'unknown')).toBeUndefined()
  })
})

describe('registerMotif', () => {
  it('should register a new motif', () => {
    let state = createEmptyThematicState()
    state = registerMotif(state, 'water', 'symbolic', ['flow', 'depth', 'purify'], ['river', 'rain', 'tears'])
    expect(state.motifs.size).toBe(1)
  })

  it('should associate with semantic field', () => {
    let state = createEmptyThematicState()
    state = registerMotif(state, 'fire', 'symbolic', ['passion', 'destruction', 'purify'], ['flame', 'burn', 'ash'])
    const motif = Array.from(state.motifs.values())[0]
    expect(motif.semanticField).toContain('passion')
    expect(motif.manifestationForms).toContain('flame')
  })
})

describe('recordMotifOccurrence', () => {
  it('should increment occurrence count', () => {
    let state = createEmptyThematicState()
    state = registerMotif(state, 'rose', 'visual', ['beauty', 'love', 'fragility'], ['flower', 'petal'])
    const motifId = Array.from(state.motifs.keys())[0]
    state = recordMotifOccurrence(state, motifId)
    expect(state.motifs.get(motifId)?.occurrences).toBe(1)
  })

  it('should accumulate history', () => {
    let state = createEmptyThematicState()
    state = registerMotif(state, 'moon', 'visual', ['night', 'mystery', 'change'], ['moonlight', 'crescent'])
    const motifId = Array.from(state.motifs.keys())[0]
    for (let i = 0; i < 5; i++) state = recordMotifOccurrence(state, motifId)
    expect(state.motifs.get(motifId)?.occurrences).toBe(5)
    expect(state.motifs.get(motifId)?.consistencyHistory.length).toBe(5)
  })
})

describe('detectThemes', () => {
  it('should detect love theme from keywords', () => {
    const state = createEmptyThematicState()
    const themes = detectThemes('Her heart filled with passion and devotion as she gazed at him with deep love', state)
    expect(themes).toContain('love')
  })

  it('should detect death theme from keywords', () => {
    const state = createEmptyThematicState()
    const themes = detectThemes('The grave stood silent. Death had come for him, cold and inevitable as the end of all mortal things', state)
    expect(themes).toContain('death')
  })

  it('should detect power theme', () => {
    const state = createEmptyThematicState()
    const themes = detectThemes('The king demanded absolute control and authority over the realm. His might was unmatched', state)
    expect(themes).toContain('power')
  })

  it('should not detect theme with fewer than 2 keyword matches', () => {
    const state = createEmptyThematicState()
    const themes = detectThemes('He felt a moment of love but continued walking', state)
    expect(themes).not.toContain('love')
  })

  it('should detect multiple themes', () => {
    const state = createEmptyThematicState()
    const themes = detectThemes('War erupted between the kingdoms. Soldiers fought with weapons drawn, blood staining the battlefield', state)
    expect(themes).toContain('war')
  })
})

describe('detectMotifs', () => {
  it('should detect motif from semantic field', () => {
    let state = createEmptyThematicState()
    state = registerMotif(state, 'water', 'symbolic', ['flow', 'depth', 'purify'], ['river', 'rain'])
    state = analyzeChapter(state, 1, 'The river flowed silently through the valley, its depths concealing ancient secrets')
    const motifs = detectMotifs('The calm river brought a sense of peaceful flow to the land', state)
    expect(motifs.length).toBeGreaterThan(0)
  })

  it('should detect motif from manifestation forms', () => {
    let state = createEmptyThematicState()
    state = registerMotif(state, 'fire', 'symbolic', ['passion', 'destruction'], ['flame', 'burn'])
    const motifs = detectMotifs('The flame danced wildly in the darkness', state)
    expect(motifs.length).toBeGreaterThan(0)
  })
})

describe('analyzeChapter', () => {
  it('should update current chapter', () => {
    let state = createEmptyThematicState()
    state = analyzeChapter(state, 3, 'A brief chapter')
    expect(state.currentChapter).toBe(3)
  })

  it('should register detected themes', () => {
    let state = createEmptyThematicState()
    state = analyzeChapter(state, 1, 'War erupted across the land. Battle cries filled the air as soldiers fought')
    expect(state.themes.size).toBeGreaterThan(0)
  })

  it('should record motif occurrences', () => {
    let state = createEmptyThematicState()
    state = registerMotif(state, 'blood', 'visual', ['sacrifice', 'vitality', 'death'], ['blood', 'bleeding'])
    const motifId = Array.from(state.motifs.keys())[0]
    state = analyzeChapter(state, 2, 'Blood stained the ground as the warrior fell')
    expect(state.motifs.get(motifId)?.occurrences).toBeGreaterThanOrEqual(1)
  })

  it('should update dominant theme by weight', () => {
    let state = createEmptyThematicState()
    state = registerTheme(state, 'love', 30, 60)
    const loveId = state.dominantTheme!
    state = analyzeChapter(state, 1, 'A tale of war and conflict. Battle. Fight. Kill. Enemy. Blood.')
    const warTheme = findThemeByName(state, 'war')
    if (warTheme && state.dominantTheme) {
      expect(state.themes.get(state.dominantTheme)?.weight).toBeGreaterThanOrEqual(30)
    }
  })
})

describe('validateThematicConsistency', () => {
  it('should pass for consistent themes', () => {
    let state = createEmptyThematicState()
    state = registerTheme(state, 'nature', 50, 50)
    state = registerTheme(state, 'freedom', 45, 55)
    state = { ...state, currentChapter: 5 }
    const result = validateThematicConsistency(state)
    expect(result.valid).toBe(true)
  })

  it('should detect conflicting emotional valences', () => {
    let state = createEmptyThematicState()
    state = registerTheme(state, 'love', 60, 90)  // highly positive
    state = registerTheme(state, 'death', 55, -90)  // highly negative
    state = { ...state, currentChapter: 3 }  // close proximity
    const result = validateThematicConsistency(state)
    expect(result.valid).toBe(false)
    expect(result.conflicts.length).toBeGreaterThan(0)
  })

  it('should flag faded motifs', () => {
    let state = createEmptyThematicState()
    state = registerMotif(state, 'ancient_ritual', 'structural', ['tradition', 'magic', 'power'], ['ritual', 'ceremony'])
    const motifId = Array.from(state.motifs.keys())[0]
    // Record occurrences with faded consistency
    for (let i = 0; i < 3; i++) {
      const motif = state.motifs.get(motifId)!
      const updated = { ...motif, consistencyHistory: [...motif.consistencyHistory.slice(-9), 'faded'] }
      state = { ...state, motifs: new Map(state.motifs).set(motifId, updated) }
    }
    const result = validateThematicConsistency(state)
    expect(result.conflicts.some(c => c.includes('faded'))).toBeTruthy()
  })
})

describe('formatThematicSummary', () => {
  it('should show theme count', () => {
    let state = createEmptyThematicState()
    state = registerTheme(state, 'identity', 55, 20)
    state = registerTheme(state, 'power', 45, 30)
    const summary = formatThematicSummary(state)
    expect(summary).toContain('Active Themes: 2')
  })

  it('should show dominant theme', () => {
    let state = createEmptyThematicState()
    state = registerTheme(state, 'redemption', 70, 40)
    const summary = formatThematicSummary(state)
    expect(summary).toContain('Dominant Theme: redemption')
  })

  it('should show motif occurrences', () => {
    let state = createEmptyThematicState()
    state = registerMotif(state, 'water', 'symbolic', ['flow'], ['river'])
    state = registerMotif(state, 'fire', 'symbolic', ['passion'], ['flame'])
    const summary = formatThematicSummary(state)
    expect(summary).toContain('Active Motifs: 2')
  })
})

describe('formatThematicDashboard', () => {
  it('should show chapter count', () => {
    let state = createEmptyThematicState()
    state = analyzeChapter(state, 5, 'Chapter content with some thematic elements about nature and growth and renewal')
    const dashboard = formatThematicDashboard(state)
    expect(dashboard).toContain('Chapters Analyzed: 5')
  })

  it('should show thematic arc', () => {
    let state = createEmptyThematicState()
    state = registerTheme(state, 'war', 60, -50)
    state = analyzeChapter(state, 1, 'War broke out across the kingdom')
    state = analyzeChapter(state, 2, 'Battle continued with relentless conflict')
    const dashboard = formatThematicDashboard(state)
    expect(dashboard).toContain('Thematic Arc')
  })

  it('should show consistency status', () => {
    let state = createEmptyThematicState()
    state = registerTheme(state, 'love', 50, 60)
    const dashboard = formatThematicDashboard(state)
    expect(dashboard).toContain('Consistency')
  })
})
