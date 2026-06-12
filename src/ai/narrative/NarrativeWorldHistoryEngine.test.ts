/**
 * V1353 NarrativeWorldHistoryEngine Tests — Direction J Iter 24/30 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeWorldHistoryEngineState,
  addWorldHistoryEntry,
  addWorldHistoryLayer,
  getWorldHistoryEntriesByEra,
  getWorldHistoryReport,
  resetNarrativeWorldHistoryEngineState,
  type NarrativeWorldHistoryEngineState,
} from './NarrativeWorldHistoryEngine';

describe('NarrativeWorldHistoryEngine', () => {
  let state: NarrativeWorldHistoryEngineState;

  beforeEach(() => { state = createNarrativeWorldHistoryEngineState(); });

  describe('createNarrativeWorldHistoryEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.layers.size).toBe(0);
    });
  });

  describe('addWorldHistoryEntry', () => {
    it('should add entry', () => {
      const next = addWorldHistoryEntry(state, 'e1', 'transcendent', 'transcendent', 'absolute', 'desc', 0.95, 0.9, 1);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });
  });

  describe('addWorldHistoryLayer', () => {
    it('should add layer', () => {
      let next = addWorldHistoryEntry(state, 'e1', 'transcendent', 'transcendent', 'absolute', 'desc', 0.95, 0.9, 1);
      next = addWorldHistoryLayer(next, 'l1', ['e1']);
      expect(next.totalLayers).toBe(1);
    });
  });

  describe('getWorldHistoryEntriesByEra', () => {
    it('should filter by era', () => {
      let next = addWorldHistoryEntry(state, 'e1', 'transcendent', 'transcendent', 'absolute', 'desc', 0.95, 0.9, 1);
      next = addWorldHistoryEntry(next, 'e2', 'ancient', 'transcendent', 'absolute', 'desc', 0.95, 0.9, 1);
      const transcendent = getWorldHistoryEntriesByEra(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getWorldHistoryReport', () => {
    it('should return comprehensive report', () => {
      const report = getWorldHistoryReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.worldHistoryMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getWorldHistoryReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeWorldHistoryEngineState', () => {
    it('should reset all state', () => {
      let next = addWorldHistoryEntry(state, 'e1', 'transcendent', 'transcendent', 'absolute', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeWorldHistoryEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});