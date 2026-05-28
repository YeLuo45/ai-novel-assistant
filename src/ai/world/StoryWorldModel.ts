/**
 * StoryWorldModel Types - V89
 * Narrative World State Graph
 * 
 * Maintains a dynamic knowledge graph of the story world:
 * - Characters (identity, traits, relationships, state changes)
 * - Locations (geography, atmosphere, plot significance)
 * - Timeline (events, causality, parallel threads)
 * - Items/Artifacts (significance, ownership, magical properties)
 * - World Rules (magic systems, physics, social norms)
 * 
 * Inspired by generic-agent's knowledge graph + nanobot's distributed state.
 */

import type { SkillNode } from '../evolution/SkillGraph'

// ===============================================================================
// Entity Types
// ===============================================================================

export type EntityType = 'character' | 'location' | 'item' | 'event' | 'rule'

export interface WorldEntity {
  id: string
  type: EntityType
  name: string
  aliases: string[]
  introducedChapter: number
  description: string
  tags: string[]
  importance: number          // 0-1: centrality to main plot
  vitality: number            // 0-1: how likely to remain relevant (-1 = deceased/exited)
  lastMentionedChapter: number
  properties: Map<string, any>
}

export interface CharacterEntity extends WorldEntity {
  type: 'character'
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
  aliases: string[]            // Known names/nicknames
  traits: CharacterTrait[]
  relationships: Relationship[]
  arcProgress: number          // 0-1: how much character arc is resolved
  activeGoals: string[]
  activeConflicts: string[]
  currentState: Map<string, string>  // emotional/physical state
}

export interface CharacterTrait {
  name: string                 // e.g., 'brave', 'deceitful', 'loyal'
  polarity: number              // -1 very negative trait, +1 very positive
  consistency: number           // 0-1 how consistently trait manifests
  originChapter?: number        // when first shown
}

export interface Relationship {
  targetId: string
  type: 'family' | 'friend' | 'enemy' | 'romantic' | 'mentor' | 'rival' | 'professional' | 'lover' | 'nemesis'
  strength: number              // 0-1
  bidirectional: boolean
  originChapter: number
  description: string
  status: 'active' | 'strained' | 'broken' | 'evolved'
}

export interface LocationEntity extends WorldEntity {
  type: 'location'
  parentLocationId?: string     // for nested geography
  atmosphere: string[]           // e.g., 'haunting', 'vibrant', 'dangerous'
  significance: 'major' | 'minor' | 'transit' | 'symbolic'
  visitedBy: string[]           // character IDs
  plotSignificance: number      // 0-1 how central to plot
}

export interface ItemEntity extends WorldEntity {
  type: 'item'
  category: 'weapon' | 'artifact' | 'key_item' | 'fodder' | 'symbolic'
  currentOwnerId?: string        // character ID
  previousOwners: string[]
  magicalProperties: string[]
  plotFunction: string          // e.g., 'unlock ending', 'reveal truth'
}

export interface TimelineEvent {
  id: string
  chapter: number
  title: string
  description: string
  participants: string[]        // character IDs
  locations: string[]            // location IDs
  causality: string[]            // event IDs this causes
  reverseCausedBy: string[]      // event IDs that caused this
  importance: number             // 0-1
  revealsTruth: boolean
  changesState: string[]        // entity IDs whose state changes
}

export interface WorldRule {
  id: string
  name: string                  // e.g., 'Magic System: Elemental Binding'
  description: string
  type: 'magic' | 'physics' | 'social' | 'custom'
  constraints: string[]         // what cannot happen
  allowances: string[]          // what is possible
  plotRelevance: number         // 0-1
}

// ===============================================================================
// World State Types
// ===============================================================================

export interface StoryWorldState {
  id: string
  storyId: string
  totalChapters: number
  characters: Map<string, CharacterEntity>
  locations: Map<string, LocationEntity>
  items: Map<string, ItemEntity>
  events: Map<string, TimelineEvent>
  rules: Map<string, WorldRule>
  timeline: string[]            // event IDs in chronological order
  characterCount: number
  locationCount: number
  itemCount: number
}

