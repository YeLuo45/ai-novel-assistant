/**
 * V50 DAG 验证器 - Kahn算法 + 环路检测 + 最小割破环
 * DAGValidator: Kahn's Algorithm + Cycle Detection + Min-Cut Break Cycles
 */

import type {
  NarrativeEdge,
  NarrativeNode,
  CycleInfo,
  EdgeRemoval,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  NarrativeEdgeType,
} from './types';

/**
 * 过滤出参与DAG检测的边类型
 * Only sequence/branch/merge edges participate in DAG validation
 */
const DAG_EDGE_TYPES: NarrativeEdgeType[] = ['sequence', 'branch', 'merge'];

/**
 * DAG验证器
 */
export class DAGValidator {
  private nodes: Map<string, NarrativeNode> = new Map();
  private edges: NarrativeEdge[] = [];
  private adjacencyList: Map<string, string[]> = new Map();
  private reverseAdjacencyList: Map<string, string[]> = new Map();

  constructor(nodes: NarrativeNode[], edges: NarrativeEdge[]) {
    this.buildGraph(nodes, edges);
  }

  /**
   * 构建图结构
   */
  private buildGraph(nodes: NarrativeNode[], edges: NarrativeEdge[]): void {
    this.nodes.clear();
    this.adjacencyList.clear();
    this.reverseAdjacencyList.clear();
    this.edges = [];

    // 添加节点
    for (const node of nodes) {
      this.nodes.set(node.id, node);
      this.adjacencyList.set(node.id, []);
      this.reverseAdjacencyList.set(node.id, []);
    }

    // 添加边（仅DAG边参与检测）
    for (const edge of edges) {
      if (DAG_EDGE_TYPES.includes(edge.type)) {
        this.edges.push(edge);
        this.adjacencyList.get(edge.sourceId)?.push(edge.targetId);
        this.reverseAdjacencyList.get(edge.targetId)?.push(edge.sourceId);
      }
    }
  }

  /**
   * 使用 Kahn 算法验证是否为 DAG
   * @returns true 表示是有效DAG，false 表示存在环路
   */
  isDAG(): boolean {
    const inDegree = new Map<string, number>();
    const queue: string[] = [];
    let processedCount = 0;

    // 初始化入度
    const nodeIds = Array.from(this.nodes.keys());
    for (const nodeId of nodeIds) {
      inDegree.set(nodeId, 0);
    }

    // 计算入度
    for (const edge of this.edges) {
      inDegree.set(edge.targetId, (inDegree.get(edge.targetId) || 0) + 1);
    }

    // 入度为0的节点入队
    for (const [nodeId, degree] of Array.from(inDegree.entries())) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }

    // BFS拓扑排序
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      processedCount++;

