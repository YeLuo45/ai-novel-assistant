/**
 * V722 SemanticNarrativeEngine — Direction E Iter 2/9 (Round 2)
 * Semantic narrative engine: deep semantic understanding of narrative
 * Sources: nanobot semantic + thunderbolt pipeline + chatdev
 */

export type SemanticType = 'entity' | 'action' | 'state' | 'event' | 'relation' | 'concept';
export type SemanticRole = 'subject' | 'object' | 'predicate' | 'modifier' | 'context' | 'reference';
export type SemanticDepth = 'surface' | 'shallow' | 'deep' | 'meta';

export interface SemanticNode {
  nodeId: string;
  type: SemanticType;
  label: string;
  role: SemanticRole;
  embedding: number[];
  salience: number;
  depth: SemanticDepth;
}

export interface SemanticRelation {
  relationId: string;
  sourceId: string;
  targetId: string;
  relationType: string;
  strength: number;
  context: string;
}

export interface SemanticNarrativeState {
  nodes: Map<string, SemanticNode>;
  relations: Map<string, SemanticRelation>;
  totalNodes: number;
  totalRelations: number;
  averageSalience: number;
  semanticDensity: number;
  averageDepth: number;
  typeDistribution: Map<SemanticType, number>;
}

// Factory
export function createSemanticNarrativeState(): SemanticNarrativeState {
  return {
    nodes: new Map(),
    relations: new Map(),
    totalNodes: 0,
    totalRelations: 0,
    averageSalience: 0.5,
    semanticDensity: 0,
    averageDepth: 0.5,
    typeDistribution: new Map(),
  };
}

// Add semantic node
export function addSemanticNode(
  state: SemanticNarrativeState,
  nodeId: string,
  type: SemanticType,
  label: string,
  role: SemanticRole,
  salience: number = 0.5,
  depth: SemanticDepth = 'surface',
  embedding: number[] = []
): SemanticNarrativeState {
  const node: SemanticNode = { nodeId, type, label, role, embedding, salience, depth };
  const nodes = new Map(state.nodes).set(nodeId, node);
  const typeDistribution = new Map(state.typeDistribution);
  typeDistribution.set(type, (typeDistribution.get(type) || 0) + 1);
  return recomputeSemantic({ ...state, nodes, typeDistribution, totalNodes: nodes.size });
}

// Add semantic relation
export function addSemanticRelation(
  state: SemanticNarrativeState,
  relationId: string,
  sourceId: string,
  targetId: string,
  relationType: string,
  strength: number = 0.5,
  context: string = ''
): SemanticNarrativeState {
  const relation: SemanticRelation = { relationId, sourceId, targetId, relationType, strength, context };
  const relations = new Map(state.relations).set(relationId, relation);
  return recomputeSemantic({ ...state, relations, totalRelations: relations.size });
}

// Get nodes by type
export function getNodesByType(state: SemanticNarrativeState, type: SemanticType): SemanticNode[] {
  return Array.from(state.nodes.values()).filter(n => n.type === type);
}

// Get relations from node
export function getRelationsFromNode(state: SemanticNarrativeState, nodeId: string): SemanticRelation[] {
  return Array.from(state.relations.values()).filter(r => r.sourceId === nodeId);
}

// Get relations to node
export function getRelationsToNode(state: SemanticNarrativeState, nodeId: string): SemanticRelation[] {
  return Array.from(state.relations.values()).filter(r => r.targetId === nodeId);
}

// Get semantic neighborhood
export function getSemanticNeighborhood(state: SemanticNarrativeState, nodeId: string, depth: number = 1): SemanticNode[] {
  const result = new Set<string>([nodeId]);
  let frontier = [nodeId];

  for (let d = 0; d < depth; d++) {
    const nextFrontier: string[] = [];
    for (const id of frontier) {
      const outRelations = getRelationsFromNode(state, id);
      const inRelations = getRelationsToNode(state, id);
      for (const r of [...outRelations, ...inRelations]) {
        const otherId = r.sourceId === id ? r.targetId : r.sourceId;
        if (!result.has(otherId)) {
          result.add(otherId);
          nextFrontier.push(otherId);
        }
      }
    }
    frontier = nextFrontier;
  }

  return Array.from(result)
    .map(id => state.nodes.get(id))
    .filter((n): n is SemanticNode => n !== undefined);
}

// Compute semantic similarity (simple Euclidean distance)
export function computeSemanticSimilarity(state: SemanticNarrativeState, nodeId1: string, nodeId2: string): number {
  const n1 = state.nodes.get(nodeId1);
  const n2 = state.nodes.get(nodeId2);
  if (!n1 || !n2 || n1.embedding.length === 0 || n2.embedding.length === 0) return 0;
  if (n1.embedding.length !== n2.embedding.length) return 0;

  let sum = 0;
  for (let i = 0; i < n1.embedding.length; i++) {
    const e1 = n1.embedding[i] ?? 0;
    const e2 = n2.embedding[i] ?? 0;
    sum += Math.pow(e1 - e2, 2);
  }
  return 1 / (1 + Math.sqrt(sum));
}

// Get semantic report
export function getSemanticReport(state: SemanticNarrativeState): {
  totalNodes: number;
  totalRelations: number;
  averageSalience: number;
  semanticDensity: number;
  averageDepth: number;
  typeDistribution: Record<string, number>;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalNodes < 5) recommendations.push('Few semantic nodes — extract more concepts');
  if (state.semanticDensity < 0.3) recommendations.push('Low density — add more relations');
  if (state.averageDepth === 0.5) recommendations.push('Surface-level analysis — deepen semantics');

  const typeDistribution: Record<string, number> = {};
  state.typeDistribution.forEach((count, type) => {
    typeDistribution[type] = count;
  });

  return {
    totalNodes: state.totalNodes,
    totalRelations: state.totalRelations,
    averageSalience: Math.round(state.averageSalience * 100) / 100,
    semanticDensity: Math.round(state.semanticDensity * 100) / 100,
    averageDepth: Math.round(state.averageDepth * 100) / 100,
    typeDistribution,
    recommendations,
  };
}

// Recompute metrics
function recomputeSemantic(state: SemanticNarrativeState): SemanticNarrativeState {
  const nodes = Array.from(state.nodes.values());
  const averageSalience = nodes.length > 0
    ? nodes.reduce((s, n) => s + n.salience, 0) / nodes.length
    : 0.5;

  const depthMap: Record<SemanticDepth, number> = {
    surface: 0.25,
    shallow: 0.5,
    deep: 0.75,
    meta: 1.0,
  };
  const averageDepth = nodes.length > 0
    ? nodes.reduce((s, n) => s + depthMap[n.depth], 0) / nodes.length
    : 0.5;

  const semanticDensity = nodes.length === 0 ? 0 : Math.min(1, state.totalRelations / (nodes.length * 2));

  return { ...state, averageSalience, averageDepth, semanticDensity };
}

// Reset semantic state
export function resetSemanticNarrativeState(): SemanticNarrativeState {
  return createSemanticNarrativeState();
}