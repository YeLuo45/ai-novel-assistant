/**
 * V751 AutonomousCore Tests — Direction A Iter 7/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAutonomousCoreState,
  takeAutonomousAction,
  recordActionOutcome,
  setAutonomyPolicy,
  setAutonomyLevel,
  getActionsByType,
  getActionsByOutcome,
  getAutonomousCoreReport,
  resetAutonomousCoreState,
  type AutonomousCoreState,
} from './AutonomousCore';

describe('AutonomousCore', () => {
  let state: AutonomousCoreState;

  beforeEach(() => { state = createAutonomousCoreState(); });

  describe('createAutonomousCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.actions.size).toBe(0);
      expect(state.currentLevel).toBe('supervised');
    });
  });

  describe('takeAutonomousAction', () => {
    it('should take action', () => {
      const next = takeAutonomousAction(state, 'a1', 'create', 'Generate text', 'learning', 0.8, 0.5);
      expect(next.actions.size).toBe(1);
      expect(next.totalActions).toBe(1);
    });

    it('should clamp confidence and impact', () => {
      const next = takeAutonomousAction(state, 'a1', 'create', 'desc', 'learning', 1.5, 1.5);
      expect(next.actions.get('a1')?.confidence).toBe(1);
      expect(next.actions.get('a1')?.impact).toBe(1);
    });
  });

  describe('recordActionOutcome', () => {
    it('should record success', () => {
      let next = takeAutonomousAction(state, 'a1', 'create', 'desc', 'learning', 0.8, 0.5);
      next = recordActionOutcome(next, 'a1', 'success');
      expect(next.actions.get('a1')?.outcome).toBe('success');
      expect(next.successfulActions).toBe(1);
    });

    it('should record failure', () => {
      let next = takeAutonomousAction(state, 'a1', 'create', 'desc', 'learning', 0.8, 0.5);
      next = recordActionOutcome(next, 'a1', 'failure');
      expect(next.successfulActions).toBe(0);
    });
  });

  describe('setAutonomyPolicy', () => {
    it('should set policy', () => {
      const next = setAutonomyPolicy(state, 'p1', 'full', 'all', ['no harm'], ['escalate if error']);
      expect(next.policies.size).toBe(1);
      expect(next.activePolicies).toBe(1);
    });
  });

  describe('setAutonomyLevel', () => {
    it('should set level', () => {
      const next = setAutonomyLevel(state, 'full');
      expect(next.currentLevel).toBe('full');
    });
  });

  describe('getActionsByType', () => {
    it('should filter by type', () => {
      let next = takeAutonomousAction(state, 'a1', 'create', 'desc', 'learning', 0.8, 0.5);
      next = takeAutonomousAction(next, 'a2', 'modify', 'desc', 'learning', 0.8, 0.5);
      const creates = getActionsByType(next, 'create');
      expect(creates.length).toBe(1);
    });
  });

  describe('getActionsByOutcome', () => {
    it('should filter by outcome', () => {
      let next = takeAutonomousAction(state, 'a1', 'create', 'desc', 'learning', 0.8, 0.5);
      next = recordActionOutcome(next, 'a1', 'success');
      const successes = getActionsByOutcome(next, 'success');
      expect(successes.length).toBe(1);
    });
  });

  describe('getAutonomousCoreReport', () => {
    it('should return comprehensive report', () => {
      const report = getAutonomousCoreReport(state);
      expect(report.totalActions).toBe(0);
      expect(typeof report.autonomyScore).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAutonomousCoreReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetAutonomousCoreState', () => {
    it('should reset all state', () => {
      let next = takeAutonomousAction(state, 'a1', 'create', 'desc', 'learning', 0.8, 0.5);
      next = resetAutonomousCoreState();
      expect(next.actions.size).toBe(0);
      expect(next.totalActions).toBe(0);
    });
  });
});