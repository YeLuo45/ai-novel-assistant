/**
 * V50 CircularNarrativeEngine 测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CircularNarrativeEngine, createCircularNarrativeEngine } from './CircularNarrativeEngine';
import type { NarrativeNode } from './types';

describe('CircularNarrativeEngine', () => {
  const createNode = (id: string, type: NarrativeNode['type'] = 'scene'): NarrativeNode => ({
    id,
    type,
    title: `Node ${id}`,
    createdAt: Date.now(),
  });

  let engine: CircularNarrativeEngine;

  beforeEach(() => {
    engine = createCircularNarrativeEngine();
  });

  describe('addNode', () => {
    it('应正确添加节点', () => {
      const node = createNode('A');
      engine.addNode(node);
      expect(engine.getNodeCount()).toBe(1);
      expect(engine.getNodes()[0]).toEqual(node);
    });

    it('应正确添加多个节点', () => {
      engine.addNodes([createNode('A'), createNode('B'), createNode('C')]);
      expect(engine.getNodeCount()).toBe(3);
    });
  });

  describe('connect', () => {
    it('应正确连接两个节点', () => {
      engine.addNodes([createNode('A'), createNode('B')]);
      engine.connect('A', 'B', 'sequence');
      expect(engine.getEdgeCount()).toBe(1);
    });

    it('应在节点不存在时抛出错误', () => {
      engine.addNode(createNode('A'));
      expect(() => engine.connect('A', 'B', 'sequence')).toThrow('目标节点 B 不存在');
    });

    it('应正确添加不同类型的边', () => {
      engine.addNodes([createNode('A'), createNode('B')]);
      engine.connect('A', 'B', 'branch');
      const edges = engine.getEdges();
      expect(edges[0].type).toBe('branch');
    });
  });

  describe('registerForeshadow', () => {
    it('应正确注册伏笔', () => {
      engine.addNodes([createNode('A'), createNode('B')]);
      engine.registerForeshadow('fs1', 'A', 'B');
      const foreshadows = engine.getForeshadows();
      expect(foreshadows.length).toBe(1);
      expect(foreshadows[0].foreshadowId).toBe('fs1');
    });

    it('应在节点不存在时抛出错误', () => {
      engine.addNode(createNode('A'));
      expect(() => engine.registerForeshadow('fs1', 'A', 'B')).toThrow('目标节点 B 不存在');
    });
  });

  describe('registerCallback', () => {
    it('应正确注册回环', () => {
      engine.addNodes([createNode('A'), createNode('B')]);
      engine.registerCallback('cb1', 'A', 'B');
      const callbacks = engine.getCallbacks();
      expect(callbacks.length).toBe(1);
      expect(callbacks[0].callbackId).toBe('cb1');
    });

    it('应在节点不存在时抛出错误', () => {
      engine.addNode(createNode('A'));
      expect(() => engine.registerCallback('cb1', 'A', 'B')).toThrow('目标节点 B 不存在');
    });
  });

  describe('validate', () => {
    it('应对有效 DAG 返回 isValid=true', () => {
      engine.addNodes([createNode('A'), createNode('B'), createNode('C')]);
      engine.connect('A', 'B', 'sequence');
      engine.connect('B', 'C', 'sequence');
      const result = engine.validate();
      expect(result.isValid).toBe(true);
    });

    it('应对存在环路的图返回 isValid=false', () => {
      engine.addNodes([createNode('A'), createNode('B'), createNode('C')]);
      engine.connect('A', 'B', 'sequence');
      engine.connect('B', 'C', 'sequence');
      engine.connect('C', 'A', 'sequence');
      const result = engine.validate();
      expect(result.isValid).toBe(false);
    });

    it('应忽略 foreshadow 边进行 DAG 检测', () => {
      engine.addNodes([createNode('A'), createNode('B'), createNode('C')]);
      engine.connect('A', 'B', 'sequence');
      engine.connect('B', 'C', 'sequence');
      engine.registerForeshadow('fs1', 'C', 'A');
      const result = engine.validate();
      expect(result.isValid).toBe(true);
    });

    it('应忽略 callback 边进行 DAG 检测', () => {
      engine.addNodes([createNode('A'), createNode('B'), createNode('C')]);
      engine.connect('A', 'B', 'sequence');
      engine.registerCallback('cb1', 'C', 'A');
      const result = engine.validate();
      expect(result.isValid).toBe(true);
    });
  });

  describe('generateGraphData', () => {
    it('应正确生成图数据', () => {
      engine.addNodes([createNode('A'), createNode('B')]);
      engine.connect('A', 'B', 'sequence');
      const graphData = engine.generateGraphData();
      expect(graphData.nodes.length).toBe(2);
      expect(graphData.edges.length).toBe(1);
    });

    it('应包含 SCC 信息', () => {
      engine.addNodes([createNode('A'), createNode('B')]);
      engine.connect('A', 'B', 'sequence');
      engine.connect('B', 'A', 'sequence');
      const graphData = engine.generateGraphData();
      expect(graphData.sccs.length).toBe(1);
      expect(graphData.sccs[0].isCircular).toBe(true);
    });
  });

  describe('checkForeshadowResolved', () => {
    it('应正确检测伏笔是否已解决', () => {
      engine.addNodes([createNode('A'), createNode('B'), createNode('C')]);
      engine.connect('A', 'B', 'sequence');
      engine.connect('B', 'C', 'sequence');
      engine.registerForeshadow('fs1', 'A', 'C');
      const statuses = engine.checkForeshadowResolved();
      expect(statuses.length).toBe(1);
      expect(statuses[0].isResolved).toBe(true);
    });

    it('应正确检测未解决的伏笔', () => {
      engine.addNodes([createNode('A'), createNode('B')]);
      engine.registerForeshadow('fs1', 'A', 'B');
      const statuses = engine.checkForeshadowResolved();
      expect(statuses.length).toBe(1);
      expect(statuses[0].isResolved).toBe(false);
    });
  });

  describe('checkCallbacksAligned', () => {
    it('应对有效回环返回 isAligned=true', () => {
      engine.addNodes([createNode('A'), createNode('B')]);
      engine.registerCallback('cb1', 'A', 'B');
      const statuses = engine.checkCallbacksAligned();
      expect(statuses.length).toBe(1);
      expect(statuses[0].isAligned).toBe(true);
    });
  });

  describe('clear', () => {
    it('应正确清空所有数据', () => {
      engine.addNodes([createNode('A'), createNode('B')]);
      engine.connect('A', 'B', 'sequence');
      engine.clear();
      expect(engine.getNodeCount()).toBe(0);
      expect(engine.getEdgeCount()).toBe(0);
    });
  });

  describe('createCircularNarrativeEngine', () => {
    it('应创建新的引擎实例', () => {
      const newEngine = createCircularNarrativeEngine();
      expect(newEngine).toBeInstanceOf(CircularNarrativeEngine);
    });
  });
});