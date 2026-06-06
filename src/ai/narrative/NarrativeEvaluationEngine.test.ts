/**
 * V951 NarrativeEvaluationEngine Tests — Direction E Iter 8/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeEvaluationEngineState,
  addEvaluation,
  addEvaluationProfile,
  getEvaluationsByCriterion,
  getEvaluationReport,
  resetNarrativeEvaluationEngineState,
  type NarrativeEvaluationEngineState,
} from './NarrativeEvaluationEngine';

describe('NarrativeEvaluationEngine', () => {
  let state: NarrativeEvaluationEngineState;

  beforeEach(() => { state = createNarrativeEvaluationEngineState(); });

  describe('createNarrativeEvaluationEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.evaluations.size).toBe(0);
      expect(state.profiles.size).toBe(0);
    });
  });

  describe('addEvaluation', () => {
    it('should add evaluation', () => {
      const next = addEvaluation(state, 'e1', 'craft', 'rubric', 'excellent', 0.8, 'notes', 'critic1', 1);
      expect(next.evaluations.size).toBe(1);
      expect(next.totalEvaluations).toBe(1);
    });
  });

  describe('addEvaluationProfile', () => {
    it('should add profile', () => {
      let next = addEvaluation(state, 'e1', 'craft', 'rubric', 'excellent', 0.8, 'notes', 'critic1', 1);
      next = addEvaluationProfile(next, 'p1', 'Chapter 1', ['e1'], 'strong craft', 'weak plot');
      expect(next.totalProfiles).toBe(1);
    });
  });

  describe('getEvaluationsByCriterion', () => {
    it('should filter by criterion', () => {
      let next = addEvaluation(state, 'e1', 'craft', 'rubric', 'excellent', 0.8, 'notes', 'critic1', 1);
      next = addEvaluation(next, 'e2', 'originality', 'rubric', 'good', 0.7, 'notes', 'critic1', 1);
      const craft = getEvaluationsByCriterion(next, 'craft');
      expect(craft.length).toBe(1);
    });
  });

  describe('getEvaluationReport', () => {
    it('should return comprehensive report', () => {
      const report = getEvaluationReport(state);
      expect(report.totalEvaluations).toBe(0);
      expect(typeof report.evaluationMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getEvaluationReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeEvaluationEngineState', () => {
    it('should reset all state', () => {
      let next = addEvaluation(state, 'e1', 'craft', 'rubric', 'excellent', 0.8, 'notes', 'critic1', 1);
      next = resetNarrativeEvaluationEngineState();
      expect(next.evaluations.size).toBe(0);
      expect(next.totalEvaluations).toBe(0);
    });
  });
});