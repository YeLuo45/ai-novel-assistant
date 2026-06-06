/**
 * V1229 NarrativeAudienceCuriosityEngine Tests — Direction H Iter 2/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAudienceCuriosityEngineState,
  addAudienceCuriosity,
  addAudienceCuriosityField,
  getAudienceCuriositiesByType,
  getAudienceCuriosityReport,
  resetNarrativeAudienceCuriosityEngineState,
  type NarrativeAudienceCuriosityEngineState,
} from './NarrativeAudienceCuriosityEngine';

describe('NarrativeAudienceCuriosityEngine', () => {
  let state: NarrativeAudienceCuriosityEngineState;

  beforeEach(() => { state = createNarrativeAudienceCuriosityEngineState(); });

  describe('createNarrativeAudienceCuriosityEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.curiosities.size).toBe(0);
      expect(state.fields.size).toBe(0);
    });
  });

  describe('addAudienceCuriosity', () => {
    it('should add curiosity', () => {
      const next = addAudienceCuriosity(state, 'c1', 'epistemic', 'overwhelming', 'permanent', 'desc', 0.9, 0.85, 1);
      expect(next.curiosities.size).toBe(1);
      expect(next.totalCuriosities).toBe(1);
    });
  });

  describe('addAudienceCuriosityField', () => {
    it('should add field', () => {
      let next = addAudienceCuriosity(state, 'c1', 'epistemic', 'overwhelming', 'permanent', 'desc', 0.9, 0.85, 1);
      next = addAudienceCuriosityField(next, 'f1', ['c1']);
      expect(next.totalFields).toBe(1);
    });
  });

  describe('getAudienceCuriositiesByType', () => {
    it('should filter by type', () => {
      let next = addAudienceCuriosity(state, 'c1', 'epistemic', 'overwhelming', 'permanent', 'desc', 0.9, 0.85, 1);
      next = addAudienceCuriosity(next, 'c2', 'emotional', 'overwhelming', 'permanent', 'desc', 0.9, 0.85, 1);
      const epistemic = getAudienceCuriositiesByType(next, 'epistemic');
      expect(epistemic.length).toBe(1);
    });
  });

  describe('getAudienceCuriosityReport', () => {
    it('should return comprehensive report', () => {
      const report = getAudienceCuriosityReport(state);
      expect(report.totalCuriosities).toBe(0);
      expect(typeof report.audienceCuriosityMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAudienceCuriosityReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAudienceCuriosityEngineState', () => {
    it('should reset all state', () => {
      let next = addAudienceCuriosity(state, 'c1', 'epistemic', 'overwhelming', 'permanent', 'desc', 0.9, 0.85, 1);
      next = resetNarrativeAudienceCuriosityEngineState();
      expect(next.curiosities.size).toBe(0);
      expect(next.totalCuriosities).toBe(0);
    });
  });
});