      const neighbors = this.adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    return processedCount === this.nodes.size;
  }

  /**
   * Kahn算法拓扑排序
   * @returns 排序后的节点ID数组，如果存在环路则返回空数组
   */
  topologicalSort(): string[] {
    const result: string[] = [];
    const inDegree = new Map<string, number>();
    const queue: string[] = [];

    // 初始化入度
    const nodeIds = Array.from(this.nodes.keys());
    for (const nodeId of nodeIds) {
      inDegree.set(nodeId, 0);
    }

    // 计算入度
    for (const edge of this.edges) {
      inDegree.set(edge.targetId, (inDegree.get(edge.targetId) || 0) + 1);
    }

    // 入度为0的节点入队
    for (const [nodeId, degree] of Array.from(inDegree.entries())) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }

    // BFS拓扑排序
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      result.push(nodeId);

      const neighbors = this.adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    return result;
  }

  /**
   * 查找所有环路（使用DFS）
   * @returns 环路信息数组
   */
  findCycles(): CycleInfo[] {
    const cycles: CycleInfo[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];
    const pathEdges: string[] = [];

    // 构建边ID查找表
    const edgeMap = new Map<string, NarrativeEdge>();
    for (const edge of this.edges) {
      edgeMap.set(`${edge.sourceId}->${edge.targetId}`, edge);
    }

    const dfs = (nodeId: string): void => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const neighbors = this.adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        const edgeId = `${nodeId}->${neighbor}`;
        pathEdges.push(edgeId);

        if (!visited.has(neighbor)) {
          dfs(neighbor);
        } else if (recursionStack.has(neighbor)) {
          // 发现环路
          const cycleStart = path.indexOf(neighbor);
          const cyclePath = path.slice(cycleStart);
          cyclePath.push(neighbor); // 闭环

          const cycleEdges: string[] = [];
          for (let i = cycleStart; i < path.length; i++) {
            const from = path[i];
            const to = path[i + 1];
            if (to) {
              cycleEdges.push(`${from}->${to}`);
            }
          }
          cycleEdges.push(edgeId);

          cycles.push({
            nodeIds: cyclePath,
            edgeIds: cycleEdges.filter(e => e !== edgeId || cycleEdges.indexOf(e) === cycleEdges.lastIndexOf(e)),
            length: cyclePath.length - 1,
          });
        }

        pathEdges.pop();
      }

      path.pop();
      recursionStack.delete(nodeId);
    };

    const nodeIds = Array.from(this.nodes.keys());
    for (const nodeId of nodeIds) {
      if (!visited.has(nodeId)) {
        dfs(nodeId);
      }
    }

    // 去重（同一环路可能多次检测到）
    return this.deduplicateCycles(cycles);
  }

  /**
   * 环路去重
   */
  private deduplicateCycles(cycles: CycleInfo[]): CycleInfo[] {
    const seen = new Set<string>();
    return cycles.filter(cycle => {
      const key = cycle.nodeIds.slice().sort().join(',');
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * 查找最小割边（用于破环）
   * 使用简化的关键边识别：去除后可使图变为DAG的最小边集
   */
  findMinCutToBreakCycles(): EdgeRemoval[] {
    const cycles = this.findCycles();
    if (cycles.length === 0) {
      return [];
    }

    const edgeImpact = new Map<string, EdgeRemoval>();
    const edgeMap = new Map<string, NarrativeEdge>();
    for (const edge of this.edges) {
      edgeMap.set(`${edge.sourceId}->${edge.targetId}`, edge);
    }

    // 统计每条边出现在多少个环路中
    for (const cycle of cycles) {
      for (const edgeId of cycle.edgeIds) {
        const existing = edgeImpact.get(edgeId);
        if (existing) {
          // 已存在，增加计数（简化处理）
          edgeImpact.set(edgeId, {
            ...existing,
            impact: 'medium',
          });
        } else {
          const edge = edgeMap.get(edgeId);
          if (edge) {
            edgeImpact.set(edgeId, {
              edgeId,
              sourceId: edge.sourceId,
              targetId: edge.targetId,
              impact: 'low',
            });
          }
        }
      }
    }

    // 返回按impact排序的建议
    return Array.from(edgeImpact.values()).sort((a, b) => {
      const order: Record<string, number> = { low: 0, medium: 1, high: 2 };
      return order[a.impact] - order[b.impact];
    });
  }

  /**
   * 完整验证
   */
  validate(): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const cycles = this.findCycles();
    const minCut = this.findMinCutToBreakCycles();

    const isValidDAG = this.isDAG();

    if (!isValidDAG) {
      errors.push({
        code: 'CYCLE_DETECTED',
        message: `检测到 ${cycles.length} 个环路，图不是有效DAG`,
        nodeIds: Array.from(new Set(cycles.flatMap(c => c.nodeIds))),
        edgeIds: Array.from(new Set(cycles.flatMap(c => c.edgeIds))),
      });
    }

    // 检查孤立节点
    const nodeIds = Array.from(this.nodes.keys());
    for (const nodeId of nodeIds) {
      const outgoing = this.adjacencyList.get(nodeId) || [];
      const incoming = this.reverseAdjacencyList.get(nodeId) || [];
      if (outgoing.length === 0 && incoming.length === 0) {
        warnings.push({
          code: 'ISOLATED_NODE',
          message: `节点 ${nodeId} 没有连接边`,
          nodeIds: [nodeId],
        });
      }
    }

    return {
      isValid: isValidDAG,
      errors,
      warnings,
      cycles,
      minCut,
    };
  }

  /**
   * 获取节点的入度
   */
  getInDegree(nodeId: string): number {
    return (this.reverseAdjacencyList.get(nodeId) || []).length;
  }

  /**
   * 获取节点的出度
   */
  getOutDegree(nodeId: string): number {
    return (this.adjacencyList.get(nodeId) || []).length;
  }
}

/**
 * 验证一组节点和边是否构成有效DAG
 */
export function validateDAG(
  nodes: NarrativeNode[],
  edges: NarrativeEdge[]
): ValidationResult {
  const validator = new DAGValidator(nodes, edges);
  return validator.validate();
}

/**
 * 检测环路
 */
export function findCycles(
  nodes: NarrativeNode[],
  edges: NarrativeEdge[]
): CycleInfo[] {
  const validator = new DAGValidator(nodes, edges);
  return validator.findCycles();
}

/**
 * 计算最小破环割边
 */
export function findMinCutToBreakCycles(
  nodes: NarrativeNode[],
  edges: NarrativeEdge[]
): EdgeRemoval[] {
  const validator = new DAGValidator(nodes, edges);
  return validator.findMinCutToBreakCycles();
}