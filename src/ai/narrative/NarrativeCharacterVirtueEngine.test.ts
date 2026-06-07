/**
 * V1375 NarrativeCharacterVirtueEngine Tests — Direction K Iter 5/30 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCharacterVirtueEngineState,
  addCharacterVirtueEntry,
  addCharacterVirtueProfile,
  getCharacterVirtueEntriesByType,
  getCharacterVirtueReport,
  resetNarrativeCharacterVirtueEngineState,
  type NarrativeCharacterVirtueEngineState,
} from './NarrativeCharacterVirtueEngine';

describe('NarrativeCharacterVirtueEngine', () => {
  let state: NarrativeCharacterVirtueEngineState;

  beforeEach(() => { state = createNarrativeCharacterVirtueEngineState(); });

  describe('createNarrativeCharacterVirtueEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.profiles.size).toBe(0);
    });
  });

  describe('addCharacterVirtueEntry', () => {
    it('should add entry', () => {
      const next = addCharacterVirtueEntry(state, 'e1', 'transcendent', 'absolute', 'infinite', 'desc', 0.95, 0.9, 1);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });
  });

  describe('addCharacterVirtueProfile', () => {
    it('should add profile', () => {
      let next = addCharacterVirtueEntry(state, 'e1', 'transcendent', 'absolute', 'infinite', 'desc', 0.95, 0.9, 1);
      next = addCharacterVirtueProfile(next, 'p1', ['e1']);
      expect(next.totalProfiles).toBe(1);
    });
  });

  describe('getCharacterVirtueEntriesByType', () => {
    it('should filter by type', () => {
      let next = addCharacterVirtueEntry(state, 'e1', 'transcendent', 'absolute', 'infinite', 'desc', 0.95, 0.9, 1);
      next = addCharacterVirtueEntry(next, 'e2', 'courage', 'absolute', 'infinite', 'desc', 0.95, 0.9, 1);
      const transcendent = getCharacterVirtueEntriesByType(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getCharacterVirtueReport', () => {
    it('should return comprehensive report', () => {
      const report = getCharacterVirtueReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.characterVirtueMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getCharacterVirtueReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeCharacterVirtueEngineState', () => {
    it('should reset all state', () => {
      let next = addCharacterVirtueEntry(state, 'e1', 'transcendent', 'absolute', 'infinite', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeCharacterVirtueEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});