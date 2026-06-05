/**
 * V801 TensionBalanceEngine Tests — Direction D Iter 5/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTensionBalanceEngineState,
  addTensionPoint,
  updateTensionEffectiveness,
  recordBalanceSnapshot,
  getPointsBySource,
  getTensionBalanceReport,
  resetTensionBalanceEngineState,
  type TensionBalanceEngineState,
} from './TensionBalanceEngine';

describe('TensionBalanceEngine', () => {
  let state: TensionBalanceEngineState;

  beforeEach(() => { state = createTensionBalanceEngineState(); });

  describe('createTensionBalanceEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.points.size).toBe(0);
      expect(state.currentStatus).toBe('moderate');
    });
  });

  describe('addTensionPoint', () => {
    it('should add tension point', () => {
      const next = addTensionPoint(state, 'p1', 'plot', 0.7, 5, 2);
      expect(next.points.size).toBe(1);
      expect(next.totalPoints).toBe(1);
    });

    it('should clamp intensity', () => {
      const next = addTensionPoint(state, 'p1', 'plot', 1.5, 5);
      expect(next.points.get('p1')?.intensity).toBe(1);
    });
  });

  describe('updateTensionEffectiveness', () => {
    it('should update effectiveness', () => {
      let next = addTensionPoint(state, 'p1', 'plot', 0.7, 5);
      next = updateTensionEffectiveness(next, 'p1', 0.9);
      expect(next.points.get('p1')?.effectiveness).toBe(0.9);
    });
  });

  describe('recordBalanceSnapshot', () => {
    it('should record snapshot', () => {
      let next = addTensionPoint(state, 'p1', 'plot', 0.7, 5);
      next = recordBalanceSnapshot(next, 'r1', 5);
      expect(next.totalRecords).toBe(1);
    });

    it('should determine status', () => {
      let next = addTensionPoint(state, 'p1', 'plot', 0.7, 5);
      next = recordBalanceSnapshot(next, 'r1', 5);
      expect(['optimal', 'moderate']).toContain(next.currentStatus);
    });
  });

  describe('getPointsBySource', () => {
    it('should filter by source', () => {
      let next = addTensionPoint(state, 'p1', 'plot', 0.7, 5);
      next = addTensionPoint(next, 'p2', 'character', 0.5, 5);
      const plot = getPointsBySource(next, 'plot');
      expect(plot.length).toBe(1);
    });
  });

  describe('getTensionBalanceReport', () => {
    it('should return comprehensive report', () => {
      const report = getTensionBalanceReport(state);
      expect(report.totalPoints).toBe(0);
      expect(typeof report.balanceScore).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getTensionBalanceReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetTensionBalanceEngineState', () => {
    it('should reset all state', () => {
      let next = addTensionPoint(state, 'p1', 'plot', 0.7, 5);
      next = resetTensionBalanceEngineState();
      expect(next.points.size).toBe(0);
      expect(next.totalPoints).toBe(0);
    });
  });
});