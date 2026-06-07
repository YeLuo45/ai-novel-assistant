/**
 * V1335 NarrativeWorldCosmologyEngine Tests — Direction J Iter 15/30 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeWorldCosmologyEngineState,
  addWorldCosmologyEntry,
  addWorldCosmologyModel,
  getWorldCosmologyEntriesByOrigin,
  getWorldCosmologyReport,
  resetNarrativeWorldCosmologyEngineState,
  type NarrativeWorldCosmologyEngineState,
} from './NarrativeWorldCosmologyEngine';

describe('NarrativeWorldCosmologyEngine', () => {
  let state: NarrativeWorldCosmologyEngineState;

  beforeEach(() => { state = createNarrativeWorldCosmologyEngineState(); });

  describe('createNarrativeWorldCosmologyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.models.size).toBe(0);
    });
  });

  describe('addWorldCosmologyEntry', () => {
    it('should add entry', () => {
      const next = addWorldCosmologyEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });
  });

  describe('addWorldCosmologyModel', () => {
    it('should add model', () => {
      let next = addWorldCosmologyEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldCosmologyModel(next, 'm1', ['e1']);
      expect(next.totalModels).toBe(1);
    });
  });

  describe('getWorldCosmologyEntriesByOrigin', () => {
    it('should filter by origin', () => {
      let next = addWorldCosmologyEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldCosmologyEntry(next, 'e2', 'creation', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      const transcendent = getWorldCosmologyEntriesByOrigin(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getWorldCosmologyReport', () => {
    it('should return comprehensive report', () => {
      const report = getWorldCosmologyReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.worldCosmologyMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getWorldCosmologyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeWorldCosmologyEngineState', () => {
    it('should reset all state', () => {
      let next = addWorldCosmologyEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeWorldCosmologyEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});