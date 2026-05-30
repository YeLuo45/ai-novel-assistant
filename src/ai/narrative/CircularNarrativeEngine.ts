/**
 * V50 循环叙事引擎 - 核心引擎
 * CircularNarrativeEngine: Core Narrative Engine with DAG + Tarjan SCC
 */

import type {
  NarrativeNode,
  NarrativeEdge,
  NarrativeEdgeType,
  ValidationResult,
  GraphData,
  GraphNode,
  GraphEdge,
  ForeshadowStatus,
  CallbackStatus,
  StronglyConnectedComponent,
} from './types';
import { DAGValidator } from './DAGValidator';
import { TarjanSCC } from './TarjanSCC';

/**
 * 伏笔注册信息
 */
interface ForeshadowRegistration {
  foreshadowId: string;
  triggerNodeId: string;
  targetNodeId: string;
  createdAt: number;
}

/**
 * 回环注册信息
 */
interface CallbackRegistration {
  callbackId: string;
  sourceNodeId: string;
  targetNodeId: string;
  createdAt: number;
}

/**
 * 循环叙事引擎
 * 核心功能：
 * 1. 管理叙事节点和边
 * 2. Kahn算法验证DAG（callback/foreshadow边不参与检测）
 * 3. Tarjan SCC检测循环叙事
 * 4. 提供图数据用于可视化
 */
export class CircularNarrativeEngine {
  private nodes: Map<string, NarrativeNode> = new Map();
  private edges: Map<string, NarrativeEdge> = new Map();
  private foreshadows: Map<string, ForeshadowRegistration> = new Map();
  private callbacks: Map<string, CallbackRegistration> = new Map();

  // 缓存
  private dagValidator: DAGValidator | null = null;
  private tarjanSCC: TarjanSCC | null = null;
  private cacheValid: boolean = false;

  constructor() {
    this.clear();
  }

