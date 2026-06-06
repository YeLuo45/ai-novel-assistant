/**
 * V1103 NarrativeRecoveryEngine Tests — Direction D Iter 19/20 (Round 6)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeRecoveryEngineState,
  addRecovery,
  addRecoveryArc,
  getRecoveriesByType,
  getRecoveryReport,
  resetNarrativeRecoveryEngineState,
  type NarrativeRecoveryEngineState,
} from './NarrativeRecoveryEngine';

describe('NarrativeRecoveryEngine', () => {
  let state: NarrativeRecoveryEngineState;

  beforeEach(() => { state = createNarrativeRecoveryEngineState(); });

  describe('createNarrativeRecoveryEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.recoveries.size).toBe(0);
      expect(state.arcs.size).toBe(0);
    });
  });

  describe('addRecovery', () => {
    it('should add recovery', () => {
      const next = addRecovery(state, 'r1', 'plot', 'normal', 'fully', 'desc', 0.3, 0.9);
      expect(next.recoveries.size).toBe(1);
      expect(next.totalRecoveries).toBe(1);
    });
  });

  describe('addRecoveryArc', () => {
    it('should add arc', () => {
      let next = addRecovery(state, 'r1', 'plot', 'normal', 'fully', 'desc', 0.3, 0.9);
      next = addRecoveryArc(next, 'a1', ['r1']);
      expect(next.totalArcs).toBe(1);
    });
  });

  describe('getRecoveriesByType', () => {
    it('should filter by type', () => {
      let next = addRecovery(state, 'r1', 'plot', 'normal', 'fully', 'desc', 0.3, 0.9);
      next = addRecovery(next, 'r2', 'character', 'normal', 'fully', 'desc', 0.3, 0.9);
      const plot = getRecoveriesByType(next, 'plot');
      expect(plot.length).toBe(1);
    });
  });

  describe('getRecoveryReport', () => {
    it('should return comprehensive report', () => {
      const report = getRecoveryReport(state);
      expect(report.totalRecoveries).toBe(0);
      expect(typeof report.recoveryMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getRecoveryReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeRecoveryEngineState', () => {
    it('should reset all state', () => {
      let next = addRecovery(state, 'r1', 'plot', 'normal', 'fully', 'desc', 0.3, 0.9);
      next = resetNarrativeRecoveryEngineState();
      expect(next.recoveries.size).toBe(0);
      expect(next.totalRecoveries).toBe(0);
    });
  });
});