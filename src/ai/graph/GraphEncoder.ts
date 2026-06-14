// V2176 GraphEncoder - Direction G Iter 1/30
// Encode graph nodes to compact vectors + tags
// Source: thunderbolt
export type NodeAspect = 'new' | 'encoded' | 'indexed' | 'stale' | 'archived';

export interface GraphNode {
  id: string;
  label: string;
  vec: number[];
  tags: string[];
  aspect: NodeAspect;
  weight: number;
  ts: number;
}

export interface GraphEncoderState {
  nodes: Map<string, GraphNode>;
}

export function createGraphEncoderState(): GraphEncoderState {
  return { nodes: new Map() };
}

function vecOf(s: string, dim = 8): number[] {
  const out: number[] = new Array(dim).fill(0);
  for (let i = 0; i < s.length; i++) {
    out[i % dim] += s.charCodeAt(i) * (i + 1);
  }
  let norm = 0;
  for (const v of out) norm += v * v;
  norm = Math.sqrt(norm);
  if (norm > 0) for (let i = 0; i < out.length; i++) out[i] = out[i] / norm;
  return out;
}

function tagsOf(s: string): string[] {
  return Array.from(new Set((s.toLowerCase().match(/[a-z\u4e00-\u9fa5]+/g) || []))).slice(0, 6);
}

export function encodeNode(state: GraphEncoderState, label: string, id?: string): { state: GraphEncoderState; node: GraphNode } {
  const nodeId = id || `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const node: GraphNode = { id: nodeId, label, vec: vecOf(label), tags: tagsOf(label), aspect: 'encoded', weight: 1, ts: Date.now() };
  const nodes = new Map(state.nodes);
  nodes.set(nodeId, node);
  return { state: { nodes }, node };
}

export function markIndexed(state: GraphEncoderState, id: string): GraphEncoderState {
  const n = state.nodes.get(id);
  if (!n) return state;
  const nodes = new Map(state.nodes);
  nodes.set(id, { ...n, aspect: 'indexed' });
  return { ...state, nodes };
}

export function markStale(state: GraphEncoderState, id: string): GraphEncoderState {
  const n = state.nodes.get(id);
  if (!n) return state;
  const nodes = new Map(state.nodes);
  nodes.set(id, { ...n, aspect: 'stale', weight: n.weight * 0.5 });
  return { ...state, nodes };
}

export function archiveNode(state: GraphEncoderState, id: string): GraphEncoderState {
  const n = state.nodes.get(id);
  if (!n) return state;
  const nodes = new Map(state.nodes);
  nodes.set(id, { ...n, aspect: 'archived' });
  return { ...state, nodes };
}

export function setNodeWeight(state: GraphEncoderState, id: string, w: number): GraphEncoderState {
  const n = state.nodes.get(id);
  if (!n) return state;
  const nodes = new Map(state.nodes);
  nodes.set(id, { ...n, weight: Math.max(0, Math.min(1, w)) });
  return { ...state, nodes };
}

export function nodeCount(state: GraphEncoderState): number {
  return state.nodes.size;
}

export function activeNodeCount(state: GraphEncoderState): number {
  return Array.from(state.nodes.values()).filter((n) => n.aspect !== 'archived' && n.aspect !== 'stale').length;
}

export function graphEncoderHealth(state: GraphEncoderState): { total: number; active: number; health: number } {
  const total = nodeCount(state);
  const active = activeNodeCount(state);
  return { total, active, health: total > 0 ? active / total : 1 };
}
