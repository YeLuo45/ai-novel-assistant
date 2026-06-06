/**
 * V1169 NarrativeToneEngine Tests — Direction F Iter 12/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeToneEngineState,
  addTone,
  addTonePattern,
  getTonesByType,
  getToneReport,
  resetNarrativeToneEngineState,
  type NarrativeToneEngineState,
} from './NarrativeToneEngine';

describe('NarrativeToneEngine', () => {
  let state: NarrativeToneEngineState;

  beforeEach(() => { state = createNarrativeToneEngineState(); });

  describe('createNarrativeToneEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.tones.size).toBe(0);
      expect(state.patterns.size).toBe(0);
    });
  });

  describe('addTone', () => {
    it('should add tone', () => {
      const next = addTone(state, 't1', 'wistful', 'consistent', 'wide', 'desc', 0.9, 0.85, 1);
      expect(next.tones.size).toBe(1);
      expect(next.totalTones).toBe(1);
    });
  });

  describe('addTonePattern', () => {
    it('should add pattern', () => {
      let next = addTone(state, 't1', 'wistful', 'consistent', 'wide', 'desc', 0.9, 0.85, 1);
      next = addTonePattern(next, 'p1', ['t1']);
      expect(next.totalPatterns).toBe(1);
    });
  });

  describe('getTonesByType', () => {
    it('should filter by type', () => {
      let next = addTone(state, 't1', 'wistful', 'consistent', 'wide', 'desc', 0.9, 0.85, 1);
      next = addTone(next, 't2', 'ironic', 'consistent', 'wide', 'desc', 0.9, 0.85, 1);
      const wistful = getTonesByType(next, 'wistful');
      expect(wistful.length).toBe(1);
    });
  });

  describe('getToneReport', () => {
    it('should return comprehensive report', () => {
      const report = getToneReport(state);
      expect(report.totalTones).toBe(0);
      expect(typeof report.toneMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getToneReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeToneEngineState', () => {
    it('should reset all state', () => {
      let next = addTone(state, 't1', 'wistful', 'consistent', 'wide', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeToneEngineState();
      expect(next.tones.size).toBe(0);
      expect(next.totalTones).toBe(0);
    });
  });
});