/**
 * V835 RefinementLoopCore Tests — Direction A Iter 4/9 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createRefinementLoopCoreState,
  startRefinementCycle,
  advanceRefinementCycle,
  completeRefinementCycle,
  addRefinementMetric,
  getCyclesByTrend,
  getRefinementReport,
  resetRefinementLoopCoreState,
  type RefinementLoopCoreState,
} from './RefinementLoopCore';

describe('RefinementLoopCore', () => {
  let state: RefinementLoopCoreState;

  beforeEach(() => { state = createRefinementLoopCoreState(); });

  describe('createRefinementLoopCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.cycles.size).toBe(0);
      expect(state.metrics.size).toBe(0);
    });
  });

  describe('startRefinementCycle', () => {
    it('should start cycle', () => {
      const next = startRefinementCycle(state, 'c1', 0.5, 0.9);
      expect(next.cycles.size).toBe(1);
      expect(next.totalCycles).toBe(1);
    });
  });

  describe('advanceRefinementCycle', () => {
    it('should advance', () => {
      let next = startRefinementCycle(state, 'c1', 0.5, 0.9);
      next = advanceRefinementCycle(next, 'c1', 0.6);
      expect(next.cycles.get('c1')?.iteration).toBe(1);
      expect(next.cycles.get('c1')?.currentValue).toBe(0.6);
    });
  });

  describe('completeRefinementCycle', () => {
    it('should complete', () => {
      let next = startRefinementCycle(state, 'c1', 0.5, 0.9);
      next = completeRefinementCycle(next, 'c1');
      expect(next.cycles.get('c1')?.stage).toBe('commit');
      expect(next.activeCycles).toBe(0);
    });
  });

  describe('addRefinementMetric', () => {
    it('should add metric', () => {
      const next = addRefinementMetric(state, 'm1', 'c1', 'clarity', 0.5);
      expect(next.totalMetrics).toBe(1);
    });
  });

  describe('getCyclesByTrend', () => {
    it('should filter by trend', () => {
      let next = startRefinementCycle(state, 'c1', 0.5, 0.9);
      next = advanceRefinementCycle(next, 'c1', 0.4);
      const improving = getCyclesByTrend(next, 'improving');
      expect(improving.length).toBe(1);
    });
  });

  describe('getRefinementReport', () => {
    it('should return comprehensive report', () => {
      const report = getRefinementReport(state);
      expect(report.totalCycles).toBe(0);
      expect(typeof report.refinementEfficiency).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getRefinementReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetRefinementLoopCoreState', () => {
    it('should reset all state', () => {
      let next = startRefinementCycle(state, 'c1', 0.5, 0.9);
      next = resetRefinementLoopCoreState();
      expect(next.cycles.size).toBe(0);
      expect(next.totalCycles).toBe(0);
    });
  });
});