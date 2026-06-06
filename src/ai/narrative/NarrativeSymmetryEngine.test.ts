/**
 * V1023 NarrativeSymmetryEngine Tests — Direction B Iter 14/15 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeSymmetryEngineState,
  addSymmetry,
  addSymmetryPattern,
  getSymmetriesByType,
  getSymmetryReport,
  resetNarrativeSymmetryEngineState,
  type NarrativeSymmetryEngineState,
} from './NarrativeSymmetryEngine';

describe('NarrativeSymmetryEngine', () => {
  let state: NarrativeSymmetryEngineState;

  beforeEach(() => { state = createNarrativeSymmetryEngineState(); });

  describe('createNarrativeSymmetryEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.symmetries.size).toBe(0);
      expect(state.patterns.size).toBe(0);
    });
  });

  describe('addSymmetry', () => {
    it('should add symmetry', () => {
      const next = addSymmetry(state, 's1', 'mirror', 'strong', 'narrative', 'beginning', 'end', 'desc', 0.8, 1);
      expect(next.symmetries.size).toBe(1);
      expect(next.totalSymmetries).toBe(1);
    });
  });

  describe('addSymmetryPattern', () => {
    it('should add pattern', () => {
      let next = addSymmetry(state, 's1', 'mirror', 'strong', 'narrative', 'a', 'b', 'desc', 0.8, 1);
      next = addSymmetryPattern(next, 'p1', ['s1']);
      expect(next.totalPatterns).toBe(1);
    });
  });

  describe('getSymmetriesByType', () => {
    it('should filter by type', () => {
      let next = addSymmetry(state, 's1', 'mirror', 'strong', 'narrative', 'a', 'b', 'desc', 0.8, 1);
      next = addSymmetry(next, 's2', 'echo', 'strong', 'narrative', 'a', 'b', 'desc', 0.8, 1);
      const mirror = getSymmetriesByType(next, 'mirror');
      expect(mirror.length).toBe(1);
    });
  });

  describe('getSymmetryReport', () => {
    it('should return comprehensive report', () => {
      const report = getSymmetryReport(state);
      expect(report.totalSymmetries).toBe(0);
      expect(typeof report.symmetryMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getSymmetryReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeSymmetryEngineState', () => {
    it('should reset all state', () => {
      let next = addSymmetry(state, 's1', 'mirror', 'strong', 'narrative', 'a', 'b', 'desc', 0.8, 1);
      next = resetNarrativeSymmetryEngineState();
      expect(next.symmetries.size).toBe(0);
      expect(next.totalSymmetries).toBe(0);
    });
  });
});