export interface WorldConsistencyResult {
  isConsistent: boolean
  conflicts: WorldConflict[]
  warnings: WorldWarning[]
  suggestions: string[]
}

export interface WorldConflict {
  entityAId: string
  entityBId: string
  conflictType: 'timeline' | 'property' | 'relationship' | 'rule_violation' | 'causality'
  description: string
  chapter: number
  severity: 'critical' | 'major' | 'minor'
}

export interface WorldWarning {
  entityId: string
  warningType: 'unused' | 'forgotten' | 'inconsistent_state' | 'orphaned'
  description: string
  lastRelevantChapter: number
}

export interface WorldChange {
  type: 'create' | 'update' | 'delete'
  entityType: EntityType
  entityId: string
  changes: Record<string, { from: any; to: any }>
  chapter: number
}

// ===============================================================================
// Configuration
// ===============================================================================

export interface WorldModelConfig {
  maxCharacters: number
  maxLocations: number
  maxItems: number
  orphanThresholdChapters: number   // warn if entity not mentioned in N chapters
  consistencyCheckDepth: number       // how deep to trace causality
  relationshipDecayRate: number     // 0-1 per chapter (unused relationships weaken)
}

export const DEFAULT_WORLD_CONFIG: WorldModelConfig = {
  maxCharacters: 50,
  maxLocations: 30,
  maxItems: 40,
  orphanThresholdChapters: 5,
  consistencyCheckDepth: 3,
  relationshipDecayRate: 0.05
}

// ===============================================================================
// Factory Functions
// ===============================================================================

/**
 * Create empty world state
 */
export function createEmptyWorldState(storyId: string): StoryWorldState {
  return {
    id: `world-${storyId}`,
    storyId,
    totalChapters: 0,
    characters: new Map(),
    locations: new Map(),
    items: new Map(),
    events: new Map(),
    rules: new Map(),
    timeline: [],
    characterCount: 0,
    locationCount: 0,
    itemCount: 0
  }
}

/**
 * Create character entity
 */
export function createCharacter(
  id: string,
  name: string,
  role: CharacterEntity['role'],
  chapter: number,
  aliases: string[] = []
): CharacterEntity {
  const entity: CharacterEntity = {
    id,
    type: 'character',
    name,
    aliases,
    introducedChapter: chapter,
    description: '',
    tags: [],
    importance: role === 'protagonist' ? 1.0 : role === 'antagonist' ? 0.9 : 0.5,
    vitality: 1.0,
    lastMentionedChapter: chapter,
    properties: new Map(),
    role,
    traits: [],
    relationships: [],
    arcProgress: 0,
    activeGoals: [],
    activeConflicts: [],
    currentState: new Map()
  }
  return entity
}

/**
 * Create location entity
 */
export function createLocation(
  id: string,
  name: string,
  significance: LocationEntity['significance'],
  chapter: number
): LocationEntity {
  return {
    id,
    type: 'location',
    name,
    aliases: [],
    introducedChapter: chapter,
    description: '',
    tags: [],
    importance: significance === 'major' ? 0.9 : significance === 'minor' ? 0.4 : 0.2,
    vitality: 0.8,
    lastMentionedChapter: chapter,
    properties: new Map(),
    parentLocationId: undefined,
    atmosphere: [],
    significance,
    visitedBy: [],
    plotSignificance: significance === 'major' ? 0.8 : 0.3
  }
}

/**
 * Add character relationship
 */
export function addRelationship(
  character: CharacterEntity,
  targetId: string,
  type: Relationship['type'],
  strength: number,
  chapter: number,
  description: string,
  bidirectional: boolean = true
): CharacterEntity {
  const relationship: Relationship = {
    targetId,
    type,
    strength,
    bidirectional,
    originChapter: chapter,
    description,
    status: 'active'
  }
  return {
    ...character,
    relationships: [...character.relationships, relationship]
  }
}

