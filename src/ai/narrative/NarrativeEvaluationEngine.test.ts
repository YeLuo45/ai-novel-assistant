/**
 * V659 NarrativeEvaluationEngine Tests — Direction E Iter 6/9
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeEvaluationState,
  addMetricScore,
  evaluateNarrative,
  recordEvaluation,
  getEvaluationReport,
  resetNarrativeEvaluationState,
  type NarrativeEvaluationState,
} from './NarrativeEvaluationEngine';

describe('NarrativeEvaluationEngine', () => {
  let state: NarrativeEvaluationState;

  beforeEach(() => { state = createNarrativeEvaluationState(); });

  describe('createNarrativeEvaluationState', () => {
    it('should initialize with defaults', () => {
      expect(state.scores).toEqual([]);
      expect(state.evaluationCount).toBe(0);
    });

    it('should have default confidence', () => {
      expect(state.averageConfidence).toBe(0.8);
    });
  });

  describe('addMetricScore', () => {
    it('should add metric score', () => {
      const next = addMetricScore(state, 'coherence', 0.8, 1, 'structural', 'Good flow');
      expect(next.scores.length).toBe(1);
      expect(next.scores[0]?.metric).toBe('coherence');
    });

    it('should clamp score to 0-1', () => {
      const next = addMetricScore(state, 'engagement', 1.5, 1, 'semantic');
      expect(next.scores[0]?.score).toBe(1);
    });

    it('should compute overall score', () => {
      const next = addMetricScore(state, 'coherence', 0.8, 1, 'surface');
      expect(next.overallScore).toBeGreaterThan(0);
    });

    it('should set reasoning', () => {
      const next = addMetricScore(state, 'originality', 0.7, 1, 'holistic', 'Creative elements');
      expect(next.scores[0]?.reasoning).toBe('Creative elements');
    });
  });

  describe('evaluateNarrative', () => {
    it('should return evaluation result', () => {
      let next = addMetricScore(state, 'coherence', 0.8, 1, 'surface');
      next = addMetricScore(next, 'engagement', 0.6, 1, 'surface');
      const result = evaluateNarrative(next);
      expect(typeof result.overallScore).toBe('number');
      expect(Array.isArray(result.dominantMetrics)).toBe(true);
    });

    it('should identify dominant and weakest metrics', () => {
      let next = addMetricScore(state, 'coherence', 0.9, 1, 'surface');
      next = addMetricScore(next, 'engagement', 0.4, 1, 'surface');
      const result = evaluateNarrative(next);
      expect(result.dominantMetrics).toContain('coherence');
      expect(result.weakestMetrics).toContain('engagement');
    });

    it('should include recommendations', () => {
      const result = evaluateNarrative(state);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should return empty for no scores', () => {
      const result = evaluateNarrative(state);
      expect(result.overallScore).toBe(0);
      expect(result.dominantMetrics).toEqual([]);
    });
  });

  describe('recordEvaluation', () => {
    it('should record evaluation to history', () => {
      let next = addMetricScore(state, 'coherence', 0.8, 1, 'surface');
      next = recordEvaluation(next);
      expect(next.evaluationHistory.length).toBe(1);
      expect(next.evaluationCount).toBe(1);
    });

    it('should clear current scores', () => {
      let next = addMetricScore(state, 'coherence', 0.8, 1, 'surface');
      next = recordEvaluation(next);
      expect(next.scores.length).toBe(0);
    });
  });

  describe('getEvaluationReport', () => {
    it('should return comprehensive report', () => {
      const report = getEvaluationReport(state);
      expect(typeof report.evaluationCount).toBe('number');
      expect(typeof report.averageConfidence).toBe('number');
    });

    it('should compute average overall score from history', () => {
      let next = addMetricScore(state, 'coherence', 0.8, 1, 'surface');
      next = recordEvaluation(next);
      next = addMetricScore(next, 'engagement', 0.6, 1, 'surface');
      next = recordEvaluation(next);
      const report = getEvaluationReport(next);
      expect(report.averageOverallScore).toBeGreaterThan(0);
    });

    it('should include recommendations', () => {
      const report = getEvaluationReport(state);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });

  describe('resetNarrativeEvaluationState', () => {
    it('should reset all state', () => {
      let next = addMetricScore(state, 'coherence', 0.8, 1, 'surface');
      next = recordEvaluation(next);
      next = resetNarrativeEvaluationState();
      expect(next.evaluationCount).toBe(0);
      expect(next.evaluationHistory.length).toBe(0);
    });
  });
});