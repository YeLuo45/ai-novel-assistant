/**
 * V779 CharacterDynamicsCore Tests — Direction C Iter 3/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createCharacterDynamicsCoreState,
  createRelationship,
  updateRelationshipQuality,
  recordInteraction,
  getRelationshipsByType,
  getRelationshipsForCharacter,
  getInteractionsForRelationship,
  getDynamicsCoreReport,
  resetCharacterDynamicsCoreState,
  type CharacterDynamicsCoreState,
} from './CharacterDynamicsCore';

describe('CharacterDynamicsCore', () => {
  let state: CharacterDynamicsCoreState;

  beforeEach(() => { state = createCharacterDynamicsCoreState(); });

  describe('createCharacterDynamicsCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.relationships.size).toBe(0);
      expect(state.interactions.size).toBe(0);
    });
  });

  describe('createRelationship', () => {
    it('should create relationship', () => {
      const next = createRelationship(state, 'r1', 'alice', 'bob', 'friendship', 'warm', 0.7);
      expect(next.relationships.size).toBe(1);
      expect(next.totalRelationships).toBe(1);
    });

    it('should clamp strength', () => {
      const next = createRelationship(state, 'r1', 'alice', 'bob', 'friendship', 'warm', 1.5);
      expect(next.relationships.get('r1')?.strength).toBe(1);
    });
  });

  describe('updateRelationshipQuality', () => {
    it('should update quality', () => {
      let next = createRelationship(state, 'r1', 'alice', 'bob', 'friendship');
      next = updateRelationshipQuality(next, 'r1', 'close', 0.2);
      expect(next.relationships.get('r1')?.quality).toBe('close');
      expect(next.relationships.get('r1')?.strength).toBe(0.7);
    });
  });

  describe('recordInteraction', () => {
    it('should record interaction', () => {
      let next = createRelationship(state, 'r1', 'alice', 'bob', 'friendship');
      next = recordInteraction(next, 'i1', 'r1', 'cooperation', 0.8, 'helped each other', 5);
      expect(next.totalInteractions).toBe(1);
    });

    it('should update relationship history', () => {
      let next = createRelationship(state, 'r1', 'alice', 'bob', 'friendship');
      next = recordInteraction(next, 'i1', 'r1', 'cooperation', 0.8, 'helped', 5);
      expect(next.relationships.get('r1')?.history.length).toBe(1);
    });
  });

  describe('getRelationshipsByType', () => {
    it('should filter by type', () => {
      let next = createRelationship(state, 'r1', 'alice', 'bob', 'friendship');
      next = createRelationship(next, 'r2', 'alice', 'charlie', 'rivalry');
      const friendships = getRelationshipsByType(next, 'friendship');
      expect(friendships.length).toBe(1);
    });
  });

  describe('getRelationshipsForCharacter', () => {
    it('should return character relationships', () => {
      let next = createRelationship(state, 'r1', 'alice', 'bob', 'friendship');
      next = createRelationship(next, 'r2', 'alice', 'charlie', 'rivalry');
      const aliceRels = getRelationshipsForCharacter(next, 'alice');
      expect(aliceRels.length).toBe(2);
    });
  });

  describe('getInteractionsForRelationship', () => {
    it('should return interactions', () => {
      let next = createRelationship(state, 'r1', 'alice', 'bob', 'friendship');
      next = recordInteraction(next, 'i1', 'r1', 'cooperation', 0.8, 'helped', 5);
      const interactions = getInteractionsForRelationship(next, 'r1');
      expect(interactions.length).toBe(1);
    });
  });

  describe('getDynamicsCoreReport', () => {
    it('should return comprehensive report', () => {
      const report = getDynamicsCoreReport(state);
      expect(report.totalRelationships).toBe(0);
      expect(typeof report.dynamicsComplexity).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getDynamicsCoreReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetCharacterDynamicsCoreState', () => {
    it('should reset all state', () => {
      let next = createRelationship(state, 'r1', 'alice', 'bob', 'friendship');
      next = resetCharacterDynamicsCoreState();
      expect(next.relationships.size).toBe(0);
      expect(next.totalRelationships).toBe(0);
    });
  });
});