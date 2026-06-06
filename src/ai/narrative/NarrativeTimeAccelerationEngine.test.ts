/**
 * V1219 NarrativeTimeAccelerationEngine Tests — Direction G Iter 17/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeTimeAccelerationEngineState,
  addTimeAcceleration,
  addTimeAccelerationBurst,
  getTimeAccelerationsByType,
  getTimeAccelerationReport,
  resetNarrativeTimeAccelerationEngineState,
  type NarrativeTimeAccelerationEngineState,
} from './NarrativeTimeAccelerationEngine';

describe('NarrativeTimeAccelerationEngine', () => {
  let state: NarrativeTimeAccelerationEngineState;

  beforeEach(() => { state = createNarrativeTimeAccelerationEngineState(); });

  describe('createNarrativeTimeAccelerationEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.accelerations.size).toBe(0);
      expect(state.bursts.size).toBe(0);
    });
  });

  describe('addTimeAcceleration', () => {
    it('should add acceleration', () => {
      const next = addTimeAcceleration(state, 'a1', 'exponential', 'breakneck', 'paradigm_shift', 'desc', 0.9, 0.85, 1);
      expect(next.accelerations.size).toBe(1);
      expect(next.totalAccelerations).toBe(1);
    });
  });

  describe('addTimeAccelerationBurst', () => {
    it('should add burst', () => {
      let next = addTimeAcceleration(state, 'a1', 'exponential', 'breakneck', 'paradigm_shift', 'desc', 0.9, 0.85, 1);
      next = addTimeAccelerationBurst(next, 'b1', ['a1']);
      expect(next.totalBursts).toBe(1);
    });
  });

  describe('getTimeAccelerationsByType', () => {
    it('should filter by type', () => {
      let next = addTimeAcceleration(state, 'a1', 'exponential', 'breakneck', 'paradigm_shift', 'desc', 0.9, 0.85, 1);
      next = addTimeAcceleration(next, 'a2', 'linear', 'breakneck', 'paradigm_shift', 'desc', 0.9, 0.85, 1);
      const exp = getTimeAccelerationsByType(next, 'exponential');
      expect(exp.length).toBe(1);
    });
  });

  describe('getTimeAccelerationReport', () => {
    it('should return comprehensive report', () => {
      const report = getTimeAccelerationReport(state);
      expect(report.totalAccelerations).toBe(0);
      expect(typeof report.timeAccelerationMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getTimeAccelerationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeTimeAccelerationEngineState', () => {
    it('should reset all state', () => {
      let next = addTimeAcceleration(state, 'a1', 'exponential', 'breakneck', 'paradigm_shift', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeTimeAccelerationEngineState();
      expect(next.accelerations.size).toBe(0);
      expect(next.totalAccelerations).toBe(0);
    });
  });
});