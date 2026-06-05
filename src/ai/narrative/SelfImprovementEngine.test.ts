/**
 * V745 SelfImprovementEngine Tests — Direction A Iter 4/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSelfImprovementEngineState,
  identifyImprovement,
  startImprovementCycle,
  executeImprovement,
  completeImprovement,
  rollbackImprovement,
  getImprovementsByArea,
  getSelfImprovementReport,
  resetSelfImprovementEngineState,
  type SelfImprovementEngineState,
} from './SelfImprovementEngine';

describe('SelfImprovementEngine', () => {
  let state: SelfImprovementEngineState;

  beforeEach(() => { state = createSelfImprovementEngineState(); });

  describe('createSelfImprovementEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.improvements.size).toBe(0);
      expect(state.cycles.size).toBe(0);
    });
  });

  describe('identifyImprovement', () => {
    it('should identify improvement', () => {
      const next = identifyImprovement(state, 'i1', 'performance', 'incremental', 'Speed up by 20%', 100, 120);
      expect(next.improvements.size).toBe(1);
      expect(next.totalImprovements).toBe(1);
    });

    it('should set initial status', () => {
      const next = identifyImprovement(state, 'i1', 'performance', 'incremental', 'desc', 0, 100);
      expect(next.improvements.get('i1')?.status).toBe('identified');
    });
  });

  describe('startImprovementCycle', () => {
    it('should start cycle', () => {
      const next = startImprovementCycle(state, 'c1');
      expect(next.cycles.size).toBe(1);
      expect(next.totalCycles).toBe(1);
    });
  });

  describe('executeImprovement', () => {
    it('should execute improvement', () => {
      let next = identifyImprovement(state, 'i1', 'performance', 'incremental', 'desc', 0, 100);
      next = executeImprovement(next, 'i1');
      expect(next.improvements.get('i1')?.status).toBe('executing');
    });
  });

  describe('completeImprovement', () => {
    it('should complete improvement', () => {
      let next = identifyImprovement(state, 'i1', 'performance', 'incremental', 'desc', 100, 120);
      next = completeImprovement(next, 'i1', 125);
      expect(next.improvements.get('i1')?.status).toBe('completed');
      expect(next.improvements.get('i1')?.achieved).toBe(125);
      expect(next.completedImprovements).toBe(1);
    });
  });

  describe('rollbackImprovement', () => {
    it('should roll back', () => {
      let next = identifyImprovement(state, 'i1', 'performance', 'incremental', 'desc', 100, 120);
      next = rollbackImprovement(next, 'i1');
      expect(next.improvements.get('i1')?.status).toBe('rolled_back');
    });
  });

  describe('getImprovementsByArea', () => {
    it('should filter by area', () => {
      let next = identifyImprovement(state, 'i1', 'performance', 'incremental', 'desc', 0, 100);
      next = identifyImprovement(next, 'i2', 'quality', 'leapfrog', 'desc', 0, 100);
      const perf = getImprovementsByArea(next, 'performance');
      expect(perf.length).toBe(1);
    });
  });

  describe('getSelfImprovementReport', () => {
    it('should return comprehensive report', () => {
      const report = getSelfImprovementReport(state);
      expect(report.totalImprovements).toBe(0);
      expect(typeof report.improvementVelocity).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getSelfImprovementReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetSelfImprovementEngineState', () => {
    it('should reset all state', () => {
      let next = identifyImprovement(state, 'i1', 'performance', 'incremental', 'desc', 0, 100);
      next = resetSelfImprovementEngineState();
      expect(next.improvements.size).toBe(0);
      expect(next.totalImprovements).toBe(0);
    });
  });
});