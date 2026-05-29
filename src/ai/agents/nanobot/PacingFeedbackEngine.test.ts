import { describe, it, expect } from 'vitest'
import {
  createEmptyPacingFeedbackState,
  recordPacingEvent,
  getPacingAtChapter,
  getRetentionScore,
  formatPacingSummary,
  formatPacingDashboard,
} from './PacingFeedbackEngine'

describe('createEmptyPacingFeedbackState', () => {
  it('should create empty state', () => {
    const state = createEmptyPacingFeedbackState()
    expect(state.events.length).toBe(0)
    expect(state.engagementTrend).toBe('stable')
    expect(state.retentionScore).toBe(0)
  })
})

describe('recordPacingEvent', () => {
  it('should add first pacing event', () => {
    let state = createEmptyPacingFeedbackState()
    state = recordPacingEvent(state, 1, 'The mystery deepens as the secret is discovered', 'Good pacing')
    expect(state.events.length).toBe(1)
  })

  it('should assess pacing score for fast scene', () => {
    let state = createEmptyPacingFeedbackState()
    state = recordPacingEvent(state, 1, 'Suddenly and immediately everything changed', 'Fast')
    expect(state.events[0].pacingScore).toBe(50)
  })

  it('should assess pacing score for slow scene', () => {
    let state = createEmptyPacingFeedbackState()
    state = recordPacingEvent(state, 1, 'Meanwhile, in another place, the scene continued slowly with descriptive detail', 'Slow')
    expect(state.events[0].pacingScore).toBeLessThan(60)
  })

  it('should assess engagement for mystery text', () => {
    let state = createEmptyPacingFeedbackState()
    state = recordPacingEvent(state, 1, 'The mystery deepens with a secret revealed', 'Engaging')
    expect(state.events[0].engagementLevel).toBeGreaterThan(50)
  })

  it('should assess engagement for quiet text', () => {
    let state = createEmptyPacingFeedbackState()
    state = recordPacingEvent(state, 1, 'The quiet peaceful morning was calm and serene', 'Calm')
    expect(state.events[0].engagementLevel).toBeLessThan(50)
  })

  it('should detect improving trend', () => {
    let state = createEmptyPacingFeedbackState()
    state = recordPacingEvent(state, 1, 'The quiet morning', 'Low')
    state = recordPacingEvent(state, 2, 'Meanwhile things continued', 'Med')
    state = recordPacingEvent(state, 3, 'The danger approaches with threat looming', 'High')
    state = recordPacingEvent(state, 4, 'The mystery deepens with secret revelation', 'High')
    expect(state.engagementTrend).toBe('improving')
  })

  it('should detect declining trend', () => {
    let state = createEmptyPacingFeedbackState()
    state = recordPacingEvent(state, 1, 'The danger with threat looming', 'High')
    state = recordPacingEvent(state, 2, 'The mystery with secret', 'High')
    state = recordPacingEvent(state, 3, 'Meanwhile peaceful quiet calm', 'Low')
    state = recordPacingEvent(state, 4, 'The quiet peaceful morning was serene', 'Low')
    expect(state.engagementTrend).toBe('declining')
  })

  it('should update current chapter', () => {
    let state = createEmptyPacingFeedbackState()
    state = recordPacingEvent(state, 5, 'The scene', 'Pacing')
    expect(state.currentChapter).toBe(5)
  })

  it('should update retention score', () => {
    let state = createEmptyPacingFeedbackState()
    state = recordPacingEvent(state, 1, 'The danger with mystery threat', 'Engaging')
    expect(state.retentionScore).toBeGreaterThan(0)
  })
})

describe('getPacingAtChapter', () => {
  it('should return null for unknown chapter', () => {
    const state = createEmptyPacingFeedbackState()
    expect(getPacingAtChapter(state, 1)).toBeNull()
  })

  it('should return event at chapter', () => {
    let state = createEmptyPacingFeedbackState()
    state = recordPacingEvent(state, 5, 'The scene', 'Pacing')
    const event = getPacingAtChapter(state, 5)
    expect(event).not.toBeNull()
    expect(event?.chapter).toBe(5)
  })
})

describe('getRetentionScore', () => {
  it('should return 0 for no events', () => {
    const state = createEmptyPacingFeedbackState()
    expect(getRetentionScore(state)).toBe(0)
  })

  it('should return retention score', () => {
    let state = createEmptyPacingFeedbackState()
    state = recordPacingEvent(state, 1, 'The danger with threat', 'Engaging')
    expect(getRetentionScore(state)).toBeGreaterThan(0)
  })
})

describe('formatPacingSummary', () => {
  it('should show event count', () => {
    let state = createEmptyPacingFeedbackState()
    state = recordPacingEvent(state, 1, 'Scene', 'Pacing')
    state = recordPacingEvent(state, 2, 'Scene', 'Pacing')
    const summary = formatPacingSummary(state)
    expect(summary).toContain('Events: 2')
  })

  it('should show avg pacing', () => {
    let state = createEmptyPacingFeedbackState()
    state = recordPacingEvent(state, 1, 'The scene', 'Pacing')
    const summary = formatPacingSummary(state)
    expect(summary).toContain('Avg Pacing:')
  })

  it('should show retention score', () => {
    let state = createEmptyPacingFeedbackState()
    state = recordPacingEvent(state, 1, 'The danger with mystery', 'Engaging')
    const summary = formatPacingSummary(state)
    expect(summary).toContain('Retention Score:')
  })
})

describe('formatPacingDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptyPacingFeedbackState()
    state = recordPacingEvent(state, 3, 'Scene', 'Pacing')
    const dashboard = formatPacingDashboard(state)
    expect(dashboard).toContain('Chapter: 3')
  })

  it('should show trend', () => {
    let state = createEmptyPacingFeedbackState()
    state = recordPacingEvent(state, 1, 'The quiet morning', 'Low')
    state = recordPacingEvent(state, 2, 'Meanwhile', 'Med')
    state = recordPacingEvent(state, 3, 'The danger with threat', 'High')
    state = recordPacingEvent(state, 4, 'The mystery with secret', 'High')
    const dashboard = formatPacingDashboard(state)
    expect(dashboard).toContain('Trend: improving')
  })

  it('should show recent events', () => {
    let state = createEmptyPacingFeedbackState()
    state = recordPacingEvent(state, 1, 'Scene 1', 'Pacing')
    state = recordPacingEvent(state, 2, 'Scene 2', 'Pacing')
    const dashboard = formatPacingDashboard(state)
    expect(dashboard).toContain('Recent Events')
  })
})
