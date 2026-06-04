/**
 * V654 NarrativeKnowledgeEngine — Direction E Iter 4/9
 * Narrative knowledge engine: knowledge graph + concept relationships
 * Sources: nanobot knowledge + ruflo hierarchical + thunderbolt graph
 */

export type KnowledgeNodeType = 'concept' | 'entity' | 'event' | 'relation' | 'rule';
export type KnowledgeState = 'acquiring' | 'integrating' | 'reasoning' | 'stable';

export interface KnowledgeNode {
  nodeId: string;
  type: KnowledgeNodeType;
  label: string;
  properties: Record<string, string>;
  weight: number;
  connections: string[];
}

export interface NarrativeKnowledgeState {
  nodes: Map<string, KnowledgeNode>;
  activeConcepts: Set<string>;
  totalConnections: number;
  knowledgeDensity: number;
  reasoningDepth: number;
}

export interface KnowledgeQuery {
  targetId: string;
  depth: number;
  relationshipType: string | null;
}

export interface KnowledgeResult {
  nodes: KnowledgeNode[];
  confidence: number;
  pathLength: number;
}

// Factory
export function createNarrativeKnowledgeState(): NarrativeKnowledgeState {
  return {
    nodes: new Map(),
    activeConcepts: new Set(),
    totalConnections: 0,
    knowledgeDensity: 0.5,
    reasoningDepth: 0,
  };
}

// Add knowledge node
export function addKnowledgeNode(
  state: NarrativeKnowledgeState,
  nodeId: string,
  type: KnowledgeNodeType,
  label: string,
  properties: Record<string, string> = {},
  weight: number = 0.5
): NarrativeKnowledgeState {
  const node: KnowledgeNode = { nodeId, type, label, properties, weight, connections: [] };
  const nodes = new Map(state.nodes).set(nodeId, node);
  const activeConcepts = new Set(state.activeConcepts).add(nodeId);
  return recomputeMetrics({ ...state, nodes, activeConcepts });
}

// Connect knowledge nodes
export function connectKnowledgeNodes(
  state: NarrativeKnowledgeState,
  fromId: string,
  toId: string
): NarrativeKnowledgeState {
  const fromNode = state.nodes.get(fromId);
  const toNode = state.nodes.get(toId);
  if (!fromNode || !toNode) return state;

  const updatedFrom: KnowledgeNode = { ...fromNode, connections: [...fromNode.connections, toId] };
  const updatedTo: KnowledgeNode = { ...toNode, connections: [...toNode.connections, fromId] };

  const nodes = new Map(state.nodes)
    .set(fromId, updatedFrom)
    .set(toId, updatedTo);

  return recomputeMetrics({ ...state, nodes, totalConnections: state.totalConnections + 1 });
}

// Query knowledge graph
export function queryKnowledge(
  state: NarrativeKnowledgeState,
  query: KnowledgeQuery
): KnowledgeResult {
  const targetNode = state.nodes.get(query.targetId);
  if (!targetNode) return { nodes: [], confidence: 0, pathLength: 0 };

  const visited = new Set<string>();
  const resultNodes: KnowledgeNode[] = [targetNode];
  visited.add(query.targetId);

  let currentDepth = 0;
  let frontier = [query.targetId];

  while (currentDepth < query.depth && frontier.length > 0) {
    const nextFrontier: string[] = [];
    for (const nodeId of frontier) {
      const node = state.nodes.get(nodeId);
      if (!node) continue;
      for (const connectedId of node.connections) {
        if (!visited.has(connectedId)) {
          visited.add(connectedId);
          const connectedNode = state.nodes.get(connectedId);
          if (connectedNode) {
            resultNodes.push(connectedNode);
            nextFrontier.push(connectedId);
          }
        }
      }
    }
    frontier = nextFrontier;
    currentDepth++;
  }

  const confidence = state.knowledgeDensity * (1 - currentDepth * 0.1);
  return {
    nodes: resultNodes,
    confidence: Math.max(0, confidence),
    pathLength: currentDepth,
  };
}

// Get subgraph for concept
export function getConceptSubgraph(
  state: NarrativeKnowledgeState,
  conceptId: string
): KnowledgeNode[] {
  const queryResult = queryKnowledge(state, { targetId: conceptId, depth: 2, relationshipType: null });
  return queryResult.nodes;
}

// Get knowledge report
export function getKnowledgeReport(state: NarrativeKnowledgeState): {
  nodeCount: number;
  connectionCount: number;
  knowledgeDensity: number;
  activeConceptCount: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.nodes.size < 5) recommendations.push('Add more knowledge nodes for richer graph');
  if (state.knowledgeDensity < 0.4) recommendations.push('Increase knowledge density — add more connections');
  if (state.reasoningDepth < 2) recommendations.push('Build deeper reasoning chains');

  return {
    nodeCount: state.nodes.size,
    connectionCount: state.totalConnections,
    knowledgeDensity: Math.round(state.knowledgeDensity * 100) / 100,
    activeConceptCount: state.activeConcepts.size,
    recommendations,
  };
}

// Recompute metrics
function recomputeMetrics(state: NarrativeKnowledgeState): NarrativeKnowledgeState {
  const nodes = Array.from(state.nodes.values());
  const totalConnections = nodes.reduce((s, n) => s + n.connections.length, 0) / 2;
  const knowledgeDensity = nodes.length > 0
    ? Math.min(1, totalConnections / nodes.length * 0.3 + 0.3)
    : 0.5;
  return { ...state, totalConnections, knowledgeDensity };
}

// Reset knowledge state
export function resetNarrativeKnowledgeState(): NarrativeKnowledgeState {
  return createNarrativeKnowledgeState();
}