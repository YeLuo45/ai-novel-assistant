/**
 * V1295 NarrativeStoryBranchEngine Tests — Direction I Iter 15/20 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeStoryBranchEngineState,
  addStoryBranchNode,
  addStoryBranchTree,
  getStoryBranchNodesByType,
  getStoryBranchReport,
  resetNarrativeStoryBranchEngineState,
  type NarrativeStoryBranchEngineState,
} from './NarrativeStoryBranchEngine';

describe('NarrativeStoryBranchEngine', () => {
  let state: NarrativeStoryBranchEngineState;

  beforeEach(() => { state = createNarrativeStoryBranchEngineState(); });

  describe('createNarrativeStoryBranchEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.branches.size).toBe(0);
      expect(state.trees.size).toBe(0);
    });
  });

  describe('addStoryBranchNode', () => {
    it('should add branch', () => {
      const next = addStoryBranchNode(state, 'b1', 'transcendent', 'eternal', 'transcendent', 'desc', 0.95, 0.9, 1);
      expect(next.branches.size).toBe(1);
      expect(next.totalBranches).toBe(1);
    });
  });

  describe('addStoryBranchTree', () => {
    it('should add tree', () => {
      let next = addStoryBranchNode(state, 'b1', 'transcendent', 'eternal', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addStoryBranchTree(next, 't1', ['b1']);
      expect(next.totalTrees).toBe(1);
    });
  });

  describe('getStoryBranchNodesByType', () => {
    it('should filter by type', () => {
      let next = addStoryBranchNode(state, 'b1', 'transcendent', 'eternal', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = addStoryBranchNode(next, 'b2', 'main', 'eternal', 'transcendent', 'desc', 0.95, 0.9, 1);
      const transcendent = getStoryBranchNodesByType(next, 'transcendent');
      expect(transcendent.length).toBe(1);
    });
  });

  describe('getStoryBranchReport', () => {
    it('should return comprehensive report', () => {
      const report = getStoryBranchReport(state);
      expect(report.totalBranches).toBe(0);
      expect(typeof report.storyBranchMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getStoryBranchReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeStoryBranchEngineState', () => {
    it('should reset all state', () => {
      let next = addStoryBranchNode(state, 'b1', 'transcendent', 'eternal', 'transcendent', 'desc', 0.95, 0.9, 1);
      next = resetNarrativeStoryBranchEngineState();
      expect(next.branches.size).toBe(0);
      expect(next.totalBranches).toBe(0);
    });
  });
});