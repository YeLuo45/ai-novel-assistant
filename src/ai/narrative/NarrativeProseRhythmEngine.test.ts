/**
 * V1147 NarrativeProseRhythmEngine Tests — Direction F Iter 1/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeProseRhythmEngineState,
  addProseRhythm,
  addProseRhythmPattern,
  getProseRhythmsByType,
  getProseRhythmReport,
  resetNarrativeProseRhythmEngineState,
  type NarrativeProseRhythmEngineState,
} from './NarrativeProseRhythmEngine';

describe('NarrativeProseRhythmEngine', () => {
  let state: NarrativeProseRhythmEngineState;

  beforeEach(() => { state = createNarrativeProseRhythmEngineState(); });

  describe('createNarrativeProseRhythmEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.rhythms.size).toBe(0);
      expect(state.patterns.size).toBe(0);
    });
  });

  describe('addProseRhythm', () => {
    it('should add rhythm', () => {
      const next = addProseRhythm(state, 'r1', 'flowing', 'moderate', 'varied', 'desc', 0.85, 0.9, 1);
      expect(next.rhythms.size).toBe(1);
      expect(next.totalRhythms).toBe(1);
    });
  });

  describe('addProseRhythmPattern', () => {
    it('should add pattern', () => {
      let next = addProseRhythm(state, 'r1', 'flowing', 'moderate', 'varied', 'desc', 0.85, 0.9, 1);
      next = addProseRhythmPattern(next, 'p1', ['r1']);
      expect(next.totalPatterns).toBe(1);
    });
  });

  describe('getProseRhythmsByType', () => {
    it('should filter by type', () => {
      let next = addProseRhythm(state, 'r1', 'flowing', 'moderate', 'varied', 'desc', 0.85, 0.9, 1);
      next = addProseRhythm(next, 'r2', 'staccato', 'moderate', 'varied', 'desc', 0.85, 0.9, 1);
      const flowing = getProseRhythmsByType(next, 'flowing');
      expect(flowing.length).toBe(1);
    });
  });

  describe('getProseRhythmReport', () => {
    it('should return comprehensive report', () => {
      const report = getProseRhythmReport(state);
      expect(report.totalRhythms).toBe(0);
      expect(typeof report.proseRhythmMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getProseRhythmReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeProseRhythmEngineState', () => {
    it('should reset all state', () => {
      let next = addProseRhythm(state, 'r1', 'flowing', 'moderate', 'varied', 'desc', 0.85, 0.9, 1);
      next = resetNarrativeProseRhythmEngineState();
      expect(next.rhythms.size).toBe(0);
      expect(next.totalRhythms).toBe(0);
    });
  });
});