/**
 * V909 ContinuousRefinementEngine Tests — Direction D Iter 2/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createContinuousRefinementEngineState,
  addRefinementCycle,
  addRefinementTarget,
  completeRefinementTarget,
  getCyclesByStage,
  getRefinementReport,
  resetContinuousRefinementEngineState,
  type ContinuousRefinementEngineState,
} from './ContinuousRefinementEngine';

describe('ContinuousRefinementEngine', () => {
  let state: ContinuousRefinementEngineState;

  beforeEach(() => { state = createContinuousRefinementEngineState(); });

  describe('createContinuousRefinementEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.cycles.size).toBe(0);
      expect(state.targets.size).toBe(0);
    });
  });

  describe('addRefinementCycle', () => {
    it('should add cycle', () => {
      const next = addRefinementCycle(state, 'c1', 'draft', 'clarity', 0, 60, 0.2, 'fair');
      expect(next.cycles.size).toBe(1);
      expect(next.totalCycles).toBe(1);
    });
  });

  describe('addRefinementTarget', () => {
    it('should add target', () => {
      const next = addRefinementTarget(state, 't1', 'Chapter 1', 'draft', 'excellent', 'fair');
      expect(next.totalTargets).toBe(1);
    });
  });

  describe('completeRefinementTarget', () => {
    it('should complete', () => {
      let next = addRefinementTarget(state, 't1', 'Chapter 1');
      next = completeRefinementTarget(next, 't1');
      expect(next.completedTargets).toBe(1);
      expect(next.targets.get('t1')?.currentStage).toBe('maintain');
    });
  });

  describe('getCyclesByStage', () => {
    it('should filter by stage', () => {
      let next = addRefinementCycle(state, 'c1', 'draft', 'clarity', 0, 60);
      next = addRefinementCycle(next, 'c2', 'review', 'flow', 60, 120);
      const drafts = getCyclesByStage(next, 'draft');
      expect(drafts.length).toBe(1);
    });
  });

  describe('getRefinementReport', () => {
    it('should return comprehensive report', () => {
      const report = getRefinementReport(state);
      expect(report.totalCycles).toBe(0);
      expect(typeof report.refinementMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getRefinementReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetContinuousRefinementEngineState', () => {
    it('should reset all state', () => {
      let next = addRefinementCycle(state, 'c1', 'draft', 'clarity', 0, 60);
      next = resetContinuousRefinementEngineState();
      expect(next.cycles.size).toBe(0);
      expect(next.totalCycles).toBe(0);
    });
  });
});