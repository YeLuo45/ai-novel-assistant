import { describe, it, expect } from 'vitest'
import {
  createEmptySettingWorldState,
  registerLocation,
  addTimelineEvent,
  getLocationInfo,
  getTimelineGaps,
  formatSettingSummary,
  formatSettingDashboard,
} from './SettingWorldConsistencyEngine'

describe('createEmptySettingWorldState', () => {
  it('should create empty state', () => {
    const state = createEmptySettingWorldState()
    expect(state.locations.size).toBe(0)
    expect(state.timeline.length).toBe(0)
    expect(state.consistencyScore).toBe(100)
  })
})

describe('registerLocation', () => {
  it('should register location', () => {
    let state = createEmptySettingWorldState()
    state = registerLocation(state, 'Castle', 'The royal castle')
    expect(state.locations.size).toBe(1)
    expect(state.locations.get('Castle')?.name).toBe('Castle')
  })

  it('should set first chapter', () => {
    let state = createEmptySettingWorldState()
    state = addTimelineEvent(state, 5, 'Event', ['Castle'])
    state = registerLocation(state, 'Tavern', 'A tavern')
    expect(state.locations.get('Tavern')?.firstChapter).toBe(5)
  })
})

describe('addTimelineEvent', () => {
  it('should add timeline event', () => {
    let state = createEmptySettingWorldState()
    state = addTimelineEvent(state, 1, 'The battle begins', ['Battlefield'])
    expect(state.timeline.length).toBe(1)
    expect(state.timeline[0].event).toContain('battle')
  })

  it('should auto-register affected locations', () => {
    let state = createEmptySettingWorldState()
    state = addTimelineEvent(state, 1, 'The battle at the castle', ['Castle'])
    expect(state.locations.has('Castle')).toBeTruthy()
  })

  it('should update location last chapter', () => {
    let state = createEmptySettingWorldState()
    state = addTimelineEvent(state, 1, 'Event at castle', ['Castle'])
    state = addTimelineEvent(state, 5, 'Another event', ['Castle'])
    expect(state.locations.get('Castle')?.lastChapter).toBe(5)
  })

  it('should detect timeline gaps', () => {
    let state = createEmptySettingWorldState()
    state = addTimelineEvent(state, 1, 'Event 1', ['Loc A'])
    state = addTimelineEvent(state, 2, 'Event 2', ['Loc A'])
    state = addTimelineEvent(state, 6, 'Event 3', ['Loc A'])
    expect(state.timelineGaps.length).toBeGreaterThan(0)
  })

  it('should update current chapter', () => {
    let state = createEmptySettingWorldState()
    state = addTimelineEvent(state, 3, 'Event', ['Loc'])
    expect(state.currentChapter).toBe(3)
  })
})

describe('getLocationInfo', () => {
  it('should return null for unknown location', () => {
    const state = createEmptySettingWorldState()
    expect(getLocationInfo(state, 'Unknown')).toBeNull()
  })

  it('should return location info', () => {
    let state = createEmptySettingWorldState()
    state = addTimelineEvent(state, 1, 'Event', ['Castle'])
    const info = getLocationInfo(state, 'Castle')
    expect(info).not.toBeNull()
    expect(info?.name).toBe('Castle')
  })
})

describe('getTimelineGaps', () => {
  it('should return empty for continuous timeline', () => {
    let state = createEmptySettingWorldState()
    state = addTimelineEvent(state, 1, 'Event', ['Loc'])
    state = addTimelineEvent(state, 2, 'Event', ['Loc'])
    expect(getTimelineGaps(state).length).toBe(0)
  })

  it('should return gaps', () => {
    let state = createEmptySettingWorldState()
    state = addTimelineEvent(state, 1, 'Event', ['Loc'])
    state = addTimelineEvent(state, 5, 'Event', ['Loc'])
    expect(getTimelineGaps(state).length).toBeGreaterThan(0)
  })
})

describe('formatSettingSummary', () => {
  it('should show location count', () => {
    let state = createEmptySettingWorldState()
    state = addTimelineEvent(state, 1, 'Event', ['Castle'])
    state = addTimelineEvent(state, 2, 'Event', ['Tavern'])
    const summary = formatSettingSummary(state)
    expect(summary).toContain('Locations: 2')
  })

  it('should show timeline event count', () => {
    let state = createEmptySettingWorldState()
    state = addTimelineEvent(state, 1, 'Event 1', ['Loc'])
    state = addTimelineEvent(state, 2, 'Event 2', ['Loc'])
    const summary = formatSettingSummary(state)
    expect(summary).toContain('Timeline Events: 2')
  })
})

describe('formatSettingDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptySettingWorldState()
    state = addTimelineEvent(state, 4, 'Event', ['Loc'])
    const dashboard = formatSettingDashboard(state)
    expect(dashboard).toContain('Chapter: 4')
  })

  it('should show recent locations', () => {
    let state = createEmptySettingWorldState()
    state = addTimelineEvent(state, 1, 'Event', ['Castle'])
    state = addTimelineEvent(state, 2, 'Event', ['Tavern'])
    const dashboard = formatSettingDashboard(state)
    expect(dashboard).toContain('Castle')
    expect(dashboard).toContain('Tavern')
  })
})
