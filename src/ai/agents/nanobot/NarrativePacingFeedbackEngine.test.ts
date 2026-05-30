import { describe, it, expect } from 'vitest'
import {
  createEmptyPacingFeedbackState,
  addPacingSegment,
  getPacingAtChapter,
  getRecentAdjustments,
  getPacingTrend,
  formatPacingFeedbackSummary,
  formatPacingFeedbackDashboard,
} from './NarrativePacingFeedbackEngine'

describe('createEmptyPacingFeedbackState', () => {
  it('should create empty state', () => {
    const state = createEmptyPacingFeedbackState()
    expect(state.segments.length).toBe(0)
    expect(state.averagePacing).toBe(50)
    expect(state.feedbackScore).toBe(100)
  })
})

describe('addPacingSegment', () => {
  it('should add pacing segment', () => {
    let state = createEmptyPacingFeedbackState()
    state = addPacingSegment(state, 1, 3000, 4, 15, 900, 20)
    expect(state.segments.length).toBe(1)
    expect(state.currentChapter).toBe(1)
  })

  it('should detect fast rhythm', () => {
    let state = createEmptyPacingFeedbackState()
    state = addPacingSegment(state, 1, 3000, 4, 50, 1500, 10)
    expect(state.segments[0].rhythm).toBe('fast')
  })

  it('should detect slow rhythm', () => {
    let state = createEmptyPacingFeedbackState()
    state = addPacingSegment(state, 1, 2000, 6, 1, 200, 50)
    expect(state.segments[0].rhythm).toBe('slow')
  })

  it('should detect rushed issue', () => {
    let state = createEmptyPacingFeedbackState()
    state = addPacingSegment(state, 1, 6000, 2, 20, 1800, 15)
    expect(state.segments[0].issues).toContain('rushed')
  })

  it('should detect dragged issue', () => {
    let state = createEmptyPacingFeedbackState()
    state = addPacingSegment(state, 1, 1200, 6, 3, 200, 30)
    expect(state.segments[0].issues).toContain('dragged')
  })

  it('should detect overwhelming issue', () => {
    let state = createEmptyPacingFeedbackState()
    state = addPacingSegment(state, 1, 2000, 4, 60, 1200, 5)
    expect(state.segments[0].issues).toContain('overwhelming')
  })

  it('should calculate average pacing', () => {
    let state = createEmptyPacingFeedbackState()
    state = addPacingSegment(state, 1, 3000, 4, 15, 900, 20)
    state = addPacingSegment(state, 2, 3000, 4, 50, 1500, 10)
    expect(state.averagePacing).toBeGreaterThan(50)
  })

  it('should reduce feedback score for issues', () => {
    let state = createEmptyPacingFeedbackState()
    state = addPacingSegment(state, 1, 6000, 2, 20, 1800, 15)
    expect(state.feedbackScore).toBeLessThan(100)
  })
})

describe('getPacingAtChapter', () => {
  it('should return segment at chapter', () => {
    let state = createEmptyPacingFeedbackState()
    state = addPacingSegment(state, 5, 3000, 4, 15, 900, 20)
    const seg = getPacingAtChapter(state, 5)
    expect(seg).not.toBeNull()
    expect(seg?.chapter).toBe(5)
  })

  it('should return null for missing chapter', () => {
    let state = createEmptyPacingFeedbackState()
    state = addPacingSegment(state, 1, 3000, 4, 15, 900, 20)
    const seg = getPacingAtChapter(state, 99)
    expect(seg).toBeNull()
  })
})

describe('getRecentAdjustments', () => {
  it('should return recent adjustments', () => {
    let state = createEmptyPacingFeedbackState()
    state = addPacingSegment(state, 1, 6000, 2, 20, 1800, 15)
    const adjustments = getRecentAdjustments(state)
    expect(adjustments.length).toBeGreaterThan(0)
  })
})

describe('getPacingTrend', () => {
  it('should return stable for insufficient segments', () => {
    const state = createEmptyPacingFeedbackState()
    expect(getPacingTrend(state)).toBe('stable')
  })

  it('should detect accelerating trend', () => {
    let state = createEmptyPacingFeedbackState()
    state = addPacingSegment(state, 1, 2000, 4, 10, 400, 15)
    state = addPacingSegment(state, 2, 3000, 4, 50, 1500, 10)
    expect(getPacingTrend(state)).toBe('accelerating')
  })

  it('should detect decelerating trend', () => {
    let state = createEmptyPacingFeedbackState()
    state = addPacingSegment(state, 1, 3000, 4, 50, 1500, 10)
    state = addPacingSegment(state, 2, 2000, 4, 10, 400, 15)
    expect(getPacingTrend(state)).toBe('decelerating')
  })
})

describe('formatPacingFeedbackSummary', () => {
  it('should show pacing summary', () => {
    let state = createEmptyPacingFeedbackState()
    state = addPacingSegment(state, 1, 3000, 4, 15, 900, 20)
    const summary = formatPacingFeedbackSummary(state)
    expect(summary).toContain('Segments: 1')
  })
})

describe('formatPacingFeedbackDashboard', () => {
  it('should show pacing dashboard', () => {
    let state = createEmptyPacingFeedbackState()
    state = addPacingSegment(state, 1, 3000, 4, 15, 900, 20)
    const dash = formatPacingFeedbackDashboard(state)
    expect(dash).toContain('Chapter: 1')
  })

  it('should show segments', () => {
    let state = createEmptyPacingFeedbackState()
    state = addPacingSegment(state, 1, 3000, 4, 15, 900, 20)
    const dash = formatPacingFeedbackDashboard(state)
    expect(dash).toContain('Recent Segments')
  })
})