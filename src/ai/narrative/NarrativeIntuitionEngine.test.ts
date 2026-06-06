/**
 * V937 NarrativeIntuitionEngine Tests — Direction E Iter 1/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeIntuitionEngineState,
  recordIntuitiveInsight,
  addIntuitivePattern,
  getInsightsByType,
  getIntuitionReport,
  resetNarrativeIntuitionEngineState,
  type NarrativeIntuitionEngineState,
} from './NarrativeIntuitionEngine';

describe('NarrativeIntuitionEngine', () => {
  let state: NarrativeIntuitionEngineState;

  beforeEach(() => { state = createNarrativeIntuitionEngineState(); });

  describe('createNarrativeIntuitionEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.insights.size).toBe(0);
      expect(state.patterns.size).toBe(0);
    });
  });

  describe('recordIntuitiveInsight', () => {
    it('should record', () => {
      const next = recordIntuitiveInsight(state, 'i1', 'creative', 'pattern_recognition', 'feeling', 'desc', 0.7, 1);
      expect(next.insights.size).toBe(1);
      expect(next.totalInsights).toBe(1);
    });

    it('should clamp accuracy', () => {
      const next = recordIntuitiveInsight(state, 'i1', 'creative', 'pattern_recognition', 'feeling', 'desc', 1.5, 1);
      expect(next.insights.get('i1')?.accuracy).toBe(1);
    });
  });

  describe('addIntuitivePattern', () => {
    it('should add pattern', () => {
      let next = recordIntuitiveInsight(state, 'i1', 'creative', 'pattern_recognition', 'feeling', 'desc', 0.7, 1);
      next = addIntuitivePattern(next, 'p1', 'creative flow', ['i1']);
      expect(next.totalPatterns).toBe(1);
    });
  });

  describe('getInsightsByType', () => {
    it('should filter by type', () => {
      let next = recordIntuitiveInsight(state, 'i1', 'creative', 'pattern_recognition', 'feeling', 'desc', 0.7, 1);
      next = recordIntuitiveInsight(next, 'i2', 'emotional', 'experience', 'conviction', 'desc', 0.7, 1);
      const creative = getInsightsByType(next, 'creative');
      expect(creative.length).toBe(1);
    });
  });

  describe('getIntuitionReport', () => {
    it('should return comprehensive report', () => {
      const report = getIntuitionReport(state);
      expect(report.totalInsights).toBe(0);
      expect(typeof report.intuitionMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getIntuitionReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeIntuitionEngineState', () => {
    it('should reset all state', () => {
      let next = recordIntuitiveInsight(state, 'i1', 'creative', 'pattern_recognition', 'feeling', 'desc', 0.7, 1);
      next = resetNarrativeIntuitionEngineState();
      expect(next.insights.size).toBe(0);
      expect(next.totalInsights).toBe(0);
    });
  });
});