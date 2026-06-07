/**
 * V1343 NarrativeWorldEcologyEngine Tests — Direction J Iter 19/30 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeWorldEcologyEngineState,
  addWorldEcologyEntry,
  addWorldEcologyCycle,
  getWorldEcologyEntriesByNiche,
  getWorldEcologyReport,
  resetNarrativeWorldEcologyEngineState,
  type NarrativeWorldEcologyEngineState,
} from './NarrativeWorldEcologyEngine';

describe('NarrativeWorldEcologyEngine', () => {
  let state: NarrativeWorldEcologyEngineState;

  beforeEach(() => { state = createNarrativeWorldEcologyEngineState(); });

  describe('createNarrativeWorldEcologyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.cycles.size).toBe(0);
    });
  });

  describe('addWorldEcologyEntry', () => {
    it('should add entry', () => {
      const next = addWorldEcologyEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });
  });

  describe('addWorldEcologyCycle', () => {
    it('should add cycle', () => {
      let next = addWorldEcologyEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldEcologyCycle(next, 'c1', ['e1']);
      expect(next.totalCycles).toBe(1);
    });
  });

  describe('getWorldEcologyEntriesByNiche', () => {
    it('should filter by niche', () => {
      let next = addWorldEcologyEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldEcologyEntry(next, 'e2', 'producer', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      const transcendent = getWorldEcologyEntriesByNiche(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getWorldEcologyReport', () => {
    it('should return comprehensive report', () => {
      const report = getWorldEcologyReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.worldEcologyMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getWorldEcologyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeWorldEcologyEngineState', () => {
    it('should reset all state', () => {
      let next = addWorldEcologyEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeWorldEcologyEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});