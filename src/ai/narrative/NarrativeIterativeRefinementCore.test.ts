/**
 * V975 NarrativeIterativeRefinementCore Tests — Direction A Iter 5/15 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeIterativeRefinementCoreState,
  addRefinementIteration,
  addRefinementPlan,
  getIterationsByPass,
  getRefinementCoreReport,
  resetNarrativeIterativeRefinementCoreState,
  type NarrativeIterativeRefinementCoreState,
} from './NarrativeIterativeRefinementCore';

describe('NarrativeIterativeRefinementCore', () => {
  let state: NarrativeIterativeRefinementCoreState;

  beforeEach(() => { state = createNarrativeIterativeRefinementCoreState(); });

  describe('createNarrativeIterativeRefinementCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.iterations.size).toBe(0);
      expect(state.plans.size).toBe(0);
    });
  });

  describe('addRefinementIteration', () => {
    it('should add iteration', () => {
      const next = addRefinementIteration(state, 'i1', 'first', 'prose', 'moderate', 0.5, 0.7, 'desc', 1);
      expect(next.iterations.size).toBe(1);
      expect(next.totalGain).toBeCloseTo(0.2, 5);
    });
  });

  describe('addRefinementPlan', () => {
    it('should add plan', () => {
      let next = addRefinementIteration(state, 'i1', 'first', 'prose', 'moderate', 0.5, 0.7, 'desc', 1);
      next = addRefinementPlan(next, 'p1', 'main plan', ['i1']);
      expect(next.totalPlans).toBe(1);
    });
  });

  describe('getIterationsByPass', () => {
    it('should filter by pass', () => {
      let next = addRefinementIteration(state, 'i1', 'first', 'prose', 'moderate', 0.5, 0.7, 'desc', 1);
      next = addRefinementIteration(next, 'i2', 'second', 'prose', 'moderate', 0.5, 0.7, 'desc', 1);
      const first = getIterationsByPass(next, 'first');
      expect(first.length).toBe(1);
    });
  });

  describe('getRefinementCoreReport', () => {
    it('should return comprehensive report', () => {
      const report = getRefinementCoreReport(state);
      expect(report.totalIterations).toBe(0);
      expect(typeof report.refinementMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getRefinementCoreReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeIterativeRefinementCoreState', () => {
    it('should reset all state', () => {
      let next = addRefinementIteration(state, 'i1', 'first', 'prose', 'moderate', 0.5, 0.7, 'desc', 1);
      next = resetNarrativeIterativeRefinementCoreState();
      expect(next.iterations.size).toBe(0);
      expect(next.totalIterations).toBe(0);
    });
  });
});