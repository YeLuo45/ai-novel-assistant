/**
 * WorldbuildingKnowledgeGraphEngine — V507
 * Character relationship network, lore management, and consistency verification.
 * Inspired by: nanobot (distributed mesh) + ruflo (hierarchical decomposition) + chatdev (role专业化)
 */

export type EntityType = 'character' | 'location' | 'faction' | 'item' | 'event' | 'concept'
export type RelationshipType = 'ally' | 'enemy' | 'neutral' | 'family' | 'romantic' | 'mentor' | 'rival' | 'unknown'
export type ConsistencyStatus = 'consistent' | 'warning' | 'conflict'

export interface Entity {
  id: string
  type: EntityType
  name: string
  aliases: string[]
  description: string
  properties: Record<string, string | number | boolean>
  appearance?: string
  personality?: string
  firstMentioned: { chapterNumber: number, sceneId: string }
  lastUpdated: number
}

export interface Relationship {
  id: string
  fromId: string
  toId: string
  type: RelationshipType
  strength: number  // 0-100, how strong the relationship is
  description: string
  history: { chapterNumber: number, event: string }[]
  lastUpdated: number
}

export interface LoreEntry {
  id: string
  category: string  // e.g., 'magic_system', 'history', 'geography'
  title: string
  content: string
  relatedEntities: string[]  // entity IDs
  verified: boolean
  lastVerified: number
}

export interface ConsistencyWarning {
  id: string
  type: 'property_mismatch' | 'relationship_conflict' | 'timeline_error' | 'missing_link'
  severity: 'low' | 'medium' | 'high'
  entityIds: string[]
  description: string
  suggestedFix?: string
}

export interface KnowledgeGraphState {
  entities: Record<string, Entity>
  relationships: Record<string, Relationship>
  loreEntries: Record<string, LoreEntry>
  consistencyWarnings: ConsistencyWarning[]
  totalConnections: number
  lastConsistencyCheck: number
}

export function createEmptyState(): KnowledgeGraphState {
  return {
    entities: {},
    relationships: {},
    loreEntries: {},
    consistencyWarnings: [],
    totalConnections: 0,
    lastConsistencyCheck: Date.now()
  }
}

export function addEntity(
  state: KnowledgeGraphState,
  type: EntityType,
  name: string,
  description: string,
  properties: Record<string, string | number | boolean> = {},
  chapterNumber: number = 1,
  sceneId: string = 'intro'
): KnowledgeGraphState {
  const id = `entity_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const entity: Entity = {
    id,
    type,
    name,
    aliases: [],
    description,
    properties,
    firstMentioned: { chapterNumber, sceneId },
    lastUpdated: Date.now()
  }

  return {
    ...state,
    entities: { ...state.entities, [id]: entity }
  }
}

export function updateEntity(
  state: KnowledgeGraphState,
  entityId: string,
  updates: Partial<Entity>
): KnowledgeGraphState {
  const entity = state.entities[entityId]
  if (!entity) return state

  return {
    ...state,
    entities: {
      ...state.entities,
      [entityId]: { ...entity, ...updates, lastUpdated: Date.now() }
    }
  }
}

export function addRelationship(
  state: KnowledgeGraphState,
  fromId: string,
  toId: string,
  type: RelationshipType,
  description: string,
  strength: number = 50,
  chapterNumber: number = 1,
  event: string = 'Initial connection'
): KnowledgeGraphState {
  if (!state.entities[fromId] || !state.entities[toId]) return state

  const id = `rel_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const relationship: Relationship = {
    id,
    fromId,
    toId,
    type,
    strength: Math.max(0, Math.min(100, strength)),
    description,
    history: [{ chapterNumber, event }],
    lastUpdated: Date.now()
  }

  return {
    ...state,
    relationships: { ...state.relationships, [id]: relationship },
    totalConnections: state.totalConnections + 1
  }
}

export function updateRelationshipStrength(
  state: KnowledgeGraphState,
  relationshipId: string,
  delta: number,
  chapterNumber: number,
  event: string
): KnowledgeGraphState {
  const rel = state.relationships[relationshipId]
  if (!rel) return state

  const newStrength = Math.max(0, Math.min(100, rel.strength + delta))
  const updatedRel: Relationship = {
    ...rel,
    strength: newStrength,
    history: [...rel.history, { chapterNumber, event }],
    lastUpdated: Date.now()
  }

  return {
    ...state,
    relationships: { ...state.relationships, [relationshipId]: updatedRel }
  }
}

