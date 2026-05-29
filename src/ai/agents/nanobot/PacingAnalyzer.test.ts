import { describe, it, expect } from 'vitest'
import {
  createEmptyPacingAnalysisState,
  analyzeScenePacing,
  getPacingAtChapter,
  getPacingRhythm,
  formatPacingSummary,
  formatPacingDashboard,
} from './PacingAnalyzer'

describe('createEmptyPacingAnalysisState', () => {
  it('should create empty state', () => {
    const state = createEmptyPacingAnalysisState()
    expect(state.scenes.length).toBe(0)
    expect(state.averagePacing).toBe(0)
    expect(state.pacingScore).toBe(100)
  })
})

describe('analyzeScenePacing', () => {
  it('should add scene data', () => {
    let state = createEmptyPacingAnalysisState()
    state = analyzeScenePacing(state, 1, 1500, false)
    expect(state.scenes.length).toBe(1)
    expect(state.currentChapter).toBe(1)
  })

  it('should boost pacing for action scenes', () => {
    let state = createEmptyPacingAnalysisState()
    state = analyzeScenePacing(state, 1, 1000, false)
    const normalScore = state.scenes[0].pacingScore
    state = analyzeScenePacing(state, 2, 1000, true)
    expect(state.scenes[1].pacingScore).toBeGreaterThan(normalScore)
  })

  it('should penalize very short scenes', () => {
    let state = createEmptyPacingAnalysisState()
    state = analyzeScenePacing(state, 1, 200, false)
    expect(state.scenes[0].pacingScore).toBeLessThan(70)
  })

  it('should update average pacing', () => {
    let state = createEmptyPacingAnalysisState()
    state = analyzeScenePacing(state, 1, 1000, false)
    state = analyzeScenePacing(state, 2, 1000, false)
    expect(state.averagePacing).toBeGreaterThan(0)
  })

  it('should track rhythm changes', () => {
    let state = createEmptyPacingAnalysisState()
    state = analyzeScenePacing(state, 1, 500, true)
    state = analyzeScenePacing(state, 2, 2000, false)
    expect(state.rhythmChanges).toBe(1)
  })
})

describe('getPacingAtChapter', () => {
  it('should return scene data for known chapter', () => {
    let state = createEmptyPacingAnalysisState()
    state = analyzeScenePacing(state, 3, 1500, false)
    const found = getPacingAtChapter(state, 3)
    expect(found).not.toBeNull()
    expect(found?.chapter).toBe(3)
  })

  it('should return null for unknown chapter', () => {
    const state = createEmptyPacingAnalysisState()
    expect(getPacingAtChapter(state, 1)).toBeNull()
  })
})

describe('getPacingRhythm', () => {
  it('should return rhythm sequence', () => {
    let state = createEmptyPacingAnalysisState()
    state = analyzeScenePacing(state, 1, 1000, true)
    state = analyzeScenePacing(state, 2, 2000, false)
    const rhythms = getPacingRhythm(state)
    expect(rhythms.length).toBe(2)
  })
})

describe('formatPacingSummary', () => {
  it('should show chapter count', () => {
    let state = createEmptyPacingAnalysisState()
    state = analyzeScenePacing(state, 1, 1000, false)
    const summary = formatPacingSummary(state)
    expect(summary).toContain('Chapters Analyzed: 1')
  })

  it('should show average pacing', () => {
    let state = createEmptyPacingAnalysisState()
    state = analyzeScenePacing(state, 1, 1000, false)
    const summary = formatPacingSummary(state)
    expect(summary).toContain('Average Pacing:')
  })

  it('should show rhythm change count', () => {
    let state = createEmptyPacingAnalysisState()
    state = analyzeScenePacing(state, 1, 500, true)
    state = analyzeScenePacing(state, 2, 2000, false)
    const summary = formatPacingSummary(state)
    expect(summary).toContain('Rhythm Changes: 1')
  })
})

describe('formatPacingDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptyPacingAnalysisState()
    state = analyzeScenePacing(state, 4, 1500, false)
    const dashboard = formatPacingDashboard(state)
    expect(dashboard).toContain('Chapter: 4')
  })

  it('should show ACTION flag for action scenes', () => {
    let state = createEmptyPacingAnalysisState()
    state = analyzeScenePacing(state, 1, 1000, true)
    const dashboard = formatPacingDashboard(state)
    expect(dashboard).toContain('ACTION')
  })

  it('should show recent chapters', () => {
    let state = createEmptyPacingAnalysisState()
    state = analyzeScenePacing(state, 1, 1000, false)
    state = analyzeScenePacing(state, 2, 1000, false)
    const dashboard = formatPacingDashboard(state)
    expect(dashboard).toContain('Ch1')
    expect(dashboard).toContain('Ch2')
  })
})
