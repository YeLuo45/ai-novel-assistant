/**
 * V1369 NarrativeCharacterAgencyEngine Tests — Direction K Iter 2/30 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCharacterAgencyEngineState,
  addCharacterAgencyEntry,
  addCharacterAgencyGroup,
  getCharacterAgencyEntriesByLevel,
  getCharacterAgencyReport,
  resetNarrativeCharacterAgencyEngineState,
  type NarrativeCharacterAgencyEngineState,
} from './NarrativeCharacterAgencyEngine';

describe('NarrativeCharacterAgencyEngine', () => {
  let state: NarrativeCharacterAgencyEngineState;

  beforeEach(() => { state = createNarrativeCharacterAgencyEngineState(); });

  describe('createNarrativeCharacterAgencyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.groups.size).toBe(0);
    });
  });

  describe('addCharacterAgencyEntry', () => {
    it('should add entry', () => {
      const next = addCharacterAgencyEntry(state, 'e1', 'absolute', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });
  });

  describe('addCharacterAgencyGroup', () => {
    it('should add group', () => {
      let next = addCharacterAgencyEntry(state, 'e1', 'absolute', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addCharacterAgencyGroup(next, 'g1', ['e1']);
      expect(next.totalGroups).toBe(1);
    });
  });

  describe('getCharacterAgencyEntriesByLevel', () => {
    it('should filter by level', () => {
      let next = addCharacterAgencyEntry(state, 'e1', 'absolute', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addCharacterAgencyEntry(next, 'e2', 'passive', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      const absolute = getCharacterAgencyEntriesByLevel(next, 'absolute');
      expect(absolute.length).toBe(1);
    });
  });

  describe('getCharacterAgencyReport', () => {
    it('should return comprehensive report', () => {
      const report = getCharacterAgencyReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.characterAgencyMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getCharacterAgencyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeCharacterAgencyEngineState', () => {
    it('should reset all state', () => {
      let next = addCharacterAgencyEntry(state, 'e1', 'absolute', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeCharacterAgencyEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});