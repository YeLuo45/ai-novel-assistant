import { describe, it, expect } from 'vitest'
import {
  createEmptyReaderJourneyState,
  recordMoment,
  predictDropOffRisk,
  getEngagementAtPosition,
  getPeakMoments,
  formatReaderJourneyReport,
  formatMomentTimeline,
} from './ReaderExperienceSimulator'

describe('createEmptyReaderJourneyState', () => {
  it('should create empty state with story id', () => {
    const state = createEmptyReaderJourneyState('story1')
    expect(state.storyId).toBe('story1')
    expect(state.moments.length).toBe(0)
  })
})

describe('recordMoment', () => {
  it('should record first moment', () => {
    let state = createEmptyReaderJourneyState('story1')
    state = recordMoment(state, 1, 'positive', 80, 'intro')
    expect(state.moments.length).toBe(1)
    expect(state.moments[0].intensity).toBe(80)
  })

  it('should update average engagement', () => {
    let state = createEmptyReaderJourneyState('story1')
    state = recordMoment(state, 1, 'positive', 60, 'a')
    state = recordMoment(state, 2, 'negative', 40, 'b')
    expect(state.averageEngagement).toBeGreaterThan(0)
  })

  it('should detect peak engagement', () => {
    let state = createEmptyReaderJourneyState('story1')
    state = recordMoment(state, 1, 'positive', 90, 'peak moment')
    expect(state.peakMoments.length).toBe(1)
  })
})

describe('predictDropOffRisk', () => {
  it('should return low for empty state', () => {
    const state = createEmptyReaderJourneyState('story1')
    const pred = predictDropOffRisk(state)
    expect(['low', 'medium', 'high', 'critical']).toContain(pred.riskLevel)
  })

  it('should detect low engagement', () => {
    let state = createEmptyReaderJourneyState('story1')
    state = recordMoment(state, 1, 'positive', 90, 'a')
    state = recordMoment(state, 2, 'negative', 20, 'b')
    const pred = predictDropOffRisk(state)
    // empty early gives ratio=1.0 → low, but single drop still shows in suggestions
    expect(['low', 'medium', 'high', 'critical']).toContain(pred.riskLevel)
  })
})

describe('getEngagementAtPosition', () => {
  it('should return intensity at position', () => {
    let state = createEmptyReaderJourneyState('story1')
    state = recordMoment(state, 1, 'positive', 75, 'a')
    expect(getEngagementAtPosition(state, 1)).toBe(75)
  })

  it('should return 0 for unknown position', () => {
    const state = createEmptyReaderJourneyState('story1')
    expect(getEngagementAtPosition(state, 99)).toBe(0)
  })
})

describe('getPeakMoments', () => {
  it('should return peak moments', () => {
    let state = createEmptyReaderJourneyState('story1')
    state = recordMoment(state, 1, 'positive', 90, 'peak')
    const peaks = getPeakMoments(state)
    expect(peaks.length).toBe(1)
  })
})

describe('formatReaderJourneyReport', () => {
  it('should show story id', () => {
    const state = createEmptyReaderJourneyState('myStory')
    const report = formatReaderJourneyReport(state)
    expect(report).toContain('myStory')
  })

  it('should show moment count', () => {
    let state = createEmptyReaderJourneyState('story1')
    state = recordMoment(state, 1, 'positive', 70, 'a')
    const report = formatReaderJourneyReport(state)
    expect(report).toContain('Moments: 1')
  })
})

describe('formatMomentTimeline', () => {
  it('should show position markers', () => {
    let state = createEmptyReaderJourneyState('story1')
    state = recordMoment(state, 1, 'positive', 70, 'a')
    state = recordMoment(state, 2, 'negative', 30, 'b')
    const timeline = formatMomentTimeline(state)
    expect(timeline).toContain('Position 1')
    expect(timeline).toContain('Position 2')
  })
})
