/**
 * V1371 NarrativeCharacterMotivationEngine Tests — Direction K Iter 3/30 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCharacterMotivationEngineState,
  addCharacterMotivationEntry,
  addCharacterMotivationProfile,
  getCharacterMotivationEntriesBySource,
  getCharacterMotivationReport,
  resetNarrativeCharacterMotivationEngineState,
  type NarrativeCharacterMotivationEngineState,
} from './NarrativeCharacterMotivationEngine';

describe('NarrativeCharacterMotivationEngine', () => {
  let state: NarrativeCharacterMotivationEngineState;

  beforeEach(() => { state = createNarrativeCharacterMotivationEngineState(); });

  describe('createNarrativeCharacterMotivationEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.profiles.size).toBe(0);
    });
  });

  describe('addCharacterMotivationEntry', () => {
    it('should add entry', () => {
      const next = addCharacterMotivationEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });
  });

  describe('addCharacterMotivationProfile', () => {
    it('should add profile', () => {
      let next = addCharacterMotivationEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addCharacterMotivationProfile(next, 'p1', ['e1']);
      expect(next.totalProfiles).toBe(1);
    });
  });

  describe('getCharacterMotivationEntriesBySource', () => {
    it('should filter by source', () => {
      let next = addCharacterMotivationEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addCharacterMotivationEntry(next, 'e2', 'survival', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      const transcendent = getCharacterMotivationEntriesBySource(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getCharacterMotivationReport', () => {
    it('should return comprehensive report', () => {
      const report = getCharacterMotivationReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.characterMotivationMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getCharacterMotivationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeCharacterMotivationEngineState', () => {
    it('should reset all state', () => {
      let next = addCharacterMotivationEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeCharacterMotivationEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});