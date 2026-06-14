// V2152 MemoryRelation - Direction F Iter 7/30
// Memory graph edges (causal/temporal/semantic)
// Source: thunderbolt
export type RelationKind = 'causal' | 'temporal' | 'semantic' | 'contradicts';

export interface MemoryEdge {
  fromId: string;
  toId: string;
  kind: RelationKind;
  weight: number;
  ts: number;
}

export interface MemoryRelationState {
  edges: MemoryEdge[];
  nodes: Set<string>;
}

export function createMemoryRelationState(): MemoryRelationState {
  return { edges: [], nodes: new Set() };
}

export function addNode(state: MemoryRelationState, id: string): MemoryRelationState {
  const nodes = new Set(state.nodes);
  nodes.add(id);
  return { ...state, nodes };
}

export function addEdge(state: MemoryRelationState, fromId: string, toId: string, kind: RelationKind, weight = 1): MemoryRelationState {
  if (state.edges.some((e) => e.fromId === fromId && e.toId === toId && e.kind === kind)) return state;
  const nodes = new Set(state.nodes);
  nodes.add(fromId);
  nodes.add(toId);
  return { ...state, edges: [...state.edges, { fromId, toId, kind, weight, ts: Date.now() }], nodes };
}

export function removeEdge(state: MemoryRelationState, fromId: string, toId: string, kind: RelationKind): MemoryRelationState {
  return { ...state, edges: state.edges.filter((e) => !(e.fromId === fromId && e.toId === toId && e.kind === kind)) };
}

export function edgesFrom(state: MemoryRelationState, fromId: string): MemoryEdge[] {
  return state.edges.filter((e) => e.fromId === fromId);
}

export function edgesTo(state: MemoryRelationState, toId: string): MemoryEdge[] {
  return state.edges.filter((e) => e.toId === toId);
}

export function edgesByKind(state: MemoryRelationState, kind: RelationKind): MemoryEdge[] {
  return state.edges.filter((e) => e.kind === kind);
}

export function causalChain(state: MemoryRelationState, startId: string, maxDepth = 10): string[] {
  const chain = [startId];
  let current = startId;
  for (let d = 0; d < maxDepth; d++) {
    const next = state.edges.find((e) => e.fromId === current && e.kind === 'causal');
    if (!next) break;
    current = next.toId;
    chain.push(current);
  }
  return chain;
}

export function relatedCount(state: MemoryRelationState, id: string): number {
  return state.edges.filter((e) => e.fromId === id || e.toId === id).length;
}

export function memoryRelationHealth(state: MemoryRelationState): { nodes: number; edges: number; health: number } {
  return { nodes: state.nodes.size, edges: state.edges.length, health: state.nodes.size > 0 ? 1 : 0 };
}
