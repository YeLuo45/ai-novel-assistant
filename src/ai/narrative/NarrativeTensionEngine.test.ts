/**
 * V763 NarrativeTensionEngine Tests — Direction B Iter 4/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeTensionEngineState,
  createTension,
  advanceTension,
  getTensionsByType,
  getTensionsByLevel,
  getTensionReport,
  resetNarrativeTensionEngineState,
  type NarrativeTensionEngineState,
} from './NarrativeTensionEngine';

describe('NarrativeTensionEngine', () => {
  let state: NarrativeTensionEngineState;

  beforeEach(() => { state = createNarrativeTensionEngineState(); });

  describe('createNarrativeTensionEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.tensions.size).toBe(0);
      expect(state.tensionHistory.length).toBe(0);
    });
  });

  describe('createTension', () => {
    it('should create tension', () => {
      const next = createTension(state, 't1', 'suspense', 'plot', 1, 5, 10, 0.8);
      expect(next.tensions.size).toBe(1);
      expect(next.totalTensions).toBe(1);
    });

    it('should track peak intensity', () => {
      const next = createTension(state, 't1', 'suspense', 'plot', 1, 5, 10, 0.95);
      expect(next.peakIntensity).toBe(0.95);
    });
  });

  describe('advanceTension', () => {
    it('should build tension', () => {
      let next = createTension(state, 't1', 'suspense', 'plot', 1, 5, 10);
      next = advanceTension(next, 't1', 3);
      expect(next.tensions.get('t1')?.intensity).toBeGreaterThan(0.1);
      expect(next.tensions.get('t1')?.status).toBe('building');
    });

    it('should peak at climax', () => {
      let next = createTension(state, 't1', 'suspense', 'plot', 1, 5, 10);
      next = advanceTension(next, 't1', 6);
      expect(next.tensions.get('t1')?.status).toBe('peaked');
    });

    it('should release after climax', () => {
      let next = createTension(state, 't1', 'suspense', 'plot', 1, 5, 10);
      next = advanceTension(next, 't1', 20);
      expect(['releasing', 'resolved']).toContain(next.tensions.get('t1')?.status);
    });

    it('should return state for unknown tension', () => {
      const next = advanceTension(state, 'unknown', 5);
      expect(next.totalTensions).toBe(0);
    });
  });

  describe('getTensionsByType', () => {
    it('should filter by type', () => {
      let next = createTension(state, 't1', 'suspense', 'plot', 1, 5, 10);
      next = createTension(next, 't2', 'mystery', 'plot', 1, 5, 10);
      const suspense = getTensionsByType(next, 'suspense');
      expect(suspense.length).toBe(1);
    });
  });

  describe('getTensionsByLevel', () => {
    it('should filter by level', () => {
      let next = createTension(state, 't1', 'suspense', 'plot', 1, 5, 10);
      next = advanceTension(next, 't1', 5);
      const climactic = getTensionsByLevel(next, 'climactic');
      expect(climactic.length).toBe(1);
    });
  });

  describe('getTensionReport', () => {
    it('should return comprehensive report', () => {
      const report = getTensionReport(state);
      expect(report.totalTensions).toBe(0);
      expect(typeof report.averageIntensity).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getTensionReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeTensionEngineState', () => {
    it('should reset all state', () => {
      let next = createTension(state, 't1', 'suspense', 'plot', 1, 5, 10);
      next = resetNarrativeTensionEngineState();
      expect(next.tensions.size).toBe(0);
      expect(next.totalTensions).toBe(0);
    });
  });
});