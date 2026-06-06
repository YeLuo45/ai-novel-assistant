/**
 * V983 NarrativeAdaptiveOrchestratorCore Tests — Direction A Iter 9/15 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAdaptiveOrchestratorCoreState,
  addOrchestrationComponent,
  createOrchestrationPlan,
  getComponentsByMode,
  getOrchestratorReport,
  resetNarrativeAdaptiveOrchestratorCoreState,
  type NarrativeAdaptiveOrchestratorCoreState,
} from './NarrativeAdaptiveOrchestratorCore';

describe('NarrativeAdaptiveOrchestratorCore', () => {
  let state: NarrativeAdaptiveOrchestratorCoreState;

  beforeEach(() => { state = createNarrativeAdaptiveOrchestratorCoreState(); });

  describe('createNarrativeAdaptiveOrchestratorCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.components.size).toBe(0);
      expect(state.plans.size).toBe(0);
    });
  });

  describe('addOrchestrationComponent', () => {
    it('should add component', () => {
      const next = addOrchestrationComponent(state, 'c1', 'adaptive', 50, 100, 1);
      expect(next.components.size).toBe(1);
      expect(next.totalComponents).toBe(1);
      expect(next.components.get('c1')?.utilization).toBeCloseTo(0.5, 5);
    });
  });

  describe('createOrchestrationPlan', () => {
    it('should create plan', () => {
      let next = addOrchestrationComponent(state, 'c1', 'adaptive', 50, 100, 1);
      next = createOrchestrationPlan(next, 'p1', 'main plan', ['c1'], 'balanced');
      expect(next.totalPlans).toBe(1);
    });
  });

  describe('getComponentsByMode', () => {
    it('should filter by mode', () => {
      let next = addOrchestrationComponent(state, 'c1', 'adaptive', 50, 100, 1);
      next = addOrchestrationComponent(next, 'c2', 'reactive', 50, 100, 1);
      const adaptive = getComponentsByMode(next, 'adaptive');
      expect(adaptive.length).toBe(1);
    });
  });

  describe('getOrchestratorReport', () => {
    it('should return comprehensive report', () => {
      const report = getOrchestratorReport(state);
      expect(report.totalComponents).toBe(0);
      expect(typeof report.adaptiveOrchestrationMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getOrchestratorReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAdaptiveOrchestratorCoreState', () => {
    it('should reset all state', () => {
      let next = addOrchestrationComponent(state, 'c1', 'adaptive', 50, 100, 1);
      next = resetNarrativeAdaptiveOrchestratorCoreState();
      expect(next.components.size).toBe(0);
      expect(next.totalComponents).toBe(0);
    });
  });
});