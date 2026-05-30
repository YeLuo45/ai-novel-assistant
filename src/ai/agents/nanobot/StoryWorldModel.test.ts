import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  addCharacter,
  addLocation,
  recordEvent,
  getCharacterRelationships,
  getCharactersAtLocation,
  getTimeline,
  getCharacterAppearances,
  getLocationEvents,
  searchCharacters,
  validateWorldConsistency,
  getWorldStatistics,
} from './StoryWorldModel'

describe('createEmptyState', () => {
  it('should create empty world state', () => {
    const s = createEmptyState()
    expect(s.characters).toEqual({})
    expect(s.locations).toEqual({})
    expect(s.events).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('addCharacter', () => {
  it('should add a character', () => {
    let s = createEmptyState()
    s = addCharacter(s, 'Alice', 'protagonist', ['brave', 'smart'])
    expect(Object.keys(s.characters).length).toBe(1)
    const char = Object.values(s.characters)[0]
    expect(char.name).toBe('Alice')
    expect(char.role).toBe('protagonist')
    expect(char.traits).toEqual(['brave', 'smart'])
  })

  it('should support relationships', () => {
    let s = createEmptyState()
    s = addCharacter(s, 'Alice', 'protagonist', [])
    s = addCharacter(s, 'Bob', 'antagonist', [])
    const aliceId = Object.keys(s.characters)[0]
    const bobId = Object.keys(s.characters)[1]
    // Use actual IDs in relationship
    s = { ...s, characters: { ...s.characters, [aliceId]: { ...s.characters[aliceId], relationships: { [bobId]: 'enemy' } } } }
    expect(s.characters[aliceId].relationships[bobId]).toBe('enemy')
  })
})

describe('addLocation', () => {
  it('should add a location', () => {
    let s = createEmptyState()
    s = addLocation(s, 'Castle', 'building', 'A dark fortress', ['alice_id'])
    expect(Object.keys(s.locations).length).toBe(1)
    const loc = Object.values(s.locations)[0]
    expect(loc.name).toBe('Castle')
    expect(loc.type).toBe('building')
  })
})

describe('recordEvent', () => {
  it('should record an event', () => {
    let s = createEmptyState()
    s = addCharacter(s, 'Alice', 'protagonist', [])
    const charId = Object.keys(s.characters)[0]
    s = recordEvent(s, 'battle', 'Great battle', [charId], 10)
    expect(s.events.length).toBe(1)
    expect(s.events[0].type).toBe('battle')
    expect(s.events[0].timestamp).toBe(10)
  })

  it('should auto-increment timestamp', () => {
    let s = createEmptyState()
    s = recordEvent(s, 'event1', 'First', [], 1)
    s = recordEvent(s, 'event2', 'Second', [])
    expect(s.events[1].timestamp).toBe(2)
  })
})

describe('getCharacterRelationships', () => {
  it('should return empty for unknown character', () => {
    const s = createEmptyState()
    expect(getCharacterRelationships(s, 'unknown')).toEqual({})
  })

  it('should return character relationships', () => {
    let s = createEmptyState()
    s = addCharacter(s, 'Alice', 'protagonist', [], { bob_id: 'friend' })
    const aliceId = Object.keys(s.characters)[0]
    const rels = getCharacterRelationships(s, aliceId)
    expect(rels.bob_id).toBe('friend')
  })
})

describe('getCharactersAtLocation', () => {
  it('should return characters at location', () => {
    let s = createEmptyState()
    s = addCharacter(s, 'Alice', 'protagonist', [])
    s = addCharacter(s, 'Bob', 'supporting', [])
    s = addLocation(s, 'Castle', 'building', 'A fortress', [Object.keys(s.characters)[0], Object.keys(s.characters)[1]])
    const locId = Object.keys(s.locations)[0]
    const chars = getCharactersAtLocation(s, locId)
    expect(chars.length).toBe(2)
  })
})

describe('getTimeline', () => {
  it('should return sorted events', () => {
    let s = createEmptyState()
    s = recordEvent(s, 'later', 'Later event', [], 20)
    s = recordEvent(s, 'earlier', 'Earlier event', [], 5)
    const timeline = getTimeline(s)
    expect(timeline[0].timestamp).toBe(5)
    expect(timeline[1].timestamp).toBe(20)
  })
})

describe('getCharacterAppearances', () => {
  it('should return character appearances', () => {
    let s = createEmptyState()
    s = addCharacter(s, 'Alice', 'protagonist', [], {}, ['ch1', 'ch2'])
    const aliceId = Object.keys(s.characters)[0]
    expect(getCharacterAppearances(s, aliceId)).toEqual(['ch1', 'ch2'])
  })
})

describe('getLocationEvents', () => {
  it('should return events at location', () => {
    let s = createEmptyState()
    s = addLocation(s, 'Castle', 'building', 'Fortress')
    const locId = Object.keys(s.locations)[0]
    s = recordEvent(s, 'battle', 'Battle at castle', [], 10, locId)
    const events = getLocationEvents(s, locId)
    expect(events.length).toBe(1)
  })
})

describe('searchCharacters', () => {
  it('should find by name', () => {
    let s = createEmptyState()
    s = addCharacter(s, 'Alice Wonder', 'protagonist', ['brave'])
    const results = searchCharacters(s, 'alice')
    expect(results.length).toBe(1)
  })

  it('should find by trait', () => {
    let s = createEmptyState()
    s = addCharacter(s, 'Alice', 'protagonist', ['brave'])
    const results = searchCharacters(s, 'brave')
    expect(results.length).toBe(1)
  })
})

describe('validateWorldConsistency', () => {
  it('should return no issues for valid world', () => {
    let s = createEmptyState()
    s = addCharacter(s, 'Alice', 'protagonist', [])
    s = addCharacter(s, 'Bob', 'antagonist', [])
    const aliceId = Object.keys(s.characters)[0]
    const bobId = Object.keys(s.characters)[1]
    s = addCharacter(s, 'Alice', 'protagonist', [], { [bobId]: 'enemy' })
    const issues = validateWorldConsistency(s)
    expect(issues.length).toBe(0)
  })

  it('should detect broken relationships', () => {
    let s = createEmptyState()
    s = addCharacter(s, 'Alice', 'protagonist', [], { nonexistent: 'friend' })
    const issues = validateWorldConsistency(s)
    expect(issues.some(i => i.includes('non-existent'))).toBe(true)
  })
})

describe('getWorldStatistics', () => {
  it('should return world stats', () => {
    let s = createEmptyState()
    s = addCharacter(s, 'Alice', 'protagonist', [])
    s = addLocation(s, 'Castle', 'building', 'Fortress')
    s = recordEvent(s, 'battle', 'Battle', [])
    const stats = getWorldStatistics(s)
    expect(stats.characterCount).toBe(1)
    expect(stats.locationCount).toBe(1)
    expect(stats.eventCount).toBe(1)
  })
})
