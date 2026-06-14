// V2272 ContextRelation - Direction J Iter 7/30
// Context relation graph
// Source: thunderbolt
export type ContextRelKind = 'cites' | 'derives' | 'summarizes' | 'extends' | 'paraphrases';

export interface ContextRelEdge {
  from: string;
  to: string;
  kind: ContextRelKind;
  weight: number;
  ts: number;
}

export interface ContextRelationState {
  edges: ContextRelEdge[];
  byKey: Map<string, Set<number>>;
}

export function createContextRelationState(): ContextRelationState {
  return { edges: [], byKey: new Map() };
}

export function addContextRelation(state: ContextRelationState, from: string, to: string, kind: ContextRelKind, weight = 1): ContextRelationState {
  if (state.edges.some((e) => e.from === from && e.to === to && e.kind === kind)) return state;
  const edge: ContextRelEdge = { from, to, kind, weight, ts: Date.now() };
  const edges = [...state.edges, edge];
  const byKey = new Map(state.byKey);
  const idx = edges.length - 1;
  const a = new Set(byKey.get(from) || []);
  a.add(idx);
  byKey.set(from, a);
  const b = new Set(byKey.get(to) || []);
  b.add(idx);
  byKey.set(to, b);
  return { ...state, edges, byKey };
}

export function relationsFrom(state: ContextRelationState, key: string): ContextRelEdge[] {
  const indices = state.byKey.get(key) || new Set();
  const result: ContextRelEdge[] = [];
  for (const i of indices) {
    if (state.edges[i].from === key) result.push(state.edges[i]);
  }
  return result;
}

export function relationsTo(state: ContextRelationState, key: string): ContextRelEdge[] {
  const indices = state.byKey.get(key) || new Set();
  const result: ContextRelEdge[] = [];
  for (const i of indices) {
    if (state.edges[i].to === key) result.push(state.edges[i]);
  }
  return result;
}

export function relationsByKind(state: ContextRelationState, kind: ContextRelKind): ContextRelEdge[] {
  return state.edges.filter((e) => e.kind === kind);
}

export function contextRelationHealth(state: ContextRelationState): { edges: number; health: number } {
  return { edges: state.edges.length, health: state.edges.length > 0 ? 1 : 0.5 };
}