/**
 * Add timeline event
 */
export function addTimelineEvent(
  state: StoryWorldState,
  event: Omit<TimelineEvent, 'id'>
): StoryWorldState {
  const id = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const fullEvent: TimelineEvent = { ...event, id }
  const newEvents = new Map(state.events)
  newEvents.set(id, fullEvent)
  const newTimeline = Array.from(newEvents.values()).map(e => e.id).sort((a, b) => {
    const evtA = newEvents.get(a)!
    const evtB = newEvents.get(b)!
    return evtA.chapter - evtB.chapter || evtA.id.localeCompare(evtB.id)
  })
  return {
    ...state,
    events: newEvents,
    timeline: newTimeline,
    totalChapters: Math.max(state.totalChapters, event.chapter)
  }
}

// ===============================================================================
// Query Functions
// =============================================================================

/**
 * Get character by ID
 */
export function getCharacter(state: StoryWorldState, id: string): CharacterEntity | undefined {
  return state.characters.get(id)
}

/**
 * Get all characters of a role
 */
export function getCharactersByRole(
  state: StoryWorldState,
  role: CharacterEntity['role']
): CharacterEntity[] {
  return Array.from(state.characters.values()).filter(c => c.role === role)
}

/**
 * Get characters at a location
 */
export function getCharactersAtLocation(
  state: StoryWorldState,
  locationId: string
): CharacterEntity[] {
  const location = state.locations.get(locationId)
  if (!location) return []
  return location.visitedBy
    .map(id => state.characters.get(id))
    .filter((c): c is CharacterEntity => c !== undefined)
}

/**
 * Get item by ID
 */
export function getItem(state: StoryWorldState, id: string): ItemEntity | undefined {
  return state.items.get(id)
}

/**
 * Get items owned by character
 */
export function getItemsOwnedBy(state: StoryWorldState, characterId: string): ItemEntity[] {
  return Array.from(state.items.values()).filter(
    item => item.currentOwnerId === characterId
  )
}

/**
 * Get location by ID
 */
export function getLocation(state: StoryWorldState, id: string): LocationEntity | undefined {
  return state.locations.get(id)
}

/**
 * Get events at chapter
 */
export function getEventsAtChapter(state: StoryWorldState, chapter: number): TimelineEvent[] {
  return Array.from(state.events.values()).filter(e => e.chapter === chapter)
}

/**
 * Get events involving character
 */
export function getCharacterEvents(
  state: StoryWorldState,
  characterId: string
): TimelineEvent[] {
  return Array.from(state.events.values()).filter(e =>
    e.participants.includes(characterId)
  )
}

/**
 * Find character by name/alias
 */
export function findCharacterByName(
  state: StoryWorldState,
  name: string
): CharacterEntity | undefined {
  const lower = name.toLowerCase()
  return Array.from(state.characters.values()).find(
    c => c.name.toLowerCase() === lower ||
         c.aliases.some(a => a.toLowerCase() === lower)
  )
}

/**
 * Get active relationships for character
 */
export function getActiveRelationships(
  character: CharacterEntity
): Relationship[] {
  return character.relationships.filter(r => r.status === 'active')
}

/**
 * Get relationship strength between two characters
 */
export function getRelationshipStrength(
  state: StoryWorldState,
  charA: string,
  charB: string
): number {
  const a = state.characters.get(charA)
  if (!a) return 0
  const rel = a.relationships.find(r => r.targetId === charB)
  return rel?.strength ?? 0
}

// ===============================================================================
// Analysis Functions
// =============================================================================

/**
 * Check world consistency
 */
