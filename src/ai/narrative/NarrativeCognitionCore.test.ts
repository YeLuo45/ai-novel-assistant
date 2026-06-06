/**
 * V961 NarrativeCognitionCore Tests — Direction E Iter 13/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeCognitionCoreState,
  addCognitiveUnit,
  addCognitiveSchema,
  getUnitsByProcess,
  getCognitionReport,
  resetNarrativeCognitionCoreState,
  type NarrativeCognitionCoreState,
} from './NarrativeCognitionCore';

describe('NarrativeCognitionCore', () => {
  let state: NarrativeCognitionCoreState;

  beforeEach(() => { state = createNarrativeCognitionCoreState(); });

  describe('createNarrativeCognitionCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.units.size).toBe(0);
      expect(state.schemas.size).toBe(0);
    });
  });

  describe('addCognitiveUnit', () => {
    it('should add unit', () => {
      const next = addCognitiveUnit(state, 'u1', 'perception', 'analytical', 'expert', 'desc', 0.8, 1);
      expect(next.units.size).toBe(1);
      expect(next.totalUnits).toBe(1);
    });
  });

  describe('addCognitiveSchema', () => {
    it('should add schema', () => {
      let next = addCognitiveUnit(state, 'u1', 'perception', 'analytical', 'expert', 'desc', 0.8, 1);
      next = addCognitiveSchema(next, 's1', 'main schema', ['u1']);
      expect(next.totalSchemas).toBe(1);
    });
  });

  describe('getUnitsByProcess', () => {
    it('should filter by process', () => {
      let next = addCognitiveUnit(state, 'u1', 'perception', 'analytical', 'expert', 'desc', 0.8, 1);
      next = addCognitiveUnit(next, 'u2', 'memory', 'analytical', 'expert', 'desc', 0.8, 1);
      const perception = getUnitsByProcess(next, 'perception');
      expect(perception.length).toBe(1);
    });
  });

  describe('getCognitionReport', () => {
    it('should return comprehensive report', () => {
      const report = getCognitionReport(state);
      expect(report.totalUnits).toBe(0);
      expect(typeof report.cognitionMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getCognitionReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeCognitionCoreState', () => {
    it('should reset all state', () => {
      let next = addCognitiveUnit(state, 'u1', 'perception', 'analytical', 'expert', 'desc', 0.8, 1);
      next = resetNarrativeCognitionCoreState();
      expect(next.units.size).toBe(0);
      expect(next.totalUnits).toBe(0);
    });
  });
});