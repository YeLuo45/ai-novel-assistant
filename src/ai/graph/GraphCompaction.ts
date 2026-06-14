// V2187 GraphCompaction - Direction G Iter 12/30
// Background adjacency compaction
// Source: nanobot
export interface CompactedGraphSegment {
  id: string;
  nodeCount: number;
  edgeCount: number;
  sizeBefore: number;
  sizeAfter: number;
  ts: number;
}

export interface GraphCompactionState {
  pendingNodes: Map<string, string>;
  pendingEdges: { from: string; to: string }[];
  compacted: CompactedGraphSegment[];
  ratio: number;
}

export function createGraphCompactionState(ratio = 0.5): GraphCompactionState {
  return { pendingNodes: new Map(), pendingEdges: [], compacted: [], ratio };
}

export function enqueueNode(state: GraphCompactionState, id: string, label: string): GraphCompactionState {
  const pendingNodes = new Map(state.pendingNodes);
  pendingNodes.set(id, label);
  return { ...state, pendingNodes };
}

export function enqueueEdge(state: GraphCompactionState, from: string, to: string): GraphCompactionState {
  return { ...state, pendingEdges: [...state.pendingEdges, { from, to }] };
}

export function runGraphCompaction(state: GraphCompactionState): GraphCompactionState {
  if (state.pendingNodes.size === 0 && state.pendingEdges.length === 0) return state;
  const nodes = Array.from(state.pendingNodes.entries());
  const sizeBefore = nodes.reduce((s, [_, v]) => s + v.length, 0) + state.pendingEdges.length * 10;
  // Deduplicate edges
  const uniqueEdges: { from: string; to: string }[] = [];
  const seen = new Set<string>();
  for (const e of state.pendingEdges) {
    const k = `${e.from}->${e.to}`;
    if (!seen.has(k)) { seen.add(k); uniqueEdges.push(e); }
  }
  const compressed = nodes.map(([k, v]) => `${k}:${v}`).join('|');
  const target = Math.floor(compressed.length * state.ratio);
  const sizeAfter = target + uniqueEdges.length * 10;
  const seg: CompactedGraphSegment = { id: `seg-${Date.now()}`, nodeCount: nodes.length, edgeCount: uniqueEdges.length, sizeBefore, sizeAfter, ts: Date.now() };
  return { ...state, pendingNodes: new Map(), pendingEdges: [], compacted: [...state.compacted, seg] };
}

export function graphCompactionHealth(state: GraphCompactionState): { segments: number; health: number } {
  return { segments: state.compacted.length, health: state.compacted.length > 0 ? 1 : 0.5 };
}
