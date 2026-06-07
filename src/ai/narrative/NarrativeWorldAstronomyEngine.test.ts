/**
 * V1333 NarrativeWorldAstronomyEngine Tests — Direction J Iter 14/30 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeWorldAstronomyEngineState,
  addWorldAstronomyEntry,
  addWorldAstronomySystem,
  getWorldAstronomyEntriesByBody,
  getWorldAstronomyReport,
  resetNarrativeWorldAstronomyEngineState,
  type NarrativeWorldAstronomyEngineState,
} from './NarrativeWorldAstronomyEngine';

describe('NarrativeWorldAstronomyEngine', () => {
  let state: NarrativeWorldAstronomyEngineState;

  beforeEach(() => { state = createNarrativeWorldAstronomyEngineState(); });

  describe('createNarrativeWorldAstronomyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.systems.size).toBe(0);
    });
  });

  describe('addWorldAstronomyEntry', () => {
    it('should add entry', () => {
      const next = addWorldAstronomyEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });
  });

  describe('addWorldAstronomySystem', () => {
    it('should add system', () => {
      let next = addWorldAstronomyEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldAstronomySystem(next, 's1', ['e1']);
      expect(next.totalSystems).toBe(1);
    });
  });

  describe('getWorldAstronomyEntriesByBody', () => {
    it('should filter by body', () => {
      let next = addWorldAstronomyEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldAstronomyEntry(next, 'e2', 'star', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      const transcendent = getWorldAstronomyEntriesByBody(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getWorldAstronomyReport', () => {
    it('should return comprehensive report', () => {
      const report = getWorldAstronomyReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.worldAstronomyMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getWorldAstronomyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeWorldAstronomyEngineState', () => {
    it('should reset all state', () => {
      let next = addWorldAstronomyEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeWorldAstronomyEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});