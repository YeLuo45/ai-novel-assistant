/**
 * V977 NarrativeAutonomousGoalEngine Tests — Direction A Iter 6/15 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAutonomousGoalEngineState,
  addNarrativeGoal,
  updateNarrativeGoal,
  addGoalStrategy,
  getGoalsByType,
  getGoalReport,
  resetNarrativeAutonomousGoalEngineState,
  type NarrativeAutonomousGoalEngineState,
} from './NarrativeAutonomousGoalEngine';

describe('NarrativeAutonomousGoalEngine', () => {
  let state: NarrativeAutonomousGoalEngineState;

  beforeEach(() => { state = createNarrativeAutonomousGoalEngineState(); });

  describe('createNarrativeAutonomousGoalEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.goals.size).toBe(0);
      expect(state.strategies.size).toBe(0);
    });
  });

  describe('addNarrativeGoal', () => {
    it('should add goal', () => {
      const next = addNarrativeGoal(state, 'g1', 'craft', 'high', 'desc', 100, 25, 1);
      expect(next.goals.size).toBe(1);
      expect(next.totalGoals).toBe(1);
      expect(next.goals.get('g1')?.progress).toBeCloseTo(0.25, 5);
    });
  });

  describe('updateNarrativeGoal', () => {
    it('should update', () => {
      let next = addNarrativeGoal(state, 'g1', 'craft', 'high', 'desc', 100, 25, 1);
      next = updateNarrativeGoal(next, 'g1', 100);
      expect(next.goals.get('g1')?.status).toBe('achieved');
      expect(next.achievedGoals).toBe(1);
    });
  });

  describe('addGoalStrategy', () => {
    it('should add strategy', () => {
      let next = addNarrativeGoal(state, 'g1', 'craft', 'high', 'desc', 100, 25, 1);
      next = addGoalStrategy(next, 's1', 'main strategy', ['g1']);
      expect(next.totalStrategies).toBe(1);
    });
  });

  describe('getGoalsByType', () => {
    it('should filter by type', () => {
      let next = addNarrativeGoal(state, 'g1', 'craft', 'high', 'desc', 100, 25, 1);
      next = addNarrativeGoal(next, 'g2', 'thematic', 'high', 'desc', 100, 25, 1);
      const craft = getGoalsByType(next, 'craft');
      expect(craft.length).toBe(1);
    });
  });

  describe('getGoalReport', () => {
    it('should return comprehensive report', () => {
      const report = getGoalReport(state);
      expect(report.totalGoals).toBe(0);
      expect(typeof report.goalPursuitMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getGoalReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAutonomousGoalEngineState', () => {
    it('should reset all state', () => {
      let next = addNarrativeGoal(state, 'g1', 'craft', 'high', 'desc', 100, 25, 1);
      next = resetNarrativeAutonomousGoalEngineState();
      expect(next.goals.size).toBe(0);
      expect(next.totalGoals).toBe(0);
    });
  });
});