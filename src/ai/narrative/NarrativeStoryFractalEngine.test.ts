/**
 * V1283 NarrativeStoryFractalEngine Tests — Direction I Iter 9/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeStoryFractalEngineState,
  addStoryFractalNode,
  addStoryFractalLevel,
  getStoryFractalNodesByPattern,
  getStoryFractalReport,
  resetNarrativeStoryFractalEngineState,
  type NarrativeStoryFractalEngineState,
} from './NarrativeStoryFractalEngine';

describe('NarrativeStoryFractalEngine', () => {
  let state: NarrativeStoryFractalEngineState;

  beforeEach(() => { state = createNarrativeStoryFractalEngineState(); });

  describe('createNarrativeStoryFractalEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.fractals.size).toBe(0);
      expect(state.levels.size).toBe(0);
    });
  });

  describe('addStoryFractalNode', () => {
    it('should add fractal', () => {
      const next = addStoryFractalNode(state, 'f1', 'infinite', 'cosmic', 'infinite', 'desc', 0.95, 0.9, 1);
      expect(next.fractals.size).toBe(1);
      expect(next.totalFractals).toBe(1);
    });
  });

  describe('addStoryFractalLevel', () => {
    it('should add level', () => {
      let next = addStoryFractalNode(state, 'f1', 'infinite', 'cosmic', 'infinite', 'desc', 0.95, 0.9, 1);
      next = addStoryFractalLevel(next, 'l1', ['f1']);
      expect(next.totalLevels).toBe(1);
    });
  });

  describe('getStoryFractalNodesByPattern', () => {
    it('should filter by pattern', () => {
      let next = addStoryFractalNode(state, 'f1', 'infinite', 'cosmic', 'infinite', 'desc', 0.95, 0.9, 1);
      next = addStoryFractalNode(next, 'f2', 'self_similar', 'cosmic', 'infinite', 'desc', 0.95, 0.9, 1);
      const infinite = getStoryFractalNodesByPattern(next, 'infinite');
      expect(infinite.length).toBe(1);
    });
  });

  describe('getStoryFractalReport', () => {
    it('should return comprehensive report', () => {
      const report = getStoryFractalReport(state);
      expect(report.totalFractals).toBe(0);
      expect(typeof report.storyFractalMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getStoryFractalReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeStoryFractalEngineState', () => {
    it('should reset all state', () => {
      let next = addStoryFractalNode(state, 'f1', 'infinite', 'cosmic', 'infinite', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeStoryFractalEngineState();
      expect(next.fractals.size).toBe(0);
      expect(next.totalFractals).toBe(0);
    });
  });
});