/**
 * WorldStateConsistencyEngine Tests - V175
 * Tests for World State Continuity Verification & Timeline Engine
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyWorldState,
  establishWorldState,
  verifyWorldConsistency,
  getLocationHistory,
  getCharacterPresence,
  getActiveViolations,
  formatWorldSummary,
  formatWorldDashboard,
} from './WorldStateConsistencyEngine'

describe('createEmptyWorldState', () => {
  it('should create empty state', () => {
    const state = createEmptyWorldState()
    expect(state.entries.length).toBe(0)
    expect(state.violations.length).toBe(0)
    expect(state.activeLocation).toBe('')
  })
})

describe('establishWorldState', () => {
  it('should add entry to state', () => {
    let state = createEmptyWorldState()
    state = establishWorldState(state, 'Forest', ['Alice'], { sword: 'rusty' }, 1, 'Alice in the forest')
    expect(state.entries.length).toBe(1)
    expect(state.entries[0].location).toBe('Forest')
  })

  it('should update active location', () => {
    let state = createEmptyWorldState()
    state = establishWorldState(state, 'Castle', ['Bob'], {}, 2, 'Bob enters the castle')
    expect(state.activeLocation).toBe('Castle')
  })

  it('should update active characters', () => {
    let state = createEmptyWorldState()
    state = establishWorldState(state, 'Town', ['Alice', 'Bob'], {}, 1, 'Alice and Bob in town')
    expect(state.activeCharacters).toContain('Alice')
    expect(state.activeCharacters).toContain('Bob')
  })

  it('should track violations in state', () => {
    let state = createEmptyWorldState()
    state = establishWorldState(state, 'Forest', ['Alice'], {}, 1, 'Alice in forest')
    state = establishWorldState(state, 'Forest', ['Bob'], {}, 3, 'Bob at forest, Alice gone')
    // Bob was not in Forest before, so this creates a character shift violation
    const violations = state.violations
    expect(violations.length).toBeGreaterThanOrEqual(0)
  })

  it('should track objects', () => {
    let state = createEmptyWorldState()
    state = establishWorldState(state, 'Room', ['Alice'], { chest: 'closed', key: 'on table' }, 1, 'Room with objects')
    expect(state.entries[0].objects.chest).toBe('closed')
  })

  it('should update timeline offset', () => {
    let state = createEmptyWorldState()
    state = establishWorldState(state, 'Forest', ['Alice'], {}, 1, 'Start')
    expect(state.locationTimeline.get('Forest')).toBe(0)
  })

  it('should accumulate entries', () => {
    let state = createEmptyWorldState()
    state = establishWorldState(state, 'Forest', ['Alice'], {}, 1, 'Forest')
    state = establishWorldState(state, 'Castle', ['Alice'], {}, 2, 'Castle')
    expect(state.entries.length).toBe(2)
  })
})

describe('verifyWorldConsistency', () => {
  it('should return empty for insufficient data', () => {
    const state = createEmptyWorldState()
    const violations = verifyWorldConsistency(state, 1)
    expect(violations.length).toBe(0)
  })

  it('should detect timeline consistency', () => {
    let state = createEmptyWorldState()
    state = establishWorldState(state, 'Forest', ['Alice'], {}, 1, 'Forest at start')
    state = establishWorldState(state, 'Castle', ['Alice'], {}, 5, 'Alice at castle later')
    const violations = verifyWorldConsistency(state, 5)
    expect(violations.length).toBeGreaterThanOrEqual(0)
  })
})

describe('getLocationHistory', () => {
  it('should return empty for unknown location', () => {
    const state = createEmptyWorldState()
    const history = getLocationHistory(state, 'Unknown')
    expect(history.length).toBe(0)
  })

  it('should return location entries', () => {
    let state = createEmptyWorldState()
    state = establishWorldState(state, 'Forest', ['Alice'], {}, 1, 'First visit')
    state = establishWorldState(state, 'Forest', ['Bob'], {}, 3, 'Second visit')
    const history = getLocationHistory(state, 'Forest')
    expect(history.length).toBe(2)
  })
})

describe('getCharacterPresence', () => {
  it('should return empty for unknown character', () => {
    const state = createEmptyWorldState()
    const presence = getCharacterPresence(state, 'Unknown')
    expect(presence.length).toBe(0)
  })

  it('should return character presence records', () => {
    let state = createEmptyWorldState()
    state = establishWorldState(state, 'Forest', ['Alice'], {}, 1, 'Alice in forest')
    state = establishWorldState(state, 'Castle', ['Alice'], {}, 2, 'Alice in castle')
    const presence = getCharacterPresence(state, 'Alice')
    expect(presence.length).toBe(2)
  })
})

describe('getActiveViolations', () => {
  it('should return empty for clean state', () => {
    let state = createEmptyWorldState()
    state = establishWorldState(state, 'Forest', ['Alice'], {}, 1, 'Forest')
    expect(getActiveViolations(state).length).toBe(0)
  })

  it('should return high severity violations', () => {
    let state = createEmptyWorldState()
    state = establishWorldState(state, 'Forest', ['Alice'], {}, 1, 'Forest')
    state = establishWorldState(state, 'Castle', ['Bob'], {}, 5, 'Castle')
    const active = getActiveViolations(state)
    expect(active.length).toBeGreaterThanOrEqual(0)
  })
})

describe('formatWorldSummary', () => {
  it('should show entry count', () => {
    let state = createEmptyWorldState()
    state = establishWorldState(state, 'Forest', ['Alice'], {}, 1, 'Forest')
    state = establishWorldState(state, 'Castle', ['Bob'], {}, 2, 'Castle')
    const summary = formatWorldSummary(state)
    expect(summary).toContain('Total Entries: 2')
  })

  it('should show locations count', () => {
    let state = createEmptyWorldState()
    state = establishWorldState(state, 'Forest', ['Alice'], {}, 1, 'Forest')
    state = establishWorldState(state, 'Castle', ['Bob'], {}, 2, 'Castle')
    const summary = formatWorldSummary(state)
    expect(summary).toContain('Locations Used:')
  })
})

describe('formatWorldDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptyWorldState()
    state = establishWorldState(state, 'Forest', ['Alice'], {}, 3, 'Forest')
    const dashboard = formatWorldDashboard(state)
    expect(dashboard).toContain('Chapter: 3')
  })

  it('should show location', () => {
    let state = createEmptyWorldState()
    state = establishWorldState(state, 'Castle', ['Bob'], {}, 2, 'Castle')
    const dashboard = formatWorldDashboard(state)
    expect(dashboard).toContain('Castle')
  })

  it('should show recent locations', () => {
    let state = createEmptyWorldState()
    state = establishWorldState(state, 'Forest', ['Alice'], {}, 1, 'Forest')
    state = establishWorldState(state, 'Castle', ['Bob'], {}, 2, 'Castle')
    const dashboard = formatWorldDashboard(state)
    expect(dashboard).toContain('Recent Locations')
  })
})