export function addLoreEntry(
  state: KnowledgeGraphState,
  category: string,
  title: string,
  content: string,
  relatedEntities: string[] = []
): KnowledgeGraphState {
  const id = `lore_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const loreEntry: LoreEntry = {
    id,
    category,
    title,
    content,
    relatedEntities,
    verified: false,
    lastVerified: Date.now()
  }

  return {
    ...state,
    loreEntries: { ...state.loreEntries, [id]: loreEntry }
  }
}

export function linkEntitiesToLore(
  state: KnowledgeGraphState,
  loreId: string,
  entityIds: string[]
): KnowledgeGraphState {
  const lore = state.loreEntries[loreId]
  if (!lore) return state

  return {
    ...state,
    loreEntries: {
      ...state.loreEntries,
      [loreId]: { ...lore, relatedEntities: Array.from(new Set([...lore.relatedEntities, ...entityIds])) }
    }
  }
}

export function checkConsistency(
  state: KnowledgeGraphState
): KnowledgeGraphState {
  const warnings: ConsistencyWarning[] = []

  // Check for relationship conflicts (A enemy B but B ally A)
  const rels = Object.values(state.relationships)
  for (const rel of rels) {
    const inverse = rels.find(r =>
      r.fromId === rel.toId && r.toId === rel.fromId
    )
    if (inverse) {
      if ((rel.type === 'enemy' && inverse.type === 'ally') ||
          (rel.type === 'ally' && inverse.type === 'enemy')) {
        warnings.push({
          id: `warn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          type: 'relationship_conflict',
          severity: 'high',
          entityIds: [rel.fromId, rel.toId],
          description: `${state.entities[rel.fromId]?.name} is ${rel.type} to ${state.entities[rel.toId]?.name} but relationship is asymmetric`,
          suggestedFix: 'Review and resolve the relationship direction'
        })
      }
    }
  }

  // Check for timeline errors in relationship history
  for (const rel of rels) {
    if (rel.history.length >= 2) {
      for (let i = 1; i < rel.history.length; i++) {
        if (rel.history[i].chapterNumber < rel.history[i - 1].chapterNumber) {
          warnings.push({
            id: `warn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            type: 'timeline_error',
            severity: 'medium',
            entityIds: [rel.fromId, rel.toId],
            description: `Relationship history for ${state.entities[rel.fromId]?.name} has non-sequential chapter order`,
            suggestedFix: 'Reorder relationship events chronologically'
          })
        }
      }
    }
  }

  // Check for unverified lore older than 10 chapters
  const now = Date.now()
  for (const entity of Object.values(state.entities)) {
    if (!entity.firstMentioned) continue
    // If entity was introduced many chapters ago but lore not verified
    const timeSinceUpdate = now - entity.lastUpdated
    if (timeSinceUpdate > 3600000) {  // 1 hour = 10 chapters worth
      const unverifiedLore = Object.values(state.loreEntries)
        .filter(l => l.relatedEntities.includes(entity.id) && !l.verified)
      if (unverifiedLore.length > 3) {
        warnings.push({
          id: `warn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          type: 'missing_link',
          severity: 'low',
          entityIds: [entity.id],
          description: `${entity.name} has ${unverifiedLore.length} unverified lore entries`,
          suggestedFix: 'Verify lore entries for consistency'
        })
      }
    }
  }

  return {
    ...state,
    consistencyWarnings: warnings,
    lastConsistencyCheck: Date.now()
  }
}

export function resolveWarning(
  state: KnowledgeGraphState,
  warningId: string
): KnowledgeGraphState {
  return {
    ...state,
    consistencyWarnings: state.consistencyWarnings.filter(w => w.id !== warningId)
  }
}

export function getCharacterNetwork(
  state: KnowledgeGraphState,
  characterId: string,
  depth: number = 1
): { nodes: Entity[], edges: Relationship[] } {
  const nodes: Entity[] = []
  const edges: Relationship[] = []
  const visited = new Set<string>()

  function traverse(id: string, currentDepth: number) {
    if (currentDepth > depth || visited.has(id)) return
    visited.add(id)

    const entity = state.entities[id]
    if (entity && entity.type === 'character' && !nodes.find(n => n.id === id)) {
      nodes.push(entity)
    }

    const connectedRels = Object.values(state.relationships).filter(
      r => r.fromId === id || r.toId === id
    )
    for (const rel of connectedRels) {
      if (!edges.find(e => e.id === rel.id)) edges.push(rel)
      const neighborId = rel.fromId === id ? rel.toId : rel.fromId
      traverse(neighborId, currentDepth + 1)
    }
  }

  traverse(characterId, 0)
  return { nodes, edges }
}

export function getEntitiesByType(state: KnowledgeGraphState, type: EntityType): Entity[] {
  return Object.values(state.entities).filter(e => e.type === type)
}

export function getLoreByCategory(state: KnowledgeGraphState, category: string): LoreEntry[] {
  return Object.values(state.loreEntries).filter(l => l.category === category)
}

export function getRelationshipBetween(
  state: KnowledgeGraphState,
  id1: string,
  id2: string
): Relationship | null {
  return Object.values(state.relationships).find(
    r => (r.fromId === id1 && r.toId === id2) || (r.fromId === id2 && r.toId === id1)
  ) || null
}

export function getWarningSummary(state: KnowledgeGraphState): { total: number, high: number, medium: number, low: number } {
  return {
    total: state.consistencyWarnings.length,
    high: state.consistencyWarnings.filter(w => w.severity === 'high').length,
    medium: state.consistencyWarnings.filter(w => w.severity === 'medium').length,
    low: state.consistencyWarnings.filter(w => w.severity === 'low').length
  }
}

export function searchEntities(state: KnowledgeGraphState, query: string): Entity[] {
  const q = query.toLowerCase()
  return Object.values(state.entities).filter(e =>
    e.name.toLowerCase().includes(q) ||
    e.aliases.some(a => a.toLowerCase().includes(q)) ||
    e.description.toLowerCase().includes(q)
  )
}

export function getKnowledgeGraphSummary(state: KnowledgeGraphState): {
  totalEntities: number,
  totalRelationships: number,
  totalLore: number,
  entityBreakdown: Record<EntityType, number>,
  warningSummary: { total: number, high: number, medium: number, low: number }
} {
  const entities = Object.values(state.entities)
  const breakdown: Record<EntityType, number> = {
    character: 0, location: 0, faction: 0, item: 0, event: 0, concept: 0
  }
  for (const e of entities) {
    breakdown[e.type]++
  }

  return {
    totalEntities: entities.length,
    totalRelationships: Object.keys(state.relationships).length,
    totalLore: Object.keys(state.loreEntries).length,
    entityBreakdown: breakdown,
    warningSummary: getWarningSummary(state)
  }
}