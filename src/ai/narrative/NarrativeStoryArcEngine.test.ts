/**
 * V1299 NarrativeStoryArcEngine Tests — Direction I Iter 17/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeStoryArcEngineState,
  addStoryArcNode,
  addStoryArcCollection,
  getStoryArcNodesByType,
  getStoryArcReport,
  resetNarrativeStoryArcEngineState,
  type NarrativeStoryArcEngineState,
} from './NarrativeStoryArcEngine';

describe('NarrativeStoryArcEngine', () => {
  let state: NarrativeStoryArcEngineState;

  beforeEach(() => { state = createNarrativeStoryArcEngineState(); });

  describe('createNarrativeStoryArcEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.arcs.size).toBe(0);
      expect(state.collections.size).toBe(0);
    });
  });

  describe('addStoryArcNode', () => {
    it('should add arc', () => {
      const next = addStoryArcNode(state, 'a1', 'transcendent', 'wave', 'climactic', 'desc', 0.95, 0.9, 1);
      expect(next.arcs.size).toBe(1);
      expect(next.totalArcs).toBe(1);
    });
  });

  describe('addStoryArcCollection', () => {
    it('should add collection', () => {
      let next = addStoryArcNode(state, 'a1', 'transcendent', 'wave', 'climactic', 'desc', 0.95, 0.9, 1);
      next = addStoryArcCollection(next, 'c1', ['a1']);
      expect(next.totalCollections).toBe(1);
    });
  });

  describe('getStoryArcNodesByType', () => {
    it('should filter by type', () => {
      let next = addStoryArcNode(state, 'a1', 'transcendent', 'wave', 'climactic', 'desc', 0.95, 0.9, 1);
      next = addStoryArcNode(next, 'a2', 'character', 'wave', 'climactic', 'desc', 0.95, 0.9, 1);
      const transcendent = getStoryArcNodesByType(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getStoryArcReport', () => {
    it('should return comprehensive report', () => {
      const report = getStoryArcReport(state);
      expect(report.totalArcs).toBe(0);
      expect(typeof report.storyArcMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getStoryArcReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeStoryArcEngineState', () => {
    it('should reset all state', () => {
      let next = addStoryArcNode(state, 'a1', 'transcendent', 'wave', 'climactic', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeStoryArcEngineState();
      expect(next.arcs.size).toBe(0);
      expect(next.totalArcs).toBe(0);
    });
  });
});