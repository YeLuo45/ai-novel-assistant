/**
 * V1119 NarrativeSuspensionEngine Tests — Direction E Iter 7/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeSuspensionEngineState,
  addSuspension,
  addSuspensionField,
  getSuspensionsByType,
  getSuspensionReport,
  resetNarrativeSuspensionEngineState,
  type NarrativeSuspensionEngineState,
} from './NarrativeSuspensionEngine';

describe('NarrativeSuspensionEngine', () => {
  let state: NarrativeSuspensionEngineState;

  beforeEach(() => { state = createNarrativeSuspensionEngineState(); });

  describe('createNarrativeSuspensionEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.suspensions.size).toBe(0);
      expect(state.fields.size).toBe(0);
    });
  });

  describe('addSuspension', () => {
    it('should add suspension', () => {
      const next = addSuspension(state, 's1', 'world', 'robust', 'plot_hole', 'desc', 0.8, 0.9, 1);
      expect(next.suspensions.size).toBe(1);
      expect(next.totalSuspensions).toBe(1);
    });
  });

  describe('addSuspensionField', () => {
    it('should add field', () => {
      let next = addSuspension(state, 's1', 'world', 'robust', 'plot_hole', 'desc', 0.8, 0.9, 1);
      next = addSuspensionField(next, 'f1', ['s1']);
      expect(next.totalFields).toBe(1);
    });
  });

  describe('getSuspensionsByType', () => {
    it('should filter by type', () => {
      let next = addSuspension(state, 's1', 'world', 'robust', 'plot_hole', 'desc', 0.8, 0.9, 1);
      next = addSuspension(next, 's2', 'character', 'robust', 'plot_hole', 'desc', 0.8, 0.9, 1);
      const world = getSuspensionsByType(next, 'world');
      expect(world.length).toBe(1);
    });
  });

  describe('getSuspensionReport', () => {
    it('should return comprehensive report', () => {
      const report = getSuspensionReport(state);
      expect(report.totalSuspensions).toBe(0);
      expect(typeof report.suspensionMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getSuspensionReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeSuspensionEngineState', () => {
    it('should reset all state', () => {
      let next = addSuspension(state, 's1', 'world', 'robust', 'plot_hole', 'desc', 0.8, 0.9, 1);
      next = resetNarrativeSuspensionEngineState();
      expect(next.suspensions.size).toBe(0);
      expect(next.totalSuspensions).toBe(0);
    });
  });
});