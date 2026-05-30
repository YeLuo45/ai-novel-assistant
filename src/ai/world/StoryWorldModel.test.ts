/**
 * StoryWorldModel Tests - V90
 * Tests for Narrative World State Graph
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyWorldState,
  createCharacter,
  createLocation,
  addRelationship,
  addTimelineEvent,
  getCharacter,
  getCharactersByRole,
  getItemsOwnedBy,
  findCharacterByName,
  getActiveRelationships,
  getRelationshipStrength,
  checkWorldConsistency,
  calculateCharacterImportance,
  findCharacterPath,
  pruneInactiveEntities,
  formatWorldSummary,
  getWorldSummary,
  DEFAULT_WORLD_CONFIG,
  type StoryWorldState,
  type CharacterEntity
} from './StoryWorldModel'

// =============================================================================
// Helper Functions
// =============================================================================

function makeWorld(): StoryWorldState {
  const state = createEmptyWorldState('test-story')
  return state
}

function addTestCharacter(
  state: StoryWorldState,
  id: string,
  name: string,
  role: CharacterEntity['role'] = 'supporting'
): StoryWorldState {
  const char = createCharacter(id, name, role, 1)
  const newChars = new Map(state.characters)
  newChars.set(id, char)
  return { ...state, characters: newChars, characterCount: newChars.size }
}

// =============================================================================
// createEmptyWorldState Tests
// =============================================================================

describe('createEmptyWorldState', () => {
  it('should create empty world with defaults', () => {
    const state = createEmptyWorldState('story-1')
    expect(state.storyId).toBe('story-1')
    expect(state.characterCount).toBe(0)
    expect(state.locationCount).toBe(0)
    expect(state.itemCount).toBe(0)
    expect(state.totalChapters).toBe(0)
  })

  it('should have empty collections', () => {
    const state = createEmptyWorldState('story-1')
    expect(state.characters.size).toBe(0)
    expect(state.locations.size).toBe(0)
    expect(state.items.size).toBe(0)
    expect(state.events.size).toBe(0)
  })
})

// =============================================================================
// createCharacter Tests
// =============================================================================

describe('createCharacter', () => {
  it('should create protagonist with highest importance', () => {
    const char = createCharacter('char1', 'Alice', 'protagonist', 1)
    expect(char.role).toBe('protagonist')
    expect(char.importance).toBe(1.0)
    expect(char.vitality).toBe(1.0)
  })

  it('should create antagonist with high importance', () => {
    const char = createCharacter('char1', 'Villain', 'antagonist', 1)
    expect(char.role).toBe('antagonist')
    expect(char.importance).toBe(0.9)
  })

  it('should set aliases and chapter', () => {
    const char = createCharacter('char1', 'Bob', 'supporting', 5, ['Bobby', 'Robert'])
    expect(char.aliases).toEqual(['Bobby', 'Robert'])
    expect(char.introducedChapter).toBe(5)
  })

  it('should initialize empty relationships and traits', () => {
    const char = createCharacter('char1', 'Test', 'supporting', 1)
    expect(char.relationships).toEqual([])
    expect(char.traits).toEqual([])
    expect(char.activeGoals).toEqual([])
  })
})

// =============================================================================
// createLocation Tests
// =============================================================================

describe('createLocation', () => {
  it('should create major location with high importance', () => {
    const loc = createLocation('loc1', 'Castle', 'major', 1)
    expect(loc.significance).toBe('major')
    expect(loc.importance).toBe(0.9)
    expect(loc.plotSignificance).toBe(0.8)
  })

  it('should create minor location with lower importance', () => {
    const loc = createLocation('loc1', 'Shack', 'minor', 1)
    expect(loc.importance).toBe(0.4)
    expect(loc.plotSignificance).toBe(0.3)
  })
})

// =============================================================================
// addRelationship Tests
// =============================================================================

describe('addRelationship', () => {
  it('should add relationship to character', () => {
    let char = createCharacter('char1', 'Alice', 'protagonist', 1)
    char = addRelationship(char, 'char2', 'friend', 0.8, 5, 'Best friends', true)
    expect(char.relationships.length).toBe(1)
    expect(char.relationships[0].targetId).toBe('char2')
    expect(char.relationships[0].type).toBe('friend')
    expect(char.relationships[0].strength).toBe(0.8)
  })
})

// =============================================================================
// addTimelineEvent Tests
// =============================================================================

describe('addTimelineEvent', () => {
  it('should add event to world state', () => {
    let state = makeWorld()
    state = addTimelineEvent(state, {
      chapter: 3,
      title: 'The Battle',
      description: 'A great battle occurs',
      participants: [],
      locations: [],
      causality: [],
      reverseCausedBy: [],
      importance: 0.8,
      revealsTruth: false,
      changesState: []
    })
    expect(state.events.size).toBe(1)
    expect(state.totalChapters).toBe(3)
  })

  it('should sort timeline by chapter', () => {
    let state = makeWorld()
    state = addTimelineEvent(state, { chapter: 5, title: 'Event 5', description: '', participants: [], locations: [], causality: [], reverseCausedBy: [], importance: 0.5, revealsTruth: false, changesState: [] })
    state = addTimelineEvent(state, { chapter: 1, title: 'Event 1', description: '', participants: [], locations: [], causality: [], reverseCausedBy: [], importance: 0.5, revealsTruth: false, changesState: [] })
    state = addTimelineEvent(state, { chapter: 3, title: 'Event 3', description: '', participants: [], locations: [], causality: [], reverseCausedBy: [], importance: 0.5, revealsTruth: false, changesState: [] })
    // First event by chapter
    const firstEvent = state.events.get(state.timeline[0])!
    expect(firstEvent.title).toContain('Event 1')
    // Last event by chapter
    const lastEvent = state.events.get(state.timeline[2])!
    expect(lastEvent.title).toContain('Event 5')
  })
})

// =============================================================================
// Query Functions Tests
// =============================================================================

describe('getCharacter', () => {
  it('should return character by id', () => {
    let state = makeWorld()
    state = addTestCharacter(state, 'char1', 'Alice', 'protagonist')
    const char = getCharacter(state, 'char1')
    expect(char?.name).toBe('Alice')
  })

  it('should return undefined for missing character', () => {
    const state = makeWorld()
    expect(getCharacter(state, 'nonexistent')).toBeUndefined()
  })
})

describe('getCharactersByRole', () => {
  it('should return characters of specific role', () => {
    let state = makeWorld()
    state = addTestCharacter(state, 'char1', 'Hero', 'protagonist')
    state = addTestCharacter(state, 'char2', 'Villain', 'antagonist')
    state = addTestCharacter(state, 'char3', 'Side', 'supporting')
    const protags = getCharactersByRole(state, 'protagonist')
    expect(protags.length).toBe(1)
    expect(protags[0].name).toBe('Hero')
  })
})

describe('findCharacterByName', () => {
  it('should find character by name', () => {
    let state = makeWorld()
    state = addTestCharacter(state, 'char1', 'Alice', 'protagonist')
    const found = findCharacterByName(state, 'Alice')
    expect(found?.id).toBe('char1')
  })

  it('should find character by alias', () => {
    let state = makeWorld()
    const char = createCharacter('char1', 'Robert', 'supporting', 1, ['Bob', 'Bobby'])
    const newChars = new Map(state.characters)
    newChars.set('char1', char)
    state = { ...state, characters: newChars, characterCount: 1 }
    const found = findCharacterByName(state, 'Bob')
    expect(found?.id).toBe('char1')
  })

  it('should return undefined for missing name', () => {
    const state = makeWorld()
    expect(findCharacterByName(state, 'Nobody')).toBeUndefined()
  })
})

describe('getActiveRelationships', () => {
  it('should return only active relationships', () => {
    let char = createCharacter('char1', 'Alice', 'protagonist', 1)
    char = addRelationship(char, 'char2', 'friend', 0.8, 1, 'Friend', true)
    // Manually mark one as strained
    char.relationships[0].status = 'strained'
    const active = getActiveRelationships(char)
    expect(active.length).toBe(0)
  })
})

describe('getRelationshipStrength', () => {
  it('should return 0 for missing character', () => {
    const state = makeWorld()
    expect(getRelationshipStrength(state, 'a', 'b')).toBe(0)
  })

  it('should return relationship strength', () => {
    let state = makeWorld()
    state = addTestCharacter(state, 'char1', 'Alice', 'protagonist')
    state = addTestCharacter(state, 'char2', 'Bob', 'supporting')
    let char1 = state.characters.get('char1')!
    char1 = addRelationship(char1, 'char2', 'friend', 0.7, 1, 'Friends', true)
    const newChars = new Map(state.characters)
    newChars.set('char1', char1)
    state = { ...state, characters: newChars }
    expect(getRelationshipStrength(state, 'char1', 'char2')).toBe(0.7)
  })
})

describe('checkWorldConsistency', () => {
  it('should return consistent for clean world', () => {
    let state = makeWorld()
    state = addTestCharacter(state, 'char1', 'Alice', 'protagonist')
    state = addTestCharacter(state, 'char2', 'Bob', 'supporting')
    const result = checkWorldConsistency(state, 5)
    expect(result.isConsistent).toBe(true)
    expect(result.conflicts).toEqual([])
  })

  it('should warn about orphaned characters (not mentioned recently)', () => {
    let state = makeWorld()
    state = addTestCharacter(state, 'char1', 'Alice', 'protagonist')
    // Simulate character not mentioned for many chapters
    const char = state.characters.get('char1')!
    char.lastMentionedChapter = 1
    const newChars = new Map(state.characters)
    newChars.set('char1', { ...char, lastMentionedChapter: 1 })
    state = { ...state, characters: newChars }
    // With orphanThreshold=5, at chapter 10 Alice would be orphaned
    const result = checkWorldConsistency(state, 10)
    expect(result.warnings.some(w => w.warningType === 'forgotten')).toBe(true)
  })
})

describe('calculateCharacterImportance', () => {
  it('should return 0 for missing character', () => {
    const state = makeWorld()
    expect(calculateCharacterImportance(state, 'nonexistent')).toBe(0)
  })

  it('should score protagonist higher than minor', () => {
    let state = makeWorld()
    state = addTestCharacter(state, 'char1', 'Hero', 'protagonist')
    state = addTestCharacter(state, 'char2', 'Extra', 'minor')
    const heroScore = calculateCharacterImportance(state, 'char1')
    const minorScore = calculateCharacterImportance(state, 'char2')
    expect(heroScore).toBeGreaterThan(minorScore)
  })
})

describe('findCharacterPath', () => {
  it('should return null for missing characters', () => {
    const state = makeWorld()
    expect(findCharacterPath(state, 'a', 'b')).toBeNull()
  })

  it('should find direct path', () => {
    let state = makeWorld()
    state = addTestCharacter(state, 'char1', 'Alice', 'protagonist')
    state = addTestCharacter(state, 'char2', 'Bob', 'supporting')
    let char1 = state.characters.get('char1')!
    char1 = addRelationship(char1, 'char2', 'friend', 0.8, 1, 'Friends', true)
    const newChars = new Map(state.characters)
    newChars.set('char1', char1)
    state = { ...state, characters: newChars }
    const path = findCharacterPath(state, 'char1', 'char2')
    expect(path).toEqual(['char1', 'char2'])
  })

  it('should find indirect path', () => {
    let state = makeWorld()
    state = addTestCharacter(state, 'char1', 'Alice', 'protagonist')
    state = addTestCharacter(state, 'char2', 'Bob', 'supporting')
    state = addTestCharacter(state, 'char3', 'Carol', 'supporting')
    let char1 = state.characters.get('char1')!
    char1 = addRelationship(char1, 'char2', 'friend', 0.8, 1, 'Friends', false)
    let char2 = state.characters.get('char2')!
    char2 = addRelationship(char2, 'char3', 'friend', 0.8, 1, 'Friends', false)
    const newChars = new Map(state.characters)
    newChars.set('char1', char1)
    newChars.set('char2', char2)
    state = { ...state, characters: newChars }
    const path = findCharacterPath(state, 'char1', 'char3')
    expect(path).toEqual(['char1', 'char2', 'char3'])
  })
})

describe('pruneInactiveEntities', () => {
  it('should not prune active entities', () => {
    let state = makeWorld()
    state = addTestCharacter(state, 'char1', 'Alice', 'protagonist')
    const pruned = pruneInactiveEntities(state, 20)
    expect(pruned.characterCount).toBe(1)
  })
})

describe('getWorldSummary', () => {
  it('should return summary stats', () => {
    let state = makeWorld()
    state = addTestCharacter(state, 'char1', 'Alice', 'protagonist')
    const summary = getWorldSummary(state)
    expect(summary.characterCount).toBe(1)
    expect(summary.locationCount).toBe(0)
  })
})

describe('formatWorldSummary', () => {
  it('should format world info', () => {
    let state = makeWorld()
    state = addTestCharacter(state, 'char1', 'Alice', 'protagonist')
    state = addTestCharacter(state, 'char2', 'Villain', 'antagonist')
    const formatted = formatWorldSummary(state)
    expect(formatted).toContain('Characters: 2')
    expect(formatted).toContain('Protagonists: 1')
    expect(formatted).toContain('Antagonists: 1')
  })
})
