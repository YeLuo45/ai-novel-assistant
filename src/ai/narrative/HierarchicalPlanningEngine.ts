/**
 * V830 HierarchicalPlanningEngine — Direction A Iter 2/9 (Round 4)
 * Hierarchical planning engine: hierarchical task decomposition + planning
 * Sources: ruflo hierarchical + thunderbolt pipeline + generic-agent
 */

export type PlanLevel = 'mission' | 'goal' | 'strategy' | 'task' | 'action';
export type PlanStatus = 'draft' | 'active' | 'blocked' | 'completed' | 'abandoned';
export type DependencyType = 'requires' | 'enables' | 'conflicts' | 'relates';

export interface PlanNode {
  nodeId: string;
  level: PlanLevel;
  status: PlanStatus;
  description: string;
  parentId: string | null;
  childIds: string[];
  priority: number;
  progress: number;
}

export interface PlanDependency {
  dependencyId: string;
  fromNodeId: string;
  toNodeId: string;
  type: DependencyType;
  strength: number;
}

export interface HierarchicalPlanningEngineState {
  nodes: Map<string, PlanNode>;
  dependencies: Map<string, PlanDependency>;
  totalNodes: number;
  totalDependencies: number;
  completedNodes: number;
  blockedNodes: number;
  averageProgress: number;
  levelDistribution: Map<PlanLevel, number>;
  planCoherence: number;
  executionVelocity: number;
}

// Factory
export function createHierarchicalPlanningEngineState(): HierarchicalPlanningEngineState {
  return {
    nodes: new Map(),
    dependencies: new Map(),
    totalNodes: 0,
    totalDependencies: 0,
    completedNodes: 0,
    blockedNodes: 0,
    averageProgress: 0,
    levelDistribution: new Map(),
    planCoherence: 0.5,
    executionVelocity: 0,
  };
}

// Create plan node
export function createPlanNode(
  state: HierarchicalPlanningEngineState,
  nodeId: string,
  level: PlanLevel,
  description: string,
  parentId: string | null = null,
  priority: number = 1
): HierarchicalPlanningEngineState {
  const node: PlanNode = {
    nodeId, level, status: 'draft', description,
    parentId, childIds: [], priority, progress: 0,
  };
  const nodes = new Map(state.nodes).set(nodeId, node);

  // Update parent's children
  let updatedNodes = nodes;
  if (parentId) {
    const parent = state.nodes.get(parentId);
    if (parent) {
      const updatedParent: PlanNode = { ...parent, childIds: [...parent.childIds, nodeId] };
      updatedNodes = new Map(nodes).set(parentId, updatedParent);
    }
  }

  const levelDistribution = new Map(state.levelDistribution);
  levelDistribution.set(level, (levelDistribution.get(level) || 0) + 1);

  return recomputePlanning({ ...state, nodes: updatedNodes, levelDistribution, totalNodes: updatedNodes.size });
}

// Update progress
export function updatePlanProgress(state: HierarchicalPlanningEngineState, nodeId: string, progress: number, status?: PlanStatus): HierarchicalPlanningEngineState {
  const node = state.nodes.get(nodeId);
  if (!node) return state;

  const newProgress = Math.min(1, Math.max(0, progress));
  const newStatus: PlanStatus = status || (newProgress === 0 ? 'draft' : newProgress >= 1 ? 'completed' : 'active');
  const updated: PlanNode = { ...node, progress: newProgress, status: newStatus };
  const nodes = new Map(state.nodes).set(nodeId, updated);

  const completedNodes = newStatus === 'completed' && node.status !== 'completed' ? state.completedNodes + 1 : state.completedNodes;
  const blockedNodes = newStatus === 'blocked' && node.status !== 'blocked' ? state.blockedNodes + 1 : state.blockedNodes;

  return recomputePlanning({ ...state, nodes, completedNodes, blockedNodes });
}

// Add dependency
export function addPlanDependency(
  state: HierarchicalPlanningEngineState,
  dependencyId: string,
  fromNodeId: string,
  toNodeId: string,
  type: DependencyType,
  strength: number = 0.5
): HierarchicalPlanningEngineState {
  const dependency: PlanDependency = { dependencyId, fromNodeId, toNodeId, type, strength };
  const dependencies = new Map(state.dependencies).set(dependencyId, dependency);
  return recomputePlanning({ ...state, dependencies, totalDependencies: dependencies.size });
}

// Get nodes by level
export function getNodesByLevel(state: HierarchicalPlanningEngineState, level: PlanLevel): PlanNode[] {
  return Array.from(state.nodes.values()).filter(n => n.level === level);
}

// Get children
export function getChildNodes(state: HierarchicalPlanningEngineState, nodeId: string): PlanNode[] {
  const node = state.nodes.get(nodeId);
  if (!node) return [];
  return node.childIds.map(id => state.nodes.get(id)).filter((n): n is PlanNode => n !== undefined);
}

// Get planning report
export function getPlanningEngineReport(state: HierarchicalPlanningEngineState): {
  totalNodes: number;
  totalDependencies: number;
  completedNodes: number;
  blockedNodes: number;
  averageProgress: number;
  planCoherence: number;
  executionVelocity: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalNodes === 0) recommendations.push('No nodes — create plan');
  if (state.blockedNodes > 0) recommendations.push(`${state.blockedNodes} blocked nodes — unblock them`);
  if (state.planCoherence < 0.5) recommendations.push('Low coherence — review structure');

  return {
    totalNodes: state.totalNodes,
    totalDependencies: state.totalDependencies,
    completedNodes: state.completedNodes,
    blockedNodes: state.blockedNodes,
    averageProgress: Math.round(state.averageProgress * 100) / 100,
    planCoherence: Math.round(state.planCoherence * 100) / 100,
    executionVelocity: Math.round(state.executionVelocity * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputePlanning(state: HierarchicalPlanningEngineState): HierarchicalPlanningEngineState {
  const nodes = Array.from(state.nodes.values());
  const averageProgress = nodes.length === 0 ? 0
    : nodes.reduce((s, n) => s + n.progress, 0) / nodes.length;

  // Coherence: ratio of nodes that have proper structure
  const withParent = nodes.filter(n => n.parentId !== null || n.level === 'mission').length;
  const planCoherence = nodes.length === 0 ? 0.5 : withParent / nodes.length;

  const executionVelocity = state.totalNodes === 0 ? 0
    : state.completedNodes / state.totalNodes;

  return { ...state, averageProgress, planCoherence, executionVelocity };
}

// Reset planning state
export function resetHierarchicalPlanningEngineState(): HierarchicalPlanningEngineState {
  return createHierarchicalPlanningEngineState();
}