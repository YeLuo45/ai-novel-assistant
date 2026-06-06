/**
 * V1205 NarrativeTimeTideEngine Tests — Direction G Iter 10/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeTimeTideEngineState,
  addTimeTide,
  addTimeTideWash,
  getTimeTidesByType,
  getTimeTideReport,
  resetNarrativeTimeTideEngineState,
  type NarrativeTimeTideEngineState,
} from './NarrativeTimeTideEngine';

describe('NarrativeTimeTideEngine', () => {
  let state: NarrativeTimeTideEngineState;

  beforeEach(() => { state = createNarrativeTimeTideEngineState(); });

  describe('createNarrativeTimeTideEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.tides.size).toBe(0);
      expect(state.washes.size).toBe(0);
    });
  });

  describe('addTimeTide', () => {
    it('should add tide', () => {
      const next = addTimeTide(state, 't1', 'spring', 'mighty', 'absolute', 'desc', 0.9, 0.85, 1);
      expect(next.tides.size).toBe(1);
      expect(next.totalTides).toBe(1);
    });
  });

  describe('addTimeTideWash', () => {
    it('should add wash', () => {
      let next = addTimeTide(state, 't1', 'spring', 'mighty', 'absolute', 'desc', 0.9, 0.85, 1);
      next = addTimeTideWash(next, 'w1', ['t1']);
      expect(next.totalWashes).toBe(1);
    });
  });

  describe('getTimeTidesByType', () => {
    it('should filter by type', () => {
      let next = addTimeTide(state, 't1', 'spring', 'mighty', 'absolute', 'desc', 0.9, 0.85, 1);
      next = addTimeTide(next, 't2', 'neap', 'mighty', 'absolute', 'desc', 0.9, 0.85, 1);
      const spring = getTimeTidesByType(next, 'spring');
      expect(spring.length).toBe(1);
    });
  });

  describe('getTimeTideReport', () => {
    it('should return comprehensive report', () => {
      const report = getTimeTideReport(state);
      expect(report.totalTides).toBe(0);
      expect(typeof report.timeTideMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getTimeTideReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeTimeTideEngineState', () => {
    it('should reset all state', () => {
      let next = addTimeTide(state, 't1', 'spring', 'mighty', 'absolute', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeTimeTideEngineState();
      expect(next.tides.size).toBe(0);
      expect(next.totalTides).toBe(0);
    });
  });
});