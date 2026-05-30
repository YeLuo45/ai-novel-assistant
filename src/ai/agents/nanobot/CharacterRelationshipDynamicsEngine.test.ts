/**
 * CharacterRelationshipDynamicsEngine Tests — V522
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  registerCharacter,
  initializeRelationship,
  recordRelationshipEvent,
  evolveRelationships,
  calculateRelationshipStrength,
  predictRelationshipTrajectory,
  getRelationshipSummary,
  getRelationshipById,
  getAllRelationships,
  getRelationshipEvents,
  getConflictedRelationships
} from './CharacterRelationshipDynamicsEngine'

describe('CharacterRelationshipDynamicsEngine', () => {
  describe('createEmptyState', () => {
    it('should initialize empty state', () => {
      const state = createEmptyState()
      expect(state.relationships).toEqual({})
      expect(state.events).toEqual([])
      expect(state.characterProfiles).toEqual({})
    })
  })

  describe('registerCharacter', () => {
    it('should register character', () => {
      let state = createEmptyState()
      state = registerCharacter(state, 'alice', 'Alice', 'protagonist')
      expect(state.characterProfiles.alice).toEqual({ name: 'Alice', archetype: 'protagonist' })
    })
  })

  describe('initializeRelationship', () => {
    it('should initialize relationship', () => {
      let state = createEmptyState()
      state = initializeRelationship(state, 'alice', 'bob', 'alliance')
      const rel = getRelationshipById(state, 'alice', 'bob')
      expect(rel).not.toBeNull()
      expect(rel?.relationshipType).toBe('alliance')
      expect(rel?.trustLevel).toBe(0)
    })

    it('should be bidirectional (same key regardless of order)', () => {
      let state = createEmptyState()
      state = initializeRelationship(state, 'alice', 'bob', 'rivalry')
      const rel1 = getRelationshipById(state, 'alice', 'bob')
      const rel2 = getRelationshipById(state, 'bob', 'alice')
      expect(rel1).toEqual(rel2)
    })

    it('should not duplicate existing relationship', () => {
      let state = createEmptyState()
      state = initializeRelationship(state, 'alice', 'bob', 'alliance')
      state = initializeRelationship(state, 'alice', 'bob', 'rivalry')  // try to change type
      const rel = getRelationshipById(state, 'alice', 'bob')
      expect(rel?.relationshipType).toBe('alliance')
    })
  })

  describe('recordRelationshipEvent', () => {
    it('should record trust change', () => {
      let state = createEmptyState()
      state = initializeRelationship(state, 'alice', 'bob', 'alliance')
      state = recordRelationshipEvent(state, 'alice', 'bob', 'trust_change', 20, 'Bob saved Alice')
      expect(state.events).toHaveLength(1)
      expect(state.events[0].eventType).toBe('trust_change')
      const rel = getRelationshipById(state, 'alice', 'bob')
      expect(rel?.trustLevel).toBe(20)
    })

    it('should record conflict event', () => {
      let state = createEmptyState()
      state = initializeRelationship(state, 'alice', 'bob', 'alliance')
      state = recordRelationshipEvent(state, 'alice', 'bob', 'conflict_event', 30, 'Verbal fight')
      const rel = getRelationshipById(state, 'alice', 'bob')
      expect(rel?.conflictLevel).toBe(30)
      expect(rel?.trustLevel).toBeLessThan(0)
    })

    it('should record betrayal', () => {
      let state = createEmptyState()
      state = initializeRelationship(state, 'alice', 'bob', 'alliance')
      state = recordRelationshipEvent(state, 'alice', 'bob', 'betrayal', 50, 'Bob revealed secrets')
      const rel = getRelationshipById(state, 'alice', 'bob')
      expect(rel?.status).toBe('conflictual')
      expect(rel?.trustLevel).toBe(-50)
    })

    it('should record reconciliation', () => {
      let state = createEmptyState()
      state = initializeRelationship(state, 'alice', 'bob', 'adversarial')
      state = Object.assign(state, {
        relationships: {
          ...state.relationships,
          alice_bob: { ...state.relationships.alice_bob, conflictLevel: 60, trustLevel: -30 }
        }
      })
      state = recordRelationshipEvent(state, 'alice', 'bob', 'reconciliation', 40, 'Peace talks')
      const rel = getRelationshipById(state, 'alice', 'bob')
      expect(rel?.trustLevel).toBeGreaterThan(-30)
    })

    it('should update shared history', () => {
      let state = createEmptyState()
      state = initializeRelationship(state, 'alice', 'bob', 'alliance')
      state = recordRelationshipEvent(state, 'alice', 'bob', 'shared_experience', 20, 'Battle together')
      const rel = getRelationshipById(state, 'alice', 'bob')
      expect(rel?.sharedHistory).toContain('Battle together')
    })
  })

  describe('evolveRelationships', () => {
    it('should decrease conflict over time', () => {
      let state = createEmptyState()
      state = initializeRelationship(state, 'alice', 'bob', 'alliance')
      state = Object.assign(state, {
        relationships: {
          ...state.relationships,
          alice_bob: { ...state.relationships.alice_bob, conflictLevel: 40, trustLevel: 20 }
        }
      })
      state = evolveRelationships(state)
      const rel = getRelationshipById(state, 'alice', 'bob')
      expect(rel?.conflictLevel).toBeLessThan(40)
    })

    it('should increase positive trust over time', () => {
      let state = createEmptyState()
      state = initializeRelationship(state, 'alice', 'bob', 'alliance')
      state = Object.assign(state, {
        relationships: {
          ...state.relationships,
          alice_bob: { ...state.relationships.alice_bob, trustLevel: 20, conflictLevel: 0 }
        }
      })
      state = evolveRelationships(state)
      const rel = getRelationshipById(state, 'alice', 'bob')
      expect(rel?.trustLevel).toBeGreaterThan(20)
    })

    it('should mark dissolving when alliance trust too low', () => {
      let state = createEmptyState()
      state = initializeRelationship(state, 'alice', 'bob', 'alliance')
      state = Object.assign(state, {
        relationships: {
          ...state.relationships,
          alice_bob: { ...state.relationships.alice_bob, trustLevel: 20, conflictLevel: 5 }
        }
      })
      state = evolveRelationships(state)
      const rel = getRelationshipById(state, 'alice', 'bob')
      expect(rel?.status).toBe('dissolving')
    })
  })

  describe('calculateRelationshipStrength', () => {
    it('should calculate strength from trust, conflict, bond', () => {
      let state = createEmptyState()
      state = initializeRelationship(state, 'alice', 'bob', 'alliance')
      state = Object.assign(state, {
        relationships: {
          ...state.relationships,
          alice_bob: {
            ...state.relationships.alice_bob,
            trustLevel: 50,
            conflictLevel: 10,
            emotionalBond: 20,
            sharedHistory: ['Battle']
          }
        }
      })
      const strength = calculateRelationshipStrength(state, 'alice', 'bob')
      expect(strength).toBeGreaterThan(50)
    })

    it('should return 0 for non-existent relationship', () => {
      const state = createEmptyState()
      const strength = calculateRelationshipStrength(state, 'alice', 'bob')
      expect(strength).toBe(0)
    })
  })

  describe('predictRelationshipTrajectory', () => {
    it('should predict future relationship state', () => {
      let state = createEmptyState()
      state = initializeRelationship(state, 'alice', 'bob', 'alliance')
      state = Object.assign(state, {
        relationships: {
          ...state.relationships,
          alice_bob: { ...state.relationships.alice_bob, trustLevel: 50, conflictLevel: 20 }
        }
      })
      const trajectory = predictRelationshipTrajectory(state, 'alice', 'bob', 5)
      expect(trajectory).toHaveLength(5)
      expect(trajectory[0].step).toBe(1)
      expect(trajectory[4].step).toBe(5)
    })

    it('should return empty for non-existent relationship', () => {
      const state = createEmptyState()
      const trajectory = predictRelationshipTrajectory(state, 'alice', 'bob', 3)
      expect(trajectory).toHaveLength(0)
    })
  })

  describe('getRelationshipSummary', () => {
    it('should compute summary for character', () => {
      let state = createEmptyState()
      state = registerCharacter(state, 'alice', 'Alice', 'protagonist')
      state = registerCharacter(state, 'bob', 'Bob', 'mentor')
      state = initializeRelationship(state, 'alice', 'bob', 'alliance')
      state = Object.assign(state, {
        relationships: {
          ...state.relationships,
          alice_bob: { ...state.relationships.alice_bob, trustLevel: 50, conflictLevel: 5 }
        }
      })
      const summary = getRelationshipSummary(state, 'alice')
      expect(summary.totalRelationships).toBe(1)
      expect(summary.closestAllies).toContain('bob')
      expect(summary.averageTrust).toBe(50)
    })
  })

  describe('getAllRelationships', () => {
    it('should return all relationships', () => {
      let state = createEmptyState()
      state = initializeRelationship(state, 'alice', 'bob', 'alliance')
      state = initializeRelationship(state, 'alice', 'carol', 'rivalry')
      const all = getAllRelationships(state)
      expect(all).toHaveLength(2)
    })
  })

  describe('getRelationshipEvents', () => {
    it('should return events for relationship', () => {
      let state = createEmptyState()
      state = initializeRelationship(state, 'alice', 'bob', 'alliance')
      state = recordRelationshipEvent(state, 'alice', 'bob', 'trust_change', 20, 'Event 1')
      state = recordRelationshipEvent(state, 'alice', 'bob', 'conflict_event', 10, 'Event 2')
      const events = getRelationshipEvents(state, 'alice', 'bob')
      expect(events).toHaveLength(2)
    })
  })

  describe('getConflictedRelationships', () => {
    it('should return only conflictual relationships', () => {
      let state = createEmptyState()
      state = initializeRelationship(state, 'alice', 'bob', 'alliance')
      state = initializeRelationship(state, 'alice', 'carol', 'rivalry')
      state = Object.assign(state, {
        relationships: {
          ...state.relationships,
          alice_bob: { ...state.relationships.alice_bob, status: 'conflictual', conflictLevel: 70 },
          alice_carol: { ...state.relationships.alice_carol, status: 'stable', conflictLevel: 10 }
        }
      })
      const conflicted = getConflictedRelationships(state)
      expect(conflicted).toHaveLength(1)
      expect(conflicted[0].status).toBe('conflictual')
    })
  })
})