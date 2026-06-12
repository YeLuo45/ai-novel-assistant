/**
 * V1349 NarrativeWorldPoliticsEngine Tests — Direction J Iter 22/30 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeWorldPoliticsEngineState,
  addWorldPoliticsEntry,
  addWorldPoliticsSphere,
  getWorldPoliticsEntriesByRegime,
  getWorldPoliticsReport,
  resetNarrativeWorldPoliticsEngineState,
  type NarrativeWorldPoliticsEngineState,
} from './NarrativeWorldPoliticsEngine';

describe('NarrativeWorldPoliticsEngine', () => {
  let state: NarrativeWorldPoliticsEngineState;

  beforeEach(() => { state = createNarrativeWorldPoliticsEngineState(); });

  describe('createNarrativeWorldPoliticsEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.spheres.size).toBe(0);
    });
  });

  describe('addWorldPoliticsEntry', () => {
    it('should add entry', () => {
      const next = addWorldPoliticsEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });
  });

  describe('addWorldPoliticsSphere', () => {
    it('should add sphere', () => {
      let next = addWorldPoliticsEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldPoliticsSphere(next, 's1', ['e1']);
      expect(next.totalSpheres).toBe(1);
    });
  });

  describe('getWorldPoliticsEntriesByRegime', () => {
    it('should filter by regime', () => {
      let next = addWorldPoliticsEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldPoliticsEntry(next, 'e2', 'anarchy', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      const transcendent = getWorldPoliticsEntriesByRegime(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getWorldPoliticsReport', () => {
    it('should return comprehensive report', () => {
      const report = getWorldPoliticsReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.worldPoliticsMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getWorldPoliticsReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeWorldPoliticsEngineState', () => {
    it('should reset all state', () => {
      let next = addWorldPoliticsEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeWorldPoliticsEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});