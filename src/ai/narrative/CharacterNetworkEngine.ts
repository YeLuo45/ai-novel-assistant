/**
 * V880 CharacterNetworkEngine — Direction C Iter 3/15 (Round 4)
 * Character network engine: character network analysis + social graph
 * Sources: nanobot network + thunderbolt + chatdev
 */

export type NetworkNode = 'protagonist' | 'ally' | 'antagonist' | 'neutral' | 'mentor' | 'love_interest';
export type EdgeType = 'friendship' | 'rivalry' | 'family' | 'romance' | 'professional' | 'adversarial';
export type NetworkHealth = 'fragmented' | 'sparse' | 'connected' | 'dense' | 'interwoven';

export interface NetworkNodeData {
  nodeId: string;
  characterId: string;
  type: NetworkNode;
  centrality: number;
  influence: number;
  connections: number;
}

export interface NetworkEdge {
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
  type: EdgeType;
  strength: number;
  evolution: number;
}

export interface CharacterNetworkEngineState {
  nodes: Map<string, NetworkNodeData>;
  edges: Map<string, NetworkEdge>;
  totalNodes: number;
  totalEdges: number;
  averageCentrality: number;
  networkDensity: number;
  networkHealth: NetworkHealth;
  networkComplexity: number;
}

// Factory
export function createCharacterNetworkEngineState(): CharacterNetworkEngineState {
  return {
    nodes: new Map(),
    edges: new Map(),
    totalNodes: 0,
    totalEdges: 0,
    averageCentrality: 0,
    networkDensity: 0,
    networkHealth: 'sparse',
    networkComplexity: 0.5,
  };
}

// Add node
export function addNetworkNode(
  state: CharacterNetworkEngineState,
  nodeId: string,
  characterId: string,
  type: NetworkNode,
  influence: number = 0.5
): CharacterNetworkEngineState {
  const node: NetworkNodeData = { nodeId, characterId, type, centrality: 0, influence, connections: 0 };
  const nodes = new Map(state.nodes).set(nodeId, node);
  return recomputeNetwork({ ...state, nodes, totalNodes: nodes.size });
}

// Add edge
export function addNetworkEdge(
  state: CharacterNetworkEngineState,
  edgeId: string,
  fromNodeId: string,
  toNodeId: string,
  type: EdgeType,
  strength: number = 0.5
): CharacterNetworkEngineState {
  const edge: NetworkEdge = { edgeId, fromNodeId, toNodeId, type, strength, evolution: 0 };
  const edges = new Map(state.edges).set(edgeId, edge);

  // Update node connections count
  const fromNode = state.nodes.get(fromNodeId);
  const toNode = state.nodes.get(toNodeId);
  const nodes = new Map(state.nodes);
  if (fromNode) nodes.set(fromNodeId, { ...fromNode, connections: fromNode.connections + 1 });
  if (toNode) nodes.set(toNodeId, { ...toNode, connections: toNode.connections + 1 });

  return recomputeNetwork({ ...state, nodes, edges, totalEdges: edges.size });
}

// Evolve edge
export function evolveNetworkEdge(state: CharacterNetworkEngineState, edgeId: string, evolution: number): CharacterNetworkEngineState {
  const edge = state.edges.get(edgeId);
  if (!edge) return state;

  const updated: NetworkEdge = { ...edge, evolution };
  const edges = new Map(state.edges).set(edgeId, updated);
  return recomputeNetwork({ ...state, edges });
}

// Get nodes by type
export function getNodesByType(state: CharacterNetworkEngineState, type: NetworkNode): NetworkNodeData[] {
  return Array.from(state.nodes.values()).filter(n => n.type === type);
}

// Get network report
export function getNetworkReport(state: CharacterNetworkEngineState): {
  totalNodes: number;
  totalEdges: number;
  averageCentrality: number;
  networkDensity: number;
  networkHealth: NetworkHealth;
  networkComplexity: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalNodes === 0) recommendations.push('No nodes — add nodes');
  if (state.networkDensity < 0.2) recommendations.push('Low density — add edges');
  if (state.networkComplexity < 0.3) recommendations.push('Low complexity — diversify');

  return {
    totalNodes: state.totalNodes,
    totalEdges: state.totalEdges,
    averageCentrality: Math.round(state.averageCentrality * 100) / 100,
    networkDensity: Math.round(state.networkDensity * 100) / 100,
    networkHealth: state.networkHealth,
    networkComplexity: Math.round(state.networkComplexity * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeNetwork(state: CharacterNetworkEngineState): CharacterNetworkEngineState {
  const nodes = Array.from(state.nodes.values());
  const totalConnections = nodes.reduce((s, n) => s + n.connections, 0);
  const averageCentrality = nodes.length === 0 ? 0
    : nodes.reduce((s, n) => s + n.influence, 0) / nodes.length;

  // Network density: edges / (nodes * (nodes-1) / 2)
  const maxEdges = nodes.length === 0 || nodes.length === 1 ? 0 : (nodes.length * (nodes.length - 1)) / 2;
  const networkDensity = maxEdges === 0 ? 0 : Math.min(1, state.totalEdges / maxEdges);

  // Centrality: weighted by connections
  const updatedNodes = new Map(state.nodes);
  if (maxEdges > 0) {
    nodes.forEach(n => updatedNodes.set(n.nodeId, { ...n, centrality: n.connections / Math.max(1, nodes.length - 1) }));
  }

  const typeSet = new Set(nodes.map(n => n.type));
  const networkComplexity = Math.min(1, typeSet.size / 5);

  const health: NetworkHealth = networkDensity < 0.2 ? 'sparse'
    : networkDensity < 0.4 ? 'connected'
    : networkDensity < 0.6 ? 'dense'
    : 'interwoven';

  return { ...state, nodes: updatedNodes, averageCentrality, networkDensity, networkHealth: health, networkComplexity };
}

// Reset network state
export function resetCharacterNetworkEngineState(): CharacterNetworkEngineState {
  return createCharacterNetworkEngineState();
}