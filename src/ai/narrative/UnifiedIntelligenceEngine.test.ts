/**
 * V737 UnifiedIntelligenceEngine Tests — Direction E Iter 9/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createUnifiedIntelligenceEngineState,
  runUnifiedIntelligenceCycle,
  getUnifiedIntelligenceReport,
  resetUnifiedIntelligenceEngineState,
  type UnifiedIntelligenceEngineState,
} from './UnifiedIntelligenceEngine';

describe('UnifiedIntelligenceEngine', () => {
  let state: UnifiedIntelligenceEngineState;

  beforeEach(() => { state = createUnifiedIntelligenceEngineState(); });

  describe('createUnifiedIntelligenceEngineState', () => {
    it('should initialize all 8 sub-systems', () => {
      expect(state.core).toBeDefined();
      expect(state.semantic).toBeDefined();
      expect(state.context).toBeDefined();
      expect(state.reasoning).toBeDefined();
      expect(state.memory).toBeDefined();
      expect(state.pattern).toBeDefined();
      expect(state.synthesis).toBeDefined();
      expect(state.orchestration).toBeDefined();
    });

    it('should have correct version', () => {
      expect(state.version).toBe('2.0.0');
    });

    it('should have default overall intelligence', () => {
      expect(state.overallIntelligence).toBe(0.5);
    });
  });

  describe('runUnifiedIntelligenceCycle', () => {
    it('should run cycle and return metrics', () => {
      const { overallIntelligence, insights } = runUnifiedIntelligenceCycle(state);
      expect(typeof overallIntelligence).toBe('number');
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should generate insights for empty state', () => {
      const { insights } = runUnifiedIntelligenceCycle(state);
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should compute overall intelligence', () => {
      const { overallIntelligence } = runUnifiedIntelligenceCycle(state);
      expect(overallIntelligence).toBeGreaterThanOrEqual(0);
      expect(overallIntelligence).toBeLessThanOrEqual(1);
    });
  });

  describe('getUnifiedIntelligenceReport', () => {
    it('should return comprehensive report', () => {
      const report = getUnifiedIntelligenceReport(state);
      expect(typeof report.coreIQ).toBe('number');
      expect(typeof report.overallIntelligence).toBe('number');
    });

    it('should include all subsystem scores', () => {
      const report = getUnifiedIntelligenceReport(state);
      expect(typeof report.semanticDensity).toBe('number');
      expect(typeof report.contextCoherence).toBe('number');
      expect(typeof report.reasoningDepth).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getUnifiedIntelligenceReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetUnifiedIntelligenceEngineState', () => {
    it('should reset all state', () => {
      const reset = resetUnifiedIntelligenceEngineState();
      expect(reset.core).toBeDefined();
      expect(reset.overallIntelligence).toBe(0.5);
    });
  });
});