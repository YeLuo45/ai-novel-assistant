/**
 * V741 ContextualIntelligenceEngine Tests — Direction A Iter 2/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createContextualIntelligenceEngineState,
  captureContext,
  makeContextualDecision,
  getSnapshotsByLevel,
  getDecisionsByType,
  getContextualIntelligenceReport,
  resetContextualIntelligenceEngineState,
  type ContextualIntelligenceEngineState,
} from './ContextualIntelligenceEngine';

describe('ContextualIntelligenceEngine', () => {
  let state: ContextualIntelligenceEngineState;

  beforeEach(() => { state = createContextualIntelligenceEngineState(); });

  describe('createContextualIntelligenceEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.snapshots.size).toBe(0);
      expect(state.decisions.size).toBe(0);
    });
  });

  describe('captureContext', () => {
    it('should capture context', () => {
      const next = captureContext(state, 's1', 'immediate', { time: 0.8, space: 0.6 });
      expect(next.snapshots.size).toBe(1);
      expect(next.totalSnapshots).toBe(1);
    });

    it('should fill missing dimensions with 0.5', () => {
      const next = captureContext(state, 's1', 'short_term', { time: 0.8 });
      const snapshot = next.snapshots.get('s1');
      expect(snapshot?.dimensions.get('time')).toBe(0.8);
      expect(snapshot?.dimensions.get('space')).toBe(0.5);
    });

    it('should compute relevance', () => {
      const next = captureContext(state, 's1', 'global', { time: 0.9, space: 0.9, social: 0.9, emotional: 0.9, cultural: 0.9, linguistic: 0.9 });
      expect(next.snapshots.get('s1')?.relevance).toBeGreaterThan(0.5);
    });
  });

  describe('makeContextualDecision', () => {
    it('should make decision', () => {
      let next = captureContext(state, 's1', 'immediate', {});
      next = makeContextualDecision(next, 'd1', 's1', 'action', 'context demands action', 0.8);
      expect(next.totalDecisions).toBe(1);
    });
  });

  describe('getSnapshotsByLevel', () => {
    it('should filter by level', () => {
      let next = captureContext(state, 's1', 'immediate', {});
      next = captureContext(next, 's2', 'global', {});
      const immediate = getSnapshotsByLevel(next, 'immediate');
      expect(immediate.length).toBe(1);
    });
  });

  describe('getDecisionsByType', () => {
    it('should filter by decision type', () => {
      let next = captureContext(state, 's1', 'immediate', {});
      next = makeContextualDecision(next, 'd1', 's1', 'action', 'reasoning', 0.8);
      next = makeContextualDecision(next, 'd2', 's1', 'defer', 'reasoning', 0.5);
      const actions = getDecisionsByType(next, 'action');
      expect(actions.length).toBe(1);
    });
  });

  describe('getContextualIntelligenceReport', () => {
    it('should return comprehensive report', () => {
      const report = getContextualIntelligenceReport(state);
      expect(report.totalSnapshots).toBe(0);
      expect(typeof report.averageConfidence).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getContextualIntelligenceReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetContextualIntelligenceEngineState', () => {
    it('should reset all state', () => {
      let next = captureContext(state, 's1', 'immediate', {});
      next = resetContextualIntelligenceEngineState();
      expect(next.snapshots.size).toBe(0);
      expect(next.totalSnapshots).toBe(0);
    });
  });
});