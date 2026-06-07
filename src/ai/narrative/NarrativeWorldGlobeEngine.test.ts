/**
 * V1311 NarrativeWorldGlobeEngine Tests — Direction J Iter 3/30 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeWorldGlobeEngineState,
  addWorldGlobeEntry,
  addWorldGlobeLayer,
  getWorldGlobeEntriesByProjection,
  getWorldGlobeReport,
  resetNarrativeWorldGlobeEngineState,
  type NarrativeWorldGlobeEngineState,
} from './NarrativeWorldGlobeEngine';

describe('NarrativeWorldGlobeEngine', () => {
  let state: NarrativeWorldGlobeEngineState;

  beforeEach(() => { state = createNarrativeWorldGlobeEngineState(); });

  describe('createNarrativeWorldGlobeEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.layers.size).toBe(0);
    });
  });

  describe('addWorldGlobeEntry', () => {
    it('should add entry', () => {
      const next = addWorldGlobeEntry(state, 'e1', 'transcendent', 'time_dilating', 'transcendent', 'desc', 0.95, 0.9, 1);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });
  });

  describe('addWorldGlobeLayer', () => {
    it('should add layer', () => {
      let next = addWorldGlobeEntry(state, 'e1', 'transcendent', 'time_dilating', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldGlobeLayer(next, 'l1', ['e1']);
      expect(next.totalLayers).toBe(1);
    });
  });

  describe('getWorldGlobeEntriesByProjection', () => {
    it('should filter by projection', () => {
      let next = addWorldGlobeEntry(state, 'e1', 'transcendent', 'time_dilating', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldGlobeEntry(next, 'e2', 'mercator', 'time_dilating', 'transcendent', 'desc', 0.95, 0.9, 1);
      const transcendent = getWorldGlobeEntriesByProjection(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getWorldGlobeReport', () => {
    it('should return comprehensive report', () => {
      const report = getWorldGlobeReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.worldGlobeMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getWorldGlobeReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeWorldGlobeEngineState', () => {
    it('should reset all state', () => {
      let next = addWorldGlobeEntry(state, 'e1', 'transcendent', 'time_dilating', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeWorldGlobeEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});