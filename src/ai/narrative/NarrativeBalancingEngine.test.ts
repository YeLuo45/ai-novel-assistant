/**
 * V1099 NarrativeBalancingEngine Tests — Direction D Iter 17/20 (Round 6)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeBalancingEngineState,
  addBalance,
  addBalanceProfile,
  getBalancesByType,
  getBalancingReport,
  resetNarrativeBalancingEngineState,
  type NarrativeBalancingEngineState,
} from './NarrativeBalancingEngine';

describe('NarrativeBalancingEngine', () => {
  let state: NarrativeBalancingEngineState;

  beforeEach(() => { state = createNarrativeBalancingEngineState(); });

  describe('createNarrativeBalancingEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.balances.size).toBe(0);
      expect(state.profiles.size).toBe(0);
    });
  });

  describe('addBalance', () => {
    it('should add balance', () => {
      const next = addBalance(state, 'b1', 'action', 'balanced', 'moderate', 'desc', 0.8, 0.7, 1);
      expect(next.balances.size).toBe(1);
      expect(next.totalBalances).toBe(1);
    });
  });

  describe('addBalanceProfile', () => {
    it('should add profile', () => {
      let next = addBalance(state, 'b1', 'action', 'balanced', 'moderate', 'desc', 0.8, 0.7, 1);
      next = addBalanceProfile(next, 'p1', ['b1']);
      expect(next.totalProfiles).toBe(1);
    });
  });

  describe('getBalancesByType', () => {
    it('should filter by type', () => {
      let next = addBalance(state, 'b1', 'action', 'balanced', 'moderate', 'desc', 0.8, 0.7, 1);
      next = addBalance(next, 'b2', 'reflection', 'balanced', 'moderate', 'desc', 0.8, 0.7, 1);
      const action = getBalancesByType(next, 'action');
      expect(action.length).toBe(1);
    });
  });

  describe('getBalancingReport', () => {
    it('should return comprehensive report', () => {
      const report = getBalancingReport(state);
      expect(report.totalBalances).toBe(0);
      expect(typeof report.balancingMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getBalancingReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeBalancingEngineState', () => {
    it('should reset all state', () => {
      let next = addBalance(state, 'b1', 'action', 'balanced', 'moderate', 'desc', 0.8, 0.7, 1);
      next = resetNarrativeBalancingEngineState();
      expect(next.balances.size).toBe(0);
      expect(next.totalBalances).toBe(0);
    });
  });
});