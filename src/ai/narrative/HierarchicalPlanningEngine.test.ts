/**
 * V831 HierarchicalPlanningEngine Tests — Direction A Iter 2/9 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createHierarchicalPlanningEngineState,
  createPlanNode,
  updatePlanProgress,
  addPlanDependency,
  getNodesByLevel,
  getChildNodes,
  getPlanningEngineReport,
  resetHierarchicalPlanningEngineState,
  type HierarchicalPlanningEngineState,
} from './HierarchicalPlanningEngine';

describe('HierarchicalPlanningEngine', () => {
  let state: HierarchicalPlanningEngineState;

  beforeEach(() => { state = createHierarchicalPlanningEngineState(); });

  describe('createHierarchicalPlanningEngineState', () => {
    it('should initialize with defaults', () => {
      expect(state.nodes.size).toBe(0);
      expect(state.dependencies.size).toBe(0);
    });
  });

  describe('createPlanNode', () => {
    it('should create root node', () => {
      const next = createPlanNode(state, 'n1', 'mission', 'Write great novel');
      expect(next.totalNodes).toBe(1);
    });

    it('should create child and update parent', () => {
      let next = createPlanNode(state, 'n1', 'mission', 'Write novel');
      next = createPlanNode(next, 'n2', 'task', 'Outline plot', 'n1');
      expect(next.nodes.get('n1')?.childIds.length).toBe(1);
    });
  });

  describe('updatePlanProgress', () => {
    it('should update progress', () => {
      let next = createPlanNode(state, 'n1', 'task', 'desc');
      next = updatePlanProgress(next, 'n1', 0.5);
      expect(next.nodes.get('n1')?.progress).toBe(0.5);
      expect(next.nodes.get('n1')?.status).toBe('active');
    });

    it('should mark as completed', () => {
      let next = createPlanNode(state, 'n1', 'task', 'desc');
      next = updatePlanProgress(next, 'n1', 1);
      expect(next.nodes.get('n1')?.status).toBe('completed');
    });

    it('should clamp progress', () => {
      let next = createPlanNode(state, 'n1', 'task', 'desc');
      next = updatePlanProgress(next, 'n1', 1.5);
      expect(next.nodes.get('n1')?.progress).toBe(1);
    });
  });

  describe('addPlanDependency', () => {
    it('should add dependency', () => {
      const next = addPlanDependency(state, 'd1', 'n1', 'n2', 'requires');
      expect(next.totalDependencies).toBe(1);
    });
  });

  describe('getNodesByLevel', () => {
    it('should filter by level', () => {
      let next = createPlanNode(state, 'n1', 'mission', 'desc');
      next = createPlanNode(next, 'n2', 'task', 'desc');
      const missions = getNodesByLevel(next, 'mission');
      expect(missions.length).toBe(1);
    });
  });

  describe('getChildNodes', () => {
    it('should return children', () => {
      let next = createPlanNode(state, 'n1', 'mission', 'desc');
      next = createPlanNode(next, 'n2', 'task', 'desc', 'n1');
      const children = getChildNodes(next, 'n1');
      expect(children.length).toBe(1);
    });
  });

  describe('getPlanningEngineReport', () => {
    it('should return comprehensive report', () => {
      const report = getPlanningEngineReport(state);
      expect(report.totalNodes).toBe(0);
      expect(typeof report.planCoherence).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getPlanningEngineReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetHierarchicalPlanningEngineState', () => {
    it('should reset all state', () => {
      let next = createPlanNode(state, 'n1', 'mission', 'desc');
      next = resetHierarchicalPlanningEngineState();
      expect(next.nodes.size).toBe(0);
      expect(next.totalNodes).toBe(0);
    });
  });
});