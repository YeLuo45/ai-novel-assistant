// V2280 ContextGC - Direction J Iter 15/30
// Reachability-based context GC
// Source: nanobot
export interface ContextGCNode {
  id: string;
  refs: string[];
  marked: boolean;
}

export interface ContextGCState {
  nodes: Map<string, ContextGCNode>;
  roots: Set<string>;
  collectedCount: number;
}

export function createContextGCState(): ContextGCState {
  return { nodes: new Map(), roots: new Set(), collectedCount: 0 };
}

export function addContextGCNode(state: ContextGCState, id: string, refs: string[] = []): ContextGCState {
  if (state.nodes.has(id)) return state;
  const nodes = new Map(state.nodes);
  nodes.set(id, { id, refs, marked: false });
  return { ...state, nodes };
}

export function addContextRoot(state: ContextGCState, id: string): ContextGCState {
  const roots = new Set(state.roots);
  roots.add(id);
  return { ...state, roots };
}

export function runContextGC(state: ContextGCState): ContextGCState {
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

export function contextGCHealth(state: ContextGCState): { nodes: number; roots: number; collected: number; health: number } {
  return { nodes: state.nodes.size, roots: state.roots.size, collected: state.collectedCount, health: state.nodes.size > 0 ? 1 : 0.5 };
}
