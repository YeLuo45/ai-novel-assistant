import { describe, it, expect } from 'vitest'
import {
  createEmptyNarrativeToneState,
  setNarrativeTone,
  getToneAtChapter,
  getToneConsistencyScore,
  formatToneSummary,
  formatToneDashboard,
} from './NarrativeToneAnalyzer'

describe('createEmptyNarrativeToneState', () => {
  it('should create empty state with neutral tone', () => {
    const state = createEmptyNarrativeToneState()
    expect(state.currentTone).toBe('neutral')
    expect(state.shifts.length).toBe(0)
    expect(state.toneConsistencyScore).toBe(100)
  })
})

describe('setNarrativeTone', () => {
  it('should set initial tone', () => {
    let state = createEmptyNarrativeToneState()
    state = setNarrativeTone(state, 1, 'dramatic', 'Opening scene')
    expect(state.currentTone).toBe('dramatic')
    expect(state.currentChapter).toBe(1)
  })

  it('should record tone shift when changed', () => {
    let state = createEmptyNarrativeToneState()
    state = setNarrativeTone(state, 1, 'dramatic')
    state = setNarrativeTone(state, 5, 'romantic')
    expect(state.shifts.length).toBe(1)
    expect(state.shifts[0].fromTone).toBe('dramatic')
    expect(state.shifts[0].toTone).toBe('romantic')
  })

  it('should not record shift when tone unchanged', () => {
    let state = createEmptyNarrativeToneState()
    state = setNarrativeTone(state, 1, 'dramatic')
    state = setNarrativeTone(state, 2, 'dramatic')
    expect(state.shifts.length).toBe(0)
  })

  it('should calculate smoothness for similar tones', () => {
    let state = createEmptyNarrativeToneState()
    state = setNarrativeTone(state, 1, 'dramatic')
    state = setNarrativeTone(state, 5, 'tragic')
    expect(state.shifts[0].smoothness).toBe(80)
  })

  it('should calculate low smoothness for opposite tones', () => {
    let state = createEmptyNarrativeToneState()
    state = setNarrativeTone(state, 1, 'comedic')
    state = setNarrativeTone(state, 5, 'tragic')
    expect(state.shifts[0].smoothness).toBe(20)
  })

  it('should track abrupt shifts', () => {
    let state = createEmptyNarrativeToneState()
    state = setNarrativeTone(state, 1, 'comedic')
    state = setNarrativeTone(state, 5, 'tragic')
    expect(state.abruptShifts.length).toBe(1)
  })

  it('should update tone consistency score', () => {
    let state = createEmptyNarrativeToneState()
    state = setNarrativeTone(state, 1, 'dramatic')
    state = setNarrativeTone(state, 5, 'romantic')
    expect(state.toneConsistencyScore).toBeLessThan(100)
  })

  it('should record tone history', () => {
    let state = createEmptyNarrativeToneState()
    state = setNarrativeTone(state, 1, 'dramatic')
    state = setNarrativeTone(state, 3, 'tragic')
    expect(state.toneHistory.length).toBe(2)
  })
})

describe('getToneAtChapter', () => {
  it('should return tone at specific chapter', () => {
    let state = createEmptyNarrativeToneState()
    state = setNarrativeTone(state, 1, 'dramatic')
    state = setNarrativeTone(state, 5, 'romantic')
    expect(getToneAtChapter(state, 3)).toBe('dramatic')
  })

  it('should return null for chapter before any set', () => {
    const state = createEmptyNarrativeToneState()
    expect(getToneAtChapter(state, 1)).toBe('neutral')
  })

  it('should return current tone for chapter after last set', () => {
    let state = createEmptyNarrativeToneState()
    state = setNarrativeTone(state, 1, 'dramatic')
    expect(getToneAtChapter(state, 10)).toBe('dramatic')
  })
})

describe('getToneConsistencyScore', () => {
  it('should return 100 for no shifts', () => {
    let state = createEmptyNarrativeToneState()
    state = setNarrativeTone(state, 1, 'dramatic')
    expect(getToneConsistencyScore(state)).toBe(100)
  })

  it('should return consistency score after shifts', () => {
    let state = createEmptyNarrativeToneState()
    state = setNarrativeTone(state, 1, 'dramatic')
    state = setNarrativeTone(state, 5, 'romantic')
    expect(getToneConsistencyScore(state)).toBe(50)
  })
})

describe('formatToneSummary', () => {
  it('should show current tone', () => {
    let state = createEmptyNarrativeToneState()
    state = setNarrativeTone(state, 1, 'dramatic')
    const summary = formatToneSummary(state)
    expect(summary).toContain('dramatic')
  })

  it('should show shift count', () => {
    let state = createEmptyNarrativeToneState()
    state = setNarrativeTone(state, 1, 'dramatic')
    state = setNarrativeTone(state, 5, 'romantic')
    const summary = formatToneSummary(state)
    expect(summary).toContain('Tone Shifts: 1')
  })

  it('should show consistency score', () => {
    let state = createEmptyNarrativeToneState()
    state = setNarrativeTone(state, 1, 'dramatic')
    const summary = formatToneSummary(state)
    expect(summary).toContain('Consistency Score:')
  })
})

describe('formatToneDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptyNarrativeToneState()
    state = setNarrativeTone(state, 3, 'dramatic')
    const dashboard = formatToneDashboard(state)
    expect(dashboard).toContain('Chapter: 3')
  })

  it('should show recent tone shifts', () => {
    let state = createEmptyNarrativeToneState()
    state = setNarrativeTone(state, 1, 'dramatic')
    state = setNarrativeTone(state, 5, 'romantic')
    const dashboard = formatToneDashboard(state)
    expect(dashboard).toContain('dramatic')
    expect(dashboard).toContain('romantic')
  })

  it('should show abrupt shifts section when present', () => {
    let state = createEmptyNarrativeToneState()
    state = setNarrativeTone(state, 1, 'comedic')
    state = setNarrativeTone(state, 5, 'tragic')
    const dashboard = formatToneDashboard(state)
    expect(dashboard).toContain('Abrupt Shifts')
  })
})
