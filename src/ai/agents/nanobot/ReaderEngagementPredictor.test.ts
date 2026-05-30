import { describe, it, expect } from 'vitest'
import {
  createEmptyReaderEngagementState,
  predictChapterEngagement,
  predictSegmentEngagement,
  getDropoutAlerts,
  getEngagementAtChapter,
  formatEngagementSummary,
  formatEngagementDashboard,
} from './ReaderEngagementPredictor'

describe('createEmptyReaderEngagementState', () => {
  it('should create empty state', () => {
    const state = createEmptyReaderEngagementState()
    expect(state.dataPoints.length).toBe(0)
    expect(state.averageEngagement).toBe(0)
    expect(state.dropoutAlerts.length).toBe(0)
  })
})

describe('predictChapterEngagement', () => {
  it('should predict first chapter engagement', () => {
    let state = createEmptyReaderEngagementState()
    state = predictChapterEngagement(state, 1, 800, false, 50)
    expect(state.dataPoints.length).toBe(1)
    expect(state.currentChapter).toBe(1)
  })

  it('should use word count to adjust engagement', () => {
    let state = createEmptyReaderEngagementState()
    state = predictChapterEngagement(state, 1, 800, false, 50)
    expect(state.dataPoints[0].engagementScore).toBeGreaterThan(50)
  })

  it('should penalize very short chapters', () => {
    let state = createEmptyReaderEngagementState()
    state = predictChapterEngagement(state, 1, 100, false, 50)
    expect(state.dataPoints[0].engagementScore).toBeLessThan(50)
  })

  it('should boost engagement for cliffhangers', () => {
    let state = createEmptyReaderEngagementState()
    state = predictChapterEngagement(state, 1, 800, true, 50)
    expect(state.dataPoints[0].engagementScore).toBeGreaterThan(50)
  })

  it('should update average engagement', () => {
    let state = createEmptyReaderEngagementState()
    state = predictChapterEngagement(state, 1, 800, false, 50)
    state = predictChapterEngagement(state, 2, 800, false, 50)
    expect(state.averageEngagement).toBeGreaterThan(0)
  })

  it('should track momentum across chapters', () => {
    let state = createEmptyReaderEngagementState()
    state = predictChapterEngagement(state, 1, 800, false, 50)
    state = predictChapterEngagement(state, 2, 800, false, 50)
    expect(state.dataPoints[1].momentumScore).toBeGreaterThan(0)
  })

  it('should trigger dropout alert for very low engagement', () => {
    let state = createEmptyReaderEngagementState()
    state = predictChapterEngagement(state, 1, 100, false, 95)
    state = predictChapterEngagement(state, 2, 100, false, 95)
    state = predictChapterEngagement(state, 3, 100, false, 95)
    expect(state.dropoutAlerts.length).toBeGreaterThan(0)
  })
})

describe('predictSegmentEngagement', () => {
  it('should create segment with engagement prediction', () => {
    let state = createEmptyReaderEngagementState()
    state = predictChapterEngagement(state, 1, 800, false, 50)
    state = predictChapterEngagement(state, 2, 800, false, 50)
    const segment = predictSegmentEngagement(state, 1, 2, 'young_adult')
    expect(segment.chapterStart).toBe(1)
    expect(segment.chapterEnd).toBe(2)
    expect(segment.targetAudience).toBe('young_adult')
  })

  it('should use default engagement for empty chapters', () => {
    let state = createEmptyReaderEngagementState()
    const segment = predictSegmentEngagement(state, 1, 5, 'fantasy_love')
    expect(segment.expectedEngagement).toBe(50)
  })
})

describe('getDropoutAlerts', () => {
  it('should return empty for low risk chapters', () => {
    let state = createEmptyReaderEngagementState()
    state = predictChapterEngagement(state, 1, 1000, true, 50)
    expect(getDropoutAlerts(state).length).toBe(0)
  })

  it('should return chapters with high dropout risk', () => {
    let state = createEmptyReaderEngagementState()
    state = predictChapterEngagement(state, 1, 100, false, 95)
    state = predictChapterEngagement(state, 2, 100, false, 95)
    state = predictChapterEngagement(state, 3, 100, false, 95)
    const alerts = getDropoutAlerts(state)
    expect(alerts.length).toBeGreaterThan(0)
  })
})

describe('getEngagementAtChapter', () => {
  it('should return null for unknown chapter', () => {
    const state = createEmptyReaderEngagementState()
    expect(getEngagementAtChapter(state, 1)).toBeNull()
  })

  it('should return data point for known chapter', () => {
    let state = createEmptyReaderEngagementState()
    state = predictChapterEngagement(state, 1, 800, false, 50)
    const dp = getEngagementAtChapter(state, 1)
    expect(dp).not.toBeNull()
    expect(dp?.chapter).toBe(1)
  })
})

describe('formatEngagementSummary', () => {
  it('should show chapter count', () => {
    let state = createEmptyReaderEngagementState()
    state = predictChapterEngagement(state, 1, 800, false, 50)
    const summary = formatEngagementSummary(state)
    expect(summary).toContain('Chapters tracked: 1')
  })

  it('should show average engagement', () => {
    let state = createEmptyReaderEngagementState()
    state = predictChapterEngagement(state, 1, 800, false, 50)
    const summary = formatEngagementSummary(state)
    expect(summary).toContain('Avg Engagement:')
  })

  it('should show dropout alert count', () => {
    let state = createEmptyReaderEngagementState()
    state = predictChapterEngagement(state, 1, 800, false, 50)
    const summary = formatEngagementSummary(state)
    expect(summary).toContain('Dropout Alerts: 0')
  })
})

describe('formatEngagementDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptyReaderEngagementState()
    state = predictChapterEngagement(state, 3, 800, false, 50)
    const dashboard = formatEngagementDashboard(state)
    expect(dashboard).toContain('Chapter: 3')
  })

  it('should show recent chapter data', () => {
    let state = createEmptyReaderEngagementState()
    state = predictChapterEngagement(state, 1, 800, false, 50)
    state = predictChapterEngagement(state, 2, 800, false, 50)
    const dashboard = formatEngagementDashboard(state)
    expect(dashboard).toContain('Ch1')
    expect(dashboard).toContain('Ch2')
  })

  it('should show ALERT for high dropout risk', () => {
    let state = createEmptyReaderEngagementState()
    state = predictChapterEngagement(state, 1, 100, false, 95)
    state = predictChapterEngagement(state, 2, 100, false, 95)
    state = predictChapterEngagement(state, 3, 100, false, 95)
    const dashboard = formatEngagementDashboard(state)
    expect(dashboard).toContain('ALERT')
  })
})
