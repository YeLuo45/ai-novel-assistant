// V2250 CacheGarbageCollect - Direction I Iter 15/30
// Reachability-based GC
// Source: nanobot
export interface CacheGCNode {
  id: string;
  refs: string[];
  marked: boolean;
}

export interface CacheGCState {
  nodes: Map<string, CacheGCNode>;
  roots: Set<string>;
  collectedCount: number;
}

export function createCacheGCState(): CacheGCState {
  return { nodes: new Map(), roots: new Set(), collectedCount: 0 };
}

export function addCacheGCNode(state: CacheGCState, id: string, refs: string[] = []): CacheGCState {
  if (state.nodes.has(id)) return state;
  const nodes = new Map(state.nodes);
  nodes.set(id, { id, refs, marked: false });
  return { ...state, nodes };
}

export function addCacheRoot(state: CacheGCState, id: string): CacheGCState {
  const roots = new Set(state.roots);
  roots.add(id);
  return { ...state, roots };
}

export function runCacheGC(state: CacheGCState): CacheGCState {
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

export function cacheGCHealth(state: CacheGCState): { nodes: number; roots: number; collected: number; health: number } {
  return { nodes: state.nodes.size, roots: state.roots.size, collected: state.collectedCount, health: state.nodes.size > 0 ? 1 : 0.5 };
}
