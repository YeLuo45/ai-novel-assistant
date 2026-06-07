/**
 * V1319 NarrativeWorldGeographyEngine Tests — Direction J Iter 7/30 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeWorldGeographyEngineState,
  addWorldGeographyEntry,
  addWorldGeographyRegion,
  getWorldGeographyEntriesByFeature,
  getWorldGeographyReport,
  resetNarrativeWorldGeographyEngineState,
  type NarrativeWorldGeographyEngineState,
} from './NarrativeWorldGeographyEngine';

describe('NarrativeWorldGeographyEngine', () => {
  let state: NarrativeWorldGeographyEngineState;

  beforeEach(() => { state = createNarrativeWorldGeographyEngineState(); });

  describe('createNarrativeWorldGeographyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.regions.size).toBe(0);
    });
  });

  describe('addWorldGeographyEntry', () => {
    it('should add entry', () => {
      const next = addWorldGeographyEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });
  });

  describe('addWorldGeographyRegion', () => {
    it('should add region', () => {
      let next = addWorldGeographyEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldGeographyRegion(next, 'r1', ['e1']);
      expect(next.totalRegions).toBe(1);
    });
  });

  describe('getWorldGeographyEntriesByFeature', () => {
    it('should filter by feature', () => {
      let next = addWorldGeographyEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldGeographyEntry(next, 'e2', 'mountain', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      const transcendent = getWorldGeographyEntriesByFeature(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getWorldGeographyReport', () => {
    it('should return comprehensive report', () => {
      const report = getWorldGeographyReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.worldGeographyMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getWorldGeographyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeWorldGeographyEngineState', () => {
    it('should reset all state', () => {
      let next = addWorldGeographyEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeWorldGeographyEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});