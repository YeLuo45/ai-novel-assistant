/**
 * V1113 NarrativeRewardCircuitEngine Tests — Direction E Iter 4/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeRewardCircuitEngineState,
  addReward,
  addRewardLoop,
  getRewardsByType,
  getRewardCircuitReport,
  resetNarrativeRewardCircuitEngineState,
  type NarrativeRewardCircuitEngineState,
} from './NarrativeRewardCircuitEngine';

describe('NarrativeRewardCircuitEngine', () => {
  let state: NarrativeRewardCircuitEngineState;

  beforeEach(() => { state = createNarrativeRewardCircuitEngineState(); });

  describe('createNarrativeRewardCircuitEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.rewards.size).toBe(0);
      expect(state.loops.size).toBe(0);
    });
  });

  describe('addReward', () => {
    it('should add reward', () => {
      const next = addReward(state, 'r1', 'resolution', 'large', 'optimal', 'desc', 0.9, 0.7, 1);
      expect(next.rewards.size).toBe(1);
      expect(next.totalRewards).toBe(1);
    });
  });

  describe('addRewardLoop', () => {
    it('should add loop', () => {
      let next = addReward(state, 'r1', 'resolution', 'large', 'optimal', 'desc', 0.9, 0.7, 1);
      next = addRewardLoop(next, 'l1', ['r1']);
      expect(next.totalLoops).toBe(1);
    });
  });

  describe('getRewardsByType', () => {
    it('should filter by type', () => {
      let next = addReward(state, 'r1', 'resolution', 'large', 'optimal', 'desc', 0.9, 0.7, 1);
      next = addReward(next, 'r2', 'revelation', 'large', 'optimal', 'desc', 0.9, 0.7, 1);
      const resolution = getRewardsByType(next, 'resolution');
      expect(resolution.length).toBe(1);
    });
  });

  describe('getRewardCircuitReport', () => {
    it('should return comprehensive report', () => {
      const report = getRewardCircuitReport(state);
      expect(report.totalRewards).toBe(0);
      expect(typeof report.rewardMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getRewardCircuitReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeRewardCircuitEngineState', () => {
    it('should reset all state', () => {
      let next = addReward(state, 'r1', 'resolution', 'large', 'optimal', 'desc', 0.9, 0.7, 1);
      next = resetNarrativeRewardCircuitEngineState();
      expect(next.rewards.size).toBe(0);
      expect(next.totalRewards).toBe(0);
    });
  });
});