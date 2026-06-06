/**
 * V1167 NarrativeCadenceEngine Tests — Direction F Iter 11/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCadenceEngineState,
  addCadence,
  addCadencePattern,
  getCadencesByType,
  getCadenceReport,
  resetNarrativeCadenceEngineState,
  type NarrativeCadenceEngineState,
} from './NarrativeCadenceEngine';

describe('NarrativeCadenceEngine', () => {
  let state: NarrativeCadenceEngineState;

  beforeEach(() => { state = createNarrativeCadenceEngineState(); });

  describe('createNarrativeCadenceEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.cadences.size).toBe(0);
      expect(state.patterns.size).toBe(0);
    });
  });

  describe('addCadence', () => {
    it('should add cadence', () => {
      const next = addCadence(state, 'c1', 'rising', 'polished', 'varied', 'desc', 0.9, 0.85, 1);
      expect(next.cadences.size).toBe(1);
      expect(next.totalCadences).toBe(1);
    });
  });

  describe('addCadencePattern', () => {
    it('should add pattern', () => {
      let next = addCadence(state, 'c1', 'rising', 'polished', 'varied', 'desc', 0.9, 0.85, 1);
      next = addCadencePattern(next, 'p1', ['c1']);
      expect(next.totalPatterns).toBe(1);
    });
  });

  describe('getCadencesByType', () => {
    it('should filter by type', () => {
      let next = addCadence(state, 'c1', 'rising', 'polished', 'varied', 'desc', 0.9, 0.85, 1);
      next = addCadence(next, 'c2', 'falling', 'polished', 'varied', 'desc', 0.9, 0.85, 1);
      const rising = getCadencesByType(next, 'rising');
      expect(rising.length).toBe(1);
    });
  });

  describe('getCadenceReport', () => {
    it('should return comprehensive report', () => {
      const report = getCadenceReport(state);
      expect(report.totalCadences).toBe(0);
      expect(typeof report.cadenceMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getCadenceReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeCadenceEngineState', () => {
    it('should reset all state', () => {
      let next = addCadence(state, 'c1', 'rising', 'polished', 'varied', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeCadenceEngineState();
      expect(next.cadences.size).toBe(0);
      expect(next.totalCadences).toBe(0);
    });
  });
});