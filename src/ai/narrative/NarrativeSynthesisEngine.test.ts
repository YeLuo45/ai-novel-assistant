/**
 * V683 NarrativeSynthesisEngine Tests — Direction C Iter 9/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeSynthesisState,
  runSynthesisCycle,
  getSynthesisReport,
  resetNarrativeSynthesisState,
  type NarrativeSynthesisState,
} from './NarrativeSynthesisEngine';

describe('NarrativeSynthesisEngine', () => {
  let state: NarrativeSynthesisState;

  beforeEach(() => { state = createNarrativeSynthesisState(); });

  describe('createNarrativeSynthesisState', () => {
    it('should initialize all 8 sub-systems', () => {
      expect(state.pacing).toBeDefined();
      expect(state.dialogue).toBeDefined();
      expect(state.motivation).toBeDefined();
      expect(state.transition).toBeDefined();
      expect(state.theme).toBeDefined();
      expect(state.conflict).toBeDefined();
      expect(state.voice).toBeDefined();
      expect(state.engagement).toBeDefined();
    });

    it('should have correct version', () => {
      expect(state.version).toBe('2.0.0');
    });

    it('should have default overall score', () => {
      expect(state.overallScore).toBe(0.5);
    });
  });

  describe('runSynthesisCycle', () => {
    it('should run cycle and return metrics', () => {
      const { overallScore, insights } = runSynthesisCycle(state);
      expect(typeof overallScore).toBe('number');
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should generate insights for empty state', () => {
      const { insights } = runSynthesisCycle(state);
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should compute overall score', () => {
      const { overallScore } = runSynthesisCycle(state);
      expect(overallScore).toBeGreaterThanOrEqual(0);
      expect(overallScore).toBeLessThanOrEqual(1);
    });
  });

  describe('getSynthesisReport', () => {
    it('should return comprehensive report', () => {
      const report = getSynthesisReport(state);
      expect(typeof report.pacingScore).toBe('number');
      expect(typeof report.dialogueDensity).toBe('number');
      expect(typeof report.overallScore).toBe('number');
    });

    it('should include all subsystem scores', () => {
      const report = getSynthesisReport(state);
      expect(typeof report.motivationComplexity).toBe('number');
      expect(typeof report.transitionFlow).toBe('number');
      expect(typeof report.themeCoherence).toBe('number');
    });

    it('should report engagement level', () => {
      const report = getSynthesisReport(state);
      expect(['low', 'medium', 'high']).toContain(report.engagementLevel);
    });

    it('should include recommendations for empty state', () => {
      const report = getSynthesisReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeSynthesisState', () => {
    it('should reset all state', () => {
      const reset = resetNarrativeSynthesisState();
      expect(reset.pacing).toBeDefined();
      expect(reset.overallScore).toBe(0.5);
    });
  });
});