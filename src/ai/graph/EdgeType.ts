// V2182 EdgeType - Direction G Iter 7/30
// Edge type system (relates_to/causes/similar_to)
// Source: thunderbolt
export type EdgeKind = 'relates_to' | 'causes' | 'similar_to' | 'contains' | 'follows';

export interface TypedGraphEdge {
  id: string;
  fromId: string;
  toId: string;
  kind: EdgeKind;
  weight: number;
  ts: number;
}

export interface EdgeTypeState {
  edges: Map<string, TypedGraphEdge>;
  byKind: Map<EdgeKind, TypedGraphEdge[]>;
}

export function createEdgeTypeState(): EdgeTypeState {
  return { edges: new Map(), byKind: new Map() };
}

export function addTypedEdge(state: EdgeTypeState, fromId: string, toId: string, kind: EdgeKind, weight = 1): EdgeTypeState {
  const id = `e-${fromId}-${toId}-${Math.random().toString(36).slice(2, 6)}`;
  const edge: TypedGraphEdge = { id, fromId, toId, kind, weight, ts: Date.now() };
  const edges = new Map(state.edges);
  edges.set(id, edge);
  const byKind = new Map(state.byKind);
  const list = byKind.get(kind) || [];
  byKind.set(kind, [...list, edge]);
  return { ...state, edges, byKind };
}

export function setEdgeWeight(state: EdgeTypeState, id: string, weight: number): EdgeTypeState {
  const e = state.edges.get(id);
  if (!e) return state;
  const edges = new Map(state.edges);
  edges.set(id, { ...e, weight: Math.max(0, Math.min(1, weight)) });
  return { ...state, edges };
}

export function edgesFromNode(state: EdgeTypeState, fromId: string): TypedGraphEdge[] {
  return Array.from(state.edges.values()).filter((e) => e.fromId === fromId);
}

export function edgesToNode(state: EdgeTypeState, toId: string): TypedGraphEdge[] {
  return Array.from(state.edges.values()).filter((e) => e.toId === toId);
}

export function edgesOfKind(state: EdgeTypeState, kind: EdgeKind): TypedGraphEdge[] {
  return state.byKind.get(kind) || [];
}

export function removeEdge(state: EdgeTypeState, id: string): EdgeTypeState {
  const e = state.edges.get(id);
  if (!e) return state;
  const edges = new Map(state.edges);
  edges.delete(id);
  const byKind = new Map(state.byKind);
  const list = (byKind.get(e.kind) || []).filter((x) => x.id !== id);
  byKind.set(e.kind, list);
  return { ...state, edges, byKind };
}

export function countByKind(state: EdgeTypeState): Record<EdgeKind, number> {
  const counts: Record<EdgeKind, number> = { relates_to: 0, causes: 0, similar_to: 0, contains: 0, follows: 0 };
  for (const [k, list] of state.byKind) counts[k] = list.length;
  return counts;
}

export function edgeTypeHealth(state: EdgeTypeState): { total: number; kinds: number; health: number } {
  return { total: state.edges.size, kinds: state.byKind.size, health: state.edges.size > 0 ? 1 : 0.5 };
}
