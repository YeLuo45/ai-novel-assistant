/**
 * V901 NarrativeAxiologyEngine Tests — Direction C Iter 13/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAxiologyEngineState,
  addValue,
  addValueConflict,
  resolveValueConflict,
  getValuesByType,
  getAxiologyReport,
  resetNarrativeAxiologyEngineState,
  type NarrativeAxiologyEngineState,
} from './NarrativeAxiologyEngine';

describe('NarrativeAxiologyEngine', () => {
  let state: NarrativeAxiologyEngineState;

  beforeEach(() => { state = createNarrativeAxiologyEngineState(); });

  describe('createNarrativeAxiologyEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.values.size).toBe(0);
      expect(state.conflicts.size).toBe(0);
    });
  });

  describe('addValue', () => {
    it('should add value', () => {
      const next = addValue(state, 'v1', 'Courage', 'moral', 'positive', 'facing fear', 0.8, 1);
      expect(next.values.size).toBe(1);
      expect(next.positiveValues).toBe(1);
    });
  });

  describe('addValueConflict', () => {
    it('should add conflict', () => {
      const next = addValueConflict(state, 'c1', 'v1', 'v2', 0.7, 5);
      expect(next.totalConflicts).toBe(1);
    });
  });

  describe('resolveValueConflict', () => {
    it('should resolve', () => {
      let next = addValueConflict(state, 'c1', 'v1', 'v2', 0.7, 5);
      next = resolveValueConflict(next, 'c1', 'compromise');
      expect(next.conflicts.get('c1')?.resolved).toBe(true);
    });
  });

  describe('getValuesByType', () => {
    it('should filter by type', () => {
      let next = addValue(state, 'v1', 'Courage', 'moral', 'positive', 'desc', 0.8, 1);
      next = addValue(next, 'v2', 'Beauty', 'aesthetic', 'positive', 'desc', 0.7, 1);
      const moral = getValuesByType(next, 'moral');
      expect(moral.length).toBe(1);
    });
  });

  describe('getAxiologyReport', () => {
    it('should return comprehensive report', () => {
      const report = getAxiologyReport(state);
      expect(report.totalValues).toBe(0);
      expect(typeof report.ethicalRichness).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAxiologyReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAxiologyEngineState', () => {
    it('should reset all state', () => {
      let next = addValue(state, 'v1', 'Courage', 'moral', 'positive', 'desc', 0.8, 1);
      next = resetNarrativeAxiologyEngineState();
      expect(next.values.size).toBe(0);
      expect(next.totalValues).toBe(0);
    });
  });
});