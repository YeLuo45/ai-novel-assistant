// V2299 SkillIndex - Direction K Iter 4/30
// HNSW index for skill ANN search
// Source: thunderbolt
export interface SkillIndexNode {
  id: string;
  vector: number[];
  level: number;
}

export interface SkillHNSWState {
  nodes: Map<string, SkillIndexNode>;
  entryPoint: string | null;
  maxLevel: number;
  M: number;
}

export function createSkillHNSWState(M = 8): SkillHNSWState {
  return { nodes: new Map(), entryPoint: null, maxLevel: 0, M };
}

function randomLevel(M: number): number {
  let l = 0;
  while (Math.random() < 0.5 && l < 16) l++;
  return l;
}

export function addSkillIndexNode(state: SkillHNSWState, id: string, vector: number[]): SkillHNSWState {
  const level = randomLevel(state.M);
  const node: SkillIndexNode = { id, vector, level };
  const nodes = new Map(state.nodes);
  nodes.set(id, node);
  if (state.entryPoint === null || level > state.maxLevel) {
    return { ...state, nodes, entryPoint: id, maxLevel: level };
  }
  return { ...state, nodes };
}

function cosSim(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom > 0 ? dot / denom : 0;
}

export function skillHnswSearch(state: SkillHNSWState, query: number[], k = 5): { id: string; score: number }[] {
  if (state.nodes.size === 0) return [];
  const all = Array.from(state.nodes.values());
  return all.map((n) => ({ id: n.id, score: cosSim(query, n.vector) })).sort((a, b) => b.score - a.score).slice(0, k);
}

export function skillHnswNodeCount(state: SkillHNSWState): number {
  return state.nodes.size;
}

export function skillHnswIndexHealth(state: SkillHNSWState): { nodes: number; entryPoint: boolean; health: number } {
  return { nodes: state.nodes.size, entryPoint: state.entryPoint !== null, health: state.entryPoint !== null ? 1 : 0 };
}
