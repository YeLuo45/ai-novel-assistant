import { describe, it, expect } from 'vitest'
import {
  createEmptyBackstoryIntegrationState,
  registerCharacter,
  addBackstoryEvent,
  getCharacterBackstory,
  getBackstoryTimeline,
  checkContradictions,
  formatBackstorySummary,
  formatBackstoryDashboard,
} from './BackstoryIntegratorEngine'

describe('createEmptyBackstoryIntegrationState', () => {
  it('should create empty state', () => {
    const state = createEmptyBackstoryIntegrationState()
    expect(state.backstories.size).toBe(0)
  })
})

describe('registerCharacter', () => {
  it('should register new character', () => {
    let state = createEmptyBackstoryIntegrationState()
    state = registerCharacter(state, 'alice', 25)
    expect(state.backstories.has('alice')).toBeTruthy()
  })

  it('should not duplicate character', () => {
    let state = createEmptyBackstoryIntegrationState()
    state = registerCharacter(state, 'alice', 25)
    state = registerCharacter(state, 'alice', 26)
    expect(state.backstories.size).toBe(1)
  })
})

describe('addBackstoryEvent', () => {
  it('should add event to registered character', () => {
    let state = createEmptyBackstoryIntegrationState()
    state = registerCharacter(state, 'alice', 25)
    state = addBackstoryEvent(state, 'alice', 1, 10, 'First Memory', 'She learned to read', 'joy')
    expect(state.backstories.get('alice')?.events.length).toBe(1)
  })

  it('should detect emotional tags', () => {
    let state = createEmptyBackstoryIntegrationState()
    state = registerCharacter(state, 'alice', 25)
    state = addBackstoryEvent(state, 'alice', 1, 10, 'Loss', 'She lost her friend', 'grief')
    const event = state.backstories.get('alice')?.events[0]
    expect(event?.emotionalTags).toContain('grief')
  })

  it('should detect pivotal importance', () => {
    let state = createEmptyBackstoryIntegrationState()
    state = registerCharacter(state, 'alice', 25)
    state = addBackstoryEvent(state, 'alice', 1, 15, 'Turning Point', 'Life-changing moment', 'important')
    const event = state.backstories.get('alice')?.events[0]
    expect(event?.importance).toBe('major')
  })

  it('should update chapter', () => {
    let state = createEmptyBackstoryIntegrationState()
    state = addBackstoryEvent(state, 'alice', 1, 10, 'Event', 'Description', 'joy')
    expect(state.currentChapter).toBe(1)
  })

  it('should detect age contradiction', () => {
    let state = createEmptyBackstoryIntegrationState()
    state = registerCharacter(state, 'alice', 25)
    state = addBackstoryEvent(state, 'alice', 1, 10, 'First', 'First event', 'joy')
    state = addBackstoryEvent(state, 'alice', 2, 10, 'Second', 'Second event at same age', 'joy')
    const contradictions = checkContradictions(state, 'alice')
    expect(contradictions.length).toBeGreaterThan(0)
  })

  it('should auto-register unknown character', () => {
    let state = createEmptyBackstoryIntegrationState()
    state = addBackstoryEvent(state, 'bob', 1, 20, 'Event', 'Description', 'joy')
    expect(state.backstories.has('bob')).toBeTruthy()
  })
})

describe('getCharacterBackstory', () => {
  it('should return null for unknown character', () => {
    const state = createEmptyBackstoryIntegrationState()
    expect(getCharacterBackstory(state, 'unknown')).toBeNull()
  })

  it('should return backstory', () => {
    let state = createEmptyBackstoryIntegrationState()
    state = addBackstoryEvent(state, 'alice', 1, 10, 'Event', 'Desc', 'joy')
    const bs = getCharacterBackstory(state, 'alice')
    expect(bs).not.toBeNull()
    expect(bs?.events.length).toBe(1)
  })
})

describe('getBackstoryTimeline', () => {
  it('should return empty for unknown', () => {
    const state = createEmptyBackstoryIntegrationState()
    expect(getBackstoryTimeline(state, 'unknown').length).toBe(0)
  })

  it('should return sorted timeline', () => {
    let state = createEmptyBackstoryIntegrationState()
    state = addBackstoryEvent(state, 'alice', 1, 15, 'Teen', 'Teen event', 'joy')
    state = addBackstoryEvent(state, 'alice', 2, 5, 'Child', 'Child event', 'joy')
    const timeline = getBackstoryTimeline(state, 'alice')
    expect(timeline[0].age).toBe(5)
    expect(timeline[1].age).toBe(15)
  })
})

describe('checkContradictions', () => {
  it('should return empty for no contradictions', () => {
    let state = createEmptyBackstoryIntegrationState()
    state = registerCharacter(state, 'alice', 25)
    state = addBackstoryEvent(state, 'alice', 1, 10, 'Event', 'Desc', 'joy')
    expect(checkContradictions(state, 'alice').length).toBe(0)
  })
})

describe('formatBackstorySummary', () => {
  it('should show character count', () => {
    let state = createEmptyBackstoryIntegrationState()
    state = registerCharacter(state, 'alice', 25)
    state = registerCharacter(state, 'bob', 30)
    const summary = formatBackstorySummary(state)
    expect(summary).toContain('Characters Tracked: 2')
  })
})

describe('formatBackstoryDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptyBackstoryIntegrationState()
    state = addBackstoryEvent(state, 'alice', 3, 10, 'Event', 'Desc', 'joy')
    const dashboard = formatBackstoryDashboard(state)
    expect(dashboard).toContain('Chapter: 3')
  })

  it('should show character event count', () => {
    let state = createEmptyBackstoryIntegrationState()
    state = registerCharacter(state, 'alice', 25)
    state = addBackstoryEvent(state, 'alice', 1, 10, 'Event', 'Desc', 'joy')
    const dashboard = formatBackstoryDashboard(state)
    expect(dashboard).toContain('alice')
  })
})
