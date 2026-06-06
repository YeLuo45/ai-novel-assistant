/**
 * V939 NarrativePerceptionEngine Tests — Direction E Iter 2/15 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativePerceptionEngineState,
  addNarrativePercept,
  createPerceptionLayer,
  getPerceptsByMode,
  getPerceptionReport,
  resetNarrativePerceptionEngineState,
  type NarrativePerceptionEngineState,
} from './NarrativePerceptionEngine';

describe('NarrativePerceptionEngine', () => {
  let state: NarrativePerceptionEngineState;

  beforeEach(() => { state = createNarrativePerceptionEngineState(); });

  describe('createNarrativePerceptionEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.percepts.size).toBe(0);
      expect(state.layers.size).toBe(0);
    });
  });

  describe('addNarrativePercept', () => {
    it('should add percept', () => {
      const next = addNarrativePercept(state, 'p1', 'visual', 'vivid', 'deep', 'desc', 0.7, 1);
      expect(next.percepts.size).toBe(1);
      expect(next.totalPercepts).toBe(1);
    });
  });

  describe('createPerceptionLayer', () => {
    it('should create layer', () => {
      let next = addNarrativePercept(state, 'p1', 'visual', 'vivid', 'deep', 'desc', 0.7, 1);
      next = addNarrativePercept(next, 'p2', 'auditory', 'vivid', 'deep', 'desc', 0.7, 1);
      next = createPerceptionLayer(next, 'l1', ['p1', 'p2'], 'deep');
      expect(next.totalLayers).toBe(1);
    });
  });

  describe('getPerceptsByMode', () => {
    it('should filter by mode', () => {
      let next = addNarrativePercept(state, 'p1', 'visual', 'vivid', 'deep', 'desc', 0.7, 1);
      next = addNarrativePercept(next, 'p2', 'auditory', 'vivid', 'deep', 'desc', 0.7, 1);
      const visual = getPerceptsByMode(next, 'visual');
      expect(visual.length).toBe(1);
    });
  });

  describe('getPerceptionReport', () => {
    it('should return comprehensive report', () => {
      const report = getPerceptionReport(state);
      expect(report.totalPercepts).toBe(0);
      expect(typeof report.perceptionMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getPerceptionReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativePerceptionEngineState', () => {
    it('should reset all state', () => {
      let next = addNarrativePercept(state, 'p1', 'visual', 'vivid', 'deep', 'desc', 0.7, 1);
      next = resetNarrativePerceptionEngineState();
      expect(next.percepts.size).toBe(0);
      expect(next.totalPercepts).toBe(0);
    });
  });
});