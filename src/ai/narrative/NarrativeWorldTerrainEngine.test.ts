/**
 * V1313 NarrativeWorldTerrainEngine Tests — Direction J Iter 4/30 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeWorldTerrainEngineState,
  addWorldTerrainEntry,
  addWorldTerrainZone,
  getWorldTerrainEntriesByType,
  getWorldTerrainReport,
  resetNarrativeWorldTerrainEngineState,
  type NarrativeWorldTerrainEngineState,
} from './NarrativeWorldTerrainEngine';

describe('NarrativeWorldTerrainEngine', () => {
  let state: NarrativeWorldTerrainEngineState;

  beforeEach(() => { state = createNarrativeWorldTerrainEngineState(); });

  describe('createNarrativeWorldTerrainEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.zones.size).toBe(0);
    });
  });

  describe('addWorldTerrainEntry', () => {
    it('should add entry', () => {
      const next = addWorldTerrainEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });
  });

  describe('addWorldTerrainZone', () => {
    it('should add zone', () => {
      let next = addWorldTerrainEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldTerrainZone(next, 'z1', ['e1']);
      expect(next.totalZones).toBe(1);
    });
  });

  describe('getWorldTerrainEntriesByType', () => {
    it('should filter by type', () => {
      let next = addWorldTerrainEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldTerrainEntry(next, 'e2', 'plains', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      const transcendent = getWorldTerrainEntriesByType(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getWorldTerrainReport', () => {
    it('should return comprehensive report', () => {
      const report = getWorldTerrainReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.worldTerrainMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getWorldTerrainReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeWorldTerrainEngineState', () => {
    it('should reset all state', () => {
      let next = addWorldTerrainEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeWorldTerrainEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});