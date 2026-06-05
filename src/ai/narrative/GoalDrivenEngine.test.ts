/**
 * V743 GoalDrivenEngine Tests — Direction A Iter 3/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createGoalDrivenEngineState,
  createGoal,
  updateGoalProgress,
  setGoalStatus,
  addSubGoal,
  updateSubGoal,
  getGoalsByType,
  getGoalsByStatus,
  getSubGoalsForGoal,
  getGoalReport,
  resetGoalDrivenEngineState,
  type GoalDrivenEngineState,
} from './GoalDrivenEngine';

describe('GoalDrivenEngine', () => {
  let state: GoalDrivenEngineState;

  beforeEach(() => { state = createGoalDrivenEngineState(); });

  describe('createGoalDrivenEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.goals.size).toBe(0);
      expect(state.subgoals.size).toBe(0);
    });
  });

  describe('createGoal', () => {
    it('should create goal', () => {
      const next = createGoal(state, 'g1', 'Complete novel', 'Finish writing the novel', 'long_term', 'high', 100);
      expect(next.goals.size).toBe(1);
      expect(next.totalGoals).toBe(1);
    });

    it('should set initial status to active', () => {
      const next = createGoal(state, 'g1', 'Goal', 'desc', 'short_term');
      expect(next.goals.get('g1')?.status).toBe('active');
    });
  });

  describe('updateGoalProgress', () => {
    it('should update progress', () => {
      let next = createGoal(state, 'g1', 'Goal', 'desc', 'short_term', 'medium', 100);
      next = updateGoalProgress(next, 'g1', 50);
      expect(next.goals.get('g1')?.progress).toBe(0.5);
    });

    it('should clamp progress', () => {
      let next = createGoal(state, 'g1', 'Goal', 'desc', 'short_term', 'medium', 100);
      next = updateGoalProgress(next, 'g1', 200);
      expect(next.goals.get('g1')?.progress).toBe(1);
    });
  });

  describe('setGoalStatus', () => {
    it('should set status', () => {
      let next = createGoal(state, 'g1', 'Goal', 'desc', 'short_term');
      next = setGoalStatus(next, 'g1', 'completed');
      expect(next.goals.get('g1')?.status).toBe('completed');
    });
  });

  describe('addSubGoal', () => {
    it('should add subgoal', () => {
      let next = createGoal(state, 'g1', 'Goal', 'desc', 'short_term');
      next = addSubGoal(next, 'sg1', 'g1', 'Step 1', 'sequential');
      expect(next.subgoals.size).toBe(1);
    });
  });

  describe('updateSubGoal', () => {
    it('should update subgoal', () => {
      let next = createGoal(state, 'g1', 'Goal', 'desc', 'short_term');
      next = addSubGoal(next, 'sg1', 'g1', 'Step 1', 'sequential');
      next = updateSubGoal(next, 'sg1', 0.5, 'completed');
      expect(next.subgoals.get('sg1')?.progress).toBe(0.5);
    });
  });

  describe('getGoalsByType', () => {
    it('should filter by type', () => {
      let next = createGoal(state, 'g1', 'Short', 'desc', 'short_term');
      next = createGoal(next, 'g2', 'Long', 'desc', 'long_term');
      const longTerm = getGoalsByType(next, 'long_term');
      expect(longTerm.length).toBe(1);
    });
  });

  describe('getGoalsByStatus', () => {
    it('should filter by status', () => {
      let next = createGoal(state, 'g1', 'Goal 1', 'desc', 'short_term');
      next = createGoal(next, 'g2', 'Goal 2', 'desc', 'short_term');
      next = setGoalStatus(next, 'g1', 'completed');
      const completed = getGoalsByStatus(next, 'completed');
      expect(completed.length).toBe(1);
    });
  });

  describe('getSubGoalsForGoal', () => {
    it('should return subgoals for goal', () => {
      let next = createGoal(state, 'g1', 'Goal', 'desc', 'short_term');
      next = addSubGoal(next, 'sg1', 'g1', 'Step 1', 'sequential');
      next = addSubGoal(next, 'sg2', 'g1', 'Step 2', 'sequential');
      const subgoals = getSubGoalsForGoal(next, 'g1');
      expect(subgoals.length).toBe(2);
    });

    it('should return empty for unknown goal', () => {
      const subgoals = getSubGoalsForGoal(state, 'unknown');
      expect(subgoals).toEqual([]);
    });
  });

  describe('getGoalReport', () => {
    it('should return comprehensive report', () => {
      const report = getGoalReport(state);
      expect(report.totalGoals).toBe(0);
      expect(typeof report.goalAchievementRate).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getGoalReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetGoalDrivenEngineState', () => {
    it('should reset all state', () => {
      let next = createGoal(state, 'g1', 'Goal', 'desc', 'short_term');
      next = resetGoalDrivenEngineState();
      expect(next.goals.size).toBe(0);
      expect(next.totalGoals).toBe(0);
    });
  });
});