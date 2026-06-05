/**
 * V795 IterativeWritingEngine Tests — Direction D Iter 2/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createIterativeWritingEngineState,
  startIteration,
  addIterationFeedback,
  completeIteration,
  addIterationGoal,
  updateGoalProgress,
  getIterationsByStage,
  getIterativeReport,
  resetIterativeWritingEngineState,
  type IterativeWritingEngineState,
} from './IterativeWritingEngine';

describe('IterativeWritingEngine', () => {
  let state: IterativeWritingEngineState;

  beforeEach(() => { state = createIterativeWritingEngineState(); });

  describe('createIterativeWritingEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.iterations.size).toBe(0);
      expect(state.bestVersion).toBe(0);
    });
  });

  describe('startIteration', () => {
    it('should start iteration', () => {
      const next = startIteration(state, 'i1', { clarity: 0.7 });
      expect(next.iterations.size).toBe(1);
      expect(next.totalIterations).toBe(1);
    });

    it('should assign version', () => {
      const next = startIteration(state, 'i1');
      expect(next.iterations.get('i1')?.version).toBe(1);
    });

    it('should fill missing metrics', () => {
      const next = startIteration(state, 'i1', { clarity: 0.7 });
      expect(next.iterations.get('i1')?.metrics.get('engagement')).toBe(0.5);
    });
  });

  describe('addIterationFeedback', () => {
    it('should add feedback', () => {
      let next = startIteration(state, 'i1');
      next = addIterationFeedback(next, 'i1', 'good clarity');
      expect(next.iterations.get('i1')?.feedback.length).toBe(1);
    });
  });

  describe('completeIteration', () => {
    it('should complete iteration', () => {
      let next = startIteration(state, 'i1');
      next = completeIteration(next, 'i1', 3, 'major');
      expect(next.iterations.get('i1')?.stage).toBe('complete');
      expect(next.completedIterations).toBe(1);
    });
  });

  describe('addIterationGoal', () => {
    it('should add goal', () => {
      const next = addIterationGoal(state, 'g1', 'i1', 'clarity', 0.5, 0.8);
      expect(next.totalGoals).toBe(1);
    });
  });

  describe('updateGoalProgress', () => {
    it('should update and achieve goal', () => {
      let next = addIterationGoal(state, 'g1', 'i1', 'clarity', 0.5, 0.8);
      next = updateGoalProgress(next, 'g1', 0.85);
      expect(next.goals.get('g1')?.achieved).toBe(true);
      expect(next.achievedGoals).toBe(1);
    });
  });

  describe('getIterationsByStage', () => {
    it('should filter by stage', () => {
      let next = startIteration(state, 'i1');
      next = completeIteration(next, 'i1');
      const complete = getIterationsByStage(next, 'complete');
      expect(complete.length).toBe(1);
    });
  });

  describe('getIterativeReport', () => {
    it('should return comprehensive report', () => {
      const report = getIterativeReport(state);
      expect(report.totalIterations).toBe(0);
      expect(typeof report.iterationVelocity).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getIterativeReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetIterativeWritingEngineState', () => {
    it('should reset all state', () => {
      let next = startIteration(state, 'i1');
      next = resetIterativeWritingEngineState();
      expect(next.iterations.size).toBe(0);
      expect(next.totalIterations).toBe(0);
    });
  });
});