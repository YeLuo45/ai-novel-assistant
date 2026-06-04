/**
 * V719 WritingMasterEngine Tests — Direction D Iter 9/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createWritingMasterState,
  runWritingMasterCycle,
  getWritingMasterReport,
  resetWritingMasterState,
  type WritingMasterState,
} from './WritingMasterEngine';

describe('WritingMasterEngine', () => {
  let state: WritingMasterState;

  beforeEach(() => { state = createWritingMasterState(); });

  describe('createWritingMasterState', () => {
    it('should initialize all 8 sub-systems', () => {
      expect(state.iteration).toBeDefined();
      expect(state.adaptive).toBeDefined();
      expect(state.quality).toBeDefined();
      expect(state.style).toBeDefined();
      expect(state.revision).toBeDefined();
      expect(state.critique).toBeDefined();
      expect(state.enhancement).toBeDefined();
      expect(state.loop).toBeDefined();
    });

    it('should have correct version', () => {
      expect(state.version).toBe('2.0.0');
    });

    it('should have default overall score', () => {
      expect(state.overallScore).toBe(0.5);
    });
  });

  describe('runWritingMasterCycle', () => {
    it('should run cycle and return metrics', () => {
      const { overallScore, insights } = runWritingMasterCycle(state);
      expect(typeof overallScore).toBe('number');
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should generate insights for empty state', () => {
      const { insights } = runWritingMasterCycle(state);
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should compute overall score', () => {
      const { overallScore } = runWritingMasterCycle(state);
      expect(overallScore).toBeGreaterThanOrEqual(0);
      expect(overallScore).toBeLessThanOrEqual(1);
    });
  });

  describe('getWritingMasterReport', () => {
    it('should return comprehensive report', () => {
      const report = getWritingMasterReport(state);
      expect(typeof report.iterationProgress).toBe('number');
      expect(typeof report.qualityScore).toBe('number');
      expect(typeof report.overallScore).toBe('number');
    });

    it('should include all subsystem scores', () => {
      const report = getWritingMasterReport(state);
      expect(typeof report.adaptationCoverage).toBe('number');
      expect(typeof report.styleDiversity).toBe('number');
      expect(typeof report.constructiveRatio).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getWritingMasterReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetWritingMasterState', () => {
    it('should reset all state', () => {
      const reset = resetWritingMasterState();
      expect(reset.iteration).toBeDefined();
      expect(reset.overallScore).toBe(0.5);
    });
  });
});