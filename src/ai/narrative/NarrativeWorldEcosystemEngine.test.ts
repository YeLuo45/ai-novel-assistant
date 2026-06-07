/**
 * V1317 NarrativeWorldEcosystemEngine Tests — Direction J Iter 6/30 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeWorldEcosystemEngineState,
  addWorldEcosystemEntry,
  addWorldEcosystemWeb,
  getWorldEcosystemEntriesByType,
  getWorldEcosystemReport,
  resetNarrativeWorldEcosystemEngineState,
  type NarrativeWorldEcosystemEngineState,
} from './NarrativeWorldEcosystemEngine';

describe('NarrativeWorldEcosystemEngine', () => {
  let state: NarrativeWorldEcosystemEngineState;

  beforeEach(() => { state = createNarrativeWorldEcosystemEngineState(); });

  describe('createNarrativeWorldEcosystemEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.webs.size).toBe(0);
    });
  });

  describe('addWorldEcosystemEntry', () => {
    it('should add entry', () => {
      const next = addWorldEcosystemEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });
  });

  describe('addWorldEcosystemWeb', () => {
    it('should add web', () => {
      let next = addWorldEcosystemEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldEcosystemWeb(next, 'w1', ['e1']);
      expect(next.totalWebs).toBe(1);
    });
  });

  describe('getWorldEcosystemEntriesByType', () => {
    it('should filter by type', () => {
      let next = addWorldEcosystemEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldEcosystemEntry(next, 'e2', 'forest', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      const transcendent = getWorldEcosystemEntriesByType(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getWorldEcosystemReport', () => {
    it('should return comprehensive report', () => {
      const report = getWorldEcosystemReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.worldEcosystemMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getWorldEcosystemReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeWorldEcosystemEngineState', () => {
    it('should reset all state', () => {
      let next = addWorldEcosystemEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeWorldEcosystemEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});