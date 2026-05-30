/**
 * CharacterRelationshipGraph - V144
 * Character Network & Relationship Dynamics Engine
 * 
 * Design references:
 * - ruflo: hierarchical decomposition (character → relationship → event)
 * - nanobot: distributed state graph with node tracking
 * - thunderbolt: feedback loops for relationship evolution
 * - chatdev: multi-agent dynamics and conflict resolution
 */

export type RelationshipType = 
  | 'ally' | 'enemy' | 'neutral' | 'romantic' | 'family' 
  | 'mentor' | 'rival' | 'stranger' | 'complex'

export type ConflictLevel = 0 | 1 | 2 | 3 | 4 | 5  // 0=none, 5=extreme

export interface Character {
  characterId: string
  name: string
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
  traits: string[]          // personality traits
  goals: string[]            // character's goals
  arcType: string            // character arc type
  importance: number         // 0-100 story importance
  wordCount: number          // total appearances
  firstAppearance: number    // chapter number
  emotionalRange: number     // 0-100 how emotionally dynamic
}

export interface Relationship {
  relationshipId: string
  fromCharacterId: string
  toCharacterId: string
  type: RelationshipType
  strength: number           // 0-100
  conflictLevel: ConflictLevel
  sharedScenes: number
  lastInteractionChapter: number | null
  evolutionHistory: Array<{ chapter: number; event: string; strengthDelta: number }>
  notes: string
}

export interface RelationshipGraphState {
  characters: Map<string, Character>
  relationships: Map<string, Relationship>
  characterSceneCount: Map<string, number>  // characterId -> scenes appeared in
  currentChapter: number
  totalScenes: number
  mostConnectedCharacter: string | null
  centralCharacterId: string | null
}

// =============================================================================
// State Management
// =============================================================================

export function createEmptyGraphState(): RelationshipGraphState {
  return {
    characters: new Map(),
    relationships: new Map(),
    characterSceneCount: new Map(),
    currentChapter: 0,
    totalScenes: 0,
    mostConnectedCharacter: null,
    centralCharacterId: null,
  }
}

// =============================================================================
// Character Management
// =============================================================================

export function addCharacter(
  state: RelationshipGraphState,
  name: string,
  role: Character['role'] = 'supporting',
  traits: string[] = [],
  importance: number = 50
): { state: RelationshipGraphState; characterId: string } {
  const characterId = `char_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  
  const character: Character = {
    characterId,
    name,
    role,
    traits,
    goals: [],
    arcType: 'flat',
    importance,
    wordCount: 0,
    firstAppearance: state.currentChapter || 1,
    emotionalRange: 50,
  }
  
  const newCharacters = new Map(state.characters)
  newCharacters.set(characterId, character)
  
  return {
    state: { ...state, characters: newCharacters },
    characterId,
  }
}

export function updateCharacterRole(
  state: RelationshipGraphState,
  characterId: string,
  role: Character['role']
): RelationshipGraphState {
  const character = state.characters.get(characterId)
  if (!character) return state
  
  const newCharacters = new Map(state.characters)
  newCharacters.set(characterId, { ...character, role })
  
  return { ...state, characters: newCharacters }
}

export function recordCharacterAppearance(
  state: RelationshipGraphState,
  characterId: string,
  chapter: number,
  wordCount: number = 100
): RelationshipGraphState {
  const character = state.characters.get(characterId)
  if (!character) return state
  
  const newCharacters = new Map(state.characters)
  newCharacters.set(characterId, {
    ...character,
    wordCount: character.wordCount + wordCount,
    firstAppearance: Math.min(character.firstAppearance, chapter),
  })
  
  const newSceneCount = new Map(state.characterSceneCount)
  newSceneCount.set(characterId, (newSceneCount.get(characterId) || 0) + 1)
  
  return {
    ...state,
    characters: newCharacters,
    characterSceneCount: newSceneCount,
    currentChapter: Math.max(state.currentChapter, chapter),
  }
}

// =============================================================================
// Relationship Management
// =============================================================================

export function createRelationship(
  state: RelationshipGraphState,
  fromCharacterId: string,
  toCharacterId: string,
  type: RelationshipType,
  strength: number = 50
): { state: RelationshipGraphState; relationshipId: string } {
  if (fromCharacterId === toCharacterId) {
    return { state, relationshipId: '' }
  }
  
  const relationshipId = `rel_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  
  const relationship: Relationship = {
    relationshipId,
    fromCharacterId,
    toCharacterId,
    type,
    strength: Math.max(0, Math.min(100, strength)),
    conflictLevel: type === 'enemy' || type === 'rival' ? 3 as ConflictLevel : 0 as ConflictLevel,
    sharedScenes: 0,
    lastInteractionChapter: null,
    evolutionHistory: [],
    notes: '',
  }
  
  const newRelationships = new Map(state.relationships)
  newRelationships.set(relationshipId, relationship)
  
  return {
    state: { ...state, relationships: newRelationships },
    relationshipId,
  }
}

