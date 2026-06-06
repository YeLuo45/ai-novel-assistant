/**
 * V1221 NarrativeTimeDecelerationEngine Tests — Direction G Iter 18/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeTimeDecelerationEngineState,
  addTimeDeceleration,
  addTimeDecelerationField,
  getTimeDecelerationsByType,
  getTimeDecelerationReport,
  resetNarrativeTimeDecelerationEngineState,
  type NarrativeTimeDecelerationEngineState,
} from './NarrativeTimeDecelerationEngine';

describe('NarrativeTimeDecelerationEngine', () => {
  let state: NarrativeTimeDecelerationEngineState;

  beforeEach(() => { state = createNarrativeTimeDecelerationEngineState(); });

  describe('createNarrativeTimeDecelerationEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.decelerations.size).toBe(0);
      expect(state.fields.size).toBe(0);
    });
  });

  describe('addTimeDeceleration', () => {
    it('should add deceleration', () => {
      const next = addTimeDeceleration(state, 'd1', 'plateau', 'absolute_stop', 'crystallized', 'desc', 0.9, 0.85, 1);
      expect(next.decelerations.size).toBe(1);
      expect(next.totalDecelerations).toBe(1);
    });
  });

  describe('addTimeDecelerationField', () => {
    it('should add field', () => {
      let next = addTimeDeceleration(state, 'd1', 'plateau', 'absolute_stop', 'crystallized', 'desc', 0.9, 0.85, 1);
      next = addTimeDecelerationField(next, 'f1', ['d1']);
      expect(next.totalFields).toBe(1);
    });
  });

  describe('getTimeDecelerationsByType', () => {
    it('should filter by type', () => {
      let next = addTimeDeceleration(state, 'd1', 'plateau', 'absolute_stop', 'crystallized', 'desc', 0.9, 0.85, 1);
      next = addTimeDeceleration(next, 'd2', 'linear', 'absolute_stop', 'crystallized', 'desc', 0.9, 0.85, 1);
      const plateau = getTimeDecelerationsByType(next, 'plateau');
      expect(plateau.length).toBe(1);
    });
  });

  describe('getTimeDecelerationReport', () => {
    it('should return comprehensive report', () => {
      const report = getTimeDecelerationReport(state);
      expect(report.totalDecelerations).toBe(0);
      expect(typeof report.timeDecelerationMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getTimeDecelerationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeTimeDecelerationEngineState', () => {
    it('should reset all state', () => {
      let next = addTimeDeceleration(state, 'd1', 'plateau', 'absolute_stop', 'crystallized', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeTimeDecelerationEngineState();
      expect(next.decelerations.size).toBe(0);
      expect(next.totalDecelerations).toBe(0);
    });
  });
});