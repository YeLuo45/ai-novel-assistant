/**
 * V1149 NarrativeSentenceShapeEngine Tests — Direction F Iter 2/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeSentenceShapeEngineState,
  addSentenceShape,
  addSentenceShapePattern,
  getSentenceShapesByType,
  getSentenceShapeReport,
  resetNarrativeSentenceShapeEngineState,
  type NarrativeSentenceShapeEngineState,
} from './NarrativeSentenceShapeEngine';

describe('NarrativeSentenceShapeEngine', () => {
  let state: NarrativeSentenceShapeEngineState;

  beforeEach(() => { state = createNarrativeSentenceShapeEngineState(); });

  describe('createNarrativeSentenceShapeEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.shapes.size).toBe(0);
      expect(state.patterns.size).toBe(0);
    });
  });

  describe('addSentenceShape', () => {
    it('should add shape', () => {
      const next = addSentenceShape(state, 's1', 'periodic', 'long', 'open', 'desc', 0.85, 0.9, 1);
      expect(next.shapes.size).toBe(1);
      expect(next.totalShapes).toBe(1);
    });
  });

  describe('addSentenceShapePattern', () => {
    it('should add pattern', () => {
      let next = addSentenceShape(state, 's1', 'periodic', 'long', 'open', 'desc', 0.85, 0.9, 1);
      next = addSentenceShapePattern(next, 'p1', ['s1']);
      expect(next.totalPatterns).toBe(1);
    });
  });

  describe('getSentenceShapesByType', () => {
    it('should filter by type', () => {
      let next = addSentenceShape(state, 's1', 'periodic', 'long', 'open', 'desc', 0.85, 0.9, 1);
      next = addSentenceShape(next, 's2', 'simple', 'long', 'open', 'desc', 0.85, 0.9, 1);
      const periodic = getSentenceShapesByType(next, 'periodic');
      expect(periodic.length).toBe(1);
    });
  });

  describe('getSentenceShapeReport', () => {
    it('should return comprehensive report', () => {
      const report = getSentenceShapeReport(state);
      expect(report.totalShapes).toBe(0);
      expect(typeof report.sentenceShapeMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getSentenceShapeReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeSentenceShapeEngineState', () => {
    it('should reset all state', () => {
      let next = addSentenceShape(state, 's1', 'periodic', 'long', 'open', 'desc', 0.85, 0.9, 1);
      next = resetNarrativeSentenceShapeEngineState();
      expect(next.shapes.size).toBe(0);
      expect(next.totalShapes).toBe(0);
    });
  });
});