export function updateRelationshipStrength(
  state: RelationshipGraphState,
  relationshipId: string,
  delta: number,
  chapter: number,
  event: string
): RelationshipGraphState {
  const relationship = state.relationships.get(relationshipId)
  if (!relationship) return state
  
  const newStrength = Math.max(0, Math.min(100, relationship.strength + delta))
  
  const updatedRelationship: Relationship = {
    ...relationship,
    strength: newStrength,
    lastInteractionChapter: chapter,
    evolutionHistory: [
      ...relationship.evolutionHistory,
      { chapter, event, strengthDelta: delta },
    ],
  }
  
  const newRelationships = new Map(state.relationships)
  newRelationships.set(relationshipId, updatedRelationship)
  
  return { ...state, relationships: newRelationships }
}

export function resolveRelationship(
  state: RelationshipGraphState,
  relationshipId: string,
  newType: RelationshipType,
  newStrength: number = 50
): RelationshipGraphState {
  const relationship = state.relationships.get(relationshipId)
  if (!relationship) return state
  
  const newRelationships = new Map(state.relationships)
  newRelationships.set(relationshipId, {
    ...relationship,
    type: newType,
    strength: newStrength,
    conflictLevel: newType === 'enemy' || newType === 'rival' ? 3 as ConflictLevel : 0 as ConflictLevel,
  })
  
  return { ...state, relationships: newRelationships }
}

export function recordSharedScene(
  state: RelationshipGraphState,
  relationshipId: string,
  chapter: number
): RelationshipGraphState {
  const relationship = state.relationships.get(relationshipId)
  if (!relationship) return state
  
  const newRelationships = new Map(state.relationships)
  newRelationships.set(relationshipId, {
    ...relationship,
    sharedScenes: relationship.sharedScenes + 1,
    lastInteractionChapter: chapter,
  })
  
  return {
    ...state,
    relationships: newRelationships,
    totalScenes: state.totalScenes + 1,
  }
}

// =============================================================================
// Graph Analysis
// =============================================================================

export function computeCentralCharacter(state: RelationshipGraphState): RelationshipGraphState {
  if (state.characters.size === 0) return { ...state, centralCharacterId: null }
  
  // Calculate connection count for each character
  const connectionCounts = new Map<string, number>()
  
  for (const rel of state.relationships.values()) {
    connectionCounts.set(rel.fromCharacterId, (connectionCounts.get(rel.fromCharacterId) || 0) + 1)
    connectionCounts.set(rel.toCharacterId, (connectionCounts.get(rel.toCharacterId) || 0) + 1)
  }
  
  // Also factor in character importance
  let maxScore = -1
  let centralId: string | null = null
  
  for (const char of state.characters.values()) {
    const connections = connectionCounts.get(char.characterId) || 0
    const score = connections * 10 + char.importance
    
    if (score > maxScore) {
      maxScore = score
      centralId = char.characterId
    }
  }
  
  // Find most connected
  let maxConnections = 0
  let mostConnected: string | null = null
  for (const [charId, count] of connectionCounts) {
    if (count > maxConnections) {
      maxConnections = count
      mostConnected = charId
    }
  }
  
  return {
    ...state,
    centralCharacterId: centralId,
    mostConnectedCharacter: mostConnected,
  }
}

export function findConflictedRelationships(state: RelationshipGraphState): Relationship[] {
  return Array.from(state.relationships.values())
    .filter(r => r.conflictLevel >= 3)
    .sort((a, b) => b.conflictLevel - a.conflictLevel)
}

export function findCharacterConflicts(state: RelationshipGraphState, characterId: string): Relationship[] {
  return Array.from(state.relationships.values())
    .filter(r => 
      (r.fromCharacterId === characterId || r.toCharacterId === characterId) &&
      r.conflictLevel >= 3
    )
}

export function getCharacterNetwork(
  state: RelationshipGraphState,
  characterId: string,
  depth: number = 1
): Map<string, { character: Character; relationship: Relationship | null; distance: number }> {
  const network = new Map<string, { character: Character; relationship: Relationship | null; distance: number }>()
  
  // BFS to find connected characters
  const visited = new Set<string>()
  const queue: Array<{ id: string; dist: number }> = [{ id: characterId, dist: 0 }]
  
  while (queue.length > 0) {
    const current = queue.shift()!
    if (visited.has(current.id)) continue
    visited.add(current.id)
    
    const char = state.characters.get(current.id)
    if (!char) continue
    
    if (current.id !== characterId) {
      // Find relationship between current and this character
      let rel: Relationship | null = null
      for (const r of state.relationships.values()) {
        if ((r.fromCharacterId === current.id && r.toCharacterId === characterId) ||
            (r.fromCharacterId === characterId && r.toCharacterId === current.id)) {
          rel = r
          break
        }
      }
      network.set(current.id, { character: char, relationship: rel, distance: current.dist })
    }
    
    if (current.dist < depth) {
      // Find all connected characters
      for (const rel of state.relationships.values()) {
        if (rel.fromCharacterId === current.id && !visited.has(rel.toCharacterId)) {
          queue.push({ id: rel.toCharacterId, dist: current.dist + 1 })
        }
        if (rel.toCharacterId === current.id && !visited.has(rel.fromCharacterId)) {
          queue.push({ id: rel.fromCharacterId, dist: current.dist + 1 })
        }
      }
    }
  }
  
  return network
}

