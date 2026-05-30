import { describe, it, expect } from 'vitest'
import {
  createEmptyThemeConsistencyState,
  recordThemeOccurrence,
  getThemeOccurrences,
  getThemeConsistencyScore,
  formatThemeSummary,
  formatThemeDashboard,
} from './ThemeConsistencyEngine'

describe('createEmptyThemeConsistencyState', () => {
  it('should create empty state', () => {
    const state = createEmptyThemeConsistencyState()
    expect(state.themes.size).toBe(0)
    expect(state.overallConsistency).toBe(100)
  })
})

describe('recordThemeOccurrence', () => {
  it('should add first occurrence', () => {
    let state = createEmptyThemeConsistencyState()
    state = recordThemeOccurrence(state, 'freedom', 1, 'Context of freedom', 70)
    expect(state.themes.size).toBe(1)
    expect(state.themes.get('freedom')?.occurrences.length).toBe(1)
  })

  it('should track multiple themes', () => {
    let state = createEmptyThemeConsistencyState()
    state = recordThemeOccurrence(state, 'freedom', 1, 'Context', 70)
    state = recordThemeOccurrence(state, 'love', 1, 'Context', 80)
    expect(state.themes.size).toBe(2)
  })

  it('should calculate consistency for multiple occurrences', () => {
    let state = createEmptyThemeConsistencyState()
    state = recordThemeOccurrence(state, 'freedom', 1, 'Context', 70)
    state = recordThemeOccurrence(state, 'freedom', 3, 'Context', 75)
    expect(state.themes.get('freedom')?.consistencyScore).toBeGreaterThan(80)
  })

  it('should detect variation when intensity changes sharply', () => {
    let state = createEmptyThemeConsistencyState()
    state = recordThemeOccurrence(state, 'freedom', 1, 'Context', 70)
    state = recordThemeOccurrence(state, 'freedom', 3, 'Context', 30)
    state = recordThemeOccurrence(state, 'freedom', 5, 'Context', 80)
    expect(state.themes.get('freedom')?.variationCount).toBeGreaterThan(0)
  })

  it('should update current chapter', () => {
    let state = createEmptyThemeConsistencyState()
    state = recordThemeOccurrence(state, 'freedom', 5, 'Context', 70)
    expect(state.currentChapter).toBe(5)
  })

  it('should update overall consistency', () => {
    let state = createEmptyThemeConsistencyState()
    state = recordThemeOccurrence(state, 'freedom', 1, 'Context', 70)
    state = recordThemeOccurrence(state, 'freedom', 3, 'Context', 30)
    expect(state.overallConsistency).toBeLessThan(100)
  })
})

describe('getThemeOccurrences', () => {
  it('should return empty for unknown theme', () => {
    const state = createEmptyThemeConsistencyState()
    expect(getThemeOccurrences(state, 'unknown').length).toBe(0)
  })

  it('should return all occurrences for theme', () => {
    let state = createEmptyThemeConsistencyState()
    state = recordThemeOccurrence(state, 'freedom', 1, 'First', 70)
    state = recordThemeOccurrence(state, 'freedom', 3, 'Second', 75)
    const occurrences = getThemeOccurrences(state, 'freedom')
    expect(occurrences.length).toBe(2)
  })
})

describe('getThemeConsistencyScore', () => {
  it('should return 0 for unknown theme', () => {
    const state = createEmptyThemeConsistencyState()
    expect(getThemeConsistencyScore(state, 'unknown')).toBe(0)
  })

  it('should return consistency score for theme', () => {
    let state = createEmptyThemeConsistencyState()
    state = recordThemeOccurrence(state, 'freedom', 1, 'Context', 70)
    state = recordThemeOccurrence(state, 'freedom', 3, 'Context', 75)
    expect(getThemeConsistencyScore(state, 'freedom')).toBeGreaterThan(0)
  })
})

describe('formatThemeSummary', () => {
  it('should show theme count', () => {
    let state = createEmptyThemeConsistencyState()
    state = recordThemeOccurrence(state, 'freedom', 1, 'Context', 70)
    state = recordThemeOccurrence(state, 'love', 2, 'Context', 80)
    const summary = formatThemeSummary(state)
    expect(summary).toContain('Themes Tracked: 2')
  })

  it('should show overall consistency', () => {
    let state = createEmptyThemeConsistencyState()
    state = recordThemeOccurrence(state, 'freedom', 1, 'Context', 70)
    state = recordThemeOccurrence(state, 'freedom', 3, 'Context', 30)
    const summary = formatThemeSummary(state)
    expect(summary).toContain('Overall Consistency:')
  })

  it('should show chapter', () => {
    let state = createEmptyThemeConsistencyState()
    state = recordThemeOccurrence(state, 'freedom', 5, 'Context', 70)
    const summary = formatThemeSummary(state)
    expect(summary).toContain('Chapter: 5')
  })
})

describe('formatThemeDashboard', () => {
  it('should show overall consistency', () => {
    let state = createEmptyThemeConsistencyState()
    state = recordThemeOccurrence(state, 'freedom', 1, 'Context', 70)
    const dashboard = formatThemeDashboard(state)
    expect(dashboard).toContain('Overall Consistency:')
  })

  it('should show theme status', () => {
    let state = createEmptyThemeConsistencyState()
    state = recordThemeOccurrence(state, 'freedom', 1, 'Context', 70)
    state = recordThemeOccurrence(state, 'freedom', 3, 'Context', 75)
    const dashboard = formatThemeDashboard(state)
    expect(dashboard).toContain('Theme Status')
    expect(dashboard).toContain('freedom')
  })
})