export function checkWorldConsistency(
  state: StoryWorldState,
  currentChapter: number,
  config: WorldModelConfig = DEFAULT_WORLD_CONFIG
): WorldConsistencyResult {
  const conflicts: WorldConflict[] = []
  const warnings: WorldWarning[] = []
  const suggestions: string[] = []

  // Check for timeline conflicts
  for (const event of state.events.values()) {
    // Causality check: event cannot cause itself
    if (event.causality.includes(event.id)) {
      conflicts.push({
        entityAId: event.id,
        entityBId: event.id,
        conflictType: 'causality',
        description: `Event "${event.title}" lists itself as a cause`,
        chapter: event.chapter,
        severity: 'critical'
      })
    }

    // Check if referenced entities exist
    for (const charId of event.participants) {
      if (!state.characters.has(charId)) {
        conflicts.push({
          entityAId: event.id,
          entityBId: charId,
          conflictType: 'timeline',
          description: `Event "${event.title}" references missing character`,
          chapter: event.chapter,
          severity: 'major'
        })
      }
    }
  }

  // Check relationship consistency
  for (const char of state.characters.values()) {
    for (const rel of char.relationships) {
      const target = state.characters.get(rel.targetId)
      if (!target) {
        conflicts.push({
          entityAId: char.id,
          entityBId: rel.targetId,
          conflictType: 'relationship',
          description: `${char.name} has relationship with missing character`,
          chapter: rel.originChapter,
          severity: 'major'
        })
      }
    }
  }

  // Check for orphaned entities (not mentioned recently)
  for (const [id, entity] of Array.from(state.characters.entries())) {
    if (currentChapter - entity.lastMentionedChapter > config.orphanThresholdChapters) {
      warnings.push({
        entityId: id,
        warningType: 'forgotten',
        description: `${entity.name} not mentioned for ${currentChapter - entity.lastMentionedChapter} chapters`,
        lastRelevantChapter: entity.lastMentionedChapter
      })
    }
  }

  // Check for items with unknown owners
  for (const item of state.items.values()) {
    if (item.currentOwnerId && !state.characters.has(item.currentOwnerId)) {
      conflicts.push({
        entityAId: item.id,
        entityBId: item.currentOwnerId,
        conflictType: 'property',
        description: `Item "${item.name}" owned by missing character`,
        chapter: currentChapter,
        severity: 'major'
      })
    }
  }

  // Generate suggestions
  if (warnings.length > 3) {
    suggestions.push(`${warnings.length} characters/locations may be forgotten - consider revisiting or pruning`)
  }

  const isConsistent = conflicts.filter(c => c.severity === 'critical').length === 0

  return { isConsistent, conflicts, warnings, suggestions }
}

/**
 * Calculate character importance score
 */
export function calculateCharacterImportance(
  state: StoryWorldState,
  characterId: string
): number {
  const char = state.characters.get(characterId)
  if (!char) return 0

  // Role-based base
  const roleScore = char.role === 'protagonist' ? 1.0 :
                    char.role === 'antagonist' ? 0.9 :
                    char.role === 'supporting' ? 0.5 : 0.2

  // Relationship strength (sum of all relationship strengths)
  const relStrength = char.relationships.reduce((sum, r) => sum + r.strength, 0)

  // Event participation
  const eventCount = Array.from(state.events.values())
    .filter(e => e.participants.includes(characterId)).length

  const eventScore = Math.min(1, eventCount / 20)  // normalize to 0-1

  // Arc progress (unresolved arcs are more important)
  const arcScore = 1 - char.arcProgress

  return Math.min(1,
    roleScore * 0.3 +
    relStrength * 0.2 +
    eventScore * 0.3 +
    arcScore * 0.2
  )
}

/**
 * Get world summary statistics
 */
export function getWorldSummary(state: StoryWorldState): {
  characterCount: number
  locationCount: number
  itemCount: number
  eventCount: number
  avgRelationshipsPerCharacter: number
  mostConnectedCharacter: string | null
  totalChapters: number
} {
  const characters = Array.from(state.characters.values())
  const totalRelStrength = characters.reduce(
    (sum, c) => sum + c.relationships.reduce((s, r) => s + r.strength, 0), 0
  )

  let mostConnected: { id: string; count: number } | null = null
  for (const c of characters) {
    const count = c.relationships.length
    if (!mostConnected || count > mostConnected.count) {
      mostConnected = { id: c.id, count }
    }
  }

  return {
    characterCount: state.characterCount,
    locationCount: state.locationCount,
    itemCount: state.itemCount,
    eventCount: state.events.size,
    avgRelationshipsPerCharacter: characters.length > 0
      ? totalRelStrength / characters.length
      : 0,
    mostConnectedCharacter: mostConnected?.id ?? null,
    totalChapters: state.totalChapters
  }
}

