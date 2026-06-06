/**
 * V1159 NarrativeSimileEngine Tests — Direction F Iter 7/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeSimileEngineState,
  addSimile,
  addSimileField,
  getSimilesByType,
  getSimileReport,
  resetNarrativeSimileEngineState,
  type NarrativeSimileEngineState,
} from './NarrativeSimileEngine';

describe('NarrativeSimileEngine', () => {
  let state: NarrativeSimileEngineState;

  beforeEach(() => { state = createNarrativeSimileEngineState(); });

  describe('createNarrativeSimileEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.similes.size).toBe(0);
      expect(state.fields.size).toBe(0);
    });
  });

  describe('addSimile', () => {
    it('should add simile', () => {
      const next = addSimile(state, 's1', 'visual', 'novel', 'inevitable', 'desc', 0.9, 0.85, 1);
      expect(next.similes.size).toBe(1);
      expect(next.totalSimiles).toBe(1);
    });
  });

  describe('addSimileField', () => {
    it('should add field', () => {
      let next = addSimile(state, 's1', 'visual', 'novel', 'inevitable', 'desc', 0.9, 0.85, 1);
      next = addSimileField(next, 'f1', ['s1']);
      expect(next.totalFields).toBe(1);
    });
  });

  describe('getSimilesByType', () => {
    it('should filter by type', () => {
      let next = addSimile(state, 's1', 'visual', 'novel', 'inevitable', 'desc', 0.9, 0.85, 1);
      next = addSimile(next, 's2', 'auditory', 'novel', 'inevitable', 'desc', 0.9, 0.85, 1);
      const visual = getSimilesByType(next, 'visual');
      expect(visual.length).toBe(1);
    });
  });

  describe('getSimileReport', () => {
    it('should return comprehensive report', () => {
      const report = getSimileReport(state);
      expect(report.totalSimiles).toBe(0);
      expect(typeof report.simileMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getSimileReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeSimileEngineState', () => {
    it('should reset all state', () => {
      let next = addSimile(state, 's1', 'visual', 'novel', 'inevitable', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeSimileEngineState();
      expect(next.similes.size).toBe(0);
      expect(next.totalSimiles).toBe(0);
    });
  });
});