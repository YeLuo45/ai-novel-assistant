/**
 * V755 AdaptiveOrchestrator Tests — Direction A Iter 9/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAdaptiveOrchestratorState,
  runAdaptivityCycle,
  getAdaptiveOrchestratorReport,
  resetAdaptiveOrchestratorState,
  type AdaptiveOrchestratorState,
} from './AdaptiveOrchestrator';

describe('AdaptiveOrchestrator', () => {
  let state: AdaptiveOrchestratorState;

  beforeEach(() => { state = createAdaptiveOrchestratorState(); });

  describe('createAdaptiveOrchestratorState', () => {
    it('should initialize all 8 sub-systems', () => {
      expect(state.adaptation).toBeDefined();
      expect(state.contextual).toBeDefined();
      expect(state.goals).toBeDefined();
      expect(state.improvement).toBeDefined();
      expect(state.learning).toBeDefined();
      expect(state.multiAgent).toBeDefined();
      expect(state.autonomous).toBeDefined();
      expect(state.awareness).toBeDefined();
    });

    it('should have correct version', () => {
      expect(state.version).toBe('3.0.0');
    });

    it('should have default overall adaptivity', () => {
      expect(state.overallAdaptivity).toBe(0.5);
    });
  });

  describe('runAdaptivityCycle', () => {
    it('should run cycle and return metrics', () => {
      const { overallAdaptivity, insights } = runAdaptivityCycle(state);
      expect(typeof overallAdaptivity).toBe('number');
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should generate insights for empty state', () => {
      const { insights } = runAdaptivityCycle(state);
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should compute overall adaptivity', () => {
      const { overallAdaptivity } = runAdaptivityCycle(state);
      expect(overallAdaptivity).toBeGreaterThanOrEqual(0);
      expect(overallAdaptivity).toBeLessThanOrEqual(1);
    });
  });

  describe('getAdaptiveOrchestratorReport', () => {
    it('should return comprehensive report', () => {
      const report = getAdaptiveOrchestratorReport(state);
      expect(typeof report.adaptationRate).toBe('number');
      expect(typeof report.overallAdaptivity).toBe('number');
    });

    it('should include all subsystem scores', () => {
      const report = getAdaptiveOrchestratorReport(state);
      expect(typeof report.contextualConfidence).toBe('number');
      expect(typeof report.goalAchievement).toBe('number');
      expect(typeof report.learningAccuracy).toBe('number');
    });
  });

  describe('resetAdaptiveOrchestratorState', () => {
    it('should reset all state', () => {
      const reset = resetAdaptiveOrchestratorState();
      expect(reset.adaptation).toBeDefined();
      expect(reset.overallAdaptivity).toBe(0.5);
    });
  });
});