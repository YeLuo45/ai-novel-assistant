import { describe, it, expect } from 'vitest'
import {
  createEmptyPlotHoleState,
  detectPlotHole,
  getHolesByChapter,
  getHolesByType,
  getOverallIntegrity,
  formatPlotHoleSummary,
  formatPlotHoleDashboard,
} from './PlotHoleDetector'

describe('createEmptyPlotHoleState', () => {
  it('should create empty state', () => {
    const state = createEmptyPlotHoleState()
    expect(state.holes.length).toBe(0)
    expect(state.overallIntegrityScore).toBe(100)
    expect(state.criticalHoles).toBe(0)
  })
})

describe('detectPlotHole', () => {
  it('should detect a plot hole', () => {
    let state = createEmptyPlotHoleState()
    state = detectPlotHole(state, 5, 'timeline_contradiction', 60, 'Character appears before introduction')
    expect(state.holes.length).toBe(1)
    expect(state.currentChapter).toBe(5)
  })

  it('should clamp severity to 0-100', () => {
    let state = createEmptyPlotHoleState()
    state = detectPlotHole(state, 1, 'cause_effect', 150, 'Test')
    expect(state.holes[0].severity).toBe(100)
  })

  it('should update integrity score', () => {
    let state = createEmptyPlotHoleState()
    state = detectPlotHole(state, 1, 'timeline_contradiction', 50, 'Test')
    expect(state.overallIntegrityScore).toBe(50)
  })

  it('should track critical holes', () => {
    let state = createEmptyPlotHoleState()
    state = detectPlotHole(state, 1, 'character_knowledge', 70, 'Test')
    state = detectPlotHole(state, 2, 'cause_effect', 50, 'Test')
    expect(state.criticalHoles).toBe(1)
  })
})

describe('getHolesByChapter', () => {
  it('should return holes at exact chapter', () => {
    let state = createEmptyPlotHoleState()
    state = detectPlotHole(state, 3, 'timeline_contradiction', 60, 'Test')
    state = detectPlotHole(state, 7, 'cause_effect', 60, 'Test')
    const found = getHolesByChapter(state, 3)
    expect(found.length).toBe(1)
  })

  it('should return holes with related chapters', () => {
    let state = createEmptyPlotHoleState()
    state = detectPlotHole(state, 3, 'motivation_gap', 60, 'Test', [5, 7])
    const found = getHolesByChapter(state, 5)
    expect(found.length).toBe(1)
  })

  it('should return empty for chapter with no holes', () => {
    const state = createEmptyPlotHoleState()
    expect(getHolesByChapter(state, 1).length).toBe(0)
  })
})

describe('getHolesByType', () => {
  it('should filter by hole type', () => {
    let state = createEmptyPlotHoleState()
    state = detectPlotHole(state, 1, 'timeline_contradiction', 60, 'Test')
    state = detectPlotHole(state, 2, 'cause_effect', 60, 'Test')
    const found = getHolesByType(state, 'cause_effect')
    expect(found.length).toBe(1)
    expect(found[0].type).toBe('cause_effect')
  })
})

describe('getOverallIntegrity', () => {
  it('should return 100 for no holes', () => {
    const state = createEmptyPlotHoleState()
    expect(getOverallIntegrity(state)).toBe(100)
  })

  it('should return reduced score after holes', () => {
    let state = createEmptyPlotHoleState()
    state = detectPlotHole(state, 1, 'timeline_contradiction', 30, 'Test')
    expect(getOverallIntegrity(state)).toBe(70)
  })
})

describe('formatPlotHoleSummary', () => {
  it('should show total holes', () => {
    let state = createEmptyPlotHoleState()
    state = detectPlotHole(state, 1, 'timeline_contradiction', 60, 'Test')
    const summary = formatPlotHoleSummary(state)
    expect(summary).toContain('Total Holes: 1')
  })

  it('should show integrity score', () => {
    let state = createEmptyPlotHoleState()
    state = detectPlotHole(state, 1, 'timeline_contradiction', 40, 'Test')
    const summary = formatPlotHoleSummary(state)
    expect(summary).toContain('Integrity Score: 60')
  })

  it('should show critical hole count', () => {
    let state = createEmptyPlotHoleState()
    state = detectPlotHole(state, 1, 'timeline_contradiction', 70, 'Test')
    const summary = formatPlotHoleSummary(state)
    expect(summary).toContain('Critical Holes: 1')
  })
})

describe('formatPlotHoleDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptyPlotHoleState()
    state = detectPlotHole(state, 4, 'timeline_contradiction', 60, 'Test')
    const dashboard = formatPlotHoleDashboard(state)
    expect(dashboard).toContain('Chapter: 4')
  })

  it('should show CRITICAL flag for high severity holes', () => {
    let state = createEmptyPlotHoleState()
    state = detectPlotHole(state, 1, 'timeline_contradiction', 80, 'Test')
    const dashboard = formatPlotHoleDashboard(state)
    expect(dashboard).toContain('CRITICAL')
  })

  it('should show hole type', () => {
    let state = createEmptyPlotHoleState()
    state = detectPlotHole(state, 1, 'character_knowledge', 60, 'Test')
    const dashboard = formatPlotHoleDashboard(state)
    expect(dashboard).toContain('character_knowledge')
  })
})
