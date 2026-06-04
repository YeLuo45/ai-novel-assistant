/**
 * V648 UnifiedNarrativeEngine — Direction E Iter 1/9
 * Unified narrative engine: semantic understanding + context integration
 * Sources: nanobot semantic + thunderbolt pipeline + chatdev understanding
 */

export type NarrativeLayer = 'semantic' | 'syntactic' | 'pragmatic' | 'discourse' | 'contextual';
export type UnderstandingLevel = 'literal' | 'inferential' | 'implicative' | 'generic';

export interface SemanticNode {
  nodeId: string;
  type: string;
  content: string;
  weight: number;
  connections: string[];
  layer: NarrativeLayer;
}

export interface UnifiedNarrativeState {
  semanticNodes: Map<string, SemanticNode>;
  activeLayers: Set<NarrativeLayer>;
  contextWindow: number;
  understandingLevel: UnderstandingLevel;
  coherenceScore: number;
  integrationDepth: number;
}

export interface NarrativeUnderstanding {
  level: UnderstandingLevel;
  confidence: number;
  layers: NarrativeLayer[];
  keyInsights: string[];
  reasoning: string;
}

// Factory
export function createUnifiedNarrativeState(): UnifiedNarrativeState {
  return {
    semanticNodes: new Map(),
    activeLayers: new Set(['semantic', 'contextual']),
    contextWindow: 5,
    understandingLevel: 'literal',
    coherenceScore: 0.8,
    integrationDepth: 0.5,
  };
}

// Add semantic node
export function addSemanticNode(
  state: UnifiedNarrativeState,
  nodeId: string,
  type: string,
  content: string,
  weight: number = 0.5,
  layer: NarrativeLayer = 'semantic'
): UnifiedNarrativeState {
  const node: SemanticNode = { nodeId, type, content, weight, connections: [], layer };
  const semanticNodes = new Map(state.semanticNodes).set(nodeId, node);
  return recomputeMetrics({ ...state, semanticNodes });
}

// Connect nodes
export function connectNodes(state: UnifiedNarrativeState, fromId: string, toId: string): UnifiedNarrativeState {
  const fromNode = state.semanticNodes.get(fromId);
  const toNode = state.semanticNodes.get(toId);
  if (!fromNode || !toNode) return state;

  const updatedFrom: SemanticNode = { ...fromNode, connections: [...fromNode.connections, toId] };
  const updatedTo: SemanticNode = { ...toNode, connections: [...toNode.connections, fromId] };

  const semanticNodes = new Map(state.semanticNodes)
    .set(fromId, updatedFrom)
    .set(toId, updatedTo);

  return recomputeMetrics({ ...state, semanticNodes });
}

// Set understanding level
export function setUnderstandingLevel(state: UnifiedNarrativeState, level: UnderstandingLevel): UnifiedNarrativeState {
  return { ...state, understandingLevel: level };
}

// Set active layers
export function setActiveLayers(state: UnifiedNarrativeState, layers: NarrativeLayer[]): UnifiedNarrativeState {
  const activeLayers = new Set(layers);
  return recomputeMetrics({ ...state, activeLayers });
}

// Analyze narrative understanding
export function analyzeUnderstanding(state: UnifiedNarrativeState, content: string): NarrativeUnderstanding {
  const nodes = Array.from(state.semanticNodes.values());
  const hasSemantic = nodes.some(n => n.layer === 'semantic');
  const hasContextual = nodes.some(n => n.layer === 'contextual');
  const hasPragmatic = nodes.some(n => n.layer === 'pragmatic');

  let level: UnderstandingLevel = 'literal';
  if (hasSemantic && hasContextual) level = 'inferential';
  if (hasSemantic && hasContextual && hasPragmatic) level = 'implicative';
  if (state.integrationDepth > 0.8) level = 'generic';

  const layers: NarrativeLayer[] = [];
  if (hasSemantic) layers.push('semantic');
  if (hasContextual) layers.push('contextual');
  if (hasPragmatic) layers.push('pragmatic');

  const confidence = state.coherenceScore * state.integrationDepth;
  const keyInsights = nodes
    .filter(n => n.weight > 0.7)
    .map(n => n.content)
    .slice(0, 3);

  return {
    level,
    confidence: Math.round(confidence * 100) / 100,
    layers,
    keyInsights,
    reasoning: `Analysis at ${level} level across ${layers.length} layers with ${Math.round(confidence * 100)}% confidence`,
  };
}

// Get unified narrative report
export function getUnifiedNarrativeReport(state: UnifiedNarrativeState): {
  nodeCount: number;
  layerCount: number;
  understandingLevel: UnderstandingLevel;
  coherenceScore: number;
  integrationDepth: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.semanticNodes.size < 3) recommendations.push('Add more semantic nodes for deeper understanding');
  if (state.integrationDepth < 0.5) recommendations.push('Increase integration depth for better coherence');
  if (state.understandingLevel === 'literal') recommendations.push('Consider moving to inferential understanding');

  return {
    nodeCount: state.semanticNodes.size,
    layerCount: state.activeLayers.size,
    understandingLevel: state.understandingLevel,
    coherenceScore: Math.round(state.coherenceScore * 100) / 100,
    integrationDepth: Math.round(state.integrationDepth * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeMetrics(state: UnifiedNarrativeState): UnifiedNarrativeState {
  const nodes = Array.from(state.semanticNodes.values());
  const avgWeight = nodes.length > 0 ? nodes.reduce((s, n) => s + n.weight, 0) / nodes.length : 0.5;
  const avgConnections = nodes.length > 0
    ? nodes.reduce((s, n) => s + n.connections.length, 0) / nodes.length
    : 0;
  const integrationDepth = Math.min(1, avgWeight * 0.5 + avgConnections * 0.1 + 0.4);
  return { ...state, integrationDepth };
}

// Reset state
export function resetUnifiedNarrativeState(): UnifiedNarrativeState {
  return createUnifiedNarrativeState();
}