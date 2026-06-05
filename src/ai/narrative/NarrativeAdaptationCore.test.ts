/**
 * V739 NarrativeAdaptationCore Tests — Direction A Iter 1/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeAdaptationCoreState,
  addAdaptationRule,
  triggerAdaptation,
  completeAdaptation,
  toggleAdaptationRule,
  getAdaptationRulesByType,
  getAdaptationEventsByTrigger,
  getAdaptationCoreReport,
  resetNarrativeAdaptationCoreState,
  type NarrativeAdaptationCoreState,
} from './NarrativeAdaptationCore';

describe('NarrativeAdaptationCore', () => {
  let state: NarrativeAdaptationCoreState;

  beforeEach(() => { state = createNarrativeAdaptationCoreState(); });

  describe('createNarrativeAdaptationCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.rules.size).toBe(0);
      expect(state.events.size).toBe(0);
    });

    it('should have default stability', () => {
      expect(state.stabilityScore).toBe(0.7);
    });
  });

  describe('addAdaptationRule', () => {
    it('should add rule', () => {
      const next = addAdaptationRule(state, 'r1', 'content', 'feedback', 'low engagement', 'add hook', 0.5);
      expect(next.rules.size).toBe(1);
      expect(next.totalRules).toBe(1);
    });

    it('should count active rules', () => {
      const next = addAdaptationRule(state, 'r1', 'content', 'feedback', 'low', 'adjust', 0.5, true);
      expect(next.activeRules).toBe(1);
    });

    it('should not count inactive rules as active', () => {
      const next = addAdaptationRule(state, 'r1', 'content', 'feedback', 'low', 'adjust', 0.5, false);
      expect(next.activeRules).toBe(0);
    });
  });

  describe('triggerAdaptation', () => {
    it('should trigger adaptation', () => {
      let next = addAdaptationRule(state, 'r1', 'content', 'feedback', 'low', 'adjust', 0.5);
      next = triggerAdaptation(next, 'e1', 'r1', 0.3, 0.5, 0.6);
      expect(next.totalEvents).toBe(1);
    });

    it('should return state for unknown rule', () => {
      const next = triggerAdaptation(state, 'e1', 'unknown', 0.3, 0.5, 0.6);
      expect(next.totalEvents).toBe(0);
    });
  });

  describe('completeAdaptation', () => {
    it('should complete adaptation', () => {
      let next = addAdaptationRule(state, 'r1', 'content', 'feedback', 'low', 'adjust', 0.5);
      next = triggerAdaptation(next, 'e1', 'r1', 0.3, 0.5, 0.6);
      next = completeAdaptation(next, 'e1', true);
      expect(next.events.get('e1')?.status).toBe('completed');
      expect(next.successfulAdaptations).toBe(1);
    });

    it('should mark as overridden on failure', () => {
      let next = addAdaptationRule(state, 'r1', 'content', 'feedback', 'low', 'adjust', 0.5);
      next = triggerAdaptation(next, 'e1', 'r1', 0.3, 0.5, 0.6);
      next = completeAdaptation(next, 'e1', false);
      expect(next.events.get('e1')?.status).toBe('overridden');
    });
  });

  describe('toggleAdaptationRule', () => {
    it('should toggle rule', () => {
      let next = addAdaptationRule(state, 'r1', 'content', 'feedback', 'low', 'adjust', 0.5);
      next = toggleAdaptationRule(next, 'r1', false);
      expect(next.rules.get('r1')?.active).toBe(false);
      expect(next.activeRules).toBe(0);
    });

    it('should re-enable rule', () => {
      let next = addAdaptationRule(state, 'r1', 'content', 'feedback', 'low', 'adjust', 0.5, false);
      next = toggleAdaptationRule(next, 'r1', true);
      expect(next.activeRules).toBe(1);
    });

    it('should return state for unknown rule', () => {
      const next = toggleAdaptationRule(state, 'unknown', true);
      expect(next.totalRules).toBe(0);
    });
  });

  describe('getAdaptationRulesByType', () => {
    it('should filter by type', () => {
      let next = addAdaptationRule(state, 'r1', 'content', 'feedback', 'low', 'adjust', 0.5);
      next = addAdaptationRule(next, 'r2', 'style', 'metric', 'high', 'refine', 0.5);
      const content = getAdaptationRulesByType(next, 'content');
      expect(content.length).toBe(1);
    });
  });

  describe('getAdaptationEventsByTrigger', () => {
    it('should filter by trigger', () => {
      let next = addAdaptationRule(state, 'r1', 'content', 'feedback', 'low', 'adjust', 0.5);
      next = triggerAdaptation(next, 'e1', 'r1', 0.3, 0.5, 0.6);
      const events = getAdaptationEventsByTrigger(next, 'feedback');
      expect(events.length).toBe(1);
    });
  });

  describe('getAdaptationCoreReport', () => {
    it('should return comprehensive report', () => {
      const report = getAdaptationCoreReport(state);
      expect(report.totalRules).toBe(0);
      expect(typeof report.adaptationRate).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAdaptationCoreReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeAdaptationCoreState', () => {
    it('should reset all state', () => {
      let next = addAdaptationRule(state, 'r1', 'content', 'feedback', 'low', 'adjust', 0.5);
      next = resetNarrativeAdaptationCoreState();
      expect(next.rules.size).toBe(0);
      expect(next.totalRules).toBe(0);
    });
  });
});