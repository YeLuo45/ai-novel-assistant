// V2160 MemoryGarbageCollect - Direction F Iter 15/30
// Reachability-based GC
// Source: nanobot
export interface GCNode {
  id: string;
  refs: string[]; // references to other nodes
  marked: boolean;
}

export interface MemoryGCState {
  nodes: Map<string, GCNode>;
  roots: Set<string>;
  collectedCount: number;
}

export function createMemoryGCState(): MemoryGCState {
  return { nodes: new Map(), roots: new Set(), collectedCount: 0 };
}

export function addGCNode(state: MemoryGCState, id: string, refs: string[] = []): MemoryGCState {
  if (state.nodes.has(id)) return state;
  const nodes = new Map(state.nodes);
  nodes.set(id, { id, refs, marked: false });
  return { ...state, nodes };
}

export function addRoot(state: MemoryGCState, id: string): MemoryGCState {
  const roots = new Set(state.roots);
  roots.add(id);
  return { ...state, roots };
}

export function removeRoot(state: MemoryGCState, id: string): MemoryGCState {
  const roots = new Set(state.roots);
  roots.delete(id);
  return { ...state, roots };
}

export function runGC(state: MemoryGCState): MemoryGCState {
  // Mark phase
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
  // Sweep phase
  let collectedCount = 0;
  for (const [id, node] of nodes) {
    if (!node.marked) {
      nodes.delete(id);
      collectedCount++;
    }
  }
  return { ...state, nodes, collectedCount: state.collectedCount + collectedCount };
}

export function reachableCount(state: MemoryGCState): number {
  return Array.from(state.nodes.values()).filter((n) => n.marked).length;
}

export function memoryGCHealth(state: MemoryGCState): { nodes: number; roots: number; collected: number; health: number } {
  return { nodes: state.nodes.size, roots: state.roots.size, collected: state.collectedCount, health: state.nodes.size > 0 ? 1 : 0.5 };
}
