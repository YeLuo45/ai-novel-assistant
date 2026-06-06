/**
 * V970 NarrativeHierarchicalEngine — Direction A Iter 3/15 (Round 5)
 * Hierarchical engine: hierarchical task decomposition + execution
 * Sources: ruflo hierarchical + thunderbolt + chatdev
 */

export type HierarchyLevel = 'strategic' | 'tactical' | 'operational' | 'execution' | 'detail';
export type NodeStatus = 'pending' | 'active' | 'in_progress' | 'completed' | 'blocked' | 'failed';
export type DecompositionStrategy = 'top_down' | 'bottom_up' | 'middle_out' | 'lateral' | 'hybrid';

export interface HierarchyNode {
  nodeId: string;
  level: HierarchyLevel;
  status: NodeStatus;
  strategy: DecompositionStrategy;
  name: string;
  parentId: string | null;
  childIds: string[];
  progress: number;
  chapter: number;
}

export interface HierarchyPlan {
  planId: string,
  name: string,
  rootId: string,
  strategy: DecompositionStrategy,
  completionRate: number,
  effectiveness: number,
}

export interface NarrativeHierarchicalEngineState {
  nodes: Map<string, HierarchyNode>;
  plans: Map<string, HierarchyPlan>;
  totalNodes: number;
  totalPlans: number;
  completedNodes: number;
  averageProgress: number;
  hierarchyDepth: number;
  hierarchicalMastery: number;
}

// Factory
export function createNarrativeHierarchicalEngineState(): NarrativeHierarchicalEngineState {
  return {
    nodes: new Map(),
    plans: new Map(),
    totalNodes: 0,
    totalPlans: 0,
    completedNodes: 0,
    averageProgress: 0.5,
    hierarchyDepth: 0,
    hierarchicalMastery: 0.5,
  };
}

// Add node
export function addHierarchyNode(
  state: NarrativeHierarchicalEngineState,
  nodeId: string,
  level: HierarchyLevel,
  strategy: DecompositionStrategy,
  name: string,
  parentId: string | null,
  chapter: number,
  childIds: string[] = []
): NarrativeHierarchicalEngineState {
  const status: NodeStatus = 'pending';
  const node: HierarchyNode = { nodeId, level, status, strategy, name, parentId, childIds, progress: 0, chapter };
  const nodes = new Map(state.nodes).set(nodeId, node);
  return recomputeHierarchical({ ...state, nodes, totalNodes: nodes.size });
}

// Update progress
export function updateHierarchyProgress(state: NarrativeHierarchicalEngineState, nodeId: string, progress: number): NarrativeHierarchicalEngineState {
  const node = state.nodes.get(nodeId);
  if (!node) return state;

  const clampedProgress = Math.min(1, Math.max(0, progress));
  const status: NodeStatus = clampedProgress === 1 ? 'completed'
    : clampedProgress === 0 ? 'pending'
    : clampedProgress < 0.3 ? 'active'
    : clampedProgress < 0.9 ? 'in_progress'
    : 'in_progress';
  const updated: HierarchyNode = { ...node, progress: clampedProgress, status };
  const nodes = new Map(state.nodes).set(nodeId, updated);
  const completedNodes = updated.status === 'completed' && node.status !== 'completed' ? state.completedNodes + 1 : state.completedNodes;
  return recomputeHierarchical({ ...state, nodes, completedNodes });
}

// Create plan
export function createHierarchyPlan(
  state: NarrativeHierarchicalEngineState,
  planId: string,
  name: string,
  rootId: string,
  strategy: DecompositionStrategy
): NarrativeHierarchicalEngineState {
  const root = state.nodes.get(rootId);
  const completionRate = root ? root.progress : 0;
  const allNodes = Array.from(state.nodes.values());
  const effectiveness = allNodes.length === 0 ? 0.5
    : allNodes.reduce((s, n) => s + n.progress, 0) / allNodes.length;
  const plan: HierarchyPlan = { planId, name, rootId, strategy, completionRate, effectiveness };
  const plans = new Map(state.plans).set(planId, plan);
  return recomputeHierarchical({ ...state, plans, totalPlans: plans.size });
}

// Get nodes by level
export function getNodesByLevel(state: NarrativeHierarchicalEngineState, level: HierarchyLevel): HierarchyNode[] {
  return Array.from(state.nodes.values()).filter(n => n.level === level);
}

// Get hierarchical report
export function getHierarchicalReport(state: NarrativeHierarchicalEngineState): {
  totalNodes: number;
  totalPlans: number;
  averageProgress: number;
  hierarchyDepth: number;
  hierarchicalMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalNodes === 0) recommendations.push('No nodes — add hierarchy nodes');
  if (state.averageProgress < 0.3) recommendations.push('Low progress — continue execution');
  if (state.hierarchicalMastery < 0.5) recommendations.push('Low mastery — improve');

  return {
    totalNodes: state.totalNodes,
    totalPlans: state.totalPlans,
    averageProgress: Math.round(state.averageProgress * 100) / 100,
    hierarchyDepth: state.hierarchyDepth,
    hierarchicalMastery: Math.round(state.hierarchicalMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeHierarchical(state: NarrativeHierarchicalEngineState): NarrativeHierarchicalEngineState {
  const nodes = Array.from(state.nodes.values());
  const totalProgress = nodes.reduce((s, n) => s + n.progress, 0);
  const averageProgress = nodes.length === 0 ? 0.5
    : totalProgress / nodes.length;

  // Hierarchy depth: longest chain
  const getDepth = (node: HierarchyNode | undefined, depth = 0): number => {
    if (!node) return depth;
    if (node.childIds.length === 0) return depth + 1;
    return Math.max(...node.childIds.map(cid => getDepth(state.nodes.get(cid), depth + 1)));
  };
  const rootNodes = nodes.filter(n => n.parentId === null);
  const hierarchyDepth = rootNodes.length === 0 ? 0
    : Math.max(...rootNodes.map(r => getDepth(r)));

  const plans = Array.from(state.plans.values());
  const planEffectiveness = plans.length === 0 ? 0.5
    : plans.reduce((s, p) => s + p.effectiveness, 0) / plans.length;

  const hierarchicalMastery = (averageProgress * 0.5 + (hierarchyDepth > 0 ? Math.min(1, hierarchyDepth / 5) : 0) * 0.2 + planEffectiveness * 0.3);

  return { ...state, averageProgress, hierarchyDepth, hierarchicalMastery };
}

// Reset
export function resetNarrativeHierarchicalEngineState(): NarrativeHierarchicalEngineState {
  return createNarrativeHierarchicalEngineState();
}