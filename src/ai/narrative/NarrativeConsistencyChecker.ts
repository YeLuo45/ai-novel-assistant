/**
 * V50 叙事一致性检查器
 * NarrativeConsistencyChecker: Consistency Check for Foreshadows, Callbacks, Dead Ends, Orphan Nodes
 */

import type {
  NarrativeNode,
  NarrativeEdge,
  Inconsistency,
  FixSuggestion,
  ForeshadowStatus,
  CallbackStatus,
} from './types';
import { CircularNarrativeEngine } from './CircularNarrativeEngine';

/**
 * 叙事一致性检查器
 * 检查并修复叙事图中的一致性问题
 */
export class NarrativeConsistencyChecker {
  private engine: CircularNarrativeEngine;

  constructor(engine: CircularNarrativeEngine) {
    this.engine = engine;
  }

  /**
   * 查找未解决的伏笔
   */
  findUnresolvedForeshadows(): Inconsistency[] {
    const foreshadowStatuses = this.engine.checkForeshadowResolved();
    const inconsistencies: Inconsistency[] = [];

    for (const status of foreshadowStatuses) {
      if (!status.isResolved) {
        inconsistencies.push({
          type: 'unresolved_foreshadow',
          nodeIds: [status.triggerNodeId, status.targetNodeId],
          message: `伏笔 ${status.foreshadowId} 未找到解决路径（从 ${status.triggerNodeId} 到 ${status.targetNodeId}）`,
          severity: 'warning',
        });
      }
    }

    return inconsistencies;
  }

  /**
   * 查找断头路（Dead Ends）- 没有后继的节点
   */
  findDeadEnds(): Inconsistency[] {
    const nodes = this.engine.getNodes();
    const edges = this.engine.getEdges();
    const inconsistencies: Inconsistency[] = [];

    // 构建出度表
    const outDegree = new Map<string, number>();
    for (const node of nodes) {
      outDegree.set(node.id, 0);
    }
    for (const edge of edges) {
      if (edge.type === 'sequence' || edge.type === 'branch') {
        outDegree.set(edge.sourceId, (outDegree.get(edge.sourceId) || 0) + 1);
      }
    }

    // 查找出度为0的非终止节点
    for (const node of nodes) {
      if (node.type === 'chapter' || node.type === 'scene' || node.type === 'event') {
        if ((outDegree.get(node.id) || 0) === 0) {
          // 检查是否真的是终止节点（不是故事的结尾）
          inconsistencies.push({
            type: 'dead_end',
            nodeIds: [node.id],
            message: `节点 ${node.id}（${node.title}）是断头路，没有后续节点`,
            severity: node.type === 'event' ? 'warning' : 'info',
          });
        }
      }
    }

    return inconsistencies;
  }

  /**
   * 查找孤立节点（Orphan Nodes）- 没有连接的节点
   */
  findOrphanNodes(): Inconsistency[] {
    const nodes = this.engine.getNodes();
    const edges = this.engine.getEdges();
    const inconsistencies: Inconsistency[] = [];

    // 构建连接表
    const connected = new Set<string>();
    for (const edge of edges) {
      connected.add(edge.sourceId);
      connected.add(edge.targetId);
    }

    // 查找孤立节点
    for (const node of nodes) {
      if (!connected.has(node.id)) {
        inconsistencies.push({
          type: 'orphan_node',
          nodeIds: [node.id],
          message: `节点 ${node.id}（${node.title}）是孤立节点，没有连接`,
          severity: 'info',
        });
      }
    }

    return inconsistencies;
  }

  /**
   * 查找不一致的回环
   */
  findInconsistentCallbacks(): Inconsistency[] {
    const callbackStatuses = this.engine.checkCallbacksAligned();
    const inconsistencies: Inconsistency[] = [];

    for (const status of callbackStatuses) {
      if (!status.isAligned) {
        inconsistencies.push({
          type: 'inconsistent_callback',
          nodeIds: [status.sourceNodeId, status.targetNodeId],
          message: `回环 ${status.callbackId} 不一致：${status.misalignmentReason}`,
          severity: 'error',
        });
      }
    }

    return inconsistencies;
  }

  /**
   * 查找所有不一致问题
   */
  findAllInconsistencies(): Inconsistency[] {
    const all: Inconsistency[] = [];
    all.push(...this.findUnresolvedForeshadows());
    all.push(...this.findDeadEnds());
    all.push(...this.findOrphanNodes());
    all.push(...this.findInconsistentCallbacks());
    return all;
  }

  /**
   * 生成修复建议
   */
  suggestFixes(inconsistencies: Inconsistency[]): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];

    for (const inconsistency of inconsistencies) {
      switch (inconsistency.type) {
        case 'unresolved_foreshadow':
          suggestions.push({
            inconsistencyType: 'unresolved_foreshadow',
            suggestedAction: 'resolve_foreshadow',
            description: `添加从伏笔触发节点到目标节点的连接边，或调整节点顺序以确保叙事流程能到达伏笔目标`,
            affectedNodes: inconsistency.nodeIds,
            priority: 1,
          });
          break;

        case 'dead_end':
          suggestions.push({
            inconsistencyType: 'dead_end',
            suggestedAction: 'add_edge',
            description: `为断头路节点添加后续节点，或标记为终止节点`,
            affectedNodes: inconsistency.nodeIds,
            priority: 2,
          });
          break;

        case 'orphan_node':
          suggestions.push({
            inconsistencyType: 'orphan_node',
            suggestedAction: 'add_edge',
            description: `将孤立节点连接到叙事图中，或考虑移除该节点`,
            affectedNodes: inconsistency.nodeIds,
            priority: 3,
          });
          break;

        case 'inconsistent_callback':
          suggestions.push({
            inconsistencyType: 'inconsistent_callback',
            suggestedAction: 'align_callback',
            description: `修复回环连接的节点，确保源节点和目标节点都存在且有效`,
            affectedNodes: inconsistency.nodeIds,
            priority: 1,
          });
          break;
      }
    }

    // 按优先级排序
    return suggestions.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 完整检查并生成报告
   */
  checkAndSuggest(): {
    inconsistencies: Inconsistency[];
    suggestions: FixSuggestion[];
  } {
    const inconsistencies = this.findAllInconsistencies();
    const suggestions = this.suggestFixes(inconsistencies);
    return { inconsistencies, suggestions };
  }
}

/**
 * 快速检查叙事一致性
 */
export function checkNarrativeConsistency(
  engine: CircularNarrativeEngine
): {
  inconsistencies: Inconsistency[];
  suggestions: FixSuggestion[];
} {
  const checker = new NarrativeConsistencyChecker(engine);
  return checker.checkAndSuggest();
}