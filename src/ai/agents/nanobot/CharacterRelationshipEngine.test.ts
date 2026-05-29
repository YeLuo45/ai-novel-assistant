import { describe, it, expect } from 'vitest'
import {
  createEmptyCharacterRelationshipState,
  registerCharacter,
  createRelationship,
  recordRelationshipEvent,
  getRelationshipHealth,
  getCharacterRelationships,
  formatRelationshipSummary,
  formatRelationshipDashboard,
} from './CharacterRelationshipEngine'

describe('createEmptyCharacterRelationshipState', () => {
  it('should create empty state', () => {
    const state = createEmptyCharacterRelationshipState()
    expect(state.characters.size).toBe(0)
    expect(state.relationships.length).toBe(0)
    expect(state.changeCount).toBe(0)
  })
})

describe('registerCharacter', () => {
  it('should register character', () => {
    let state = createEmptyCharacterRelationshipState()
    state = registerCharacter(state, 'Alice')
    expect(state.characters.has('Alice')).toBeTruthy()
  })
})

describe('createRelationship', () => {
  it('should create relationship', () => {
    let state = createEmptyCharacterRelationshipState()
    state = createRelationship(state, 'Alice', 'Bob', 'friend')
    expect(state.relationships.length).toBe(1)
    expect(state.relationships[0].type).toBe('friend')
  })

  it('should set initial health', () => {
    let state = createEmptyCharacterRelationshipState()
    state = createRelationship(state, 'Alice', 'Bob', 'friend')
    expect(state.relationships[0].health).toBe(50)
  })

  it('should set enemy health negative', () => {
    let state = createEmptyCharacterRelationshipState()
    state = createRelationship(state, 'Alice', 'Bob', 'enemy')
    expect(state.relationships[0].health).toBe(-20)
  })

  it('should not duplicate relationship', () => {
    let state = createEmptyCharacterRelationshipState()
    state = createRelationship(state, 'Alice', 'Bob', 'friend')
    state = createRelationship(state, 'Bob', 'Alice', 'friend')
    expect(state.relationships.length).toBe(1)
  })
})

describe('recordRelationshipEvent', () => {
  it('should add positive impact', () => {
    let state = createEmptyCharacterRelationshipState()
    state = createRelationship(state, 'Alice', 'Bob', 'friend')
    state = recordRelationshipEvent(state, 'Alice', 'Bob', 1, 'Saved life', 30)
    expect(state.relationships[0].health).toBe(80)
  })

  it('should add negative impact', () => {
    let state = createEmptyCharacterRelationshipState()
    state = createRelationship(state, 'Alice', 'Bob', 'friend')
    state = recordRelationshipEvent(state, 'Alice', 'Bob', 1, 'Betrayal', -40)
    expect(state.relationships[0].health).toBe(10)
  })

  it('should clamp health at 100', () => {
    let state = createEmptyCharacterRelationshipState()
    state = createRelationship(state, 'Alice', 'Bob', 'friend')
    state = recordRelationshipEvent(state, 'Alice', 'Bob', 1, 'Great act', 80)
    expect(state.relationships[0].health).toBe(100)
  })

  it('should clamp health at -100', () => {
    let state = createEmptyCharacterRelationshipState()
    state = createRelationship(state, 'Alice', 'Bob', 'enemy')
    state = recordRelationshipEvent(state, 'Alice', 'Bob', 1, 'Major betrayal', -90)
    expect(state.relationships[0].health).toBe(-100)
  })

  it('should update current chapter', () => {
    let state = createEmptyCharacterRelationshipState()
    state = createRelationship(state, 'Alice', 'Bob', 'friend')
    state = recordRelationshipEvent(state, 'Alice', 'Bob', 5, 'Event', 10)
    expect(state.currentChapter).toBe(5)
  })

  it('should increment change count', () => {
    let state = createEmptyCharacterRelationshipState()
    state = createRelationship(state, 'Alice', 'Bob', 'friend')
    state = recordRelationshipEvent(state, 'Alice', 'Bob', 1, 'Event', 10)
    expect(state.changeCount).toBe(1)
  })
})

describe('getRelationshipHealth', () => {
  it('should return 0 for unknown relationship', () => {
    const state = createEmptyCharacterRelationshipState()
    expect(getRelationshipHealth(state, 'Alice', 'Bob')).toBe(0)
  })

  it('should return health for existing relationship', () => {
    let state = createEmptyCharacterRelationshipState()
    state = createRelationship(state, 'Alice', 'Bob', 'friend')
    expect(getRelationshipHealth(state, 'Alice', 'Bob')).toBe(50)
  })
})

describe('getCharacterRelationships', () => {
  it('should return empty for unknown character', () => {
    const state = createEmptyCharacterRelationshipState()
    expect(getCharacterRelationships(state, 'Alice').length).toBe(0)
  })

  it('should return character relationships', () => {
    let state = createEmptyCharacterRelationshipState()
    state = createRelationship(state, 'Alice', 'Bob', 'friend')
    const rels = getCharacterRelationships(state, 'Alice')
    expect(rels.length).toBe(1)
    expect(rels[0].other).toBe('Bob')
    expect(rels[0].type).toBe('friend')
  })
})

describe('formatRelationshipSummary', () => {
  it('should show character count', () => {
    let state = createEmptyCharacterRelationshipState()
    state = createRelationship(state, 'Alice', 'Bob', 'friend')
    const summary = formatRelationshipSummary(state)
    expect(summary).toContain('Characters: 2')
  })

  it('should show relationship count', () => {
    let state = createEmptyCharacterRelationshipState()
    state = createRelationship(state, 'Alice', 'Bob', 'friend')
    state = createRelationship(state, 'Alice', 'Carol', 'friend')
    const summary = formatRelationshipSummary(state)
    expect(summary).toContain('Relationships: 2')
  })
})

describe('formatRelationshipDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptyCharacterRelationshipState()
    state = createRelationship(state, 'Alice', 'Bob', 'friend')
    state = recordRelationshipEvent(state, 'Alice', 'Bob', 3, 'Event', 10)
    const dashboard = formatRelationshipDashboard(state)
    expect(dashboard).toContain('Chapter: 3')
  })

  it('should show key relationships', () => {
    let state = createEmptyCharacterRelationshipState()
    state = createRelationship(state, 'Alice', 'Bob', 'friend')
    const dashboard = formatRelationshipDashboard(state)
    expect(dashboard).toContain('Alice')
    expect(dashboard).toContain('Bob')
  })
})
