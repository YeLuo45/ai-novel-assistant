/**
 * V1345 NarrativeWorldAnthropologyEngine Tests — Direction J Iter 20/30 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeWorldAnthropologyEngineState,
  addWorldAnthropologyEntry,
  addWorldAnthropologyGroup,
  getWorldAnthropologyEntriesByCulture,
  getWorldAnthropologyReport,
  resetNarrativeWorldAnthropologyEngineState,
  type NarrativeWorldAnthropologyEngineState,
} from './NarrativeWorldAnthropologyEngine';

describe('NarrativeWorldAnthropologyEngine', () => {
  let state: NarrativeWorldAnthropologyEngineState;

  beforeEach(() => { state = createNarrativeWorldAnthropologyEngineState(); });

  describe('createNarrativeWorldAnthropologyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.groups.size).toBe(0);
    });
  });

  describe('addWorldAnthropologyEntry', () => {
    it('should add entry', () => {
      const next = addWorldAnthropologyEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });
  });

  describe('addWorldAnthropologyGroup', () => {
    it('should add group', () => {
      let next = addWorldAnthropologyEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldAnthropologyGroup(next, 'g1', ['e1']);
      expect(next.totalGroups).toBe(1);
    });
  });

  describe('getWorldAnthropologyEntriesByCulture', () => {
    it('should filter by culture', () => {
      let next = addWorldAnthropologyEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addWorldAnthropologyEntry(next, 'e2', 'tribal', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      const transcendent = getWorldAnthropologyEntriesByCulture(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getWorldAnthropologyReport', () => {
    it('should return comprehensive report', () => {
      const report = getWorldAnthropologyReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.worldAnthropologyMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getWorldAnthropologyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeWorldAnthropologyEngineState', () => {
    it('should reset all state', () => {
      let next = addWorldAnthropologyEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeWorldAnthropologyEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});