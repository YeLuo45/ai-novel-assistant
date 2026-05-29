import { describe, it, expect } from 'vitest'
import {
  createEmptyClimaxState,
  detectClimax,
  markResolutionQuality,
  getClimaxesByType,
  getClimaxesByChapter,
  formatClimaxSummary,
  formatClimaxDashboard,
} from './NarrativeClimaxAnalyzer'

describe('createEmptyClimaxState', () => {
  it('should create empty state', () => {
    const state = createEmptyClimaxState()
    expect(state.climaxes.length).toBe(0)
    expect(state.tensionPeak).toBe(0)
    expect(state.climaxCount).toBe(0)
  })
})

describe('detectClimax', () => {
  it('should detect first climax', () => {
    let state = createEmptyClimaxState()
    state = detectClimax(state, 1, 'action', 85, 50, 'Big battle')
    expect(state.climaxes.length).toBe(1)
    expect(state.tensionPeak).toBe(85)
  })

  it('should update average intensity', () => {
    let state = createEmptyClimaxState()
    state = detectClimax(state, 1, 'action', 70, 50, 'a')
    state = detectClimax(state, 2, 'emotional', 90, 50, 'b')
    expect(state.averageIntensity).toBe(80)
  })

  it('should update current chapter', () => {
    let state = createEmptyClimaxState()
    state = detectClimax(state, 5, 'revelation', 80, 50, 'Secret revealed')
    expect(state.currentChapter).toBe(5)
  })
})

describe('markResolutionQuality', () => {
  it('should update resolution quality', () => {
    let state = createEmptyClimaxState()
    state = detectClimax(state, 1, 'action', 80, 50, 'a')
    const climaxId = state.climaxes[0].climaxId
    state = markResolutionQuality(state, climaxId, 90)
    expect(state.climaxes[0].resolutionQuality).toBe(90)
  })
})

describe('getClimaxesByType', () => {
  it('should filter by type', () => {
    let state = createEmptyClimaxState()
    state = detectClimax(state, 1, 'action', 80, 50, 'a')
    state = detectClimax(state, 2, 'emotional', 80, 50, 'b')
    const actionClimaxes = getClimaxesByType(state, 'action')
    expect(actionClimaxes.length).toBe(1)
    expect(actionClimaxes[0].climaxType).toBe('action')
  })
})

describe('getClimaxesByChapter', () => {
  it('should filter by chapter', () => {
    let state = createEmptyClimaxState()
    state = detectClimax(state, 3, 'action', 80, 50, 'a')
    state = detectClimax(state, 5, 'action', 80, 50, 'b')
    const ch3 = getClimaxesByChapter(state, 3)
    expect(ch3.length).toBe(1)
  })
})

describe('formatClimaxSummary', () => {
  it('should show chapter', () => {
    let state = createEmptyClimaxState()
    state = detectClimax(state, 7, 'action', 80, 50, ' climax')
    const summary = formatClimaxSummary(state)
    expect(summary).toContain('Chapter: 7')
  })

  it('should show climax count', () => {
    let state = createEmptyClimaxState()
    state = detectClimax(state, 1, 'action', 80, 50, 'a')
    const summary = formatClimaxSummary(state)
    expect(summary).toContain('Climaxes: 1')
  })
})

describe('formatClimaxDashboard', () => {
  it('should show dramatic curve', () => {
    const state = createEmptyClimaxState()
    const dash = formatClimaxDashboard(state)
    expect(dash).toContain('Climax Dashboard')
  })

  it('should show chapter', () => {
    let state = createEmptyClimaxState()
    state = detectClimax(state, 4, 'action', 80, 50, ' climax')
    const dash = formatClimaxDashboard(state)
    expect(dash).toContain('Chapter: 4')
  })
})
