/**
 * V1329 NarrativeWorldAtmosphereEngine Tests — Direction J Iter 12/30 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeWorldAtmosphereEngineState,
  addWorldAtmosphereEntry,
  addWorldAtmosphereStratum,
  getWorldAtmosphereEntriesByLayer,
  getWorldAtmosphereReport,
  resetNarrativeWorldAtmosphereEngineState,
  type NarrativeWorldAtmosphereEngineState,
} from './NarrativeWorldAtmosphereEngine';

describe('NarrativeWorldAtmosphereEngine', () => {
  let state: NarrativeWorldAtmosphereEngineState;

  beforeEach(() => { state = createNarrativeWorldAtmosphereEngineState(); });

  describe('createNarrativeWorldAtmosphereEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.strata.size).toBe(0);
    });
  });

  describe('addWorldAtmosphereEntry', () => {
    it('should add entry', () => {
      const next = addWorldAtmosphereEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });
  });

  describe('addWorldAtmosphereStratum', () => {
    it('should add stratum', () => {
      let next = addWorldAtmosphereEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldAtmosphereStratum(next, 's1', ['e1']);
      expect(next.totalStrata).toBe(1);
    });
  });

  describe('getWorldAtmosphereEntriesByLayer', () => {
    it('should filter by layer', () => {
      let next = addWorldAtmosphereEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldAtmosphereEntry(next, 'e2', 'troposphere', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      const transcendent = getWorldAtmosphereEntriesByLayer(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getWorldAtmosphereReport', () => {
    it('should return comprehensive report', () => {
      const report = getWorldAtmosphereReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.worldAtmosphereMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getWorldAtmosphereReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeWorldAtmosphereEngineState', () => {
    it('should reset all state', () => {
      let next = addWorldAtmosphereEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeWorldAtmosphereEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});