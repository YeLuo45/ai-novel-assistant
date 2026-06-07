/**
 * V1325 NarrativeWorldGeologyEngine Tests — Direction J Iter 10/30 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeWorldGeologyEngineState,
  addWorldGeologyEntry,
  addWorldGeologyStratum,
  getWorldGeologyEntriesByRock,
  getWorldGeologyReport,
  resetNarrativeWorldGeologyEngineState,
  type NarrativeWorldGeologyEngineState,
} from './NarrativeWorldGeologyEngine';

describe('NarrativeWorldGeologyEngine', () => {
  let state: NarrativeWorldGeologyEngineState;

  beforeEach(() => { state = createNarrativeWorldGeologyEngineState(); });

  describe('createNarrativeWorldGeologyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.strata.size).toBe(0);
    });
  });

  describe('addWorldGeologyEntry', () => {
    it('should add entry', () => {
      const next = addWorldGeologyEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });
  });

  describe('addWorldGeologyStratum', () => {
    it('should add stratum', () => {
      let next = addWorldGeologyEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldGeologyStratum(next, 's1', ['e1']);
      expect(next.totalStrata).toBe(1);
    });
  });

  describe('getWorldGeologyEntriesByRock', () => {
    it('should filter by rock', () => {
      let next = addWorldGeologyEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldGeologyEntry(next, 'e2', 'igneous', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      const transcendent = getWorldGeologyEntriesByRock(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getWorldGeologyReport', () => {
    it('should return comprehensive report', () => {
      const report = getWorldGeologyReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.worldGeologyMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getWorldGeologyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeWorldGeologyEngineState', () => {
    it('should reset all state', () => {
      let next = addWorldGeologyEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeWorldGeologyEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});