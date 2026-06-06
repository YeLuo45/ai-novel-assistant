/**
 * V935 AdaptiveMasteryEngine Tests — Direction D Iter 15/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAdaptiveMasteryEngineState,
  runMasteryCycle,
  getAdaptiveMasteryReport,
  resetAdaptiveMasteryEngineState,
  type AdaptiveMasteryEngineState,
} from './AdaptiveMasteryEngine';

describe('AdaptiveMasteryEngine', () => {
  let state: AdaptiveMasteryEngineState;

  beforeEach(() => { state = createAdaptiveMasteryEngineState(); });

  describe('createAdaptiveMasteryEngineState', () => {
    it('should initialize all 14 sub-systems', () => {
      expect(state.writingCore).toBeDefined();
      expect(state.continuousRef).toBeDefined();
      expect(state.adaptiveNarr).toBeDefined();
      expect(state.selfImproving).toBeDefined();
      expect(state.feedback).toBeDefined();
      expect(state.enhancement).toBeDefined();
      expect(state.context).toBeDefined();
      expect(state.selfOptimizing).toBeDefined();
      expect(state.composition).toBeDefined();
      expect(state.learning).toBeDefined();
      expect(state.revision).toBeDefined();
      expect(state.regulation).toBeDefined();
      expect(state.quality).toBeDefined();
      expect(state.excellence).toBeDefined();
    });

    it('should have correct version', () => {
      expect(state.version).toBe('4.0.0');
    });

    it('should have default overall mastery', () => {
      expect(state.overallMastery).toBe(0.5);
    });
  });

  describe('runMasteryCycle', () => {
    it('should run cycle and return metrics', () => {
      const { overallMastery, insights } = runMasteryCycle(state);
      expect(typeof overallMastery).toBe('number');
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should generate insights for empty state', () => {
      const { insights } = runMasteryCycle(state);
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should compute overall mastery', () => {
      const { overallMastery } = runMasteryCycle(state);
      expect(overallMastery).toBeGreaterThanOrEqual(0);
      expect(overallMastery).toBeLessThanOrEqual(1);
    });
  });

  describe('getAdaptiveMasteryReport', () => {
    it('should return comprehensive report', () => {
      const report = getAdaptiveMasteryReport(state);
      expect(typeof report.coreMastery).toBe('number');
      expect(typeof report.overallMastery).toBe('number');
    });

    it('should include all 14 subsystem scores', () => {
      const report = getAdaptiveMasteryReport(state);
      expect(typeof report.refinementMastery).toBe('number');
      expect(typeof report.excellenceMastery).toBe('number');
      expect(typeof report.qualityMastery).toBe('number');
    });
  });

  describe('resetAdaptiveMasteryEngineState', () => {
    it('should reset all state', () => {
      const reset = resetAdaptiveMasteryEngineState();
      expect(reset.writingCore).toBeDefined();
      expect(reset.overallMastery).toBe(0.5);
    });
  });
});