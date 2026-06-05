/**
 * V841 ContextualReasoningEngine Tests — Direction A Iter 7/9 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createContextualReasoningEngineState,
  addContext,
  deactivateContext,
  addReasoningStep,
  getContextsByType,
  getContextualReasoningReport,
  resetContextualReasoningEngineState,
  type ContextualReasoningEngineState,
} from './ContextualReasoningEngine';

describe('ContextualReasoningEngine', () => {
  let state: ContextualReasoningEngineState;

  beforeEach(() => { state = createContextualReasoningEngineState(); });

  describe('createContextualReasoningEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.contexts.size).toBe(0);
      expect(state.steps.size).toBe(0);
    });
  });

  describe('addContext', () => {
    it('should add context', () => {
      const next = addContext(state, 'c1', 'situational', 'description', 0.8, ['data']);
      expect(next.contexts.size).toBe(1);
      expect(next.totalContexts).toBe(1);
    });

    it('should clamp relevance', () => {
      const next = addContext(state, 'c1', 'situational', 'desc', 1.5);
      expect(next.contexts.get('c1')?.relevance).toBe(1);
    });
  });

  describe('deactivateContext', () => {
    it('should deactivate', () => {
      let next = addContext(state, 'c1', 'situational', 'desc');
      next = deactivateContext(next, 'c1');
      expect(next.contexts.get('c1')?.active).toBe(false);
      expect(next.activeContexts).toBe(0);
    });
  });

  describe('addReasoningStep', () => {
    it('should add step', () => {
      let next = addContext(state, 'c1', 'situational', 'desc');
      next = addReasoningStep(next, 's1', 'deductive', 'c1', 'premise', 'conclusion', 'high');
      expect(next.totalSteps).toBe(1);
      expect(next.validSteps).toBe(1);
    });

    it('should mark invalid for low confidence', () => {
      let next = addContext(state, 'c1', 'situational', 'desc');
      next = addReasoningStep(next, 's1', 'deductive', 'c1', 'p', 'c', 'low');
      expect(next.validSteps).toBe(0);
    });
  });

  describe('getContextsByType', () => {
    it('should filter by type', () => {
      let next = addContext(state, 'c1', 'situational', 'desc');
      next = addContext(next, 'c2', 'cultural', 'desc');
      const situational = getContextsByType(next, 'situational');
      expect(situational.length).toBe(1);
    });
  });

  describe('getContextualReasoningReport', () => {
    it('should return comprehensive report', () => {
      const report = getContextualReasoningReport(state);
      expect(report.totalContexts).toBe(0);
      expect(typeof report.decisionQuality).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getContextualReasoningReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetContextualReasoningEngineState', () => {
    it('should reset all state', () => {
      let next = addContext(state, 'c1', 'situational', 'desc');
      next = resetContextualReasoningEngineState();
      expect(next.contexts.size).toBe(0);
      expect(next.totalContexts).toBe(0);
    });
  });
});