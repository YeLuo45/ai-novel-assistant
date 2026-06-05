/**
 * V809 WritingExcellenceEngine Tests — Direction D Iter 9/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createWritingExcellenceEngineState,
  runExcellenceCycle,
  getWritingExcellenceReport,
  resetWritingExcellenceEngineState,
  type WritingExcellenceEngineState,
} from './WritingExcellenceEngine';

describe('WritingExcellenceEngine', () => {
  let state: WritingExcellenceEngineState;

  beforeEach(() => { state = createWritingExcellenceEngineState(); });

  describe('createWritingExcellenceEngineState', () => {
    it('should initialize all 8 sub-systems', () => {
      expect(state.flow).toBeDefined();
      expect(state.iterative).toBeDefined();
      expect(state.quality).toBeDefined();
      expect(state.style).toBeDefined();
      expect(state.tension).toBeDefined();
      expect(state.enhancement).toBeDefined();
      expect(state.critique).toBeDefined();
      expect(state.revision).toBeDefined();
    });

    it('should have correct version', () => {
      expect(state.version).toBe('3.0.0');
    });

    it('should have default overall excellence', () => {
      expect(state.overallExcellence).toBe(0.5);
    });
  });

  describe('runExcellenceCycle', () => {
    it('should run cycle and return metrics', () => {
      const { overallExcellence, insights } = runExcellenceCycle(state);
      expect(typeof overallExcellence).toBe('number');
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should generate insights for empty state', () => {
      const { insights } = runExcellenceCycle(state);
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should compute overall excellence', () => {
      const { overallExcellence } = runExcellenceCycle(state);
      expect(overallExcellence).toBeGreaterThanOrEqual(0);
      expect(overallExcellence).toBeLessThanOrEqual(1);
    });
  });

  describe('getWritingExcellenceReport', () => {
    it('should return comprehensive report', () => {
      const report = getWritingExcellenceReport(state);
      expect(typeof report.flowConsistency).toBe('number');
      expect(typeof report.overallExcellence).toBe('number');
    });

    it('should include all subsystem scores', () => {
      const report = getWritingExcellenceReport(state);
      expect(typeof report.iterationVelocity).toBe('number');
      expect(typeof report.averageQuality).toBe('number');
      expect(typeof report.styleCoherence).toBe('number');
    });
  });

  describe('resetWritingExcellenceEngineState', () => {
    it('should reset all state', () => {
      const reset = resetWritingExcellenceEngineState();
      expect(reset.flow).toBeDefined();
      expect(reset.overallExcellence).toBe(0.5);
    });
  });
});