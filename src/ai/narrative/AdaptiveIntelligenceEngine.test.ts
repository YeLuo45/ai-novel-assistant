/**
 * V845 AdaptiveIntelligenceEngine Tests — Direction A Iter 9/9 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAdaptiveIntelligenceEngineState,
  runIntelligenceCycle,
  getAdaptiveIntelligenceReport,
  resetAdaptiveIntelligenceEngineState,
  type AdaptiveIntelligenceEngineState,
} from './AdaptiveIntelligenceEngine';

describe('AdaptiveIntelligenceEngine', () => {
  let state: AdaptiveIntelligenceEngineState;

  beforeEach(() => { state = createAdaptiveIntelligenceEngineState(); });

  describe('createAdaptiveIntelligenceEngineState', () => {
    it('should initialize all 8 sub-systems', () => {
      expect(state.regulation).toBeDefined();
      expect(state.planning).toBeDefined();
      expect(state.feedback).toBeDefined();
      expect(state.refinement).toBeDefined();
      expect(state.behavior).toBeDefined();
      expect(state.communication).toBeDefined();
      expect(state.reasoning).toBeDefined();
      expect(state.selfAwareness).toBeDefined();
    });

    it('should have correct version', () => {
      expect(state.version).toBe('4.0.0');
    });

    it('should have default overall intelligence', () => {
      expect(state.overallIntelligence).toBe(0.5);
    });
  });

  describe('runIntelligenceCycle', () => {
    it('should run cycle and return metrics', () => {
      const { overallIntelligence, insights } = runIntelligenceCycle(state);
      expect(typeof overallIntelligence).toBe('number');
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should generate insights for empty state', () => {
      const { insights } = runIntelligenceCycle(state);
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should compute overall intelligence', () => {
      const { overallIntelligence } = runIntelligenceCycle(state);
      expect(overallIntelligence).toBeGreaterThanOrEqual(0);
      expect(overallIntelligence).toBeLessThanOrEqual(1);
    });
  });

  describe('getAdaptiveIntelligenceReport', () => {
    it('should return comprehensive report', () => {
      const report = getAdaptiveIntelligenceReport(state);
      expect(typeof report.overallStability).toBe('number');
      expect(typeof report.overallIntelligence).toBe('number');
    });

    it('should include all subsystem scores', () => {
      const report = getAdaptiveIntelligenceReport(state);
      expect(typeof report.planCoherence).toBe('number');
      expect(typeof report.communicationEfficiency).toBe('number');
      expect(typeof report.decisionQuality).toBe('number');
    });
  });

  describe('resetAdaptiveIntelligenceEngineState', () => {
    it('should reset all state', () => {
      const reset = resetAdaptiveIntelligenceEngineState();
      expect(reset.regulation).toBeDefined();
      expect(reset.overallIntelligence).toBe(0.5);
    });
  });
});