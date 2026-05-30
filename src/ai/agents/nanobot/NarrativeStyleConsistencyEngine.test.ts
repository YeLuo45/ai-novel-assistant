import { describe, it, expect } from 'vitest'
import {
  createEmptyStyleConsistencyState,
  addStyleMarker,
  getStyleDrift,
  getVoiceConsistencyScore,
  getToneConsistencyScore,
  getAverageComplexity,
  formatStyleConsistencySummary,
  formatStyleConsistencyDashboard,
} from './NarrativeStyleConsistencyEngine'

describe('createEmptyStyleConsistencyState', () => {
  it('should create empty state', () => {
    const state = createEmptyStyleConsistencyState()
    expect(state.markers.length).toBe(0)
    expect(state.voiceStabilityScore).toBe(100)
    expect(state.toneStabilityScore).toBe(100)
  })
})

describe('addStyleMarker', () => {
  it('should add style marker for chapter', () => {
    let state = createEmptyStyleConsistencyState()
    state = addStyleMarker(state, 1, 'I walked down the street', 50, 250, 5, 0.3)
    expect(state.markers.length).toBe(1)
    expect(state.markers[0].chapter).toBe(1)
  })

  it('should detect first person voice', () => {
    let state = createEmptyStyleConsistencyState()
    state = addStyleMarker(state, 1, 'I felt the cold wind', 50, 250, 5, 0.3)
    expect(state.markers[0].voice).toBe('first_person')
  })

  it('should detect third person voice', () => {
    let state = createEmptyStyleConsistencyState()
    state = addStyleMarker(state, 1, 'The soldier marched forward', 50, 250, 5, 0.3)
    expect(state.markers[0].voice).toBe('third_limited')
  })

  it('should detect formal tone', () => {
    let state = createEmptyStyleConsistencyState()
    state = addStyleMarker(state, 1, 'It is moreover', 50, 300, 5, 0.3)
    expect(state.markers[0].tone).toBe('formal')
  })

  it('should detect informal tone', () => {
    let state = createEmptyStyleConsistencyState()
    state = addStyleMarker(state, 1, 'Wow ? This is crazy', 50, 280, 5, 0.3)
    expect(state.markers[0].tone).toBe('informal')
  })
})

describe('addStyleMarker drift detection', () => {
  it('should detect voice drift', () => {
    let state = createEmptyStyleConsistencyState()
    state = addStyleMarker(state, 1, 'I walked down the street', 50, 250, 5, 0.3)
    state = addStyleMarker(state, 2, 'She walked down the street', 50, 250, 5, 0.3)
    expect(state.driftEvents.length).toBeGreaterThan(0)
    expect(state.voiceStabilityScore).toBeLessThan(100)
  })

  it('should detect tone drift', () => {
    let state = createEmptyStyleConsistencyState()
    state = addStyleMarker(state, 1, 'The evidence moreover suggests', 50, 300, 5, 0.3)
    state = addStyleMarker(state, 2, 'Wow! This is crazy!', 50, 200, 5, 0.3)
    expect(state.driftEvents.some(d => d.type === 'tone_shift')).toBeTruthy()
  })
})

describe('getStyleDrift', () => {
  it('should return drift events', () => {
    let state = createEmptyStyleConsistencyState()
    state = addStyleMarker(state, 1, 'I walked', 50, 250, 5, 0.3)
    state = addStyleMarker(state, 2, 'She walked', 50, 250, 5, 0.3)
    const drift = getStyleDrift(state)
    expect(drift.length).toBeGreaterThan(0)
  })
})

describe('getVoiceConsistencyScore', () => {
  it('should return voice stability score', () => {
    let state = createEmptyStyleConsistencyState()
    state = addStyleMarker(state, 1, 'I walked', 50, 250, 5, 0.3)
    const score = getVoiceConsistencyScore(state)
    expect(score).toBeGreaterThan(0)
  })
})

describe('getToneConsistencyScore', () => {
  it('should return tone stability score', () => {
    let state = createEmptyStyleConsistencyState()
    state = addStyleMarker(state, 1, 'I walked', 50, 250, 5, 0.3)
    const score = getToneConsistencyScore(state)
    expect(score).toBeGreaterThan(0)
  })
})

describe('getAverageComplexity', () => {
  it('should return average vocabulary complexity', () => {
    let state = createEmptyStyleConsistencyState()
    state = addStyleMarker(state, 1, 'I walked', 50, 300, 5, 0.3)
    state = addStyleMarker(state, 2, 'She ran', 50, 200, 5, 0.3)
    const avg = getAverageComplexity(state)
    expect(avg).toBeGreaterThan(0)
  })
})

describe('formatStyleConsistencySummary', () => {
  it('should show style summary', () => {
    let state = createEmptyStyleConsistencyState()
    state = addStyleMarker(state, 1, 'I walked', 50, 250, 5, 0.3)
    const summary = formatStyleConsistencySummary(state)
    expect(summary).toContain('Markers: 1')
  })
})

describe('formatStyleConsistencyDashboard', () => {
  it('should show style dashboard', () => {
    let state = createEmptyStyleConsistencyState()
    state = addStyleMarker(state, 1, 'I walked', 50, 250, 5, 0.3)
    const dash = formatStyleConsistencyDashboard(state)
    expect(dash).toContain('Total Markers: 1')
  })
})