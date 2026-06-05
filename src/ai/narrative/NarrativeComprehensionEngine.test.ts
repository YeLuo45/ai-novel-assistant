/**
 * V817 NarrativeComprehensionEngine Tests — Direction E Iter 4/9 (Round 3)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeComprehensionEngineState,
  addComprehension,
  setComprehensionStatus,
  answerComprehensionQuestion,
  getComprehensionsByAspect,
  getComprehensionReport,
  resetNarrativeComprehensionEngineState,
  type NarrativeComprehensionEngineState,
} from './NarrativeComprehensionEngine';

describe('NarrativeComprehensionEngine', () => {
  let state: NarrativeComprehensionEngineState;

  beforeEach(() => { state = createNarrativeComprehensionEngineState(); });

  describe('createNarrativeComprehensionEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.comprehensions.size).toBe(0);
      expect(state.questions.size).toBe(0);
    });
  });

  describe('addComprehension', () => {
    it('should add comprehension', () => {
      const next = addComprehension(state, 'c1', 'theme', 'inferential', 'evidence', 'interpretation', 5, 0.7);
      expect(next.comprehensions.size).toBe(1);
      expect(next.totalComprehensions).toBe(1);
    });

    it('should clamp confidence', () => {
      const next = addComprehension(state, 'c1', 'theme', 'inferential', 'ev', 'int', 5, 1.5);
      expect(next.comprehensions.get('c1')?.confidence).toBe(1);
    });
  });

  describe('setComprehensionStatus', () => {
    it('should set status', () => {
      let next = addComprehension(state, 'c1', 'theme', 'inferential', 'ev', 'int', 5);
      next = setComprehensionStatus(next, 'c1', 'achieved');
      expect(next.comprehensions.get('c1')?.status).toBe('achieved');
    });
  });

  describe('answerComprehensionQuestion', () => {
    it('should record correct answer', () => {
      const next = answerComprehensionQuestion(state, 'q1', 'What is theme?', 'theme', 'love', 0.8);
      expect(next.correctAnswers).toBe(1);
    });

    it('should record incorrect answer', () => {
      const next = answerComprehensionQuestion(state, 'q1', 'q', 'theme', 'a', 0.4);
      expect(next.correctAnswers).toBe(0);
    });
  });

  describe('getComprehensionsByAspect', () => {
    it('should filter by aspect', () => {
      let next = addComprehension(state, 'c1', 'theme', 'inferential', 'ev', 'int', 5);
      next = addComprehension(next, 'c2', 'plot', 'literal', 'ev', 'int', 5);
      const themes = getComprehensionsByAspect(next, 'theme');
      expect(themes.length).toBe(1);
    });
  });

  describe('getComprehensionReport', () => {
    it('should return comprehensive report', () => {
      const report = getComprehensionReport(state);
      expect(report.totalComprehensions).toBe(0);
      expect(typeof report.comprehensionDepth).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getComprehensionReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeComprehensionEngineState', () => {
    it('should reset all state', () => {
      let next = addComprehension(state, 'c1', 'theme', 'inferential', 'ev', 'int', 5);
      next = resetNarrativeComprehensionEngineState();
      expect(next.comprehensions.size).toBe(0);
      expect(next.totalComprehensions).toBe(0);
    });
  });
});