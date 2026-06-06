/**
 * V1157 NarrativeMetaphorEngine Tests — Direction F Iter 6/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeMetaphorEngineState,
  addMetaphor,
  addMetaphorField,
  getMetaphorsByType,
  getMetaphorReport,
  resetNarrativeMetaphorEngineState,
  type NarrativeMetaphorEngineState,
} from './NarrativeMetaphorEngine';

describe('NarrativeMetaphorEngine', () => {
  let state: NarrativeMetaphorEngineState;

  beforeEach(() => { state = createNarrativeMetaphorEngineState(); });

  describe('createNarrativeMetaphorEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.metaphors.size).toBe(0);
      expect(state.fields.size).toBe(0);
    });
  });

  describe('addMetaphor', () => {
    it('should add metaphor', () => {
      const next = addMetaphor(state, 'm1', 'organic', 'novel', 'profound', 'desc', 0.9, 0.85, 1);
      expect(next.metaphors.size).toBe(1);
      expect(next.totalMetaphors).toBe(1);
    });
  });

  describe('addMetaphorField', () => {
    it('should add field', () => {
      let next = addMetaphor(state, 'm1', 'organic', 'novel', 'profound', 'desc', 0.9, 0.85, 1);
      next = addMetaphorField(next, 'f1', ['m1']);
      expect(next.totalFields).toBe(1);
    });
  });

  describe('getMetaphorsByType', () => {
    it('should filter by type', () => {
      let next = addMetaphor(state, 'm1', 'organic', 'novel', 'profound', 'desc', 0.9, 0.85, 1);
      next = addMetaphor(next, 'm2', 'mechanistic', 'novel', 'profound', 'desc', 0.9, 0.85, 1);
      const organic = getMetaphorsByType(next, 'organic');
      expect(organic.length).toBe(1);
    });
  });

  describe('getMetaphorReport', () => {
    it('should return comprehensive report', () => {
      const report = getMetaphorReport(state);
      expect(report.totalMetaphors).toBe(0);
      expect(typeof report.metaphorMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getMetaphorReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeMetaphorEngineState', () => {
    it('should reset all state', () => {
      let next = addMetaphor(state, 'm1', 'organic', 'novel', 'profound', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeMetaphorEngineState();
      expect(next.metaphors.size).toBe(0);
      expect(next.totalMetaphors).toBe(0);
    });
  });
});