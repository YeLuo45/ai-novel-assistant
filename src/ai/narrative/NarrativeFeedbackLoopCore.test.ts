/**
 * V973 NarrativeFeedbackLoopCore Tests — Direction A Iter 4/15 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeFeedbackLoopCoreState,
  addFeedbackSignal,
  createFeedbackLoop,
  getSignalsByType,
  getFeedbackLoopReport,
  resetNarrativeFeedbackLoopCoreState,
  type NarrativeFeedbackLoopCoreState,
} from './NarrativeFeedbackLoopCore';

describe('NarrativeFeedbackLoopCore', () => {
  let state: NarrativeFeedbackLoopCoreState;

  beforeEach(() => { state = createNarrativeFeedbackLoopCoreState(); });

  describe('createNarrativeFeedbackLoopCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.signals.size).toBe(0);
      expect(state.loops.size).toBe(0);
    });
  });

  describe('addFeedbackSignal', () => {
    it('should add signal', () => {
      const next = addFeedbackSignal(state, 's1', 'positive', 'reader', 'sense', 'desc', 0.7, 0.8, 1);
      expect(next.signals.size).toBe(1);
      expect(next.totalSignals).toBe(1);
    });
  });

  describe('createFeedbackLoop', () => {
    it('should create loop', () => {
      let next = addFeedbackSignal(state, 's1', 'positive', 'reader', 'sense', 'desc', 0.7, 0.8, 1);
      next = createFeedbackLoop(next, 'l1', 'main loop', ['s1']);
      expect(next.totalLoops).toBe(1);
    });
  });

  describe('getSignalsByType', () => {
    it('should filter by type', () => {
      let next = addFeedbackSignal(state, 's1', 'positive', 'reader', 'sense', 'desc', 0.7, 0.8, 1);
      next = addFeedbackSignal(next, 's2', 'negative', 'reader', 'sense', 'desc', 0.7, 0.3, 1);
      const positive = getSignalsByType(next, 'positive');
      expect(positive.length).toBe(1);
    });
  });

  describe('getFeedbackLoopReport', () => {
    it('should return comprehensive report', () => {
      const report = getFeedbackLoopReport(state);
      expect(report.totalSignals).toBe(0);
      expect(typeof report.feedbackMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getFeedbackLoopReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeFeedbackLoopCoreState', () => {
    it('should reset all state', () => {
      let next = addFeedbackSignal(state, 's1', 'positive', 'reader', 'sense', 'desc', 0.7, 0.8, 1);
      next = resetNarrativeFeedbackLoopCoreState();
      expect(next.signals.size).toBe(0);
      expect(next.totalSignals).toBe(0);
    });
  });
});