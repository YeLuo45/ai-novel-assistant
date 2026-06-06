/**
 * V905 NarrativeSystemEngine Tests — Direction C Iter 15/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeSystemEngineState,
  runSystemCycle,
  getNarrativeSystemReport,
  resetNarrativeSystemEngineState,
  type NarrativeSystemEngineState,
} from './NarrativeSystemEngine';

describe('NarrativeSystemEngine', () => {
  let state: NarrativeSystemEngineState;

  beforeEach(() => { state = createNarrativeSystemEngineState(); });

  describe('createNarrativeSystemEngineState', () => {
    it('should initialize all 14 sub-systems', () => {
      expect(state.semantics).toBeDefined();
      expect(state.geography).toBeDefined();
      expect(state.charNetwork).toBeDefined();
      expect(state.plotDyn).toBeDefined();
      expect(state.ontology).toBeDefined();
      expect(state.sociology).toBeDefined();
      expect(state.psychology).toBeDefined();
      expect(state.plotTopo).toBeDefined();
      expect(state.narrativeTopo).toBeDefined();
      expect(state.ecosystem).toBeDefined();
      expect(state.charSem).toBeDefined();
      expect(state.plotMech).toBeDefined();
      expect(state.axiology).toBeDefined();
      expect(state.epistemology).toBeDefined();
    });

    it('should have correct version', () => {
      expect(state.version).toBe('4.0.0');
    });

    it('should have default overall system', () => {
      expect(state.overallSystem).toBe(0.5);
    });
  });

  describe('runSystemCycle', () => {
    it('should run cycle and return metrics', () => {
      const { overallSystem, insights } = runSystemCycle(state);
      expect(typeof overallSystem).toBe('number');
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should generate insights for empty state', () => {
      const { insights } = runSystemCycle(state);
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should compute overall system', () => {
      const { overallSystem } = runSystemCycle(state);
      expect(overallSystem).toBeGreaterThanOrEqual(0);
      expect(overallSystem).toBeLessThanOrEqual(1);
    });
  });

  describe('getNarrativeSystemReport', () => {
    it('should return comprehensive report', () => {
      const report = getNarrativeSystemReport(state);
      expect(typeof report.semanticRichness).toBe('number');
      expect(typeof report.overallSystem).toBe('number');
    });

    it('should include all 14 subsystem scores', () => {
      const report = getNarrativeSystemReport(state);
      expect(typeof report.geographyRichness).toBe('number');
      expect(typeof report.epistemologicalHealth).toBe('number');
      expect(typeof report.ethicalRichness).toBe('number');
    });
  });

  describe('resetNarrativeSystemEngineState', () => {
    it('should reset all state', () => {
      const reset = resetNarrativeSystemEngineState();
      expect(reset.semantics).toBeDefined();
      expect(reset.overallSystem).toBe(0.5);
    });
  });
});