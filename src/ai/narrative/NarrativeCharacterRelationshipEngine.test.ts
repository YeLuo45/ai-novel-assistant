/**
 * V1379 NarrativeCharacterRelationshipEngine Tests — Direction K Iter 7/30 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCharacterRelationshipEngineState,
  addCharacterRelationshipEntry,
  addCharacterRelationshipNetwork,
  getCharacterRelationshipEntriesByType,
  getCharacterRelationshipReport,
  resetNarrativeCharacterRelationshipEngineState,
  type NarrativeCharacterRelationshipEngineState,
} from './NarrativeCharacterRelationshipEngine';

describe('NarrativeCharacterRelationshipEngine', () => {
  let state: NarrativeCharacterRelationshipEngineState;

  beforeEach(() => { state = createNarrativeCharacterRelationshipEngineState(); });

  describe('createNarrativeCharacterRelationshipEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.networks.size).toBe(0);
    });
  });

  describe('addCharacterRelationshipEntry', () => {
    it('should add entry', () => {
      const next = addCharacterRelationshipEntry(state, 'e1', 'transcendent', 'absolute', 'transcendent', 'desc', 0.95, 0.9, 1);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });
  });

  describe('addCharacterRelationshipNetwork', () => {
    it('should add network', () => {
      let next = addCharacterRelationshipEntry(state, 'e1', 'transcendent', 'absolute', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addCharacterRelationshipNetwork(next, 'n1', ['e1']);
      expect(next.totalNetworks).toBe(1);
    });
  });

  describe('getCharacterRelationshipEntriesByType', () => {
    it('should filter by type', () => {
      let next = addCharacterRelationshipEntry(state, 'e1', 'transcendent', 'absolute', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addCharacterRelationshipEntry(next, 'e2', 'alliance', 'absolute', 'transcendent', 'desc', 0.95, 0.9, 1);
      const transcendent = getCharacterRelationshipEntriesByType(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getCharacterRelationshipReport', () => {
    it('should return comprehensive report', () => {
      const report = getCharacterRelationshipReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.characterRelationshipMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getCharacterRelationshipReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeCharacterRelationshipEngineState', () => {
    it('should reset all state', () => {
      let next = addCharacterRelationshipEntry(state, 'e1', 'transcendent', 'absolute', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeCharacterRelationshipEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});