/**
 * V1296 NarrativeStoryNodeEngine — Direction I Iter 16/20 (Round 5)
 * Story node engine: nodes in story
 * Sources: nanobot node + thunderbolt + ruflo
 */

export type StoryNodeType = 'event' | 'decision' | 'turning_point' | 'revelation' | 'transformation' | 'transcendent';
export type StoryNodeWeight = 'trivial' | 'minor' | 'major' | 'pivotal' | 'epochal';
export type StoryNodeConnection = 'isolated' | 'sparse' | 'moderate' | 'dense' | 'infinite';

export interface StoryNode {
  nodeId: string;
  type: StoryNodeType;
  weight: StoryNodeWeight;
  connection: StoryNodeConnection;
  description: string;
  significance: number;
  leverage: number;
  chapter: number;
}

export interface StoryNodeCluster {
  clusterId: string,
  nodeIds: string[],
  cumulativeSignificance: number,
  density: number,
}

export interface NarrativeStoryNodeEngineState {
  nodes: Map<string, StoryNode>;
  clusters: Map<string, StoryNodeCluster>;
  totalNodes: number;
  totalClusters: number;
  averageSignificance: number;
  averageLeverage: number;
  clusterDensity: number;
  storyNodeMastery: number;
}

// Factory
export function createNarrativeStoryNodeEngineState(): NarrativeStoryNodeEngineState {
  return {
    nodes: new Map(),
    clusters: new Map(),
    totalNodes: 0,
    totalClusters: 0,
    averageSignificance: 0.5,
    averageLeverage: 0.5,
    clusterDensity: 0.5,
    storyNodeMastery: 0.5,
  };
}

// Add node
export function addStoryNode(
  state: NarrativeStoryNodeEngineState,
  nodeId: string,
  type: StoryNodeType,
  weight: StoryNodeWeight,
  connection: StoryNodeConnection,
  description: string,
  significance: number,
  leverage: number,
  chapter: number
): NarrativeStoryNodeEngineState {
  const node: StoryNode = { nodeId, type, weight, connection, description, significance, leverage, chapter };
  const nodes = new Map(state.nodes).set(nodeId, node);
  return recomputeStoryNode({ ...state, nodes, totalNodes: nodes.size });
}

// Add cluster
export function addStoryNodeCluster(
  state: NarrativeStoryNodeEngineState,
  clusterId: string,
  nodeIds: string[]
): NarrativeStoryNodeEngineState {
  const nodes = nodeIds.map(id => state.nodes.get(id)).filter((n): n is StoryNode => n !== undefined);
  const cumulativeSignificance = nodes.length === 0 ? 0
    : nodes.reduce((s, n) => s + n.significance, 0) / nodes.length;
  const typeSet = new Set(nodes.map(n => n.type));
  const density = Math.min(1, typeSet.size / 6);
  const cluster: StoryNodeCluster = { clusterId, nodeIds, cumulativeSignificance, density };
  const clusters = new Map(state.clusters).set(clusterId, cluster);
  return recomputeStoryNode({ ...state, clusters, totalClusters: clusters.size });
}

// Get nodes by type
export function getStoryNodesByType(state: NarrativeStoryNodeEngineState, type: StoryNodeType): StoryNode[] {
  return Array.from(state.nodes.values()).filter(n => n.type === type);
}

// Get story node report
export function getStoryNodeReport(state: NarrativeStoryNodeEngineState): {
  totalNodes: number;
  totalClusters: number;
  averageSignificance: number;
  averageLeverage: number;
  storyNodeMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalNodes === 0) recommendations.push('No nodes — add story nodes');
  if (state.averageSignificance < 0.5) recommendations.push('Low significance — strengthen');
  if (state.storyNodeMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalNodes: state.totalNodes,
    totalClusters: state.totalClusters,
    averageSignificance: Math.round(state.averageSignificance * 100) / 100,
    averageLeverage: Math.round(state.averageLeverage * 100) / 100,
    storyNodeMastery: Math.round(state.storyNodeMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeStoryNode(state: NarrativeStoryNodeEngineState): NarrativeStoryNodeEngineState {
  const nodes = Array.from(state.nodes.values());
  const averageSignificance = nodes.length === 0 ? 0.5
    : nodes.reduce((s, n) => s + n.significance, 0) / nodes.length;
  const averageLeverage = nodes.length === 0 ? 0.5
    : nodes.reduce((s, n) => s + n.leverage, 0) / nodes.length;

  const clusters = Array.from(state.clusters.values());
  const clusterDensity = clusters.length === 0 ? 0.5
    : clusters.reduce((s, c) => s + c.density, 0) / clusters.length;

  const storyNodeMastery = (averageSignificance * 0.4 + averageLeverage * 0.3 + clusterDensity * 0.3);

  return { ...state, averageSignificance, averageLeverage, clusterDensity, storyNodeMastery };
}

// Reset
export function resetNarrativeStoryNodeEngineState(): NarrativeStoryNodeEngineState {
  return createNarrativeStoryNodeEngineState();
}