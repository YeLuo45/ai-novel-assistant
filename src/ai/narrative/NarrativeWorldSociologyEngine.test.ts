/**
 * V1347 NarrativeWorldSociologyEngine Tests — Direction J Iter 21/30 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeWorldSociologyEngineState,
  addWorldSociologyEntry,
  addWorldSociologyLayer,
  getWorldSociologyEntriesByStructure,
  getWorldSociologyReport,
  resetNarrativeWorldSociologyEngineState,
  type NarrativeWorldSociologyEngineState,
} from './NarrativeWorldSociologyEngine';

describe('NarrativeWorldSociologyEngine', () => {
  let state: NarrativeWorldSociologyEngineState;

  beforeEach(() => { state = createNarrativeWorldSociologyEngineState(); });

  describe('createNarrativeWorldSociologyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.layers.size).toBe(0);
    });
  });

  describe('addWorldSociologyEntry', () => {
    it('should add entry', () => {
      const next = addWorldSociologyEntry(state, 'e1', 'transcendent', 'transcendent', 'absolute', 'desc', 0.95, 0.9, 1);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });
  });

  describe('addWorldSociologyLayer', () => {
    it('should add layer', () => {
      let next = addWorldSociologyEntry(state, 'e1', 'transcendent', 'transcendent', 'absolute', 'desc', 0.95, 0.9, 1);
      next = addWorldSociologyLayer(next, 'l1', ['e1']);
      expect(next.totalLayers).toBe(1);
    });
  });

  describe('getWorldSociologyEntriesByStructure', () => {
    it('should filter by structure', () => {
      let next = addWorldSociologyEntry(state, 'e1', 'transcendent', 'transcendent', 'absolute', 'desc', 0.95, 0.9, 1);
      next = addWorldSociologyEntry(next, 'e2', 'tribal', 'transcendent', 'absolute', 'desc', 0.95, 0.9, 1);
      const transcendent = getWorldSociologyEntriesByStructure(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getWorldSociologyReport', () => {
    it('should return comprehensive report', () => {
      const report = getWorldSociologyReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.worldSociologyMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getWorldSociologyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeWorldSociologyEngineState', () => {
    it('should reset all state', () => {
      let next = addWorldSociologyEntry(state, 'e1', 'transcendent', 'transcendent', 'absolute', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeWorldSociologyEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});