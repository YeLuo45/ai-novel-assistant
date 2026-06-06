/**
 * V1197 NarrativeTimeRiftEngine Tests — Direction G Iter 6/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeTimeRiftEngineState,
  addTimeRift,
  addTimeRiftField,
  getTimeRiftsByType,
  getTimeRiftReport,
  resetNarrativeTimeRiftEngineState,
  type NarrativeTimeRiftEngineState,
} from './NarrativeTimeRiftEngine';

describe('NarrativeTimeRiftEngine', () => {
  let state: NarrativeTimeRiftEngineState;

  beforeEach(() => { state = createNarrativeTimeRiftEngineState(); });

  describe('createNarrativeTimeRiftEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.rifts.size).toBe(0);
      expect(state.fields.size).toBe(0);
    });
  });

  describe('addTimeRift', () => {
    it('should add rift', () => {
      const next = addTimeRift(state, 'r1', 'temporal', 'critical', 'crystallized', 'desc', 0.9, 0.85, 1);
      expect(next.rifts.size).toBe(1);
      expect(next.totalRifts).toBe(1);
    });
  });

  describe('addTimeRiftField', () => {
    it('should add field', () => {
      let next = addTimeRift(state, 'r1', 'temporal', 'critical', 'crystallized', 'desc', 0.9, 0.85, 1);
      next = addTimeRiftField(next, 'f1', ['r1']);
      expect(next.totalFields).toBe(1);
    });
  });

  describe('getTimeRiftsByType', () => {
    it('should filter by type', () => {
      let next = addTimeRift(state, 'r1', 'temporal', 'critical', 'crystallized', 'desc', 0.9, 0.85, 1);
      next = addTimeRift(next, 'r2', 'causal', 'critical', 'crystallized', 'desc', 0.9, 0.85, 1);
      const temporal = getTimeRiftsByType(next, 'temporal');
      expect(temporal.length).toBe(1);
    });
  });

  describe('getTimeRiftReport', () => {
    it('should return comprehensive report', () => {
      const report = getTimeRiftReport(state);
      expect(report.totalRifts).toBe(0);
      expect(typeof report.timeRiftMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getTimeRiftReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeTimeRiftEngineState', () => {
    it('should reset all state', () => {
      let next = addTimeRift(state, 'r1', 'temporal', 'critical', 'crystallized', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeTimeRiftEngineState();
      expect(next.rifts.size).toBe(0);
      expect(next.totalRifts).toBe(0);
    });
  });
});