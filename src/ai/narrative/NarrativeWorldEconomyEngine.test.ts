/**
 * V1351 NarrativeWorldEconomyEngine Tests — Direction J Iter 23/30 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeWorldEconomyEngineState,
  addWorldEconomyEntry,
  addWorldEconomySector,
  getWorldEconomyEntriesBySystem,
  getWorldEconomyReport,
  resetNarrativeWorldEconomyEngineState,
  type NarrativeWorldEconomyEngineState,
} from './NarrativeWorldEconomyEngine';

describe('NarrativeWorldEconomyEngine', () => {
  let state: NarrativeWorldEconomyEngineState;

  beforeEach(() => { state = createNarrativeWorldEconomyEngineState(); });

  describe('createNarrativeWorldEconomyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.sectors.size).toBe(0);
    });
  });

  describe('addWorldEconomyEntry', () => {
    it('should add entry', () => {
      const next = addWorldEconomyEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });
  });

  describe('addWorldEconomySector', () => {
    it('should add sector', () => {
      let next = addWorldEconomyEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldEconomySector(next, 's1', ['e1']);
      expect(next.totalSectors).toBe(1);
    });
  });

  describe('getWorldEconomyEntriesBySystem', () => {
    it('should filter by system', () => {
      let next = addWorldEconomyEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldEconomyEntry(next, 'e2', 'barter', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      const transcendent = getWorldEconomyEntriesBySystem(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getWorldEconomyReport', () => {
    it('should return comprehensive report', () => {
      const report = getWorldEconomyReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.worldEconomyMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getWorldEconomyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeWorldEconomyEngineState', () => {
    it('should reset all state', () => {
      let next = addWorldEconomyEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeWorldEconomyEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});