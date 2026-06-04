/**
 * V665 NarrativeIntelligenceOrchestrator Tests — Direction E Iter 9/9
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeIntelligenceState,
  runIntelligenceCycle,
  getIntelligenceReport,
  resetNarrativeIntelligenceState,
  type NarrativeIntelligenceState,
} from './NarrativeIntelligenceOrchestrator';

describe('NarrativeIntelligenceOrchestrator', () => {
  let state: NarrativeIntelligenceState;

  beforeEach(() => { state = createNarrativeIntelligenceState(); });

  describe('createNarrativeIntelligenceState', () => {
    it('should initialize all 8 sub-systems', () => {
      expect(state.unified).toBeDefined();
      expect(state.reasoning).toBeDefined();
      expect(state.memory).toBeDefined();
      expect(state.knowledge).toBeDefined();
      expect(state.planning).toBeDefined();
      expect(state.evaluation).toBeDefined();
      expect(state.integration).toBeDefined();
      expect(state.consensus).toBeDefined();
    });

    it('should have correct version', () => {
      expect(state.version).toBe('2.0.0');
    });

    it('should have default overall intelligence', () => {
      expect(state.overallIntelligence).toBe(0.6);
    });
  });

  describe('runIntelligenceCycle', () => {
    it('should run cycle and return metrics', () => {
      const { overallIntelligence, insights } = runIntelligenceCycle(state);
      expect(typeof overallIntelligence).toBe('number');
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should update overall intelligence', () => {
      const { state: updated } = runIntelligenceCycle(state);
      expect(updated.overallIntelligence).toBeGreaterThanOrEqual(0);
    });

    it('should generate insights', () => {
      const { insights } = runIntelligenceCycle(state);
      expect(insights.length).toBeGreaterThan(0);
    });
  });

  describe('getIntelligenceReport', () => {
    it('should return comprehensive report', () => {
      const report = getIntelligenceReport(state);
      expect(typeof report.unifiedUnderstanding).toBe('number');
      expect(typeof report.reasoningDepth).toBe('number');
      expect(typeof report.overallIntelligence).toBe('number');
    });

    it('should include all subsystem scores', () => {
      const report = getIntelligenceReport(state);
      expect(typeof report.memoryCapacity).toBe('number');
      expect(typeof report.knowledgeDensity).toBe('number');
      expect(typeof report.planningProgress).toBe('number');
    });

    it('should include recommendations', () => {
      const report = getIntelligenceReport(state);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should report consensus level', () => {
      const report = getIntelligenceReport(state);
      expect(['divergent', 'negotiating', 'converging', 'agreed']).toContain(report.consensusLevel);
    });
  });

  describe('resetNarrativeIntelligenceState', () => {
    it('should reset all sub-systems', () => {
      const reset = resetNarrativeIntelligenceState();
      expect(reset.unified).toBeDefined();
      expect(reset.overallIntelligence).toBe(0.6);
    });
  });
});