/**
 * V50 DAGValidator 测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DAGValidator, validateDAG, findCycles, findMinCutToBreakCycles } from './DAGValidator';
import type { NarrativeNode, NarrativeEdge } from './types';

describe('DAGValidator', () => {
  const createNodes = (ids: string[]): NarrativeNode[] =>
    ids.map((id, idx) => ({
      id,
      type: 'scene' as const,
      title: `Node ${id}`,
      createdAt: Date.now() + idx,
    }));

  describe('isDAG', () => {
    it('应返回 true 对于有效 DAG', () => {
      const nodes = createNodes(['A', 'B', 'C']);
      const edges: NarrativeEdge[] = [
        { id: 'e1', sourceId: 'A', targetId: 'B', type: 'sequence' },
        { id: 'e2', sourceId: 'B', targetId: 'C', type: 'sequence' },
      ];
      const validator = new DAGValidator(nodes, edges);
      expect(validator.isDAG()).toBe(true);
    });

    it('应返回 false 对于存在环路的图', () => {
      const nodes = createNodes(['A', 'B', 'C']);
      const edges: NarrativeEdge[] = [
        { id: 'e1', sourceId: 'A', targetId: 'B', type: 'sequence' },
        { id: 'e2', sourceId: 'B', targetId: 'C', type: 'sequence' },
        { id: 'e3', sourceId: 'C', targetId: 'A', type: 'sequence' },
      ];
      const validator = new DAGValidator(nodes, edges);
      expect(validator.isDAG()).toBe(false);
    });

    it('应返回 true 对于空图', () => {
      const validator = new DAGValidator([], []);
      expect(validator.isDAG()).toBe(true);
    });

    it('应返回 true 对于单节点无边的图', () => {
      const nodes = createNodes(['A']);
      const validator = new DAGValidator(nodes, []);
      expect(validator.isDAG()).toBe(true);
    });

    it('应忽略 foreshadow 边进行 DAG 检测', () => {
      const nodes = createNodes(['A', 'B', 'C']);
      const edges: NarrativeEdge[] = [
        { id: 'e1', sourceId: 'A', targetId: 'B', type: 'sequence' },
        { id: 'e2', sourceId: 'B', targetId: 'C', type: 'sequence' },
        { id: 'e3', sourceId: 'C', targetId: 'A', type: 'foreshadow' }, // 这条边不参与 DAG 检测
      ];
      const validator = new DAGValidator(nodes, edges);
      expect(validator.isDAG()).toBe(true);
    });

    it('应忽略 callback 边进行 DAG 检测', () => {
      const nodes = createNodes(['A', 'B', 'C']);
      const edges: NarrativeEdge[] = [
        { id: 'e1', sourceId: 'A', targetId: 'B', type: 'sequence' },
        { id: 'e2', sourceId: 'C', targetId: 'A', type: 'callback' }, // 这条边不参与 DAG 检测
      ];
      const validator = new DAGValidator(nodes, edges);
      expect(validator.isDAG()).toBe(true);
    });
  });

  describe('topologicalSort', () => {
    it('应返回正确的拓扑排序', () => {
      const nodes = createNodes(['A', 'B', 'C']);
      const edges: NarrativeEdge[] = [
        { id: 'e1', sourceId: 'A', targetId: 'B', type: 'sequence' },
        { id: 'e2', sourceId: 'B', targetId: 'C', type: 'sequence' },
      ];
      const validator = new DAGValidator(nodes, edges);
      const result = validator.topologicalSort();
      expect(result).toEqual(['A', 'B', 'C']);
    });

    it('对于存在环路的图应返回空数组', () => {
      const nodes = createNodes(['A', 'B', 'C']);
      const edges: NarrativeEdge[] = [
        { id: 'e1', sourceId: 'A', targetId: 'B', type: 'sequence' },
        { id: 'e2', sourceId: 'B', targetId: 'C', type: 'sequence' },
        { id: 'e3', sourceId: 'C', targetId: 'A', type: 'sequence' },
      ];
      const validator = new DAGValidator(nodes, edges);
      expect(validator.topologicalSort()).toEqual([]);
    });
  });

  describe('findCycles', () => {
    it('应返回空数组对于无环图的图', () => {
      const nodes = createNodes(['A', 'B', 'C']);
      const edges: NarrativeEdge[] = [
        { id: 'e1', sourceId: 'A', targetId: 'B', type: 'sequence' },
        { id: 'e2', sourceId: 'B', targetId: 'C', type: 'sequence' },
      ];
      const validator = new DAGValidator(nodes, edges);
      expect(validator.findCycles()).toEqual([]);
    });

    it('应正确检测自环', () => {
      const nodes = createNodes(['A']);
      const edges: NarrativeEdge[] = [
        { id: 'e1', sourceId: 'A', targetId: 'A', type: 'sequence' },
      ];
      const validator = new DAGValidator(nodes, edges);
      const cycles = validator.findCycles();
      expect(cycles.length).toBeGreaterThan(0);
    });

    it('应正确检测简单环路', () => {
      const nodes = createNodes(['A', 'B', 'C']);
      const edges: NarrativeEdge[] = [
        { id: 'e1', sourceId: 'A', targetId: 'B', type: 'sequence' },
        { id: 'e2', sourceId: 'B', targetId: 'C', type: 'sequence' },
        { id: 'e3', sourceId: 'C', targetId: 'A', type: 'sequence' },
      ];
      const validator = new DAGValidator(nodes, edges);
      const cycles = validator.findCycles();
      expect(cycles.length).toBeGreaterThan(0);
    });
  });

  describe('findMinCutToBreakCycles', () => {
    it('应返回空数组对于无环图', () => {
      const nodes = createNodes(['A', 'B', 'C']);
      const edges: NarrativeEdge[] = [
        { id: 'e1', sourceId: 'A', targetId: 'B', type: 'sequence' },
        { id: 'e2', sourceId: 'B', targetId: 'C', type: 'sequence' },
      ];
      const validator = new DAGValidator(nodes, edges);
      expect(validator.findMinCutToBreakCycles()).toEqual([]);
    });

    it('应为有环图返回破环建议', () => {
      const nodes = createNodes(['A', 'B', 'C']);
      const edges: NarrativeEdge[] = [
        { id: 'e1', sourceId: 'A', targetId: 'B', type: 'sequence' },
        { id: 'e2', sourceId: 'B', targetId: 'C', type: 'sequence' },
        { id: 'e3', sourceId: 'C', targetId: 'A', type: 'sequence' },
      ];
      const validator = new DAGValidator(nodes, edges);
      const minCut = validator.findMinCutToBreakCycles();
      expect(minCut.length).toBeGreaterThan(0);
    });
  });

  describe('validate', () => {
    it('应返回 isValid=true 对于有效 DAG', () => {
      const nodes = createNodes(['A', 'B', 'C']);
      const edges: NarrativeEdge[] = [
        { id: 'e1', sourceId: 'A', targetId: 'B', type: 'sequence' },
        { id: 'e2', sourceId: 'B', targetId: 'C', type: 'sequence' },
      ];
      const validator = new DAGValidator(nodes, edges);
      const result = validator.validate();
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('应返回 isValid=false 对于存在环路的图', () => {
      const nodes = createNodes(['A', 'B', 'C']);
      const edges: NarrativeEdge[] = [
        { id: 'e1', sourceId: 'A', targetId: 'B', type: 'sequence' },
        { id: 'e2', sourceId: 'B', targetId: 'C', type: 'sequence' },
        { id: 'e3', sourceId: 'C', targetId: 'A', type: 'sequence' },
      ];
      const validator = new DAGValidator(nodes, edges);
      const result = validator.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('导出函数', () => {
    it('validateDAG 应正确工作', () => {
      const nodes = createNodes(['A', 'B', 'C']);
      const edges: NarrativeEdge[] = [
        { id: 'e1', sourceId: 'A', targetId: 'B', type: 'sequence' },
        { id: 'e2', sourceId: 'B', targetId: 'C', type: 'sequence' },
      ];
      const result = validateDAG(nodes, edges);
      expect(result.isValid).toBe(true);
    });

    it('findCycles 应正确检测环路', () => {
      const nodes = createNodes(['A', 'B', 'C']);
      const edges: NarrativeEdge[] = [
        { id: 'e1', sourceId: 'A', targetId: 'B', type: 'sequence' },
        { id: 'e2', sourceId: 'B', targetId: 'C', type: 'sequence' },
        { id: 'e3', sourceId: 'C', targetId: 'A', type: 'sequence' },
      ];
      const cycles = findCycles(nodes, edges);
      expect(cycles.length).toBeGreaterThan(0);
    });

    it('findMinCutToBreakCycles 应返回破环建议', () => {
      const nodes = createNodes(['A', 'B', 'C']);
      const edges: NarrativeEdge[] = [
        { id: 'e1', sourceId: 'A', targetId: 'B', type: 'sequence' },
        { id: 'e2', sourceId: 'B', targetId: 'C', type: 'sequence' },
        { id: 'e3', sourceId: 'C', targetId: 'A', type: 'sequence' },
      ];
      const minCut = findMinCutToBreakCycles(nodes, edges);
      expect(minCut.length).toBeGreaterThan(0);
    });
  });
});