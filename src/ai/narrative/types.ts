/**
 * V50 循环叙事引擎 - 类型定义
 * Narrative Types for Circular Narrative Engine
 */

/* 叙事节点类型 */
export type NarrativeNodeType =
  | 'chapter'
  | 'scene'
  | 'event'
  | 'character'
  | 'plot'
  | 'foreshadow'
  | 'callback';

/* 叙事节点 */
export interface NarrativeNode {
  id: string;
  type: NarrativeNodeType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

/* 叙事边类型 */
export type NarrativeEdgeType =
  | 'sequence'   // 线性序列（参与DAG检测）
  | 'branch'     // 分支（参与DAG检测）
  | 'merge'      // 合并（参与DAG检测）
  | 'foreshadow' // 伏笔（不参与DAG检测）
  | 'callback';  // 回环（不参与DAG检测）

/* 叙事边 */
export interface NarrativeEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: NarrativeEdgeType;
  metadata?: Record<string, unknown>;
}

/* 环路信息 */
export interface CycleInfo {
  nodeIds: string[];
  edgeIds: string[];
  length: number;
}

/* 边移除建议（用于破环） */
export interface EdgeRemoval {
  edgeId: string;
  sourceId: string;
  targetId: string;
  impact: 'low' | 'medium' | 'high';
}

/* 验证结果 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  cycles: CycleInfo[];
  minCut: EdgeRemoval[];
}

/* 验证错误 */
export interface ValidationError {
  code: string;
  message: string;
  nodeIds?: string[];
  edgeIds?: string[];
}

/* 验证警告 */
export interface ValidationWarning {
  code: string;
  message: string;
  nodeIds?: string[];
}

/* 图数据（用于可视化） */
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  sccs: StronglyConnectedComponent[];
}

/* 图节点 */
export interface GraphNode {
  id: string;
  label: string;
  type: NarrativeNodeType;
  color?: string;
  sccId?: number;
}

/* 图边 */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: NarrativeEdgeType;
  label?: string;
  dashed?: boolean;
}

/* 强连通分量 */
export interface StronglyConnectedComponent {
  id: number;
  nodeIds: string[];
  isCircular: boolean;
  cycleInfo?: CycleInfo;
}

/* 伏笔状态 */
export interface ForeshadowStatus {
  foreshadowId: string;
  triggerNodeId: string;
  targetNodeId: string;
  isResolved: boolean;
  resolutionPath?: string[];
}

/* 回环状态 */
export interface CallbackStatus {
  callbackId: string;
  sourceNodeId: string;
  targetNodeId: string;
  isAligned: boolean;
  misalignmentReason?: string;
}

/* 不一致性问题 */
export interface Inconsistency {
  type: 'unresolved_foreshadow' | 'dead_end' | 'orphan_node' | 'inconsistent_callback';
  nodeIds: string[];
  edgeIds?: string[];
  message: string;
  severity: 'info' | 'warning' | 'error';
}

/* 修复建议 */
export interface FixSuggestion {
  inconsistencyType: string;
  suggestedAction: 'add_edge' | 'remove_node' | 'resolve_foreshadow' | 'align_callback';
  description: string;
  affectedNodes: string[];
  priority: number;
}