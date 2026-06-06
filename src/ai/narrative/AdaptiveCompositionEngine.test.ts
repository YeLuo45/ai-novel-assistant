/**
 * V923 AdaptiveCompositionEngine Tests — Direction D Iter 9/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAdaptiveCompositionEngineState,
  addCompositionSegment,
  addCompositionShift,
  getSegmentsByMode,
  getCompositionReport,
  resetAdaptiveCompositionEngineState,
  type AdaptiveCompositionEngineState,
} from './AdaptiveCompositionEngine';

describe('AdaptiveCompositionEngine', () => {
  let state: AdaptiveCompositionEngineState;

  beforeEach(() => { state = createAdaptiveCompositionEngineState(); });

  describe('createAdaptiveCompositionEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.segments.size).toBe(0);
      expect(state.shifts.size).toBe(0);
    });
  });

  describe('addCompositionSegment', () => {
    it('should add segment', () => {
      const next = addCompositionSegment(state, 's1', 'narrative', 'polished', 1000, 0.7, 1);
      expect(next.segments.size).toBe(1);
      expect(next.totalSegments).toBe(1);
    });
  });

  describe('addCompositionShift', () => {
    it('should add shift', () => {
      let next = addCompositionSegment(state, 's1', 'narrative', 'polished', 1000, 0.7, 1);
      next = addCompositionShift(next, 'sh1', 's1', 'narrative', 'descriptive', 'pacing_need', 2);
      expect(next.totalShifts).toBe(1);
    });
  });

  describe('getSegmentsByMode', () => {
    it('should filter by mode', () => {
      let next = addCompositionSegment(state, 's1', 'narrative', 'polished', 1000, 0.7, 1);
      next = addCompositionSegment(next, 's2', 'descriptive', 'polished', 1000, 0.7, 1);
      const narrative = getSegmentsByMode(next, 'narrative');
      expect(narrative.length).toBe(1);
    });
  });

  describe('getCompositionReport', () => {
    it('should return comprehensive report', () => {
      const report = getCompositionReport(state);
      expect(report.totalSegments).toBe(0);
      expect(typeof report.compositionMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getCompositionReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetAdaptiveCompositionEngineState', () => {
    it('should reset all state', () => {
      let next = addCompositionSegment(state, 's1', 'narrative', 'polished', 1000, 0.7, 1);
      next = resetAdaptiveCompositionEngineState();
      expect(next.segments.size).toBe(0);
      expect(next.totalSegments).toBe(0);
    });
  });
});