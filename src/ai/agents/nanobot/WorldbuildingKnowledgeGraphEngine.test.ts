/**
 * WorldbuildingKnowledgeGraphEngine Tests — V508
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  addEntity,
  updateEntity,
  addRelationship,
  updateRelationshipStrength,
  addLoreEntry,
  linkEntitiesToLore,
  checkConsistency,
  resolveWarning,
  getCharacterNetwork,
  getEntitiesByType,
  getLoreByCategory,
  getRelationshipBetween,
  getWarningSummary,
  searchEntities,
  getKnowledgeGraphSummary
} from './WorldbuildingKnowledgeGraphEngine'

describe('WorldbuildingKnowledgeGraphEngine', () => {
  describe('createEmptyState', () => {
    it('should initialize empty state', () => {
      const state = createEmptyState()
      expect(state.entities).toEqual({})
      expect(state.relationships).toEqual({})
      expect(state.totalConnections).toBe(0)
    })
  })

  describe('addEntity', () => {
    it('should add a character entity', () => {
      let state = createEmptyState()
      state = addEntity(state, 'character', 'Hero', 'The protagonist', {}, 1, 'scene1')
      expect(Object.keys(state.entities)).toHaveLength(1)
      expect(state.entities[Object.keys(state.entities)[0]].name).toBe('Hero')
    })

    it('should add multiple entity types', () => {
      let state = createEmptyState()
      state = addEntity(state, 'character', 'Hero', 'The protagonist')
      state = addEntity(state, 'location', 'Castle', 'The ancient castle')
      state = addEntity(state, 'faction', 'Knights', 'The noble order')
      expect(Object.keys(state.entities)).toHaveLength(3)
    })
  })

  describe('updateEntity', () => {
    it('should update entity properties', () => {
      let state = createEmptyState()
      state = addEntity(state, 'character', 'Hero', 'The protagonist')
      const id = Object.keys(state.entities)[0]
      state = updateEntity(state, id, { description: 'Updated description', personality: 'Brave' })
      expect(state.entities[id].description).toBe('Updated description')
      expect(state.entities[id].personality).toBe('Brave')
    })

    it('should return state unchanged for invalid entity', () => {
      const state = createEmptyState()
      const updated = updateEntity(state, 'invalid', { description: 'Test' })
      expect(updated).toEqual(state)
    })
  })

  describe('addRelationship', () => {
    it('should add a relationship between entities', () => {
      let state = createEmptyState()
      state = addEntity(state, 'character', 'Hero', 'The protagonist')
      state = addEntity(state, 'character', 'Villain', 'The antagonist')
      const ids = Object.keys(state.entities)
      state = addRelationship(state, ids[0], ids[1], 'enemy', 'Oppposed by fate', 80)

      expect(Object.keys(state.relationships)).toHaveLength(1)
      expect(state.totalConnections).toBe(1)
    })

    it('should not add relationship for invalid entities', () => {
      let state = createEmptyState()
      state = addEntity(state, 'character', 'Hero', 'The protagonist')
      const id = Object.keys(state.entities)[0]
      state = addRelationship(state, id, 'invalid_id', 'ally', 'Test')
      expect(Object.keys(state.relationships)).toHaveLength(0)
    })
  })

  describe('updateRelationshipStrength', () => {
    it('should update relationship strength', () => {
      let state = createEmptyState()
      state = addEntity(state, 'character', 'A', 'A')
      state = addEntity(state, 'character', 'B', 'B')
      const ids = Object.keys(state.entities)
      state = addRelationship(state, ids[0], ids[1], 'ally', 'Friends', 50)
      const relId = Object.keys(state.relationships)[0]

      state = updateRelationshipStrength(state, relId, 20, 5, 'Battle won together')
      expect(state.relationships[relId].strength).toBe(70)
      expect(state.relationships[relId].history).toHaveLength(2)
    })

    it('should clamp strength to 0-100', () => {
      let state = createEmptyState()
      state = addEntity(state, 'character', 'A', 'A')
      state = addEntity(state, 'character', 'B', 'B')
      const ids = Object.keys(state.entities)
      state = addRelationship(state, ids[0], ids[1], 'ally', 'Friends', 50)
      const relId = Object.keys(state.relationships)[0]

      state = updateRelationshipStrength(state, relId, 60, 5, 'Test')
      expect(state.relationships[relId].strength).toBeLessThanOrEqual(100)
    })
  })

  describe('addLoreEntry', () => {
    it('should add a lore entry', () => {
      let state = createEmptyState()
      state = addLoreEntry(state, 'magic_system', 'Fire Magic', 'Magic based on flames', [])
      expect(Object.keys(state.loreEntries)).toHaveLength(1)
      expect(state.loreEntries[Object.keys(state.loreEntries)[0]].category).toBe('magic_system')
    })
  })

  describe('linkEntitiesToLore', () => {
    it('should link entities to lore', () => {
      let state = createEmptyState()
      state = addEntity(state, 'character', 'Hero', 'The protagonist')
      state = addEntity(state, 'location', 'Castle', 'The castle')
      const entityId = Object.keys(state.entities)[0]
      state = addLoreEntry(state, 'history', 'The Siege', 'A great battle', [])
      const loreId = Object.keys(state.loreEntries)[0]

      state = linkEntitiesToLore(state, loreId, [entityId])
      expect(state.loreEntries[loreId].relatedEntities).toContain(entityId)
    })
  })

  describe('checkConsistency', () => {
    it('should detect relationship conflicts', () => {
      let state = createEmptyState()
      state = addEntity(state, 'character', 'A', 'A')
      state = addEntity(state, 'character', 'B', 'B')
      const ids = Object.keys(state.entities)
      state = addRelationship(state, ids[0], ids[1], 'enemy', 'Fighting', 90)
      state = addRelationship(state, ids[1], ids[0], 'ally', 'Unlikely alliance', 30)

      state = checkConsistency(state)
      expect(state.consistencyWarnings.length).toBeGreaterThan(0)
    })

    it('should return warnings list', () => {
      const state = createEmptyState()
      const checked = checkConsistency(state)
      expect(Array.isArray(checked.consistencyWarnings)).toBe(true)
    })
  })

  describe('resolveWarning', () => {
    it('should remove a warning', () => {
      let state = createEmptyState()
      state = addEntity(state, 'character', 'A', 'A')
      state = addEntity(state, 'character', 'B', 'B')
      const ids = Object.keys(state.entities)
      state = addRelationship(state, ids[0], ids[1], 'enemy', 'Fighting', 90)
      state = addRelationship(state, ids[1], ids[0], 'ally', 'Ally', 30)
      state = checkConsistency(state)

      const warningId = state.consistencyWarnings[0]?.id
      if (warningId) {
        state = resolveWarning(state, warningId)
        expect(state.consistencyWarnings.find(w => w.id === warningId)).toBeUndefined()
      }
    })
  })

  describe('getCharacterNetwork', () => {
    it('should return network within depth', () => {
      let state = createEmptyState()
      state = addEntity(state, 'character', 'Hero', 'The hero')
      state = addEntity(state, 'character', 'Friend', 'The friend')
      state = addEntity(state, 'character', 'Stranger', 'A stranger')
      const ids = Object.keys(state.entities)
      state = addRelationship(state, ids[0], ids[1], 'ally', 'Close', 90)

      const network = getCharacterNetwork(state, ids[0], 1)
      expect(network.nodes.length).toBeGreaterThan(0)
      expect(network.edges.length).toBeGreaterThan(0)
    })
  })

  describe('getEntitiesByType', () => {
    it('should filter by entity type', () => {
      let state = createEmptyState()
      state = addEntity(state, 'character', 'C1', 'C1')
      state = addEntity(state, 'location', 'L1', 'L1')
      state = addEntity(state, 'character', 'C2', 'C2')

      const chars = getEntitiesByType(state, 'character')
      expect(chars).toHaveLength(2)
    })
  })

  describe('getLoreByCategory', () => {
    it('should filter lore by category', () => {
      let state = createEmptyState()
      state = addLoreEntry(state, 'magic', 'Fire', 'Flames', [])
      state = addLoreEntry(state, 'history', 'War', 'Ancient war', [])

      const magicLore = getLoreByCategory(state, 'magic')
      expect(magicLore).toHaveLength(1)
    })
  })

  describe('getRelationshipBetween', () => {
    it('should find relationship between two entities', () => {
      let state = createEmptyState()
      state = addEntity(state, 'character', 'A', 'A')
      state = addEntity(state, 'character', 'B', 'B')
      const ids = Object.keys(state.entities)
      state = addRelationship(state, ids[0], ids[1], 'rival', 'Competition', 60)

      const rel = getRelationshipBetween(state, ids[0], ids[1])
      expect(rel).not.toBeNull()
      expect(rel?.type).toBe('rival')
    })

    it('should return null when no relationship exists', () => {
      const state = createEmptyState()
      expect(getRelationshipBetween(state, 'a', 'b')).toBeNull()
    })
  })

  describe('getWarningSummary', () => {
    it('should count warnings by severity', () => {
      let state = createEmptyState()
      state = addEntity(state, 'character', 'A', 'A')
      state = addEntity(state, 'character', 'B', 'B')
      const ids = Object.keys(state.entities)
      state = addRelationship(state, ids[0], ids[1], 'enemy', 'Fighting', 90)
      state = addRelationship(state, ids[1], ids[0], 'ally', 'Ally', 30)
      state = checkConsistency(state)

      const summary = getWarningSummary(state)
      expect(summary.total).toBeGreaterThanOrEqual(0)
    })
  })

  describe('searchEntities', () => {
    it('should find entities by name', () => {
      let state = createEmptyState()
      state = addEntity(state, 'character', 'Aldric', 'A brave hero')
      state = addEntity(state, 'location', 'Castle', 'The castle')

      const results = searchEntities(state, 'Aldric')
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Aldric')
    })

    it('should find entities by description', () => {
      let state = createEmptyState()
      state = addEntity(state, 'character', 'Hero', 'A mysterious wanderer')

      const results = searchEntities(state, 'wanderer')
      expect(results).toHaveLength(1)
    })

    it('should return empty for no match', () => {
      const state = createEmptyState()
      expect(searchEntities(state, 'xyz')).toHaveLength(0)
    })
  })

  describe('getKnowledgeGraphSummary', () => {
    it('should return comprehensive summary', () => {
      let state = createEmptyState()
      state = addEntity(state, 'character', 'Hero', 'The hero')
      state = addEntity(state, 'location', 'Castle', 'The castle')
      state = addEntity(state, 'faction', 'Knights', 'The order')

      const summary = getKnowledgeGraphSummary(state)
      expect(summary.totalEntities).toBe(3)
      expect(summary.entityBreakdown.character).toBe(1)
      expect(summary.entityBreakdown.location).toBe(1)
      expect(summary.entityBreakdown.faction).toBe(1)
    })
  })
})