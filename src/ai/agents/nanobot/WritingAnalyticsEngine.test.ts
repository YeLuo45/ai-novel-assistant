import { describe, it, expect } from 'vitest'
import {
  createEmptyWritingAnalyticsState,
  recordSession,
  getAverageWordsPerSession,
  getProductivityScore,
  formatAnalyticsSummary,
  formatAnalyticsDashboard,
} from './WritingAnalyticsEngine'

describe('createEmptyWritingAnalyticsState', () => {
  it('should create empty state', () => {
    const state = createEmptyWritingAnalyticsState()
    expect(state.sessions.length).toBe(0)
    expect(state.totalWords).toBe(0)
    expect(state.currentStreak).toBe(0)
  })
})

describe('recordSession', () => {
  it('should add first session', () => {
    let state = createEmptyWritingAnalyticsState()
    state = recordSession(state, '2026-05-29', 500, 60, 2)
    expect(state.sessions.length).toBe(1)
  })

  it('should accumulate total words', () => {
    let state = createEmptyWritingAnalyticsState()
    state = recordSession(state, '2026-05-29', 500, 60, 2)
    state = recordSession(state, '2026-05-29', 300, 30, 1)
    expect(state.totalWords).toBe(800)
  })

  it('should calculate average quality', () => {
    let state = createEmptyWritingAnalyticsState()
    state = recordSession(state, '2026-05-29', 500, 60, 2)
    state = recordSession(state, '2026-05-29', 300, 30, 1)
    expect(state.averageQuality).toBeGreaterThan(0)
  })

  it('should detect streak for consecutive days', () => {
    let state = createEmptyWritingAnalyticsState()
    state = recordSession(state, '2026-05-28', 300, 30, 1)
    state = recordSession(state, '2026-05-29', 500, 60, 2)
    expect(state.currentStreak).toBe(2)
  })

  it('should not extend streak for gap', () => {
    let state = createEmptyWritingAnalyticsState()
    state = recordSession(state, '2026-05-27', 300, 30, 1)
    state = recordSession(state, '2026-05-29', 500, 60, 2)
    expect(state.currentStreak).toBe(1)
  })

  it('should assess quality for good pace', () => {
    let state = createEmptyWritingAnalyticsState()
    state = recordSession(state, '2026-05-29', 100, 60, 1)
    expect(state.sessions[0].qualityScore).toBeGreaterThan(70)
  })

  it('should penalize very fast pace', () => {
    let state = createEmptyWritingAnalyticsState()
    state = recordSession(state, '2026-05-29', 500, 10, 2)
    expect(state.sessions[0].qualityScore).toBeLessThan(80)
  })

  it('should calculate productivity score', () => {
    let state = createEmptyWritingAnalyticsState()
    state = recordSession(state, '2026-05-29', 500, 60, 2)
    expect(state.productivityScore).toBeGreaterThan(0)
  })
})

describe('getAverageWordsPerSession', () => {
  it('should return 0 for no sessions', () => {
    const state = createEmptyWritingAnalyticsState()
    expect(getAverageWordsPerSession(state)).toBe(0)
  })

  it('should return average words', () => {
    let state = createEmptyWritingAnalyticsState()
    state = recordSession(state, '2026-05-29', 500, 60, 2)
    state = recordSession(state, '2026-05-29', 300, 30, 1)
    expect(getAverageWordsPerSession(state)).toBe(400)
  })
})

describe('getProductivityScore', () => {
  it('should return 0 for no sessions', () => {
    const state = createEmptyWritingAnalyticsState()
    expect(getProductivityScore(state)).toBe(0)
  })

  it('should return productivity score', () => {
    let state = createEmptyWritingAnalyticsState()
    state = recordSession(state, '2026-05-29', 500, 60, 2)
    expect(getProductivityScore(state)).toBeGreaterThan(0)
  })
})

describe('formatAnalyticsSummary', () => {
  it('should show session count', () => {
    let state = createEmptyWritingAnalyticsState()
    state = recordSession(state, '2026-05-29', 500, 60, 2)
    const summary = formatAnalyticsSummary(state)
    expect(summary).toContain('Sessions: 1')
  })

  it('should show total words', () => {
    let state = createEmptyWritingAnalyticsState()
    state = recordSession(state, '2026-05-29', 500, 60, 2)
    const summary = formatAnalyticsSummary(state)
    expect(summary).toContain('Total Words: 500')
  })

  it('should show average quality', () => {
    let state = createEmptyWritingAnalyticsState()
    state = recordSession(state, '2026-05-29', 500, 60, 2)
    const summary = formatAnalyticsSummary(state)
    expect(summary).toContain('Avg Quality:')
  })

  it('should show streak', () => {
    let state = createEmptyWritingAnalyticsState()
    state = recordSession(state, '2026-05-29', 500, 60, 2)
    const summary = formatAnalyticsSummary(state)
    expect(summary).toContain('Streak:')
  })
})

describe('formatAnalyticsDashboard', () => {
  it('should show session count and total words', () => {
    let state = createEmptyWritingAnalyticsState()
    state = recordSession(state, '2026-05-29', 500, 60, 2)
    const dashboard = formatAnalyticsDashboard(state)
    expect(dashboard).toContain('Total Words: 500')
  })

  it('should show quality and streak', () => {
    let state = createEmptyWritingAnalyticsState()
    state = recordSession(state, '2026-05-29', 500, 60, 2)
    const dashboard = formatAnalyticsDashboard(state)
    expect(dashboard).toContain('Avg Quality:')
    expect(dashboard).toContain('Streak:')
  })

  it('should show productivity score', () => {
    let state = createEmptyWritingAnalyticsState()
    state = recordSession(state, '2026-05-29', 500, 60, 2)
    const dashboard = formatAnalyticsDashboard(state)
    expect(dashboard).toContain('Productivity Score:')
  })

  it('should show recent sessions', () => {
    let state = createEmptyWritingAnalyticsState()
    state = recordSession(state, '2026-05-29', 500, 60, 2)
    const dashboard = formatAnalyticsDashboard(state)
    expect(dashboard).toContain('Recent Sessions')
  })
})
