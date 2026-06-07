/**
 * V1309 NarrativeWorldMapEngine Tests — Direction J Iter 2/30 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeWorldMapEngineState,
  addWorldMapEntry,
  addWorldMapLayer,
  getWorldMapEntriesByType,
  getWorldMapReport,
  resetNarrativeWorldMapEngineState,
  type NarrativeWorldMapEngineState,
} from './NarrativeWorldMapEngine';

describe('NarrativeWorldMapEngine', () => {
  let state: NarrativeWorldMapEngineState;

  beforeEach(() => { state = createNarrativeWorldMapEngineState(); });

  describe('createNarrativeWorldMapEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.layers.size).toBe(0);
    });
  });

  describe('addWorldMapEntry', () => {
    it('should add entry', () => {
      const next = addWorldMapEntry(state, 'e1', 'transcendent', 'cosmic', 'perfect', 'desc', 0.95, 0.9, 1);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });
  });

  describe('addWorldMapLayer', () => {
    it('should add layer', () => {
      let next = addWorldMapEntry(state, 'e1', 'transcendent', 'cosmic', 'perfect', 'desc', 0.95, 0.9, 1);
      next = addWorldMapLayer(next, 'l1', ['e1']);
      expect(next.totalLayers).toBe(1);
    });
  });

  describe('getWorldMapEntriesByType', () => {
    it('should filter by type', () => {
      let next = addWorldMapEntry(state, 'e1', 'transcendent', 'cosmic', 'perfect', 'desc', 0.95, 0.9, 1);
      next = addWorldMapEntry(next, 'e2', 'political', 'cosmic', 'perfect', 'desc', 0.95, 0.9, 1);
      const transcendent = getWorldMapEntriesByType(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getWorldMapReport', () => {
    it('should return comprehensive report', () => {
      const report = getWorldMapReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.worldMapMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getWorldMapReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeWorldMapEngineState', () => {
    it('should reset all state', () => {
      let next = addWorldMapEntry(state, 'e1', 'transcendent', 'cosmic', 'perfect', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeWorldMapEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});