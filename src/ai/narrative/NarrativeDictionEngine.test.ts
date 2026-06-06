/**
 * V1175 NarrativeDictionEngine Tests — Direction F Iter 15/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeDictionEngineState,
  addDiction,
  addDictionField,
  getDictionsByType,
  getDictionReport,
  resetNarrativeDictionEngineState,
  type NarrativeDictionEngineState,
} from './NarrativeDictionEngine';

describe('NarrativeDictionEngine', () => {
  let state: NarrativeDictionEngineState;

  beforeEach(() => { state = createNarrativeDictionEngineState(); });

  describe('createNarrativeDictionEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.dictions.size).toBe(0);
      expect(state.fields.size).toBe(0);
    });
  });

  describe('addDiction', () => {
    it('should add diction', () => {
      const next = addDiction(state, 'd1', 'precise', 'inevitable', 'wide', 'desc', 0.9, 0.85, 1);
      expect(next.dictions.size).toBe(1);
      expect(next.totalDictions).toBe(1);
    });
  });

  describe('addDictionField', () => {
    it('should add field', () => {
      let next = addDiction(state, 'd1', 'precise', 'inevitable', 'wide', 'desc', 0.9, 0.85, 1);
      next = addDictionField(next, 'f1', ['d1']);
      expect(next.totalFields).toBe(1);
    });
  });

  describe('getDictionsByType', () => {
    it('should filter by type', () => {
      let next = addDiction(state, 'd1', 'precise', 'inevitable', 'wide', 'desc', 0.9, 0.85, 1);
      next = addDiction(next, 'd2', 'ornate', 'inevitable', 'wide', 'desc', 0.9, 0.85, 1);
      const precise = getDictionsByType(next, 'precise');
      expect(precise.length).toBe(1);
    });
  });

  describe('getDictionReport', () => {
    it('should return comprehensive report', () => {
      const report = getDictionReport(state);
      expect(report.totalDictions).toBe(0);
      expect(typeof report.dictionMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getDictionReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeDictionEngineState', () => {
    it('should reset all state', () => {
      let next = addDiction(state, 'd1', 'precise', 'inevitable', 'wide', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeDictionEngineState();
      expect(next.dictions.size).toBe(0);
      expect(next.totalDictions).toBe(0);
    });
  });
});