/**
 * V911 AdaptiveNarrativeEngine Tests — Direction D Iter 3/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAdaptiveNarrativeEngineState,
  addNarrativeAdaptation,
  addNarrativeFeedback,
  getAdaptationsByContext,
  getAdaptiveNarrativeReport,
  resetAdaptiveNarrativeEngineState,
  type AdaptiveNarrativeEngineState,
} from './AdaptiveNarrativeEngine';

describe('AdaptiveNarrativeEngine', () => {
  let state: AdaptiveNarrativeEngineState;

  beforeEach(() => { state = createAdaptiveNarrativeEngineState(); });

  describe('createAdaptiveNarrativeEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.adaptations.size).toBe(0);
      expect(state.feedback.size).toBe(0);
    });
  });

  describe('addNarrativeAdaptation', () => {
    it('should add adaptation', () => {
      const next = addNarrativeAdaptation(state, 'a1', 'reader_mood', 'intensify', 'proactive', 'desc', 1, 0.7);
      expect(next.adaptations.size).toBe(1);
      expect(next.totalAdaptations).toBe(1);
    });
  });

  describe('addNarrativeFeedback', () => {
    it('should add feedback', () => {
      let next = addNarrativeAdaptation(state, 'a1', 'reader_mood', 'intensify', 'proactive', 'desc', 1);
      next = addNarrativeFeedback(next, 'f1', 'a1', 'positive', 0.8, 'good', 2);
      expect(next.totalFeedback).toBe(1);
      expect(next.positiveFeedback).toBe(1);
    });
  });

  describe('getAdaptationsByContext', () => {
    it('should filter by context', () => {
      let next = addNarrativeAdaptation(state, 'a1', 'reader_mood', 'intensify', 'proactive', 'desc', 1);
      next = addNarrativeAdaptation(next, 'a2', 'genre', 'soften', 'reactive', 'desc', 1);
      const readerMood = getAdaptationsByContext(next, 'reader_mood');
      expect(readerMood.length).toBe(1);
    });
  });

  describe('getAdaptiveNarrativeReport', () => {
    it('should return comprehensive report', () => {
      const report = getAdaptiveNarrativeReport(state);
      expect(report.totalAdaptations).toBe(0);
      expect(typeof report.adaptiveMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getAdaptiveNarrativeReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetAdaptiveNarrativeEngineState', () => {
    it('should reset all state', () => {
      let next = addNarrativeAdaptation(state, 'a1', 'reader_mood', 'intensify', 'proactive', 'desc', 1);
      next = resetAdaptiveNarrativeEngineState();
      expect(next.adaptations.size).toBe(0);
      expect(next.totalAdaptations).toBe(0);
    });
  });
});