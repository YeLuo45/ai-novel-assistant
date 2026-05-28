/**
 * CharacterRelationshipEvolutionEngine - V184
 * Character Relationship Dynamics & Evolution Tracking Engine
 */

export type RelationshipType = 'ally' | 'enemy' | 'rival' | 'mentor' | 'romantic' | 'family' | 'stranger' | 'complicated'

export interface RelationshipEvent {
  eventId: string
  chapter: number
  characterA: string
  characterB: string
  eventType: string
  impact: number
  context: string
}

export interface RelationshipState {
  from: string
  to: string
  type: RelationshipType
  trust: number
  conflict: number
  dynamic: 'warming' | 'cooling' | 'stable' | 'volatile'
  events: RelationshipEvent[]
}

export interface CharacterRelationshipState {
  relationships: Map<string, RelationshipState>
  currentChapter: number
  characterList: string[]
}

function makeKey(a: string, b: string): string {
  return [a, b].sort().join('::')
}

function createEventId(): string {
  return 're_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

export function createEmptyCharacterRelationshipState(): CharacterRelationshipState {
  return { relationships: new Map(), currentChapter: 0, characterList: [] }
}

export function registerCharacter(state: CharacterRelationshipState, characterId: string): CharacterRelationshipState {
  if (state.characterList.includes(characterId)) return state
  return { ...state, characterList: [...state.characterList, characterId] }
}

export function recordRelationshipEvent(
  state: CharacterRelationshipState,
  characterA: string,
  characterB: string,
  eventType: string,
  impact: number,
  context: string,
  chapter: number
): CharacterRelationshipState {
  const key = makeKey(characterA, characterB)
  const existing = state.relationships.get(key)
  const event: RelationshipEvent = { eventId: createEventId(), chapter, characterA, characterB, eventType, impact, context }
  let trust = existing ? existing.trust : 0
  let conflict = existing ? existing.conflict : 0
  trust += impact
  trust = Math.max(-100, Math.min(100, trust))
  if (impact < 0) conflict = Math.min(100, conflict + Math.abs(impact) * 0.3)
  else conflict = Math.max(0, conflict - impact * 0.2)
  const recentEvents = existing ? existing.events.slice(-5) : []
  const dynamic: 'warming' | 'cooling' | 'stable' | 'volatile' =
    recentEvents.length >= 3
      ? (Math.abs(impact) > 40 ? 'volatile' : impact > 0 ? 'warming' : impact < 0 ? 'cooling' : 'stable')
      : 'stable'
  let type: RelationshipType = 'stranger'
  if (trust > 60) type = 'ally'
  else if (trust < -60) type = 'enemy'
  else if (trust > 20 && trust <= 60) type = 'complicated'
  else if (trust < -20 && trust >= -60) type = 'rival'
  const relationshipState: RelationshipState = { from: characterA, to: characterB, type, trust, conflict, dynamic, events: [...recentEvents, event] }
  const newRelationships = new Map(state.relationships)
  newRelationships.set(key, relationshipState)
  return { ...state, relationships: newRelationships, currentChapter: Math.max(state.currentChapter, chapter) }
}

export function getRelationship(state: CharacterRelationshipState, characterA: string, characterB: string): RelationshipState | null {
  return state.relationships.get(makeKey(characterA, characterB)) || null
}

export function getAllRelationshipsForCharacter(state: CharacterRelationshipState, characterId: string): RelationshipState[] {
  const results: RelationshipState[] = []
  for (const [, rel] of state.relationships) {
    if (rel.from === characterId || rel.to === characterId) results.push(rel)
  }
  return results
}

export function getRelationshipSummary(state: CharacterRelationshipState): string {
  let s = '=== Relationship Summary ===' + '\n'
  s += 'Characters Tracked: ' + state.characterList.length + '\n'
  s += 'Relationships: ' + state.relationships.size + '\n'
  s += 'Chapter: ' + state.currentChapter + '\n'
  return s
}

export function formatRelationshipDashboard(state: CharacterRelationshipState): string {
  let s = '=== Relationship Dashboard ===' + '\n'
  s += 'Chapter: ' + state.currentChapter + '\n'
  if (state.relationships.size > 0) {
    s += '\n--- Active Relationships ---' + '\n'
    for (const [key, rel] of state.relationships) {
      s += '  ' + rel.from + ' <-> ' + rel.to + ' [' + rel.type + '] trust=' + rel.trust + ' conflict=' + rel.conflict + ' (' + rel.dynamic + ')' + '\n'
    }
  }
  const volatile = Array.from(state.relationships.values()).filter(r => r.dynamic === 'volatile')
  if (volatile.length > 0) {
    s += '\n--- Volatile Relationships ---' + '\n'
    for (const rel of volatile) {
      s += '  ' + rel.from + ' <-> ' + rel.to + ': last impact event at Ch ' + rel.events[rel.events.length - 1]?.chapter + '\n'
    }
  }
  return s
}