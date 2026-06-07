/**
 * V1373 NarrativeCharacterFlawEngine Tests — Direction K Iter 4/30 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCharacterFlawEngineState,
  addCharacterFlawEntry,
  addCharacterFlawSet,
  getCharacterFlawEntriesByType,
  getCharacterFlawReport,
  resetNarrativeCharacterFlawEngineState,
  type NarrativeCharacterFlawEngineState,
} from './NarrativeCharacterFlawEngine';

describe('NarrativeCharacterFlawEngine', () => {
  let state: NarrativeCharacterFlawEngineState;

  beforeEach(() => { state = createNarrativeCharacterFlawEngineState(); });

  describe('createNarrativeCharacterFlawEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.sets.size).toBe(0);
    });
  });

  describe('addCharacterFlawEntry', () => {
    it('should add entry', () => {
      const next = addCharacterFlawEntry(state, 'e1', 'pride', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });
  });

  describe('addCharacterFlawSet', () => {
    it('should add set', () => {
      let next = addCharacterFlawEntry(state, 'e1', 'pride', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addCharacterFlawSet(next, 's1', ['e1']);
      expect(next.totalSets).toBe(1);
    });
  });

  describe('getCharacterFlawEntriesByType', () => {
    it('should filter by type', () => {
      let next = addCharacterFlawEntry(state, 'e1', 'pride', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addCharacterFlawEntry(next, 'e2', 'envy', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      const pride = getCharacterFlawEntriesByType(next, 'pride');
      expect(pride.length).toBe(1);
    });
  });

  describe('getCharacterFlawReport', () => {
    it('should return comprehensive report', () => {
      const report = getCharacterFlawReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.characterFlawMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getCharacterFlawReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeCharacterFlawEngineState', () => {
    it('should reset all state', () => {
      let next = addCharacterFlawEntry(state, 'e1', 'pride', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeCharacterFlawEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});