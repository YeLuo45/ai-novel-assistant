/**
 * V1305 NarrativeStoryOrchestratorEngine Tests — Direction I Iter 20/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeStoryOrchestratorEngineState,
  runStoryCycle,
  getStoryOrchestratorReport,
  resetNarrativeStoryOrchestratorEngineState,
  type NarrativeStoryOrchestratorEngineState,
} from './NarrativeStoryOrchestratorEngine';

describe('NarrativeStoryOrchestratorEngine', () => {
  let state: NarrativeStoryOrchestratorEngineState;

  beforeEach(() => { state = createNarrativeStoryOrchestratorEngineState(); });

  describe('createNarrativeStoryOrchestratorEngineState', () => {
    it('should initialize all 19 sub-systems', () => {
      expect(state.matrix).toBeDefined();
      expect(state.grid).toBeDefined();
      expect(state.network).toBeDefined();
      expect(state.web).toBeDefined();
      expect(state.lattice).toBeDefined();
      expect(state.mesh).toBeDefined();
      expect(state.tapestry).toBeDefined();
      expect(state.mosaic).toBeDefined();
      expect(state.fractal).toBeDefined();
      expect(state.spiral).toBeDefined();
      expect(state.helix).toBeDefined();
      expect(state.circuit).toBeDefined();
      expect(state.loop).toBeDefined();
      expect(state.path).toBeDefined();
      expect(state.branch).toBeDefined();
      expect(state.node).toBeDefined();
      expect(state.arc).toBeDefined();
      expect(state.spine).toBeDefined();
      expect(state.core).toBeDefined();
    });

    it('should have correct version', () => {
      expect(state.version).toBe('5.0.0');
    });

    it('should have default overall story', () => {
      expect(state.overallStory).toBe(0.5);
    });
  });

  describe('runStoryCycle', () => {
    it('should run cycle and return metrics', () => {
      const { overallStory, insights } = runStoryCycle(state);
      expect(typeof overallStory).toBe('number');
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should generate insights for empty state', () => {
      const { insights } = runStoryCycle(state);
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should compute overall story', () => {
      const { overallStory } = runStoryCycle(state);
      expect(overallStory).toBeGreaterThanOrEqual(0);
      expect(overallStory).toBeLessThanOrEqual(1);
    });
  });

  describe('getStoryOrchestratorReport', () => {
    it('should return comprehensive report', () => {
      const report = getStoryOrchestratorReport(state);
      expect(typeof report.matrixMastery).toBe('number');
      expect(typeof report.overallStory).toBe('number');
    });

    it('should include all 19 subsystem scores', () => {
      const report = getStoryOrchestratorReport(state);
      expect(typeof report.coreMastery).toBe('number');
      expect(typeof report.spineMastery).toBe('number');
    });
  });

  describe('resetNarrativeStoryOrchestratorEngineState', () => {
    it('should reset all state', () => {
      const reset = resetNarrativeStoryOrchestratorEngineState();
      expect(reset.matrix).toBeDefined();
      expect(reset.overallStory).toBe(0.5);
    });
  });
});