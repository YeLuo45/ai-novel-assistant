import { describe, it, expect } from 'vitest'
import {
  createEmptyResolutionQualityState,
  assessResolution,
  getResolutionAtChapter,
  getResolutionTrend,
  getResolutionDistribution,
  formatResolutionQualitySummary,
  formatResolutionQualityDashboard,
} from './NarrativeResolutionQualityEngine'

describe('createEmptyResolutionQualityState', () => {
  it('should create empty state', () => {
    const state = createEmptyResolutionQualityState()
    expect(state.assessments.length).toBe(0)
    expect(state.averageScore).toBe(0)
  })
})

describe('assessResolution', () => {
  it('should add resolution assessment', () => {
    let state = createEmptyResolutionQualityState()
    state = assessResolution(state, 20, 85, 80, 75, 80, 10)
    expect(state.assessments.length).toBe(1)
    expect(state.assessments[0].chapter).toBe(20)
  })

  it('should detect satisfying resolution', () => {
    let state = createEmptyResolutionQualityState()
    state = assessResolution(state, 20, 85, 80, 75, 80, 10)
    expect(state.assessments[0].resolutionType).toBe('satisfying')
  })

  it('should detect bittersweet resolution', () => {
    let state = createEmptyResolutionQualityState()
    state = assessResolution(state, 20, 85, 50, 70, 40, 20)
    expect(state.assessments[0].resolutionType).toBe('bittersweet')
  })

  it('should detect ambiguous resolution', () => {
    let state = createEmptyResolutionQualityState()
    state = assessResolution(state, 20, 60, 60, 60, 60, 50)
    expect(state.assessments[0].resolutionType).toBe('ambiguous')
  })

  it('should detect rushed resolution', () => {
    let state = createEmptyResolutionQualityState()
    state = assessResolution(state, 20, 50, 40, 45, 30, 30)
    expect(state.assessments[0].resolutionType).toBe('rushed')
  })

  it('should detect issues', () => {
    let state = createEmptyResolutionQualityState()
    state = assessResolution(state, 20, 40, 40, 40, 40, 10)
    expect(state.assessments[0].issues.length).toBeGreaterThan(0)
  })

  it('should calculate average score', () => {
    let state = createEmptyResolutionQualityState()
    state = assessResolution(state, 15, 100, 100, 100, 100, 0)
    state = assessResolution(state, 20, 90, 90, 90, 90, 5)
    expect(state.averageScore).toBeGreaterThan(70)
  })
})

describe('getResolutionAtChapter', () => {
  it('should return assessment at chapter', () => {
    let state = createEmptyResolutionQualityState()
    state = assessResolution(state, 20, 85, 80, 75, 80, 10)
    const assessment = getResolutionAtChapter(state, 20)
    expect(assessment).not.toBeNull()
    expect(assessment?.chapter).toBe(20)
  })

  it('should return null for missing chapter', () => {
    let state = createEmptyResolutionQualityState()
    state = assessResolution(state, 20, 85, 80, 75, 80, 10)
    const assessment = getResolutionAtChapter(state, 99)
    expect(assessment).toBeNull()
  })
})

describe('getResolutionTrend', () => {
  it('should return stable for insufficient data', () => {
    const state = createEmptyResolutionQualityState()
    expect(getResolutionTrend(state)).toBe('stable')
  })

  it('should detect improving trend', () => {
    let state = createEmptyResolutionQualityState()
    state = assessResolution(state, 10, 50, 50, 50, 50, 30)
    state = assessResolution(state, 15, 100, 100, 100, 100, 0)
    state = assessResolution(state, 20, 90, 90, 90, 90, 5)
    expect(getResolutionTrend(state)).toBe('improving')
  })

  it('should detect declining trend', () => {
    let state = createEmptyResolutionQualityState()
    state = assessResolution(state, 10, 90, 90, 90, 90, 5)
    state = assessResolution(state, 15, 100, 100, 100, 100, 0)
    state = assessResolution(state, 20, 50, 50, 50, 50, 30)
    expect(getResolutionTrend(state)).toBe('declining')
  })
})

describe('getResolutionDistribution', () => {
  it('should return resolution counts', () => {
    let state = createEmptyResolutionQualityState()
    state = assessResolution(state, 20, 85, 80, 75, 80, 10)
    const dist = getResolutionDistribution(state)
    expect(dist.satisfying).toBe(1)
  })
})

describe('formatResolutionQualitySummary', () => {
  it('should show resolution summary', () => {
    let state = createEmptyResolutionQualityState()
    state = assessResolution(state, 20, 85, 80, 75, 80, 10)
    const summary = formatResolutionQualitySummary(state)
    expect(summary).toContain('Assessments: 1')
  })
})

describe('formatResolutionQualityDashboard', () => {
  it('should show resolution dashboard', () => {
    let state = createEmptyResolutionQualityState()
    state = assessResolution(state, 20, 85, 80, 75, 80, 10)
    const dash = formatResolutionQualityDashboard(state)
    expect(dash).toContain('Assessments: 1')
  })
})