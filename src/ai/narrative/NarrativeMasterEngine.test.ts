/**
 * V701 NarrativeMasterEngine Tests — Direction B Iter 9/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeMasterState,
  runMasterCycle,
  getMasterReport,
  resetNarrativeMasterState,
  type NarrativeMasterState,
} from './NarrativeMasterEngine';

describe('NarrativeMasterEngine', () => {
  let state: NarrativeMasterState;

  beforeEach(() => { state = createNarrativeMasterState(); });

  describe('createNarrativeMasterState', () => {
    it('should initialize all 8 sub-systems', () => {
      expect(state.structure).toBeDefined();
      expect(state.development).toBeDefined();
      expect(state.progression).toBeDefined();
      expect(state.world).toBeDefined();
      expect(state.dialogue).toBeDefined();
      expect(state.scenePacing).toBeDefined();
      expect(state.emotion).toBeDefined();
      expect(state.prose).toBeDefined();
    });

    it('should have correct version', () => {
      expect(state.version).toBe('2.0.0');
    });

    it('should have default overall score', () => {
      expect(state.overallScore).toBe(0.5);
    });
  });

  describe('runMasterCycle', () => {
    it('should run cycle and return metrics', () => {
      const { overallScore, insights } = runMasterCycle(state);
      expect(typeof overallScore).toBe('number');
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should generate insights for empty state', () => {
      const { insights } = runMasterCycle(state);
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should compute overall score', () => {
      const { overallScore } = runMasterCycle(state);
      expect(overallScore).toBeGreaterThanOrEqual(0);
      expect(overallScore).toBeLessThanOrEqual(1);
    });
  });

  describe('getMasterReport', () => {
    it('should return comprehensive report', () => {
      const report = getMasterReport(state);
      expect(typeof report.structureCompleteness).toBe('number');
      expect(typeof report.developmentProgress).toBe('number');
      expect(typeof report.overallScore).toBe('number');
    });

    it('should include all subsystem scores', () => {
      const report = getMasterReport(state);
      expect(typeof report.progressionScore).toBe('number');
      expect(typeof report.worldCoherence).toBe('number');
      expect(typeof report.dialogueQuality).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getMasterReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeMasterState', () => {
    it('should reset all state', () => {
      const reset = resetNarrativeMasterState();
      expect(reset.structure).toBeDefined();
      expect(reset.overallScore).toBe(0.5);
    });
  });
});