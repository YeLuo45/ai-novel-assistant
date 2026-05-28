import { describe, it, expect } from 'vitest'
import {
  createEmptyClimaxDensityState,
  recordClimaxEvent,
  getClimaxAtChapter,
  getClimaxCount,
  calculateImpactScore,
  formatClimaxSummary,
  formatClimaxDashboard,
} from './StoryClimaxEngine'

describe('createEmptyClimaxDensityState', () => {
  it('should create empty state', () => {
    const state = createEmptyClimaxDensityState()
    expect(state.events.length).toBe(0)
    expect(state.totalChapters).toBe(10)
    expect(state.impactScore).toBe(0)
  })

  it('should accept custom total chapters', () => {
    const state = createEmptyClimaxDensityState(20)
    expect(state.totalChapters).toBe(20)
  })
})

describe('recordClimaxEvent', () => {
  it('should add first climax event', () => {
    let state = createEmptyClimaxDensityState()
    state = recordClimaxEvent(state, 5, 'The final battle')
    expect(state.events.length).toBe(1)
  })

  it('should detect action event type', () => {
    let state = createEmptyClimaxDensityState()
    state = recordClimaxEvent(state, 5, 'Epic battle')
    expect(state.events[0].eventType).toBe('action')
  })

  it('should detect revelation event type', () => {
    let state = createEmptyClimaxDensityState()
    state = recordClimaxEvent(state, 5, 'The truth is revealed')
    expect(state.events[0].eventType).toBe('revelation')
  })

  it('should detect betrayal event type', () => {
    let state = createEmptyClimaxDensityState()
    state = recordClimaxEvent(state, 5, 'The shocking betrayal')
    expect(state.events[0].eventType).toBe('betrayal')
  })

  it('should calculate intensity from buildUp and payoff', () => {
    let state = createEmptyClimaxDensityState()
    state = recordClimaxEvent(state, 5, 'The climax with rising tension and confrontation')
    expect(state.events[0].intensity).toBeGreaterThan(50)
  })

  it('should update current chapter', () => {
    let state = createEmptyClimaxDensityState()
    state = recordClimaxEvent(state, 7, 'Climax')
    expect(state.currentChapter).toBe(7)
  })

  it('should update impact score', () => {
    let state = createEmptyClimaxDensityState()
    state = recordClimaxEvent(state, 5, 'The climax with rising tension and confrontation')
    expect(state.impactScore).toBeGreaterThan(0)
  })
})

describe('getClimaxAtChapter', () => {
  it('should return null when no event at chapter', () => {
    const state = createEmptyClimaxDensityState()
    expect(getClimaxAtChapter(state, 5)).toBeNull()
  })

  it('should return event at specific chapter', () => {
    let state = createEmptyClimaxDensityState()
    state = recordClimaxEvent(state, 5, 'The climax')
    const event = getClimaxAtChapter(state, 5)
    expect(event).not.toBeNull()
    expect(event?.chapter).toBe(5)
  })
})

describe('getClimaxCount', () => {
  it('should return 0 for empty state', () => {
    const state = createEmptyClimaxDensityState()
    expect(getClimaxCount(state)).toBe(0)
  })

  it('should return count of events', () => {
    let state = createEmptyClimaxDensityState()
    state = recordClimaxEvent(state, 3, 'Event 1')
    state = recordClimaxEvent(state, 5, 'Event 2')
    expect(getClimaxCount(state)).toBe(2)
  })
})

describe('calculateImpactScore', () => {
  it('should return 0 for no events', () => {
    const state = createEmptyClimaxDensityState()
    expect(calculateImpactScore(state)).toBe(0)
  })

  it('should return score based on intensity', () => {
    let state = createEmptyClimaxDensityState()
    state = recordClimaxEvent(state, 5, 'The climax with rising tension and confrontation')
    expect(calculateImpactScore(state)).toBeGreaterThan(0)
  })
})

describe('formatClimaxSummary', () => {
  it('should show event count', () => {
    let state = createEmptyClimaxDensityState()
    state = recordClimaxEvent(state, 5, 'Climax')
    const summary = formatClimaxSummary(state)
    expect(summary).toContain('Events: 1')
  })

  it('should show impact score', () => {
    let state = createEmptyClimaxDensityState()
    state = recordClimaxEvent(state, 5, 'The climax with rising tension and confrontation')
    const summary = formatClimaxSummary(state)
    expect(summary).toContain('Impact Score:')
  })
})

describe('formatClimaxDashboard', () => {
  it('should show chapter progress', () => {
    let state = createEmptyClimaxDensityState(10)
    state = recordClimaxEvent(state, 5, 'Climax')
    const dashboard = formatClimaxDashboard(state)
    expect(dashboard).toContain('Chapter: 5/10')
  })

  it('should show event types', () => {
    let state = createEmptyClimaxDensityState()
    state = recordClimaxEvent(state, 5, 'Battle')
    state = recordClimaxEvent(state, 7, 'The truth is revealed')
    const dashboard = formatClimaxDashboard(state)
    expect(dashboard).toContain('Event Types')
    expect(dashboard).toContain('action')
    expect(dashboard).toContain('revelation')
  })

  it('should show total climaxes', () => {
    let state = createEmptyClimaxDensityState()
    state = recordClimaxEvent(state, 5, 'Climax 1')
    state = recordClimaxEvent(state, 7, 'Climax 2')
    const dashboard = formatClimaxDashboard(state)
    expect(dashboard).toContain('Total Climaxes: 2')
  })
})
