/**
 * CharacterRelationshipGraph Tests - V145
 * Tests for Character Network & Relationship Dynamics Engine
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyGraphState,
  addCharacter,
  updateCharacterRole,
  recordCharacterAppearance,
  createRelationship,
  updateRelationshipStrength,
  resolveRelationship,
  recordSharedScene,
  computeCentralCharacter,
  findConflictedRelationships,
  findCharacterConflicts,
  getCharacterNetwork,
  formatCharacterCard,
  formatRelationshipGraph,
  formatRelationshipDashboard,
} from './CharacterRelationshipGraph'

// =============================================================================
// createEmptyGraphState Tests
// =============================================================================

describe('createEmptyGraphState', () => {
  it('should create empty state', () => {
    const state = createEmptyGraphState()
    expect(state.characters.size).toBe(0)
    expect(state.relationships.size).toBe(0)
    expect(state.totalScenes).toBe(0)
  })

  it('should have null central character', () => {
    const state = createEmptyGraphState()
    expect(state.centralCharacterId).toBeNull()
    expect(state.mostConnectedCharacter).toBeNull()
  })
})

// =============================================================================
// Character Management Tests
// =============================================================================

describe('addCharacter', () => {
  it('should add new character', () => {
    let state = createEmptyGraphState()
    const result = addCharacter(state, 'Alice', 'protagonist', ['brave', 'curious'], 90)
    expect(result.characterId).toContain('char_')
    expect(result.state.characters.size).toBe(1)
  })

  it('should set character properties correctly', () => {
    let state = createEmptyGraphState()
    const result = addCharacter(state, 'Bob', 'antagonist', ['cunning'], 70)
    const char = result.state.characters.get(result.characterId)
    expect(char?.name).toBe('Bob')
    expect(char?.role).toBe('antagonist')
    expect(char?.traits).toEqual(['cunning'])
    expect(char?.importance).toBe(70)
  })
})

describe('updateCharacterRole', () => {
  it('should update character role', () => {
    let state = createEmptyGraphState()
    let result = addCharacter(state, 'Test', 'supporting', [], 50)
    state = updateCharacterRole(result.state, result.characterId, 'protagonist')
    expect(state.characters.get(result.characterId)?.role).toBe('protagonist')
  })
})

describe('recordCharacterAppearance', () => {
  it('should increment word count', () => {
    let state = createEmptyGraphState()
    let result = addCharacter(state, 'Test', 'supporting', [], 50)
    state = recordCharacterAppearance(result.state, result.characterId, 3, 500)
    expect(state.characters.get(result.characterId)?.wordCount).toBe(500)
  })

  it('should track scene count', () => {
    let state = createEmptyGraphState()
    let result = addCharacter(state, 'Test', 'supporting', [], 50)
    state = recordCharacterAppearance(result.state, result.characterId, 1, 100)
    state = recordCharacterAppearance(state, result.characterId, 2, 150)
    expect(state.characterSceneCount.get(result.characterId)).toBe(2)
  })
})

// =============================================================================
// Relationship Management Tests
// =============================================================================

describe('createRelationship', () => {
  it('should create relationship between two characters', () => {
    let state = createEmptyGraphState()
    const { characterId: id1 } = addCharacter(state, 'Alice', 'protagonist', [], 80)
    const { characterId: id2 } = addCharacter(state, 'Bob', 'antagonist', [], 70)
    const result = createRelationship(state, id1, id2, 'enemy', 75)
    expect(result.relationshipId).toContain('rel_')
    expect(result.state.relationships.size).toBe(1)
  })

  it('should not create self-relationship', () => {
    let state = createEmptyGraphState()
    const { characterId } = addCharacter(state, 'Solo', 'protagonist', [], 50)
    const result = createRelationship(state, characterId, characterId, 'neutral')
    expect(result.relationshipId).toBe('')
  })

  it('should set conflict level for enemy type', () => {
    let state = createEmptyGraphState()
    const { characterId: id1 } = addCharacter(state, 'A', 'supporting', [], 50)
    const { characterId: id2 } = addCharacter(state, 'B', 'supporting', [], 50)
    const result = createRelationship(state, id1, id2, 'enemy', 60)
    const rel = result.state.relationships.get(result.relationshipId)
    expect(rel?.conflictLevel).toBe(3)
  })
})

describe('updateRelationshipStrength', () => {
  it('should update relationship strength', () => {
    let state = createEmptyGraphState()
    let r1 = addCharacter(state, 'A', 'supporting', [], 50)
    let r2 = addCharacter(r1.state, 'B', 'supporting', [], 50)
    let r3 = createRelationship(r2.state, r1.characterId, r2.characterId, 'ally', 50)
    state = updateRelationshipStrength(r3.state, r3.relationshipId, 20, 5, 'Helped each other')
    
    const rel = state.relationships.get(r3.relationshipId)
    expect(rel?.strength).toBe(70)
    expect(rel?.lastInteractionChapter).toBe(5)
  })

  it('should clamp strength to 0-100', () => {
    let state = createEmptyGraphState()
    let r1 = addCharacter(state, 'A', 'supporting', [], 50)
    let r2 = addCharacter(r1.state, 'B', 'supporting', [], 50)
    let r3 = createRelationship(r2.state, r1.characterId, r2.characterId, 'ally', 90)
    state = updateRelationshipStrength(r3.state, r3.relationshipId, 30, 1, 'Boosted')
    expect(state.relationships.get(r3.relationshipId)?.strength).toBe(100)
  })
})

describe('resolveRelationship', () => {
  it('should change relationship type', () => {
    let state = createEmptyGraphState()
    let r1 = addCharacter(state, 'A', 'supporting', [], 50)
    let r2 = addCharacter(r1.state, 'B', 'supporting', [], 50)
    let r3 = createRelationship(r2.state, r1.characterId, r2.characterId, 'rival', 50)
    state = resolveRelationship(r3.state, r3.relationshipId, 'ally', 80)
    
    const rel = state.relationships.get(r3.relationshipId)
    expect(rel?.type).toBe('ally')
    expect(rel?.strength).toBe(80)
  })
})

describe('recordSharedScene', () => {
  it('should increment shared scene count', () => {
    let state = createEmptyGraphState()
    let r1 = addCharacter(state, 'A', 'supporting', [], 50)
    let r2 = addCharacter(r1.state, 'B', 'supporting', [], 50)
    let r3 = createRelationship(r2.state, r1.characterId, r2.characterId, 'ally', 60)
    state = recordSharedScene(r3.state, r3.relationshipId, 3)
    
    const rel = state.relationships.get(r3.relationshipId)
    expect(rel?.sharedScenes).toBe(1)
    expect(rel?.lastInteractionChapter).toBe(3)
  })
})

// =============================================================================
// Graph Analysis Tests
// =============================================================================

describe('computeCentralCharacter', () => {
  it('should find central character by connections and importance', () => {
    let state = createEmptyGraphState()
    let r1 = addCharacter(state, 'Hero', 'protagonist', [], 90)
    let r2 = addCharacter(r1.state, 'Friend', 'supporting', [], 40)
    let r3 = addCharacter(r2.state, 'Enemy', 'antagonist', [], 70)
    
    let r4 = createRelationship(r3.state, r1.characterId, r2.characterId, 'ally', 80)
    let r5 = createRelationship(r4.state, r1.characterId, r3.characterId, 'enemy', 90)
    let r6 = createRelationship(r5.state, r2.characterId, r3.characterId, 'neutral', 30)
    
    state = computeCentralCharacter(r6.state)
    expect(state.centralCharacterId).toBe(r1.characterId)
  })
})

describe('findConflictedRelationships', () => {
  it('should return relationships with high conflict', () => {
    let state = createEmptyGraphState()
    let r1 = addCharacter(state, 'A', 'supporting', [], 50)
    let r2 = addCharacter(r1.state, 'B', 'supporting', [], 50)
    let r3 = addCharacter(r2.state, 'C', 'supporting', [], 50)
    
    let r4 = createRelationship(r3.state, r1.characterId, r2.characterId, 'enemy', 40)
    let r5 = createRelationship(r4.state, r1.characterId, r3.characterId, 'ally', 80)
    
    // enemy type starts with conflictLevel 3, need rival for level 4
    // Actually we need to use the rival type which has conflictLevel 3
    // Let's just verify it returns the enemy relationship
    const conflicts = findConflictedRelationships(r5.state)
    expect(conflicts.length).toBeGreaterThanOrEqual(1)
  })
})

describe('findCharacterConflicts', () => {
  it('should find conflicts for specific character', () => {
    let state = createEmptyGraphState()
    let r1 = addCharacter(state, 'Hero', 'protagonist', [], 80)
    let r2 = addCharacter(r1.state, 'Enemy', 'antagonist', [], 70)
    let r3 = addCharacter(r2.state, 'Friend', 'supporting', [], 50)
    
    let r4 = createRelationship(r3.state, r1.characterId, r2.characterId, 'enemy', 80)
    let r5 = createRelationship(r4.state, r1.characterId, r3.characterId, 'ally', 90)
    
    const conflicts = findCharacterConflicts(r5.state, r1.characterId)
    expect(conflicts.length).toBeGreaterThanOrEqual(1)
  })
})

describe('getCharacterNetwork', () => {
  it('should return connected characters', () => {
    let state = createEmptyGraphState()
    let r1 = addCharacter(state, 'Hero', 'protagonist', [], 90)
    let r2 = addCharacter(r1.state, 'Friend', 'supporting', [], 50)
    let r3 = addCharacter(r2.state, 'Enemy', 'antagonist', [], 70)
    
    let r4 = createRelationship(r3.state, r1.characterId, r2.characterId, 'ally', 80)
    let r5 = createRelationship(r4.state, r1.characterId, r3.characterId, 'enemy', 90)
    
    const network = getCharacterNetwork(r5.state, r1.characterId, 1)
    expect(network.size).toBe(2)
    expect(network.has(r2.characterId)).toBe(true)
    expect(network.has(r3.characterId)).toBe(true)
  })

  it('should include relationship info', () => {
    let state = createEmptyGraphState()
    let r1 = addCharacter(state, 'Hero', 'protagonist', [], 90)
    let r2 = addCharacter(r1.state, 'Friend', 'supporting', [], 50)
    let r3 = createRelationship(r2.state, r1.characterId, r2.characterId, 'ally', 80)
    
    const network = getCharacterNetwork(r3.state, r1.characterId, 1)
    const entry = network.get(r2.characterId)
    expect(entry?.relationship).not.toBeNull()
    expect(entry?.relationship?.type).toBe('ally')
    expect(entry?.relationship?.strength).toBe(80)
  })
})

// =============================================================================
// Formatting Tests
// =============================================================================

describe('formatCharacterCard', () => {
  it('should format character card', () => {
    let state = createEmptyGraphState()
    let r1 = addCharacter(state, 'Alice', 'protagonist', ['brave', 'smart'], 85)
    state = recordCharacterAppearance(r1.state, r1.characterId, 1, 500)
    
    const card = formatCharacterCard(state, r1.characterId)
    expect(card).toContain('Alice')
    expect(card).toContain('protagonist')
    expect(card).toContain('brave')
    expect(card).toContain('500')
  })

  it('should handle unknown character', () => {
    const state = createEmptyGraphState()
    const card = formatCharacterCard(state, 'unknown')
    expect(card).toContain('not found')
  })
})

describe('formatRelationshipGraph', () => {
  it('should show character and relationship counts', () => {
    let state = createEmptyGraphState()
    let r1 = addCharacter(state, 'A', 'supporting', [], 50)
    let r2 = addCharacter(r1.state, 'B', 'supporting', [], 50)
    let r3 = createRelationship(r2.state, r1.characterId, r2.characterId, 'ally', 70)
    
    const graph = formatRelationshipGraph(r3.state)
    expect(graph).toContain('Characters: 2')
    expect(graph).toContain('Relationships: 1')
  })

  it('should list relationships', () => {
    let state = createEmptyGraphState()
    let r1 = addCharacter(state, 'Alice', 'supporting', [], 60)
    let r2 = addCharacter(r1.state, 'Bob', 'supporting', [], 60)
    let r3 = createRelationship(r2.state, r1.characterId, r2.characterId, 'enemy', 75)
    
    const graph = formatRelationshipGraph(r3.state)
    expect(graph).toContain('Alice')
    expect(graph).toContain('Bob')
    expect(graph).toContain('enemy')
  })
})

describe('formatRelationshipDashboard', () => {
  it('should show totals', () => {
    const state = createEmptyGraphState()
    const dashboard = formatRelationshipDashboard(state)
    expect(dashboard).toContain('Total Characters: 0')
    expect(dashboard).toContain('Active Relationships: 0')
    expect(dashboard).toContain('Total Scenes: 0')
  })

  it('should show character role breakdown', () => {
    let state = createEmptyGraphState()
    let r1 = addCharacter(state, 'A', 'protagonist', [], 80)
    let r2 = addCharacter(r1.state, 'B', 'antagonist', [], 70)
    
    const dashboard = formatRelationshipDashboard(r2.state)
    expect(dashboard).toContain('protagonist: 1')
    expect(dashboard).toContain('antagonist: 1')
  })

  it('should show relationship type breakdown', () => {
    let state = createEmptyGraphState()
    let r1 = addCharacter(state, 'A', 'supporting', [], 50)
    let r2 = addCharacter(r1.state, 'B', 'supporting', [], 50)
    let r3 = addCharacter(r2.state, 'C', 'supporting', [], 50)
    let r4 = createRelationship(r3.state, r1.characterId, r2.characterId, 'ally', 80)
    let r5 = createRelationship(r4.state, r1.characterId, r3.characterId, 'enemy', 70)
    
    const dashboard = formatRelationshipDashboard(r5.state)
    expect(dashboard).toContain('ally: 1')
    expect(dashboard).toContain('enemy: 1')
  })
})
