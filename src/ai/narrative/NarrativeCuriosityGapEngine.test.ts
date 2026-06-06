/**
 * V1111 NarrativeCuriosityGapEngine Tests — Direction E Iter 3/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCuriosityGapEngineState,
  addCuriosityGap,
  addCuriosityArc,
  getCuriosityGapsByType,
  getCuriosityGapReport,
  resetNarrativeCuriosityGapEngineState,
  type NarrativeCuriosityGapEngineState,
} from './NarrativeCuriosityGapEngine';

describe('NarrativeCuriosityGapEngine', () => {
  let state: NarrativeCuriosityGapEngineState;

  beforeEach(() => { state = createNarrativeCuriosityGapEngineState(); });

  describe('createNarrativeCuriosityGapEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.gaps.size).toBe(0);
      expect(state.arcs.size).toBe(0);
    });
  });

  describe('addCuriosityGap', () => {
    it('should add gap', () => {
      const next = addCuriosityGap(state, 'g1', 'mystery', 'large', 'high', 'desc', 0.85, 0.3, 1);
      expect(next.gaps.size).toBe(1);
      expect(next.totalGaps).toBe(1);
    });
  });

  describe('addCuriosityArc', () => {
    it('should add arc', () => {
      let next = addCuriosityGap(state, 'g1', 'mystery', 'large', 'high', 'desc', 0.85, 0.3, 1);
      next = addCuriosityArc(next, 'a1', ['g1']);
      expect(next.totalArcs).toBe(1);
    });
  });

  describe('getCuriosityGapsByType', () => {
    it('should filter by type', () => {
      let next = addCuriosityGap(state, 'g1', 'mystery', 'large', 'high', 'desc', 0.85, 0.3, 1);
      next = addCuriosityGap(next, 'g2', 'factual', 'large', 'high', 'desc', 0.85, 0.3, 1);
      const mystery = getCuriosityGapsByType(next, 'mystery');
      expect(mystery.length).toBe(1);
    });
  });

  describe('getCuriosityGapReport', () => {
    it('should return comprehensive report', () => {
      const report = getCuriosityGapReport(state);
      expect(report.totalGaps).toBe(0);
      expect(typeof report.curiosityMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getCuriosityGapReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeCuriosityGapEngineState', () => {
    it('should reset all state', () => {
      let next = addCuriosityGap(state, 'g1', 'mystery', 'large', 'high', 'desc', 0.85, 0.3, 1);
      next = resetNarrativeCuriosityGapEngineState();
      expect(next.gaps.size).toBe(0);
      expect(next.totalGaps).toBe(0);
    });
  });
});