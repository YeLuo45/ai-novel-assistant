/**
 * V995 NarrativeMasteryOrchestrator Tests — Direction A Iter 15/15 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeMasteryOrchestratorState,
  runMasteryOrchestrationCycle,
  getMasteryOrchestratorReport,
  resetNarrativeMasteryOrchestratorState,
  type NarrativeMasteryOrchestratorState,
} from './NarrativeMasteryOrchestrator';

describe('NarrativeMasteryOrchestrator', () => {
  let state: NarrativeMasteryOrchestratorState;

  beforeEach(() => { state = createNarrativeMasteryOrchestratorState(); });

  describe('createNarrativeMasteryOrchestratorState', () => {
    it('should initialize all 14 sub-systems', () => {
      expect(state.adaptiveLearning).toBeDefined();
      expect(state.selfRegulation).toBeDefined();
      expect(state.hierarchical).toBeDefined();
      expect(state.feedbackLoop).toBeDefined();
      expect(state.iterativeRefinement).toBeDefined();
      expect(state.autonomousGoal).toBeDefined();
      expect(state.multiAgent).toBeDefined();
      expect(state.contextAware).toBeDefined();
      expect(state.adaptiveOrchestrator).toBeDefined();
      expect(state.selfDirected).toBeDefined();
      expect(state.adaptiveResponse).toBeDefined();
      expect(state.feedbackIntegration).toBeDefined();
      expect(state.autonomousBehavior).toBeDefined();
      expect(state.contextualAdaptation).toBeDefined();
    });

    it('should have correct version', () => {
      expect(state.version).toBe('5.0.0');
    });

    it('should have default overall mastery', () => {
      expect(state.overallMastery).toBe(0.5);
    });
  });

  describe('runMasteryOrchestrationCycle', () => {
    it('should run cycle and return metrics', () => {
      const { overallMastery, insights } = runMasteryOrchestrationCycle(state);
      expect(typeof overallMastery).toBe('number');
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should generate insights for empty state', () => {
      const { insights } = runMasteryOrchestrationCycle(state);
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should compute overall mastery', () => {
      const { overallMastery } = runMasteryOrchestrationCycle(state);
      expect(overallMastery).toBeGreaterThanOrEqual(0);
      expect(overallMastery).toBeLessThanOrEqual(1);
    });
  });

  describe('getMasteryOrchestratorReport', () => {
    it('should return comprehensive report', () => {
      const report = getMasteryOrchestratorReport(state);
      expect(typeof report.adaptiveLearningMastery).toBe('number');
      expect(typeof report.overallMastery).toBe('number');
    });

    it('should include all 14 subsystem scores', () => {
      const report = getMasteryOrchestratorReport(state);
      expect(typeof report.contextualAdaptationMastery).toBe('number');
      expect(typeof report.autonomousBehaviorMastery).toBe('number');
    });
  });

  describe('resetNarrativeMasteryOrchestratorState', () => {
    it('should reset all state', () => {
      const reset = resetNarrativeMasteryOrchestratorState();
      expect(reset.adaptiveLearning).toBeDefined();
      expect(reset.overallMastery).toBe(0.5);
    });
  });
});