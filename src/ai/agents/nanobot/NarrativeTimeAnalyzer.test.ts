import { describe, it, expect } from 'vitest'
import {
  createEmptyTimeAnalyzerState,
  addTimeMarker,
  calculatePacingVelocity,
  getTimeCompressionRatio,
  getChapterTimeDensity,
  formatTimeSummary,
  formatTimeDashboard,
} from './NarrativeTimeAnalyzer'

describe('createEmptyTimeAnalyzerState', () => {
  it('should create empty state', () => {
    const state = createEmptyTimeAnalyzerState()
    expect(state.timeMarkers.length).toBe(0)
  })
})

describe('addTimeMarker', () => {
  it('should add time marker for chapter', () => {
    let state = createEmptyTimeAnalyzerState()
    state = addTimeMarker(state, 1, 1000, 1, 'day')
    expect(state.timeMarkers.length).toBe(1)
    expect(state.timeMarkers[0].storyDuration).toBe(1)
  })
})

describe('calculatePacingVelocity', () => {
  it('should calculate words per story day', () => {
    let state = createEmptyTimeAnalyzerState()
    state = addTimeMarker(state, 1, 2000, 1, 'day')
    state = addTimeMarker(state, 2, 3000, 3, 'day')
    const velocity = calculatePacingVelocity(state)
    expect(velocity).toBeGreaterThan(0)
  })
})

describe('getTimeCompressionRatio', () => {
  it('should return compression ratio', () => {
    let state = createEmptyTimeAnalyzerState()
    state = addTimeMarker(state, 1, 2000, 1, 'day')
    state = addTimeMarker(state, 2, 2000, 10, 'day')
    const ratio = getTimeCompressionRatio(state)
    expect(ratio).toBeGreaterThan(0)
  })
})

describe('getChapterTimeDensity', () => {
  it('should return time density for chapter', () => {
    let state = createEmptyTimeAnalyzerState()
    state = addTimeMarker(state, 5, 3000, 7, 'day')
    const density = getChapterTimeDensity(state, 5)
    expect(density).toBeGreaterThan(0)
  })
})

describe('formatTimeSummary', () => {
  it('should show marker count', () => {
    let state = createEmptyTimeAnalyzerState()
    state = addTimeMarker(state, 1, 1000, 1, 'day')
    const summary = formatTimeSummary(state)
    expect(summary).toContain('Markers: 1')
  })
})

describe('formatTimeDashboard', () => {
  it('should show pacing velocity', () => {
    let state = createEmptyTimeAnalyzerState()
    state = addTimeMarker(state, 1, 2000, 1, 'day')
    state = addTimeMarker(state, 2, 3000, 5, 'day')
    const dash = formatTimeDashboard(state)
    expect(dash).toContain('Pacing Velocity:')
  })
})
