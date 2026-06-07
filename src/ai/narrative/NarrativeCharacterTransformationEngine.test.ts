/**
 * V1377 NarrativeCharacterTransformationEngine Tests — Direction K Iter 6/30 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCharacterTransformationEngineState,
  addCharacterTransformationEntry,
  addCharacterTransformationArc,
  getCharacterTransformationEntriesByType,
  getCharacterTransformationReport,
  resetNarrativeCharacterTransformationEngineState,
  type NarrativeCharacterTransformationEngineState,
} from './NarrativeCharacterTransformationEngine';

describe('NarrativeCharacterTransformationEngine', () => {
  let state: NarrativeCharacterTransformationEngineState;

  beforeEach(() => { state = createNarrativeCharacterTransformationEngineState(); });

  describe('createNarrativeCharacterTransformationEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.entries.size).toBe(0);
      expect(state.arcs.size).toBe(0);
    });
  });

  describe('addCharacterTransformationEntry', () => {
    it('should add entry', () => {
      const next = addCharacterTransformationEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      expect(next.entries.size).toBe(1);
      expect(next.totalEntries).toBe(1);
    });
  });

  describe('addCharacterTransformationArc', () => {
    it('should add arc', () => {
      let next = addCharacterTransformationEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addCharacterTransformationArc(next, 'a1', ['e1']);
      expect(next.totalArcs).toBe(1);
    });
  });

  describe('getCharacterTransformationEntriesByType', () => {
    it('should filter by type', () => {
      let next = addCharacterTransformationEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addCharacterTransformationEntry(next, 'e2', 'physical', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      const transcendent = getCharacterTransformationEntriesByType(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getCharacterTransformationReport', () => {
    it('should return comprehensive report', () => {
      const report = getCharacterTransformationReport(state);
      expect(report.totalEntries).toBe(0);
      expect(typeof report.characterTransformationMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getCharacterTransformationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeCharacterTransformationEngineState', () => {
    it('should reset all state', () => {
      let next = addCharacterTransformationEntry(state, 'e1', 'transcendent', 'transcendent', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeCharacterTransformationEngineState();
      expect(next.entries.size).toBe(0);
      expect(next.totalEntries).toBe(0);
    });
  });
});