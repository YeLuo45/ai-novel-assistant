/**
 * V1270 NarrativeStoryNetworkEngine — Direction I Iter 3/20 (Round 5)
 * Story network engine: network of story connections
 * Sources: ruflo network + nanobot + thunderbolt
 */

export type StoryNetworkType = 'character' | 'event' | 'cause' | 'thematic' | 'symbolic' | 'transcendent';
export type StoryNetworkStrength = 'weak' | 'moderate' | 'strong' | 'powerful' | 'overwhelming';
export type StoryNetworkReach = 'local' | 'regional' | 'narrative' | 'universal' | 'transcendent';

export interface StoryNetworkNode {
  nodeId: string;
  type: StoryNetworkType;
  strength: StoryNetworkStrength;
  reach: StoryNetworkReach;
  description: string;
  centrality: number;
  influence: number;
  chapter: number;
}

export interface StoryNetworkCluster {
  clusterId: string,
  nodeIds: string[],
  cumulativeCentrality: number,
  density: number,
}

export interface NarrativeStoryNetworkEngineState {
  nodes: Map<string, StoryNetworkNode>;
  clusters: Map<string, StoryNetworkCluster>;
  totalNodes: number;
  totalClusters: number;
  averageCentrality: number;
  averageInfluence: number;
  clusterDensity: number;
  storyNetworkMastery: number;
}

// Factory
export function createNarrativeStoryNetworkEngineState(): NarrativeStoryNetworkEngineState {
  return {
    nodes: new Map(),
    clusters: new Map(),
    totalNodes: 0,
    totalClusters: 0,
    averageCentrality: 0.5,
    averageInfluence: 0.5,
    clusterDensity: 0.5,
    storyNetworkMastery: 0.5,
  };
}

// Add node
export function addStoryNetworkNode(
  state: NarrativeStoryNetworkEngineState,
  nodeId: string,
  type: StoryNetworkType,
  strength: StoryNetworkStrength,
  reach: StoryNetworkReach,
  description: string,
  centrality: number,
  influence: number,
  chapter: number
): NarrativeStoryNetworkEngineState {
  const node: StoryNetworkNode = { nodeId, type, strength, reach, description, centrality, influence, chapter };
  const nodes = new Map(state.nodes).set(nodeId, node);
  return recomputeStoryNetwork({ ...state, nodes, totalNodes: nodes.size });
}

// Add cluster
export function addStoryNetworkCluster(
  state: NarrativeStoryNetworkEngineState,
  clusterId: string,
  nodeIds: string[]
): NarrativeStoryNetworkEngineState {
  const nodes = nodeIds.map(id => state.nodes.get(id)).filter((n): n is StoryNetworkNode => n !== undefined);
  const cumulativeCentrality = nodes.length === 0 ? 0
    : nodes.reduce((s, n) => s + n.centrality, 0) / nodes.length;
  const typeSet = new Set(nodes.map(n => n.type));
  const density = Math.min(1, typeSet.size / 6);
  const cluster: StoryNetworkCluster = { clusterId, nodeIds, cumulativeCentrality, density };
  const clusters = new Map(state.clusters).set(clusterId, cluster);
  return recomputeStoryNetwork({ ...state, clusters, totalClusters: clusters.size });
}

// Get nodes by type
export function getStoryNetworkNodesByType(state: NarrativeStoryNetworkEngineState, type: StoryNetworkType): StoryNetworkNode[] {
  return Array.from(state.nodes.values()).filter(n => n.type === type);
}

// Get story network report
export function getStoryNetworkReport(state: NarrativeStoryNetworkEngineState): {
  totalNodes: number;
  totalClusters: number;
  averageCentrality: number;
  averageInfluence: number;
  storyNetworkMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalNodes === 0) recommendations.push('No nodes — add story network nodes');
  if (state.averageCentrality < 0.5) recommendations.push('Low centrality — strengthen');
  if (state.storyNetworkMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalNodes: state.totalNodes,
    totalClusters: state.totalClusters,
    averageCentrality: Math.round(state.averageCentrality * 100) / 100,
    averageInfluence: Math.round(state.averageInfluence * 100) / 100,
    storyNetworkMastery: Math.round(state.storyNetworkMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeStoryNetwork(state: NarrativeStoryNetworkEngineState): NarrativeStoryNetworkEngineState {
  const nodes = Array.from(state.nodes.values());
  const averageCentrality = nodes.length === 0 ? 0.5
    : nodes.reduce((s, n) => s + n.centrality, 0) / nodes.length;
  const averageInfluence = nodes.length === 0 ? 0.5
    : nodes.reduce((s, n) => s + n.influence, 0) / nodes.length;

  const clusters = Array.from(state.clusters.values());
  const clusterDensity = clusters.length === 0 ? 0.5
    : clusters.reduce((s, c) => s + c.density, 0) / clusters.length;

  const storyNetworkMastery = (averageCentrality * 0.4 + averageInfluence * 0.3 + clusterDensity * 0.3);

  return { ...state, averageCentrality, averageInfluence, clusterDensity, storyNetworkMastery };
}

// Reset
export function resetNarrativeStoryNetworkEngineState(): NarrativeStoryNetworkEngineState {
  return createNarrativeStoryNetworkEngineState();
}