/**
 * V1009 NarrativePacingVarianceEngine Tests — Direction B Iter 7/15 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativePacingVarianceEngineState,
  addPacingSegment,
  createPacingPattern,
  getPacingSegmentsByMode,
  getPacingVarianceReport,
  resetNarrativePacingVarianceEngineState,
  type NarrativePacingVarianceEngineState,
} from './NarrativePacingVarianceEngine';

describe('NarrativePacingVarianceEngine', () => {
  let state: NarrativePacingVarianceEngineState;

  beforeEach(() => { state = createNarrativePacingVarianceEngineState(); });

  describe('createNarrativePacingVarianceEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.segments.size).toBe(0);
      expect(state.patterns.size).toBe(0);
    });
  });

  describe('addPacingSegment', () => {
    it('should add segment', () => {
      const next = addPacingSegment(state, 's1', 'fast', 'action', 'sudden_shift', 1, 3, 0.8, 0.7);
      expect(next.segments.size).toBe(1);
      expect(next.totalSegments).toBe(1);
    });
  });

  describe('createPacingPattern', () => {
    it('should create pattern', () => {
      let next = addPacingSegment(state, 's1', 'fast', 'action', 'sudden_shift', 1, 3, 0.8, 0.7);
      next = addPacingSegment(next, 's2', 'slow', 'reflection', 'gradual_change', 4, 6, 0.4, 0.5);
      next = createPacingPattern(next, 'p1', 'tension pattern', ['s1', 's2']);
      expect(next.totalPatterns).toBe(1);
    });
  });

  describe('getPacingSegmentsByMode', () => {
    it('should filter by mode', () => {
      let next = addPacingSegment(state, 's1', 'fast', 'action', 'sudden_shift', 1, 3, 0.8, 0.7);
      next = addPacingSegment(next, 's2', 'slow', 'reflection', 'gradual_change', 4, 6, 0.4, 0.5);
      const fast = getPacingSegmentsByMode(next, 'fast');
      expect(fast.length).toBe(1);
    });
  });

  describe('getPacingVarianceReport', () => {
    it('should return comprehensive report', () => {
      const report = getPacingVarianceReport(state);
      expect(report.totalSegments).toBe(0);
      expect(typeof report.pacingVarianceMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getPacingVarianceReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativePacingVarianceEngineState', () => {
    it('should reset all state', () => {
      let next = addPacingSegment(state, 's1', 'fast', 'action', 'sudden_shift', 1, 3, 0.8, 0.7);
      next = resetNarrativePacingVarianceEngineState();
      expect(next.segments.size).toBe(0);
      expect(next.totalSegments).toBe(0);
    });
  });
});