/**
 * V1315 NarrativeWorldClimateEngine Tests — Direction J Iter 5/30 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeWorldClimateEngineState,
  addWorldClimateEntry,
  addWorldClimateRegion,
  getWorldClimateEntriesByType,
  getWorldClimateReport,
  resetNarrativeWorldClimateEngineState,
  type NarrativeWorldClimateEngineState,
} from './NarrativeWorldClimateEngine';

describe('NarrativeWorldClimateEngine', () => {
  let state: NarrativeWorldClimateEngineState;

  beforeEach(() => { state = createNarrativeWorldClimateEngineState(); });

  describe('createNarrativeWorldClimateEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.regions.size).toBe(0);
    });
  });

  describe('addWorldClimateEntry', () => {
    it('should add entry', () => {
      const next = addWorldClimateEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });
  });

  describe('addWorldClimateRegion', () => {
    it('should add region', () => {
      let next = addWorldClimateEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldClimateRegion(next, 'r1', ['e1']);
      expect(next.totalRegions).toBe(1);
    });
  });

  describe('getWorldClimateEntriesByType', () => {
    it('should filter by type', () => {
      let next = addWorldClimateEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldClimateEntry(next, 'e2', 'tropical', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      const transcendent = getWorldClimateEntriesByType(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getWorldClimateReport', () => {
    it('should return comprehensive report', () => {
      const report = getWorldClimateReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.worldClimateMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getWorldClimateReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeWorldClimateEngineState', () => {
    it('should reset all state', () => {
      let next = addWorldClimateEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeWorldClimateEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});