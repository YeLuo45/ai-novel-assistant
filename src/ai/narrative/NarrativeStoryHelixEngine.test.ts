/**
 * V1287 NarrativeStoryHelixEngine Tests — Direction I Iter 11/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeStoryHelixEngineState,
  addStoryHelixNode,
  addStoryHelixTurn,
  getStoryHelixNodesByStrand,
  getStoryHelixReport,
  resetNarrativeStoryHelixEngineState,
  type NarrativeStoryHelixEngineState,
} from './NarrativeStoryHelixEngine';

describe('NarrativeStoryHelixEngine', () => {
  let state: NarrativeStoryHelixEngineState;

  beforeEach(() => { state = createNarrativeStoryHelixEngineState(); });

  describe('createNarrativeStoryHelixEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.helices.size).toBe(0);
      expect(state.turns.size).toBe(0);
    });
  });

  describe('addStoryHelixNode', () => {
    it('should add helix', () => {
      const next = addStoryHelixNode(state, 'h1', 'infinite', 'cosmic', 'spiral', 'desc', 0.95, 0.9, 1);
      expect(next.helices.size).toBe(1);
      expect(next.totalHelices).toBe(1);
    });
  });

  describe('addStoryHelixTurn', () => {
    it('should add turn', () => {
      let next = addStoryHelixNode(state, 'h1', 'infinite', 'cosmic', 'spiral', 'desc', 0.95, 0.9, 1);
      next = addStoryHelixTurn(next, 't1', ['h1']);
      expect(next.totalTurns).toBe(1);
    });
  });

  describe('getStoryHelixNodesByStrand', () => {
    it('should filter by strand', () => {
      let next = addStoryHelixNode(state, 'h1', 'infinite', 'cosmic', 'spiral', 'desc', 0.95, 0.9, 1);
      next = addStoryHelixNode(next, 'h2', 'single', 'cosmic', 'spiral', 'desc', 0.95, 0.9, 1);
      const infinite = getStoryHelixNodesByStrand(next, 'infinite');
      expect(infinite.length).toBe(1);
    });
  });

  describe('getStoryHelixReport', () => {
    it('should return comprehensive report', () => {
      const report = getStoryHelixReport(state);
      expect(report.totalHelices).toBe(0);
      expect(typeof report.storyHelixMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getStoryHelixReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeStoryHelixEngineState', () => {
    it('should reset all state', () => {
      let next = addStoryHelixNode(state, 'h1', 'infinite', 'cosmic', 'spiral', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeStoryHelixEngineState();
      expect(next.helices.size).toBe(0);
      expect(next.totalHelices).toBe(0);
    });
  });
});