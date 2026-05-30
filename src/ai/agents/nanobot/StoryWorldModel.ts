/**
 * StoryWorldModel — V353
 * Story world knowledge graph: characters, locations, timelines, relationships.
 * Inspired by: ruflo (hierarchical decomposition), generic-agent (knowledge graphs)
 */

export interface Character {
  id: string
  name: string
  role: string
  traits: string[]
  relationships: Record<string, string>  // otherId -> relationshipType
  appearances: string[]  // chapter/scene ids
  arc?: string
}

export interface Location {
  id: string
  name: string
  type: 'city' | 'building' | 'natural' | 'fantasy' | 'other'
  description: string
  associatedCharacters: string[]
  events: WorldEvent[]
}

export interface WorldEvent {
  id: string
  timestamp: number  // story timeline units
  type: string
  description: string
  participants: string[]
  locationId?: string
  consequences?: string
}

export interface StoryWorldState {
  characters: Record<string, Character>
  locations: Record<string, Location>
  events: WorldEvent[]
  timelines: Record<string, number[]>  // timelineId -> sorted event timestamps
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): StoryWorldState {
  return {
    characters: {},
    locations: {},
    events: [],
    timelines: {},
    typeAlias: {},
  }
}

export function addCharacter(
  state: StoryWorldState,
  name: string,
  role: string,
  traits: string[],
  relationships?: Record<string, string>,
  appearances?: string[],
  arc?: string
): StoryWorldState {
  const id = `char_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const character: Character = { id, name, role, traits, relationships: relationships || {}, appearances: appearances || [], arc }
  return { ...state, characters: { ...state.characters, [id]: character } }
}

export function addLocation(
  state: StoryWorldState,
  name: string,
  type: Location['type'],
  description: string,
  associatedCharacters?: string[],
  events?: WorldEvent[]
): StoryWorldState {
  const id = `loc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const location: Location = { id, name, type, description, associatedCharacters: associatedCharacters || [], events: events || [] }
  return { ...state, locations: { ...state.locations, [id]: location } }
}

export function recordEvent(
  state: StoryWorldState,
  type: string,
  description: string,
  participants: string[],
  timestamp?: number,
  locationId?: string,
  consequences?: string
): StoryWorldState {
  const id = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const event: WorldEvent = {
    id, type, description, participants,
    timestamp: timestamp || (state.events.length > 0 ? Math.max(...state.events.map(e => e.timestamp)) + 1 : 1),
    locationId, consequences,
  }
  const events = [...state.events, event].slice(-200)
  return { ...state, events }
}

export function getCharacterRelationships(state: StoryWorldState, characterId: string): Record<string, string> {
  const char = state.characters[characterId]
  if (!char) return {}
  return char.relationships
}

export function getCharactersAtLocation(state: StoryWorldState, locationId: string): Character[] {
  const location = state.locations[locationId]
  if (!location) return []
  return location.associatedCharacters.map(id => state.characters[id]).filter(Boolean)
}

export function getTimeline(state: StoryWorldState, timelineId?: string): WorldEvent[] {
  if (timelineId) return state.events.filter(e => state.timelines[timelineId]?.includes(e.timestamp))
  return [...state.events].sort((a, b) => a.timestamp - b.timestamp)
}

export function getCharacterAppearances(state: StoryWorldState, characterId: string): string[] {
  const char = state.characters[characterId]
  return char?.appearances || []
}

export function getLocationEvents(state: StoryWorldState, locationId: string): WorldEvent[] {
  return state.events.filter(e => e.locationId === locationId)
}

export function searchCharacters(state: StoryWorldState, query: string): Character[] {
  const q = query.toLowerCase()
  return Object.values(state.characters).filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.role.toLowerCase().includes(q) ||
    c.traits.some(t => t.toLowerCase().includes(q))
  )
}

export function validateWorldConsistency(state: StoryWorldState): string[] {
  const issues: string[] = []
  for (const char of Object.values(state.characters)) {
    for (const relatedId of Object.keys(char.relationships)) {
      if (!state.characters[relatedId]) {
        issues.push(`Character ${char.id} references non-existent ${relatedId}`)
      }
    }
  }
  for (const event of state.events) {
    for (const pid of event.participants) {
      if (!state.characters[pid] && !state.locations[pid]) {
        issues.push(`Event ${event.id} references non-existent participant ${pid}`)
      }
    }
  }
  return issues
}

export function getWorldStatistics(state: StoryWorldState) {
  return {
    characterCount: Object.keys(state.characters).length,
    locationCount: Object.keys(state.locations).length,
    eventCount: state.events.length,
    timelineCount: Object.keys(state.timelines).length,
  }
}
