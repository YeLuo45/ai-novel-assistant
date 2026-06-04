/**
 * V657 NarrativePlanningEngine Tests — Direction E Iter 5/9
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNarrativePlanningState,
  addPlanNode,
  activatePlanNode,
  completePlanNode,
  getPlanningRecommendation,
  setPlanningPhase,
  getPlanningReport,
  resetNarrativePlanningState,
  type NarrativePlanningState,
} from './NarrativePlanningEngine';

describe('NarrativePlanningEngine', () => {
  let state: NarrativePlanningState;

  beforeEach(() => { state = createNarrativePlanningState(); });

  describe('createNarrativePlanningState', () => {
    it('should initialize with defaults', () => {
      expect(state.planNodes.size).toBe(0);
      expect(state.currentPhase).toBe('analysis');
    });

    it('should start with zero counts', () => {
      expect(state.totalNodes).toBe(0);
      expect(state.completedNodes).toBe(0);
    });
  });

  describe('addPlanNode', () => {
    it('should add plan node', () => {
      const next = addPlanNode(state, 'n1', 'Write introduction', 'design', 2, []);
      expect(next.planNodes.size).toBe(1);
      expect(next.totalNodes).toBe(1);
    });

    it('should set node properties', () => {
      const next = addPlanNode(state, 'n1', 'Write scene', 'execution', 3, []);
      expect(next.planNodes.get('n1')?.phase).toBe('execution');
      expect(next.planNodes.get('n1')?.priority).toBe(3);
    });

    it('should set dependencies', () => {
      const next = addPlanNode(state, 'n2', 'Write climax', 'execution', 2, ['n1']);
      expect(next.planNodes.get('n2')?.dependencies).toContain('n1');
    });
  });

  describe('activatePlanNode', () => {
    it('should activate node', () => {
      let next = addPlanNode(state, 'n1', 'Write scene', 'execution', 1, []);
      next = activatePlanNode(next, 'n1');
      expect(next.planNodes.get('n1')?.status).toBe('active');
    });
  });

  describe('completePlanNode', () => {
    it('should complete node and increment count', () => {
      let next = addPlanNode(state, 'n1', 'Write scene', 'execution', 1, []);
      next = completePlanNode(next, 'n1');
      expect(next.planNodes.get('n1')?.status).toBe('completed');
      expect(next.completedNodes).toBe(1);
    });
  });

  describe('getPlanningRecommendation', () => {
    it('should return executable nodes', () => {
      let next = addPlanNode(state, 'n1', 'Write intro', 'design', 1, []);
      next = addPlanNode(next, 'n2', 'Write body', 'execution', 2, ['n1']);
      const recs = getPlanningRecommendation(next);
      expect(recs.length).toBeGreaterThan(0);
    });

    it('should sort by priority', () => {
      let next = addPlanNode(state, 'n1', 'Low priority', 'design', 1, []);
      next = addPlanNode(next, 'n2', 'High priority', 'design', 3, []);
      next = completePlanNode(next, 'n1');
      const recs = getPlanningRecommendation(next);
      expect(recs[0]?.nextNodeId).toBe('n2');
    });

    it('should skip nodes with unmet dependencies', () => {
      let next = addPlanNode(state, 'n1', 'First', 'design', 1, []);
      next = addPlanNode(next, 'n2', 'Second', 'execution', 2, ['n1']);
      const recs = getPlanningRecommendation(next);
      expect(recs.find(r => r.nextNodeId === 'n2')).toBeUndefined();
    });
  });

  describe('setPlanningPhase', () => {
    it('should set phase', () => {
      const next = setPlanningPhase(state, 'execution');
      expect(next.currentPhase).toBe('execution');
    });
  });

  describe('getPlanningReport', () => {
    it('should return comprehensive report', () => {
      const report = getPlanningReport(state);
      expect(report.totalNodes).toBe(0);
      expect(report.currentPhase).toBe('analysis');
    });

    it('should include completion progress', () => {
      let next = addPlanNode(state, 'n1', 'Node 1', 'design', 1, []);
      next = completePlanNode(next, 'n1');
      const report = getPlanningReport(next);
      expect(report.completedNodes).toBe(1);
    });

    it('should include recommendations', () => {
      const report = getPlanningReport(state);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });

  describe('resetNarrativePlanningState', () => {
    it('should reset all plan nodes', () => {
      let next = addPlanNode(state, 'n1', 'Node', 'design', 1, []);
      next = completePlanNode(next, 'n1');
      next = resetNarrativePlanningState();
      expect(next.planNodes.size).toBe(0);
      expect(next.totalNodes).toBe(0);
    });
  });
});