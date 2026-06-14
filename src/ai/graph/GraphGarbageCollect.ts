// V2189 GraphGarbageCollect - Direction G Iter 14/30
// Reachability-based GC for graph nodes
// Source: nanobot
export interface GCGraphNode {
  id: string;
  refs: string[];
  marked: boolean;
}

export interface GraphGCState {
  nodes: Map<string, GCGraphNode>;
  roots: Set<string>;
  collectedCount: number;
}

export function createGraphGCState(): GraphGCState {
  return { nodes: new Map(), roots: new Set(), collectedCount: 0 };
}

export function addGCGraphNode(state: GraphGCState, id: string, refs: string[] = []): GraphGCState {
  if (state.nodes.has(id)) return state;
  const nodes = new Map(state.nodes);
  nodes.set(id, { id, refs, marked: false });
  return { ...state, nodes };
}

export function addGraphRoot(state: GraphGCState, id: string): GraphGCState {
  const roots = new Set(state.roots);
  roots.add(id);
  return { ...state, roots };
}

export function removeGraphRoot(state: GraphGCState, id: string): GraphGCState {
  const roots = new Set(state.roots);
  roots.delete(id);
  return { ...state, roots };
}

export function runGraphGC(state: GraphGCState): GraphGCState {
  const nodes = new Map(state.nodes);
  for (const n of nodes.values()) n.marked = false;
  const stack: string[] = Array.from(state.roots);
  while (stack.length > 0) {
    const id = stack.pop()!;
    const node = nodes.get(id);
    if (!node || node.marked) continue;
    node.marked = true;
    for (const r of node.refs) stack.push(r);
  }
  let collected = 0;
  for (const [id, node] of nodes) {
    if (!node.marked) { nodes.delete(id); collected++; }
  }
  return { ...state, nodes, collectedCount: state.collectedCount + collected };
}

export function graphGCHealth(state: GraphGCState): { nodes: number; roots: number; collected: number; health: number } {
  return { nodes: state.nodes.size, roots: state.roots.size, collected: state.collectedCount, health: state.nodes.size > 0 ? 1 : 0.5 };
}