/**
 * Format world summary
 */
export function formatWorldSummary(state: StoryWorldState): string {
  const stats = getWorldSummary(state)
  const characters = Array.from(state.characters.values())

  const lines = [
    `=== Story World: ${state.storyId} ===`,
    ``,
    `Entities:`,
    `  Characters: ${stats.characterCount}`,
    `  Locations: ${stats.locationCount}`,
    `  Items: ${stats.itemCount}`,
    `  Events: ${stats.eventCount}`,
    ``,
    `Connections:`,
    `  Avg relationships/character: ${stats.avgRelationshipsPerCharacter.toFixed(1)}`,
    `  Most connected: ${stats.mostConnectedCharacter ?? 'none'}`,
    ``,
    `Characters by Role:`,
    `  Protagonists: ${characters.filter(c => c.role === 'protagonist').length}`,
    `  Antagonists: ${characters.filter(c => c.role === 'antagonist').length}`,
    `  Supporting: ${characters.filter(c => c.role === 'supporting').length}`,
    `  Minor: ${characters.filter(c => c.role === 'minor').length}`,
    ``,
    `Timeline: ${stats.totalChapters} chapters`
  ]

  return lines.join('\n')
}

/**
 * Find path between two characters (relationship chain)
 */
export function findCharacterPath(
  state: StoryWorldState,
  fromId: string,
  toId: string,
  maxDepth: number = 5
): string[] | null {
  if (fromId === toId) return [fromId]

  const visited = new Set<string>([fromId])
  const queue: { id: string; path: string[] }[] = [{ id: fromId, path: [fromId] }]

  while (queue.length > 0) {
    const { id, path } = queue.shift()!

    const char = state.characters.get(id)
    if (!char) continue

    for (const rel of char.relationships) {
      if (rel.status !== 'active') continue

      if (rel.targetId === toId) {
        return [...path, toId]
      }

      if (!visited.has(rel.targetId) && path.length < maxDepth) {
        visited.add(rel.targetId)
        queue.push({ id: rel.targetId, path: [...path, rel.targetId] })
      }
    }
  }

  return null  // No path found
}

/**
 * Prune inactive entities from world state
 */
export function pruneInactiveEntities(
  state: StoryWorldState,
  beforeChapter: number
): StoryWorldState {
  const deadCharacters: string[] = []
  const removedLocations: string[] = []

  // Find characters that exited before beforeChapter
  for (const [id, char] of Array.from(state.characters.entries())) {
    if (char.lastMentionedChapter < beforeChapter - 10 && char.vitality <= 0) {
      deadCharacters.push(id)
    }
  }

  // Find locations never visited in last 20 chapters
  for (const [id, loc] of Array.from(state.locations.entries())) {
    if (loc.lastMentionedChapter < beforeChapter - 20 && loc.plotSignificance < 0.3) {
      removedLocations.push(id)
    }
  }

  // Remove entities
  const newCharacters = new Map(state.characters)
  const newItems = new Map(state.items)

  for (const id of deadCharacters) {
    newCharacters.delete(id)
  }

  // Remove items owned by dead characters
  for (const [id, item] of newItems) {
    if (item.currentOwnerId && deadCharacters.includes(item.currentOwnerId)) {
      newItems.delete(id)
    }
  }

  return {
    ...state,
    characters: newCharacters,
    items: newItems,
    characterCount: newCharacters.size,
    locationCount: state.locationCount - removedLocations.length,
    itemCount: newItems.size
  }
}