  /**
   * 清空所有数据
   */
  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.foreshadows.clear();
    this.callbacks.clear();
    this.dagValidator = null;
    this.tarjanSCC = null;
    this.cacheValid = false;
  }

  /**
   * 添加节点
   */
  addNode(node: NarrativeNode): void {
    this.nodes.set(node.id, node);
    this.invalidateCache();
  }

  /**
   * 批量添加节点
   */
  addNodes(nodeList: NarrativeNode[]): void {
    for (const node of nodeList) {
      this.nodes.set(node.id, node);
    }
    this.invalidateCache();
  }

  /**
   * 连接两个节点
   * @param sourceId 源节点ID
   * @param targetId 目标节点ID
   * @param type 边类型（默认 sequence）
   */
  connect(sourceId: string, targetId: string, type: NarrativeEdgeType = 'sequence'): void {
    // 验证节点存在
    if (!this.nodes.has(sourceId)) {
      throw new Error(`源节点 ${sourceId} 不存在`);
    }
    if (!this.nodes.has(targetId)) {
      throw new Error(`目标节点 ${targetId} 不存在`);
    }

    // 创建边
    const edgeId = `${sourceId}->${targetId}`;
    const edge: NarrativeEdge = {
      id: edgeId,
      sourceId,
      targetId,
      type,
      metadata: {},
    };
    this.edges.set(edgeId, edge);
    this.invalidateCache();
  }

  /**
   * 注册伏笔
   * @param foreshadowId 伏笔ID
   * @param triggerNodeId 触发节点ID
   * @param targetNodeId 目标节点ID
   */
  registerForeshadow(foreshadowId: string, triggerNodeId: string, targetNodeId: string): void {
    // 验证节点存在
    if (!this.nodes.has(triggerNodeId)) {
      throw new Error(`触发节点 ${triggerNodeId} 不存在`);
    }
    if (!this.nodes.has(targetNodeId)) {
      throw new Error(`目标节点 ${targetNodeId} 不存在`);
    }

    const registration: ForeshadowRegistration = {
      foreshadowId,
      triggerNodeId,
      targetNodeId,
      createdAt: Date.now(),
    };
    this.foreshadows.set(foreshadowId, registration);

    // 添加伏笔边
    const edgeId = `foreshadow-${foreshadowId}`;
    const edge: NarrativeEdge = {
      id: edgeId,
      sourceId: triggerNodeId,
      targetId: targetNodeId,
      type: 'foreshadow',
      metadata: { foreshadowId },
    };
    this.edges.set(edgeId, edge);
    this.invalidateCache();
  }

  /**
   * 注册回环
   * @param callbackId 回环ID
   * @param sourceNodeId 源节点ID
   * @param targetNodeId 目标节点ID
   */
  registerCallback(callbackId: string, sourceNodeId: string, targetNodeId: string): void {
    // 验证节点存在
    if (!this.nodes.has(sourceNodeId)) {
      throw new Error(`源节点 ${sourceNodeId} 不存在`);
    }
    if (!this.nodes.has(targetNodeId)) {
      throw new Error(`目标节点 ${targetNodeId} 不存在`);
    }

    const registration: CallbackRegistration = {
      callbackId,
      sourceNodeId,
      targetNodeId,
      createdAt: Date.now(),
    };
    this.callbacks.set(callbackId, registration);

    // 添加回环边
    const edgeId = `callback-${callbackId}`;
    const edge: NarrativeEdge = {
      id: edgeId,
      sourceId: sourceNodeId,
      targetId: targetNodeId,
      type: 'callback',
      metadata: { callbackId },
    };
    this.edges.set(edgeId, edge);
    this.invalidateCache();
  }

  /**
   * 使缓存失效
   */
  private invalidateCache(): void {
    this.cacheValid = false;
  }

  /**
   * 重建缓存
   */
  private rebuildCache(): void {
    if (this.cacheValid) {
      return;
    }

    const nodesArray = Array.from(this.nodes.values());
    const edgesArray = Array.from(this.edges.values());

    this.dagValidator = new DAGValidator(nodesArray, edgesArray);
    this.tarjanSCC = new TarjanSCC(nodesArray, edgesArray);
    this.cacheValid = true;
  }

  /**
   * 验证叙事图
   * @returns 验证结果
   */
  validate(): ValidationResult {
    this.rebuildCache();
    return this.dagValidator!.validate();
  }

  /**
   * 检查所有伏笔是否已解决
   */
  checkForeshadowResolved(): ForeshadowStatus[] {
    const statuses: ForeshadowStatus[] = [];

    for (const [, foreshadow] of Array.from(this.foreshadows.entries())) {
      // 查找从 trigger 到 target 的路径
      const path = this.findPath(foreshadow.triggerNodeId, foreshadow.targetNodeId);
      statuses.push({
        foreshadowId: foreshadow.foreshadowId,
        triggerNodeId: foreshadow.triggerNodeId,
        targetNodeId: foreshadow.targetNodeId,
        isResolved: path.length > 0,
        resolutionPath: path,
      });
    }

    return statuses;
  }

  /**
   * 检查所有回环是否对齐
   */
  checkCallbacksAligned(): CallbackStatus[] {
    const statuses: CallbackStatus[] = [];

    for (const [, callback] of Array.from(this.callbacks.entries())) {
      // 简单验证：源节点和目标节点都存在
      const sourceExists = this.nodes.has(callback.sourceNodeId);
      const targetExists = this.nodes.has(callback.targetNodeId);
      const isAligned = sourceExists && targetExists;

      statuses.push({
        callbackId: callback.callbackId,
        sourceNodeId: callback.sourceNodeId,
        targetNodeId: callback.targetNodeId,
        isAligned,
        misalignmentReason: !isAligned
          ? `源节点${sourceExists ? '' : '不'}存在，目标节点${targetExists ? '' : '不'}存在`
          : undefined,
      });
    }

    return statuses;
  }

  /**
   * 简单路径查找（BFS）
   */
  private findPath(startId: string, endId: string): string[] {
    if (startId === endId) {
      return [startId];
    }

    const visited = new Set<string>();
    const queue: string[][] = [[startId]];

    while (queue.length > 0) {
      const path = queue.shift()!;
      const current = path[path.length - 1];

      if (visited.has(current)) {
        continue;
      }
      visited.add(current);

      // 遍历 sequence/branch/merge 边
      for (const [edgeId, edge] of Array.from(this.edges.entries())) {
        if (edge.type !== 'sequence' && edge.type !== 'branch' && edge.type !== 'merge') {
          continue;
        }
        if (edge.sourceId !== current) {
          continue;
        }

        if (edge.targetId === endId) {
          return [...path, endId];
        }

        if (!visited.has(edge.targetId)) {
          queue.push([...path, edge.targetId]);
        }
      }
    }

    return [];
  }

  /**
   * 生成图数据（用于可视化）
   */
  generateGraphData(): GraphData {
    this.rebuildCache();

    const nodesArray = Array.from(this.nodes.values());
    const edgesArray = Array.from(this.edges.values());

    // 生成图节点
    const graphNodes: GraphNode[] = nodesArray.map(node => ({
      id: node.id,
      label: node.title,
      type: node.type,
      sccId: this.tarjanSCC!.getSCCId(node.id),
    }));

    // 生成图边
    const graphEdges: GraphEdge[] = edgesArray.map(edge => ({
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      type: edge.type,
      dashed: edge.type === 'foreshadow' || edge.type === 'callback',
    }));

    // 获取 SCC
    const sccs = this.tarjanSCC!.getAllSCCs();

    return {
      nodes: graphNodes,
      edges: graphEdges,
      sccs,
    };
  }

  /**
   * 获取所有节点
   */
  getNodes(): NarrativeNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * 获取所有边
   */
  getEdges(): NarrativeEdge[] {
    return Array.from(this.edges.values());
  }

  /**
   * 获取所有伏笔注册
   */
  getForeshadows(): ForeshadowRegistration[] {
    return Array.from(this.foreshadows.values());
  }

  /**
   * 获取所有回环注册
   */
  getCallbacks(): CallbackRegistration[] {
    return Array.from(this.callbacks.values());
  }

  /**
   * 获取节点数量
   */
  getNodeCount(): number {
    return this.nodes.size;
  }

  /**
   * 获取边数量
   */
  getEdgeCount(): number {
    return this.edges.size;
  }
}

/**
 * 创建新的循环叙事引擎实例
 */
export function createCircularNarrativeEngine(): CircularNarrativeEngine {
  return new CircularNarrativeEngine();
}