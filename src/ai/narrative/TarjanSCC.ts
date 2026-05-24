/**
 * V50 Tarjan SCC 检测器 - 强连通分量检测
 * TarjanSCC: Strongly Connected Components Detection
 */

import type { NarrativeNode, NarrativeEdge, NarrativeEdgeType, StronglyConnectedComponent, CycleInfo } from './types';

/**
 * 过滤出参与DAG检测的边类型
 */
const DAG_EDGE_TYPES: NarrativeEdgeType[] = ['sequence', 'branch', 'merge'];

/**
 * Tarjan SCC 检测器
 * 基于 Robert Tarjan 的经典算法，用于检测强连通分量
 */
export class TarjanSCC {
  private nodes: Map<string, NarrativeNode> = new Map();
  private adjacencyList: Map<string, string[]> = new Map();
  private nodeIds: string[] = [];

  // Tarjan 算法状态
  private index = 0;
  private indices: Map<string, number> = new Map();
  private lowlinks: Map<string, number> = new Map();
  private onStack: Set<string> = new Set();
  private stack: string[] = [];

  // 结果
  private sccs: StronglyConnectedComponent[] = [];

  constructor(nodes: NarrativeNode[], edges: NarrativeEdge[]) {
    this.buildGraph(nodes, edges);
  }

  /**
   * 构建图结构
   */
  private buildGraph(nodes: NarrativeNode[], edges: NarrativeEdge[]): void {
    this.nodes.clear();
    this.adjacencyList.clear();
    this.nodeIds = [];

    // 添加节点
    for (const node of nodes) {
      this.nodes.set(node.id, node);
      this.adjacencyList.set(node.id, []);
      this.nodeIds.push(node.id);
    }

    // 添加边（仅DAG边参与检测）
    for (const edge of edges) {
      if (DAG_EDGE_TYPES.includes(edge.type)) {
        this.adjacencyList.get(edge.sourceId)?.push(edge.targetId);
      }
    }
  }

  /**
   * 运行 Tarjan 算法
   * @returns 强连通分量数组
   */
  findSCCs(): StronglyConnectedComponent[] {
    // 重置状态
    this.index = 0;
    this.indices.clear();
    this.lowlinks.clear();
    this.onStack.clear();
    this.stack = [];
    this.sccs = [];

    // 对所有未访问节点运行 DFS
    for (const nodeId of this.nodeIds) {
      if (!this.indices.has(nodeId)) {
        this.tarjanDFS(nodeId);
      }
    }

    return this.sccs;
  }

  /**
   * Tarjan DFS
   */
  private tarjanDFS(nodeId: string): void {
    // 设置节点的索引和 lowlink
    this.indices.set(nodeId, this.index);
    this.lowlinks.set(nodeId, this.index);
    this.index++;
    this.stack.push(nodeId);
    this.onStack.add(nodeId);

    // 遍历所有邻接节点
    const neighbors = this.adjacencyList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!this.indices.has(neighbor)) {
        // 邻接节点未访问，递归 DFS
        this.tarjanDFS(neighbor);
        this.lowlinks.set(nodeId, Math.min(this.lowlinks.get(nodeId)!, this.lowlinks.get(neighbor)!));
      } else if (this.onStack.has(neighbor)) {
        // 邻接节点在栈中，更新 lowlink
        this.lowlinks.set(nodeId, Math.min(this.lowlinks.get(nodeId)!, this.indices.get(neighbor)!));
      }
    }

    // 如果节点是 SCC 的根，弹出栈中所有节点形成 SCC
    if (this.lowlinks.get(nodeId) === this.indices.get(nodeId)) {
      const sccNodes: string[] = [];
      let w: string;
      do {
        w = this.stack.pop()!;
        this.onStack.delete(w);
        sccNodes.push(w);
      } while (w !== nodeId);

      // 创建 SCC
      const sccId = this.sccs.length;
      const isCircular = sccNodes.length > 1;

      this.sccs.push({
        id: sccId,
        nodeIds: sccNodes,
        isCircular,
        cycleInfo: isCircular ? this.extractCycleFromSCC(sccNodes) : undefined,
      });
    }
  }

  /**
   * 从 SCC 中提取环路信息
   */
  private extractCycleFromSCC(sccNodes: string[]): CycleInfo | undefined {
    if (sccNodes.length < 2) {
      return undefined;
    }

    // 简化处理：返回节点列表作为环路
    return {
      nodeIds: [...sccNodes, sccNodes[0]], // 闭环
      edgeIds: [],
      length: sccNodes.length,
    };
  }

  /**
   * 识别循环叙事（多个节点形成的 SCC）
   * @returns 循环叙事 SCC 数组
   */
  identifyCircularNarratives(): StronglyConnectedComponent[] {
    const allSCCs = this.findSCCs();
    return allSCCs.filter(scc => scc.isCircular);
  }

  /**
   * 获取所有 SCC
   */
  getAllSCCs(): StronglyConnectedComponent[] {
    return this.sccs;
  }

  /**
   * 获取节点所属的 SCC ID
   */
  getSCCId(nodeId: string): number {
    // 懒加载：如果尚未计算 SCC，先计算
    if (this.sccs.length === 0 && this.indices.size === 0) {
      this.findSCCs();
    }
    for (const scc of this.sccs) {
      if (scc.nodeIds.includes(nodeId)) {
        return scc.id;
      }
    }
    return -1; // 不属于任何 SCC
  }

  /**
   * 检查节点是否在循环叙事中
   */
  isInCircularNarrative(nodeId: string): boolean {
    const sccId = this.getSCCId(nodeId);
    if (sccId < 0) {
      return false;
    }
    return this.sccs[sccId]?.isCircular ?? false;
  }
}

/**
 * 检测节点列表中的所有 SCC
 */
export function findSCCs(
  nodes: NarrativeNode[],
  edges: NarrativeEdge[]
): StronglyConnectedComponent[] {
  const tarjan = new TarjanSCC(nodes, edges);
  return tarjan.findSCCs();
}

/**
 * 识别循环叙事（返回多个节点形成的 SCC）
 */
export function identifyCircularNarratives(
  nodes: NarrativeNode[],
  edges: NarrativeEdge[]
): StronglyConnectedComponent[] {
  const tarjan = new TarjanSCC(nodes, edges);
  return tarjan.identifyCircularNarratives();
}

/**
 * 检查节点是否在循环叙事中
 */
export function isInCircularNarrative(
  nodeId: string,
  nodes: NarrativeNode[],
  edges: NarrativeEdge[]
): boolean {
  const tarjan = new TarjanSCC(nodes, edges);
  return tarjan.isInCircularNarrative(nodeId);
}