// =============================================================================
// Formatters
// =============================================================================

export function formatCharacterCard(state: RelationshipGraphState, characterId: string): string {
  const char = state.characters.get(characterId)
  if (!char) return `Character ${characterId} not found`
  
  const rels = Array.from(state.relationships.values())
    .filter(r => r.fromCharacterId === characterId || r.toCharacterId === characterId)
  
  const lines = [
    `=== ${char.name} (${char.role}) ===`,
    `Importance: ${char.importance}/100 | Words: ${char.wordCount.toLocaleString()}`,
    `Traits: ${char.traits.join(', ') || 'none'}`,
    `Goals: ${char.goals.join(', ') || 'none'}`,
    `Arc: ${char.arcType} | Emotional Range: ${char.emotionalRange}/100`,
    `Scenes: ${state.characterSceneCount.get(characterId) || 0} | First: Ch${char.firstAppearance}`,
    '',
    `Relationships (${rels.length}):`,
  ]
  
  for (const rel of rels) {
    const otherId = rel.fromCharacterId === characterId ? rel.toCharacterId : rel.fromCharacterId
    const other = state.characters.get(otherId)
    const otherName = other?.name || 'Unknown'
    const conflict = rel.conflictLevel > 0 ? ` [CONFLICT: ${rel.conflictLevel}/5]` : ''
    lines.push(`  - ${rel.type} with ${otherName}: strength=${rel.strength}${conflict}`)
  }
  
  return lines.join('\n')
}

export function formatRelationshipGraph(state: RelationshipGraphState): string {
  const lines = [
    '=== Character Relationship Graph ===',
    `Characters: ${state.characters.size} | Relationships: ${state.relationships.size}`,
    `Scenes: ${state.totalScenes} | Current Chapter: ${state.currentChapter}`,
    '',
  ]
  
  if (state.centralCharacterId) {
    const central = state.characters.get(state.centralCharacterId)
    if (central) {
      lines.push(`Central Character: ${central.name} (${state.centralCharacterId.slice(-6)})`)
    }
  }
  
  if (state.mostConnectedCharacter) {
    const most = state.characters.get(state.mostConnectedCharacter)
    if (most) {
      lines.push(`Most Connected: ${most.name} (${state.mostConnectedCharacter.slice(-6)})`)
    }
  }
  
  lines.push('')
  lines.push('--- All Relationships ---')
  
  const rels = Array.from(state.relationships.values())
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 10)
  
  for (const rel of rels) {
    const from = state.characters.get(rel.fromCharacterId)
    const to = state.characters.get(rel.toCharacterId)
    if (!from || !to) continue
    
    const conflict = rel.conflictLevel > 0 ? ` [!${rel.conflictLevel}]` : ''
    lines.push(`  ${from.name} --[${rel.type}]--> ${to.name}: ${rel.strength}${conflict} (${rel.sharedScenes} scenes)`)
  }
  
  return lines.join('\n')
}

export function formatRelationshipDashboard(state: RelationshipGraphState): string {
  const lines = [
    '=== Relationship Intelligence Dashboard ===',
    `Total Characters: ${state.characters.size}`,
    `Active Relationships: ${state.relationships.size}`,
    `Total Scenes: ${state.totalScenes}`,
    '',
  ]
  
  // Character role breakdown
  const roles: Record<string, number> = {}
  for (const char of state.characters.values()) {
    roles[char.role] = (roles[char.role] || 0) + 1
  }
  lines.push('--- Characters by Role ---')
  for (const [role, count] of Object.entries(roles)) {
    lines.push(`  ${role}: ${count}`)
  }
  
  // Relationship type breakdown
  const types: Record<string, number> = {}
  for (const rel of state.relationships.values()) {
    types[rel.type] = (types[rel.type] || 0) + 1
  }
  lines.push('')
  lines.push('--- Relationships by Type ---')
  for (const [type, count] of Object.entries(types)) {
    lines.push(`  ${type}: ${count}`)
  }
  
  // Conflicts
  const conflicts = findConflictedRelationships(state)
  if (conflicts.length > 0) {
    lines.push('')
    lines.push(`--- Active Conflicts (${conflicts.length}) ---`)
    for (const rel of conflicts.slice(0, 5)) {
      const from = state.characters.get(rel.fromCharacterId)
      const to = state.characters.get(rel.toCharacterId)
      lines.push(`  ${from?.name || '?'} vs ${to?.name || '?'}: level ${rel.conflictLevel}/5`)
    }
  }
  
  return lines.join('\n')
}
