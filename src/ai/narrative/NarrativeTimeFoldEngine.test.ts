/**
 * V1187 NarrativeTimeFoldEngine Tests — Direction G Iter 1/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeTimeFoldEngineState,
  addTimeFold,
  addTimeFoldPattern,
  getTimeFoldsByType,
  getTimeFoldReport,
  resetNarrativeTimeFoldEngineState,
  type NarrativeTimeFoldEngineState,
} from './NarrativeTimeFoldEngine';

describe('NarrativeTimeFoldEngine', () => {
  let state: NarrativeTimeFoldEngineState;

  beforeEach(() => { state = createNarrativeTimeFoldEngineState(); });

  describe('createNarrativeTimeFoldEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.folds.size).toBe(0);
      expect(state.patterns.size).toBe(0);
    });
  });

  describe('addTimeFold', () => {
    it('should add fold', () => {
      const next = addTimeFold(state, 'f1', 'parallel', 'seamless', 'complex', 'desc', 0.9, 0.85, 1);
      expect(next.folds.size).toBe(1);
      expect(next.totalFolds).toBe(1);
    });
  });

  describe('addTimeFoldPattern', () => {
    it('should add pattern', () => {
      let next = addTimeFold(state, 'f1', 'parallel', 'seamless', 'complex', 'desc', 0.9, 0.85, 1);
      next = addTimeFoldPattern(next, 'p1', ['f1']);
      expect(next.totalPatterns).toBe(1);
    });
  });

  describe('getTimeFoldsByType', () => {
    it('should filter by type', () => {
      let next = addTimeFold(state, 'f1', 'parallel', 'seamless', 'complex', 'desc', 0.9, 0.85, 1);
      next = addTimeFold(next, 'f2', 'forward', 'seamless', 'complex', 'desc', 0.9, 0.85, 1);
      const parallel = getTimeFoldsByType(next, 'parallel');
      expect(parallel.length).toBe(1);
    });
  });

  describe('getTimeFoldReport', () => {
    it('should return comprehensive report', () => {
      const report = getTimeFoldReport(state);
      expect(report.totalFolds).toBe(0);
      expect(typeof report.timeFoldMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getTimeFoldReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeTimeFoldEngineState', () => {
    it('should reset all state', () => {
      let next = addTimeFold(state, 'f1', 'parallel', 'seamless', 'complex', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeTimeFoldEngineState();
      expect(next.folds.size).toBe(0);
      expect(next.totalFolds).toBe(0);
    });
  });
});