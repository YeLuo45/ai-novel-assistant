/**
 * V1275 NarrativeStoryLatticeEngine Tests — Direction I Iter 5/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeStoryLatticeEngineState,
  addStoryLatticeNode,
  addStoryLatticePlane,
  getStoryLatticeNodesByLevel,
  getStoryLatticeReport,
  resetNarrativeStoryLatticeEngineState,
  type NarrativeStoryLatticeEngineState,
} from './NarrativeStoryLatticeEngine';

describe('NarrativeStoryLatticeEngine', () => {
  let state: NarrativeStoryLatticeEngineState;

  beforeEach(() => { state = createNarrativeStoryLatticeEngineState(); });

  describe('createNarrativeStoryLatticeEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.nodes.size).toBe(0);
      expect(state.planes.size).toBe(0);
    });
  });

  describe('addStoryLatticeNode', () => {
    it('should add node', () => {
      const next = addStoryLatticeNode(state, 'n1', 'abyssal', 'crystalline', 'eternal', 'desc', 0.95, 0.9, 1);
      expect(next.nodes.size).toBe(1);
      expect(next.totalNodes).toBe(1);
    });
  });

  describe('addStoryLatticePlane', () => {
    it('should add plane', () => {
      let next = addStoryLatticeNode(state, 'n1', 'abyssal', 'crystalline', 'eternal', 'desc', 0.95, 0.9, 1);
      next = addStoryLatticePlane(next, 'p1', ['n1']);
      expect(next.totalPlanes).toBe(1);
    });
  });

  describe('getStoryLatticeNodesByLevel', () => {
    it('should filter by level', () => {
      let next = addStoryLatticeNode(state, 'n1', 'abyssal', 'crystalline', 'eternal', 'desc', 0.95, 0.9, 1);
      next = addStoryLatticeNode(next, 'n2', 'surface', 'crystalline', 'eternal', 'desc', 0.95, 0.9, 1);
      const abyssal = getStoryLatticeNodesByLevel(next, 'abyssal');
      expect(abyssal.length).toBe(1);
    });
  });

  describe('getStoryLatticeReport', () => {
    it('should return comprehensive report', () => {
      const report = getStoryLatticeReport(state);
      expect(report.totalNodes).toBe(0);
      expect(typeof report.storyLatticeMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getStoryLatticeReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeStoryLatticeEngineState', () => {
    it('should reset all state', () => {
      let next = addStoryLatticeNode(state, 'n1', 'abyssal', 'crystalline', 'eternal', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeStoryLatticeEngineState();
      expect(next.nodes.size).toBe(0);
      expect(next.totalNodes).toBe(0);
    });
  });
});