/**
 * V1357 NarrativeWorldReligionEngine Tests — Direction J Iter 26/30 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeWorldReligionEngineState,
  addWorldReligionEntry,
  addWorldReligionPantheon,
  getWorldReligionEntriesByType,
  getWorldReligionReport,
  resetNarrativeWorldReligionEngineState,
  type NarrativeWorldReligionEngineState,
} from './NarrativeWorldReligionEngine';

describe('NarrativeWorldReligionEngine', () => {
  let state: NarrativeWorldReligionEngineState;

  beforeEach(() => { state = createNarrativeWorldReligionEngineState(); });

  describe('createNarrativeWorldReligionEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.pantheons.size).toBe(0);
    });
  });

  describe('addWorldReligionEntry', () => {
    it('should add entry', () => {
      const next = addWorldReligionEntry(state, 'e1', 'infinite', 'transcendent', 'absolute', 'desc', 0.95, 0.9, 1);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });
  });

  describe('addWorldReligionPantheon', () => {
    it('should add pantheon', () => {
      let next = addWorldReligionEntry(state, 'e1', 'infinite', 'transcendent', 'absolute', 'desc', 0.95, 0.9, 1);
      next = addWorldReligionPantheon(next, 'p1', ['e1']);
      expect(next.totalPantheons).toBe(1);
    });
  });

  describe('getWorldReligionEntriesByType', () => {
    it('should filter by type', () => {
      let next = addWorldReligionEntry(state, 'e1', 'infinite', 'transcendent', 'absolute', 'desc', 0.95, 0.9, 1);
      next = addWorldReligionEntry(next, 'e2', 'monotheism', 'transcendent', 'absolute', 'desc', 0.95, 0.9, 1);
      const infinite = getWorldReligionEntriesByType(next, 'infinite');
      expect(infinite.length).toBe(1);
    });
  });

  describe('getWorldReligionReport', () => {
    it('should return comprehensive report', () => {
      const report = getWorldReligionReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.worldReligionMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getWorldReligionReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeWorldReligionEngineState', () => {
    it('should reset all state', () => {
      let next = addWorldReligionEntry(state, 'e1', 'infinite', 'transcendent', 'absolute', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeWorldReligionEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});