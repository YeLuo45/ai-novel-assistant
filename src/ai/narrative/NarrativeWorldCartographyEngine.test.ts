/**
 * V1321 NarrativeWorldCartographyEngine Tests — Direction J Iter 8/30 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeWorldCartographyEngineState,
  addWorldCartographyEntry,
  addWorldCartographyCollection,
  getWorldCartographyEntriesByStyle,
  getWorldCartographyReport,
  resetNarrativeWorldCartographyEngineState,
  type NarrativeWorldCartographyEngineState,
} from './NarrativeWorldCartographyEngine';

describe('NarrativeWorldCartographyEngine', () => {
  let state: NarrativeWorldCartographyEngineState;

  beforeEach(() => { state = createNarrativeWorldCartographyEngineState(); });

  describe('createNarrativeWorldCartographyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.collections.size).toBe(0);
    });
  });

  describe('addWorldCartographyEntry', () => {
    it('should add entry', () => {
      const next = addWorldCartographyEntry(state, 'e1', 'transcendent', 'infinite', 'transcendent', 'desc', 0.95, 0.9, 1);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });
  });

  describe('addWorldCartographyCollection', () => {
    it('should add collection', () => {
      let next = addWorldCartographyEntry(state, 'e1', 'transcendent', 'infinite', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldCartographyCollection(next, 'c1', ['e1']);
      expect(next.totalCollections).toBe(1);
    });
  });

  describe('getWorldCartographyEntriesByStyle', () => {
    it('should filter by style', () => {
      let next = addWorldCartographyEntry(state, 'e1', 'transcendent', 'infinite', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldCartographyEntry(next, 'e2', 'flat', 'infinite', 'transcendent', 'desc', 0.95, 0.9, 1);
      const transcendent = getWorldCartographyEntriesByStyle(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getWorldCartographyReport', () => {
    it('should return comprehensive report', () => {
      const report = getWorldCartographyReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.worldCartographyMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getWorldCartographyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeWorldCartographyEngineState', () => {
    it('should reset all state', () => {
      let next = addWorldCartographyEntry(state, 'e1', 'transcendent', 'infinite', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeWorldCartographyEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});