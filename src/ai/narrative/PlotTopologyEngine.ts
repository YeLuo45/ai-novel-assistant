/**
 * V890 PlotTopologyEngine — Direction C Iter 8/15 (Round 4)
 * Plot topology engine: topological structure of plot
 * Sources: ruflo topology + nanobot + thunderbolt
 */

export type TopologicalShape = 'linear' | 'branching' | 'circular' | 'spiral' | 'network' | 'fractal';
export type NodePosition = 'origin' | 'junction' | 'terminal' | 'loop' | 'isolated';
export type TopologicalHealth = 'broken' | 'disconnected' | 'connected' | 'robust' | 'elegant';

export interface PlotNode {
  nodeId: string;
  eventName: string;
  position: NodePosition;
  connections: string[];
  degree: number;
  chapter: number;
}

export interface PlotPath {
  pathId: string;
  name: string;
  nodeIds: string[];
  length: number;
  cycles: number;
  valid: boolean;
}

export interface PlotTopologyEngineState {
  nodes: Map<string, PlotNode>;
  paths: Map<string, PlotPath>;
  shape: TopologicalShape;
  totalNodes: number;
  totalPaths: number;
  averageDegree: number;
  complexity: number;
  topologicalHealth: TopologicalHealth;
}

// Factory
export function createPlotTopologyEngineState(): PlotTopologyEngineState {
  return {
    nodes: new Map(),
    paths: new Map(),
    shape: 'linear',
    totalNodes: 0,
    totalPaths: 0,
    averageDegree: 0,
    complexity: 0,
    topologicalHealth: 'disconnected',
  };
}

// Add node
export function addPlotNode(
  state: PlotTopologyEngineState,
  nodeId: string,
  eventName: string,
  position: NodePosition,
  chapter: number
): PlotTopologyEngineState {
  const node: PlotNode = { nodeId, eventName, position, connections: [], degree: 0, chapter };
  const nodes = new Map(state.nodes).set(nodeId, node);
  return recomputePlotTopo({ ...state, nodes, totalNodes: nodes.size });
}

// Connect nodes
export function connectPlotNodes(state: PlotTopologyEngineState, fromNodeId: string, toNodeId: string): PlotTopologyEngineState {
  const fromNode = state.nodes.get(fromNodeId);
  const toNode = state.nodes.get(toNodeId);
  if (!fromNode || !toNode) return state;

  const updatedFrom: PlotNode = {
    ...fromNode,
    connections: [...fromNode.connections, toNodeId],
    degree: fromNode.degree + 1,
  };
  const updatedTo: PlotNode = {
    ...toNode,
    connections: [...toNode.connections, fromNodeId],
    degree: toNode.degree + 1,
  };
  const nodes = new Map(state.nodes).set(fromNodeId, updatedFrom).set(toNodeId, updatedTo);
  return recomputePlotTopo({ ...state, nodes });
}

// Create path
export function createPlotPath(
  state: PlotTopologyEngineState,
  pathId: string,
  name: string,
  nodeIds: string[]
): PlotTopologyEngineState {
  let cycles = 0;
  const seen = new Set<string>();
  for (const id of nodeIds) {
    if (seen.has(id)) cycles++;
    seen.add(id);
  }
  const path: PlotPath = { pathId, name, nodeIds, length: nodeIds.length, cycles, valid: cycles === 0 };
  const paths = new Map(state.paths).set(pathId, path);
  return recomputePlotTopo({ ...state, paths, totalPaths: paths.size });
}

// Get plot topology report
export function getPlotTopologyReport(state: PlotTopologyEngineState): {
  totalNodes: number;
  totalPaths: number;
  averageDegree: number;
  shape: TopologicalShape;
  topologicalHealth: TopologicalHealth;
  complexity: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalNodes === 0) recommendations.push('No nodes — add nodes');
  if (state.averageDegree < 1) recommendations.push('Low degree — connect nodes');
  if (state.topologicalHealth === 'disconnected') recommendations.push('Disconnected — connect');

  return {
    totalNodes: state.totalNodes,
    totalPaths: state.totalPaths,
    averageDegree: Math.round(state.averageDegree * 100) / 100,
    shape: state.shape,
    topologicalHealth: state.topologicalHealth,
    complexity: Math.round(state.complexity * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputePlotTopo(state: PlotTopologyEngineState): PlotTopologyEngineState {
  const nodes = Array.from(state.nodes.values());
  const averageDegree = nodes.length === 0 ? 0
    : nodes.reduce((s, n) => s + n.degree, 0) / nodes.length;

  const isolated = nodes.filter(n => n.degree === 0).length;
  const loops = nodes.filter(n => n.position === 'loop').length;

  let shape: TopologicalShape = 'linear';
  if (isolated > nodes.length / 2) shape = 'network';
  else if (loops > 0) shape = 'circular';
  else if (averageDegree > 2) shape = 'branching';
  else if (state.totalPaths > 0 && Array.from(state.paths.values()).some(p => p.cycles > 0)) shape = 'spiral';
  else shape = 'linear';

  const complexity = Math.min(1, averageDegree / 4);

  const health: TopologicalHealth = isolated === nodes.length ? 'broken'
    : isolated > nodes.length / 2 ? 'disconnected'
    : isolated > 0 ? 'connected'
    : complexity > 0.7 ? 'elegant'
    : 'robust';

  return { ...state, averageDegree, shape, complexity, topologicalHealth: health };
}

// Reset plot topology state
export function resetPlotTopologyEngineState(): PlotTopologyEngineState {
  return createPlotTopologyEngineState();
}