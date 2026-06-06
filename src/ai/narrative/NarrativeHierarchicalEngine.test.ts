/**
 * V971 NarrativeHierarchicalEngine Tests — Direction A Iter 3/15 (Round 5)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativeHierarchicalEngineState,
  addHierarchyNode,
  updateHierarchyProgress,
  createHierarchyPlan,
  getNodesByLevel,
  getHierarchicalReport,
  resetNarrativeHierarchicalEngineState,
  type NarrativeHierarchicalEngineState,
} from './NarrativeHierarchicalEngine';

describe('NarrativeHierarchicalEngine', () => {
  let state: NarrativeHierarchicalEngineState;

  beforeEach(() => { state = createNarrativeHierarchicalEngineState(); });

  describe('createNarrativeHierarchicalEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.nodes.size).toBe(0);
      expect(state.plans.size).toBe(0);
    });
  });

  describe('addHierarchyNode', () => {
    it('should add node', () => {
      const next = addHierarchyNode(state, 'n1', 'strategic', 'top_down', 'root', null, 1);
      expect(next.nodes.size).toBe(1);
      expect(next.totalNodes).toBe(1);
    });
  });

  describe('updateHierarchyProgress', () => {
    it('should update', () => {
      let next = addHierarchyNode(state, 'n1', 'strategic', 'top_down', 'root', null, 1);
      next = updateHierarchyProgress(next, 'n1', 1.0);
      expect(next.nodes.get('n1')?.status).toBe('completed');
      expect(next.completedNodes).toBe(1);
    });
  });

  describe('createHierarchyPlan', () => {
    it('should create plan', () => {
      let next = addHierarchyNode(state, 'n1', 'strategic', 'top_down', 'root', null, 1);
      next = createHierarchyPlan(next, 'p1', 'main plan', 'n1', 'top_down');
      expect(next.totalPlans).toBe(1);
    });
  });

  describe('getNodesByLevel', () => {
    it('should filter by level', () => {
      let next = addHierarchyNode(state, 'n1', 'strategic', 'top_down', 'root', null, 1);
      next = addHierarchyNode(next, 'n2', 'tactical', 'top_down', 'sub', 'n1', 1);
      const strategic = getNodesByLevel(next, 'strategic');
      expect(strategic.length).toBe(1);
    });
  });

  describe('getHierarchicalReport', () => {
    it('should return comprehensive report', () => {
      const report = getHierarchicalReport(state);
      expect(report.totalNodes).toBe(0);
      expect(typeof report.hierarchicalMastery).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getHierarchicalReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetNarrativeHierarchicalEngineState', () => {
    it('should reset all state', () => {
      let next = addHierarchyNode(state, 'n1', 'strategic', 'top_down', 'root', null, 1);
      next = resetNarrativeHierarchicalEngineState();
      expect(next.nodes.size).toBe(0);
      expect(next.totalNodes).toBe(0);
    });
  });
});