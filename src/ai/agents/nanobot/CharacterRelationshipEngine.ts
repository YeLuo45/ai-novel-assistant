export type RelationshipType = 'family' | 'friend' | 'romantic' | 'enemy' | 'mentor' | 'colleague' | 'stranger'

export interface RelationshipEvent {
  eventId: string
  chapter: number
  description: string
  impact: number  // -100 to +100
}

export interface Relationship {
  from: string
  to: string
  type: RelationshipType
  health: number  // -100 to +100
  events: RelationshipEvent[]
}

export interface CharacterRelationshipState {
  characters: Set<string>
  relationships: Relationship[]
  currentChapter: number
  changeCount: number
}

function createEventId(): string {
  return 'revent_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

export function createEmptyCharacterRelationshipState(): CharacterRelationshipState {
  return { characters: new Set(), relationships: [], currentChapter: 0, changeCount: 0 }
}

export function registerCharacter(
  state: CharacterRelationshipState,
  name: string
): CharacterRelationshipState {
  const newCharacters = new Set(state.characters)
  newCharacters.add(name)
  return { ...state, characters: newCharacters }
}

export function findRelationship(
  state: CharacterRelationshipState,
  from: string,
  to: string
): Relationship | null {
  return state.relationships.find(
    r => (r.from === from && r.to === to) || (r.from === to && r.to === from)
  ) || null
}

export function createRelationship(
  state: CharacterRelationshipState,
  from: string,
  to: string,
  type: RelationshipType
): CharacterRelationshipState {
  const existing = findRelationship(state, from, to)
  if (existing) return state

  const newChars = new Set(state.characters)
  newChars.add(from)
  newChars.add(to)

  const relationship: Relationship = {
    from,
    to,
    type,
    health: type === 'enemy' ? -20 : type === 'romantic' ? 30 : 50,
    events: [],
  }

  return {
    ...state,
    characters: newChars,
    relationships: [...state.relationships, relationship],
  }
}

export function recordRelationshipEvent(
  state: CharacterRelationshipState,
  from: string,
  to: string,
  chapter: number,
  description: string,
  impact: number
): CharacterRelationshipState {
  const relationship = findRelationship(state, from, to)
  if (!relationship) return state

  const newRelationships = state.relationships.map(r => {
    if (r.from !== from || r.to !== to) return r

    const event: RelationshipEvent = {
      eventId: createEventId(),
      chapter,
      description,
      impact,
    }

    return {
      ...r,
      health: Math.max(-100, Math.min(100, r.health + impact)),
      events: [...r.events, event],
    }
  })

  return {
    ...state,
    relationships: newRelationships,
    currentChapter: Math.max(state.currentChapter, chapter),
    changeCount: state.changeCount + 1,
  }
}

export function getRelationshipHealth(
  state: CharacterRelationshipState,
  from: string,
  to: string
): number {
  const rel = findRelationship(state, from, to)
  return rel ? rel.health : 0
}

export function getCharacterRelationships(
  state: CharacterRelationshipState,
  name: string
): Array<{ other: string; type: RelationshipType; health: number }> {
  return state.relationships
    .filter(r => r.from === name || r.to === name)
    .map(r => ({
      other: r.from === name ? r.to : r.from,
      type: r.type,
      health: r.health,
    }))
}

export function formatRelationshipSummary(state: CharacterRelationshipState): string {
  let s = "=== Relationship Summary ===" + "\n"
  s += "Characters: " + state.characters.size + "\n"
  s += "Relationships: " + state.relationships.length + "\n"
  s += "Changes: " + state.changeCount + "\n"
  return s
}

export function formatRelationshipDashboard(state: CharacterRelationshipState): string {
  let s = "=== Relationship Dashboard ===" + "\n"
  s += "Chapter: " + state.currentChapter + "\n"
  s += "Characters: " + state.characters.size + " | Relationships: " + state.relationships.length + "\n"

  if (state.relationships.length > 0) {
    s += "\n--- Key Relationships ---" + "\n"
    for (const rel of state.relationships.slice(0, 5)) {
      const healthBar = rel.health > 0 ? '+'.repeat(Math.min(Math.floor(rel.health / 20), 5)) : '-'.repeat(Math.min(Math.floor(Math.abs(rel.health) / 20), 5))
      s += "  " + rel.from + " <" + rel.type + "> " + rel.to + " " + rel.health + " " + healthBar + "\n"
    }
  }

  return s
}
