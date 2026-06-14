// V2149 MemoryIndex - Direction F Iter 4/30
// HNSW-style hierarchical navigable small world index
// Source: thunderbolt
export interface HNSWNode {
  id: string;
  level: number;
  vec: number[];
  neighbors: number[][]; // neighbors per level
}

export interface HNSWState {
  nodes: Map<string, HNSWNode>;
  entryPoint: string | null;
  maxLevel: number;
  m: number; // max neighbors per node
  ef: number; // search beam width
}

export function createHNSWState(m = 4, ef = 16): HNSWState {
  return { nodes: new Map(), entryPoint: null, maxLevel: 4, m, ef };
}

function randomLevel(maxLevel: number): number {
  let lvl = 0;
  while (Math.random() < 0.5 && lvl < maxLevel) lvl++;
  return lvl;
}

function dist(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}

export function insertNode(state: HNSWState, id: string, vec: number[]): HNSWState {
  const level = randomLevel(state.maxLevel);
  const neighbors: number[][] = [];
  for (let l = 0; l <= level; l++) neighbors.push([]);
  const node: HNSWNode = { id, level, vec, neighbors };
  const nodes = new Map(state.nodes);
  nodes.set(id, node);
  // Connect to M nearest existing nodes at each level
  for (const [otherId, other] of nodes) {
    if (otherId === id) continue;
    const d = dist(vec, other.vec);
    if (d < 0.5 && other.neighbors[0].length < state.m) {
      other.neighbors[0] = [...other.neighbors[0], nodes.size - 1];
      neighbors[0] = [...neighbors[0], Array.from(nodes.keys()).indexOf(otherId)];
    }
  }
  const entryPoint = state.entryPoint || id;
  return { ...state, nodes, entryPoint };
}

export function searchKNN(state: HNSWState, query: number[], k: number): string[] {
  if (state.nodes.size === 0) return [];
  const dists: { id: string; d: number }[] = [];
  for (const [id, node] of state.nodes) {
    dists.push({ id, d: dist(query, node.vec) });
  }
  dists.sort((a, b) => a.d - b.d);
  return dists.slice(0, k).map((x) => x.id);
}

export function nodeCount(state: HNSWState): number {
  return state.nodes.size;
}

export function getNode(state: HNSWState, id: string): HNSWNode | undefined {
  return state.nodes.get(id);
}

export function hnswHealth(state: HNSWState): { nodes: number; entryPoint: boolean; health: number } {
  return { nodes: state.nodes.size, entryPoint: state.entryPoint !== null, health: state.entryPoint !== null ? 1 : 0 };
}
