/**
 * V1215 NarrativeTimeMomentumEngine Tests — Direction G Iter 15/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeTimeMomentumEngineState,
  addTimeMomentum,
  addTimeMomentumFlow,
  getTimeMomentumsByType,
  getTimeMomentumReport,
  resetNarrativeTimeMomentumEngineState,
  type NarrativeTimeMomentumEngineState,
} from './NarrativeTimeMomentumEngine';

describe('NarrativeTimeMomentumEngine', () => {
  let state: NarrativeTimeMomentumEngineState;

  beforeEach(() => { state = createNarrativeTimeMomentumEngineState(); });

  describe('createNarrativeTimeMomentumEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.momentums.size).toBe(0);
      expect(state.flows.size).toBe(0);
    });
  });

  describe('addTimeMomentum', () => {
    it('should add momentum', () => {
      const next = addTimeMomentum(state, 'm1', 'cumulative', 'unstoppable', 'parabolic', 'desc', 0.9, 0.85, 1);
      expect(next.momentums.size).toBe(1);
      expect(next.totalMomentums).toBe(1);
    });
  });

  describe('addTimeMomentumFlow', () => {
    it('should add flow', () => {
      let next = addTimeMomentum(state, 'm1', 'cumulative', 'unstoppable', 'parabolic', 'desc', 0.9, 0.85, 1);
      next = addTimeMomentumFlow(next, 'f1', ['m1']);
      expect(next.totalFlows).toBe(1);
    });
  });

  describe('getTimeMomentumsByType', () => {
    it('should filter by type', () => {
      let next = addTimeMomentum(state, 'm1', 'cumulative', 'unstoppable', 'parabolic', 'desc', 0.9, 0.85, 1);
      next = addTimeMomentum(next, 'm2', 'forward', 'unstoppable', 'parabolic', 'desc', 0.9, 0.85, 1);
      const cumulative = getTimeMomentumsByType(next, 'cumulative');
      expect(cumulative.length).toBe(1);
    });
  });

  describe('getTimeMomentumReport', () => {
    it('should return comprehensive report', () => {
      const report = getTimeMomentumReport(state);
      expect(report.totalMomentums).toBe(0);
      expect(typeof report.timeMomentumMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getTimeMomentumReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeTimeMomentumEngineState', () => {
    it('should reset all state', () => {
      let next = addTimeMomentum(state, 'm1', 'cumulative', 'unstoppable', 'parabolic', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeTimeMomentumEngineState();
      expect(next.momentums.size).toBe(0);
      expect(next.totalMomentums).toBe(0);
    });
  });
});