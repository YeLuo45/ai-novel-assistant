/**
 * V50 TarjanSCC 测试
 */

import { describe, it, expect } from 'vitest';
import { TarjanSCC, findSCCs, identifyCircularNarratives, isInCircularNarrative } from './TarjanSCC';
import type { NarrativeNode, NarrativeEdge } from './types';

describe('TarjanSCC', () => {
  const createNodes = (ids: string[]): NarrativeNode[] =>
    ids.map((id, idx) => ({
      id,
      type: 'scene' as const,
      title: `Node ${id}`,
      createdAt: Date.now() + idx,
    }));

  describe('findSCCs', () => {
    it('应对线性图返回每个节点作为单独的 SCC', () => {
      const nodes = createNodes(['A', 'B', 'C']);
      const edges: NarrativeEdge[] = [
        { id: 'e1', sourceId: 'A', targetId: 'B', type: 'sequence' },
        { id: 'e2', sourceId: 'B', targetId: 'C', type: 'sequence' },
      ];
      const tarjan = new TarjanSCC(nodes, edges);
      const sccs = tarjan.findSCCs();
      // 线性图每个节点应该是自己的 SCC
      expect(sccs.length).toBe(3);
      expect(sccs.every(scc => !scc.isCircular)).toBe(true);
    });

    it('应正确识别相互引用的 SCC', () => {
      const nodes = createNodes(['A', 'B']);
      const edges: NarrativeEdge[] = [
        { id: 'e1', sourceId: 'A', targetId: 'B', type: 'sequence' },
        { id: 'e2', sourceId: 'B', targetId: 'A', type: 'sequence' },
      ];
      const tarjan = new TarjanSCC(nodes, edges);
      const sccs = tarjan.findSCCs();
      // A 和 B 应该在同一个 SCC 中，且是循环的
      expect(sccs.length).toBe(1);
      expect(sccs[0].isCircular).toBe(true);
      expect(sccs[0].nodeIds).toContain('A');
      expect(sccs[0].nodeIds).toContain('B');
    });

    it('应正确识别三元循环', () => {
      const nodes = createNodes(['A', 'B', 'C']);
      const edges: NarrativeEdge[] = [
        { id: 'e1', sourceId: 'A', targetId: 'B', type: 'sequence' },
        { id: 'e2', sourceId: 'B', targetId: 'C', type: 'sequence' },
        { id: 'e3', sourceId: 'C', targetId: 'A', type: 'sequence' },
      ];
      const tarjan = new TarjanSCC(nodes, edges);
      const sccs = tarjan.findSCCs();
      expect(sccs.length).toBe(1);
      expect(sccs[0].isCircular).toBe(true);
      expect(sccs[0].nodeIds.length).toBe(3);
    });

    it('应对空图返回空数组', () => {
      const tarjan = new TarjanSCC([], []);
      expect(tarjan.findSCCs()).toEqual([]);
    });

    it('应忽略 foreshadow 边', () => {
      const nodes = createNodes(['A', 'B', 'C']);
      const edges: NarrativeEdge[] = [
        { id: 'e1', sourceId: 'A', targetId: 'B', type: 'sequence' },
        { id: 'e2', sourceId: 'B', targetId: 'C', type: 'sequence' },
        { id: 'e3', sourceId: 'C', targetId: 'A', type: 'foreshadow' },
      ];
      const tarjan = new TarjanSCC(nodes, edges);
      const sccs = tarjan.findSCCs();
      // foreshadow 边不参与 SCC 检测，A->B->C 是线性的
      expect(sccs.length).toBe(3);
    });

    it('应忽略 callback 边', () => {
      const nodes = createNodes(['A', 'B', 'C']);
      const edges: NarrativeEdge[] = [
        { id: 'e1', sourceId: 'A', targetId: 'B', type: 'sequence' },
        { id: 'e2', sourceId: 'C', targetId: 'A', type: 'callback' },
      ];
      const tarjan = new TarjanSCC(nodes, edges);
      const sccs = tarjan.findSCCs();
      expect(sccs.length).toBe(3);
    });
  });

  describe('identifyCircularNarratives', () => {
    it('应对线性图返回空数组', () => {
      const nodes = createNodes(['A', 'B', 'C']);
      const edges: NarrativeEdge[] = [
        { id: 'e1', sourceId: 'A', targetId: 'B', type: 'sequence' },
        { id: 'e2', sourceId: 'B', targetId: 'C', type: 'sequence' },
      ];
      const tarjan = new TarjanSCC(nodes, edges);
      const circular = tarjan.identifyCircularNarratives();
      expect(circular).toEqual([]);
    });

    it('应对循环图返回循环叙事', () => {
      const nodes = createNodes(['A', 'B', 'C']);
      const edges: NarrativeEdge[] = [
        { id: 'e1', sourceId: 'A', targetId: 'B', type: 'sequence' },
        { id: 'e2', sourceId: 'B', targetId: 'C', type: 'sequence' },
        { id: 'e3', sourceId: 'C', targetId: 'A', type: 'sequence' },
      ];
      const tarjan = new TarjanSCC(nodes, edges);
      const circular = tarjan.identifyCircularNarratives();
      expect(circular.length).toBe(1);
      expect(circular[0].isCircular).toBe(true);
    });
  });

  describe('isInCircularNarrative', () => {
    it('应正确识别节点是否在循环叙事中', () => {
      const nodes = createNodes(['A', 'B', 'C']);
      const edges: NarrativeEdge[] = [
        { id: 'e1', sourceId: 'A', targetId: 'B', type: 'sequence' },
        { id: 'e2', sourceId: 'B', targetId: 'C', type: 'sequence' },
        { id: 'e3', sourceId: 'C', targetId: 'A', type: 'sequence' },
      ];
      const tarjan = new TarjanSCC(nodes, edges);
      expect(tarjan.isInCircularNarrative('A')).toBe(true);
      expect(tarjan.isInCircularNarrative('B')).toBe(true);
      expect(tarjan.isInCircularNarrative('C')).toBe(true);
    });

    it('应对非循环图返回 false', () => {
      const nodes = createNodes(['A', 'B', 'C']);
      const edges: NarrativeEdge[] = [
        { id: 'e1', sourceId: 'A', targetId: 'B', type: 'sequence' },
        { id: 'e2', sourceId: 'B', targetId: 'C', type: 'sequence' },
      ];
      const tarjan = new TarjanSCC(nodes, edges);
      expect(tarjan.isInCircularNarrative('A')).toBe(false);
      expect(tarjan.isInCircularNarrative('B')).toBe(false);
      expect(tarjan.isInCircularNarrative('C')).toBe(false);
    });
  });

  describe('getSCCId', () => {
    it('应返回节点所属的 SCC ID', () => {
      const nodes = createNodes(['A', 'B']);
      const edges: NarrativeEdge[] = [
        { id: 'e1', sourceId: 'A', targetId: 'B', type: 'sequence' },
        { id: 'e2', sourceId: 'B', targetId: 'A', type: 'sequence' },
      ];
      const tarjan = new TarjanSCC(nodes, edges);
      tarjan.findSCCs();
      const sccIdA = tarjan.getSCCId('A');
      const sccIdB = tarjan.getSCCId('B');
      expect(sccIdA).toBe(sccIdB);
      expect(sccIdA).toBeGreaterThanOrEqual(0);
    });
  });

  describe('导出函数', () => {
    it('findSCCs 应正确工作', () => {
      const nodes = createNodes(['A', 'B', 'C']);
      const edges: NarrativeEdge[] = [
        { id: 'e1', sourceId: 'A', targetId: 'B', type: 'sequence' },
        { id: 'e2', sourceId: 'B', targetId: 'C', type: 'sequence' },
      ];
      const sccs = findSCCs(nodes, edges);
      expect(sccs.length).toBe(3);
    });

    it('identifyCircularNarratives 应返回循环叙事', () => {
      const nodes = createNodes(['A', 'B', 'C']);
      const edges: NarrativeEdge[] = [
        { id: 'e1', sourceId: 'A', targetId: 'B', type: 'sequence' },
        { id: 'e2', sourceId: 'B', targetId: 'C', type: 'sequence' },
        { id: 'e3', sourceId: 'C', targetId: 'A', type: 'sequence' },
      ];
      const circular = identifyCircularNarratives(nodes, edges);
      expect(circular.length).toBe(1);
    });

    it('isInCircularNarrative 应正确工作', () => {
      const nodes = createNodes(['A', 'B']);
      const edges: NarrativeEdge[] = [
        { id: 'e1', sourceId: 'A', targetId: 'B', type: 'sequence' },
        { id: 'e2', sourceId: 'B', targetId: 'A', type: 'sequence' },
      ];
      expect(isInCircularNarrative('A', nodes, edges)).toBe(true);
      expect(isInCircularNarrative('B', nodes, edges)).toBe(true);
    });
  });
});