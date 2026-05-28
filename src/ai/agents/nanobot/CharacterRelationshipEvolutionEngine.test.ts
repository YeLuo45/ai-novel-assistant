/**
 * CharacterRelationshipEvolutionEngine Tests - V185
 * Tests for Character Relationship Dynamics & Evolution Tracking Engine
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyCharacterRelationshipState,
  registerCharacter,
  recordRelationshipEvent,
  getRelationship,
  getAllRelationshipsForCharacter,
  getRelationshipSummary,
  formatRelationshipDashboard,
} from './CharacterRelationshipEvolutionEngine'

describe('createEmptyCharacterRelationshipState', () => {
  it('should create empty state', () => {
    const state = createEmptyCharacterRelationshipState()
    expect(state.relationships.size).toBe(0)
    expect(state.characterList.length).toBe(0)
  })
})

describe('registerCharacter', () => {
  it('should add character to list', () => {
    let state = createEmptyCharacterRelationshipState()
    state = registerCharacter(state, 'alice')
    expect(state.characterList).toContain('alice')
  })

  it('should not add duplicate', () => {
    let state = createEmptyCharacterRelationshipState()
    state = registerCharacter(state, 'alice')
    state = registerCharacter(state, 'alice')
    expect(state.characterList.length).toBe(1)
  })
})

describe('recordRelationshipEvent', () => {
  it('should create new relationship', () => {
    let state = createEmptyCharacterRelationshipState()
    state = recordRelationshipEvent(state, 'alice', 'bob', 'helped', 40, 'Bob saved Alice', 1)
    expect(state.relationships.size).toBe(1)
  })

  it('should increase trust for positive impact', () => {
    let state = createEmptyCharacterRelationshipState()
    state = recordRelationshipEvent(state, 'alice', 'bob', 'helped', 30, 'Bob helped Alice', 1)
    const rel = state.relationships.get('alice::bob')
    expect(rel?.trust).toBeGreaterThan(0)
  })

  it('should decrease trust for negative impact', () => {
    let state = createEmptyCharacterRelationshipState()
    state = recordRelationshipEvent(state, 'alice', 'bob', 'betrayed', -40, 'Bob betrayed Alice', 1)
    const rel = state.relationships.get('alice::bob')
    expect(rel?.trust).toBeLessThan(0)
  })

  it('should increase conflict for negative impact', () => {
    let state = createEmptyCharacterRelationshipState()
    state = recordRelationshipEvent(state, 'alice', 'bob', 'betrayed', -30, 'Bob betrayed Alice', 1)
    const rel = state.relationships.get('alice::bob')
    expect(rel?.conflict).toBeGreaterThan(0)
  })

  it('should accumulate events', () => {
    let state = createEmptyCharacterRelationshipState()
    state = recordRelationshipEvent(state, 'alice', 'bob', 'helped', 20, 'First help', 1)
    state = recordRelationshipEvent(state, 'alice', 'bob', 'helped', 20, 'Second help', 2)
    const rel = state.relationships.get('alice::bob')
    expect(rel?.events.length).toBe(2)
  })

  it('should update current chapter', () => {
    let state = createEmptyCharacterRelationshipState()
    state = recordRelationshipEvent(state, 'alice', 'bob', 'met', 10, 'They met', 5)
    expect(state.currentChapter).toBe(5)
  })

  it('should classify as ally when trust > 60', () => {
    let state = createEmptyCharacterRelationshipState()
    state = recordRelationshipEvent(state, 'alice', 'bob', 'helped', 70, 'Bob saved Alice', 1)
    const rel = state.relationships.get('alice::bob')
    expect(rel?.type).toBe('ally')
  })

  it('should classify as enemy when trust < -60', () => {
    let state = createEmptyCharacterRelationshipState()
    state = recordRelationshipEvent(state, 'alice', 'bob', 'betrayed', -70, 'Bob destroyed Alice', 1)
    const rel = state.relationships.get('alice::bob')
    expect(rel?.type).toBe('enemy')
  })
})

describe('getRelationship', () => {
  it('should return null for unknown pair', () => {
    const state = createEmptyCharacterRelationshipState()
    const rel = getRelationship(state, 'alice', 'bob')
    expect(rel).toBeNull()
  })

  it('should return relationship for known pair', () => {
    let state = createEmptyCharacterRelationshipState()
    state = recordRelationshipEvent(state, 'alice', 'bob', 'met', 20, 'They met', 1)
    const rel = getRelationship(state, 'alice', 'bob')
    expect(rel).not.toBeNull()
    expect(rel?.from).toBe('alice')
  })

  it('should return same relationship regardless of order', () => {
    let state = createEmptyCharacterRelationshipState()
    state = recordRelationshipEvent(state, 'alice', 'bob', 'met', 20, 'They met', 1)
    const rel1 = getRelationship(state, 'alice', 'bob')
    const rel2 = getRelationship(state, 'bob', 'alice')
    expect(rel1).not.toBeNull()
    expect(rel2).not.toBeNull()
  })
})

describe('getAllRelationshipsForCharacter', () => {
  it('should return empty for unknown character', () => {
    const state = createEmptyCharacterRelationshipState()
    const rels = getAllRelationshipsForCharacter(state, 'unknown')
    expect(rels.length).toBe(0)
  })

  it('should return character relationships', () => {
    let state = createEmptyCharacterRelationshipState()
    state = recordRelationshipEvent(state, 'alice', 'bob', 'met', 20, 'Met', 1)
    state = recordRelationshipEvent(state, 'alice', 'carol', 'met', 30, 'Met', 1)
    const rels = getAllRelationshipsForCharacter(state, 'alice')
    expect(rels.length).toBe(2)
  })
})

describe('getRelationshipSummary', () => {
  it('should show character count', () => {
    let state = createEmptyCharacterRelationshipState()
    state = registerCharacter(state, 'alice')
    state = registerCharacter(state, 'bob')
    const summary = getRelationshipSummary(state)
    expect(summary).toContain('Characters Tracked: 2')
  })

  it('should show relationship count', () => {
    let state = createEmptyCharacterRelationshipState()
    state = recordRelationshipEvent(state, 'alice', 'bob', 'met', 20, 'Met', 1)
    const summary = getRelationshipSummary(state)
    expect(summary).toContain('Relationships: 1')
  })
})

describe('formatRelationshipDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptyCharacterRelationshipState()
    state = recordRelationshipEvent(state, 'alice', 'bob', 'met', 20, 'Met', 3)
    const dashboard = formatRelationshipDashboard(state)
    expect(dashboard).toContain('Chapter: 3')
  })

  it('should show active relationships', () => {
    let state = createEmptyCharacterRelationshipState()
    state = recordRelationshipEvent(state, 'alice', 'bob', 'met', 40, 'Met', 1)
    const dashboard = formatRelationshipDashboard(state)
    expect(dashboard).toContain('Active Relationships')
  })
})
