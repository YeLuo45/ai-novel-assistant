// V2181 NodeType - Direction G Iter 6/30
// Node type system (entity/event/concept/fact)
// Source: thunderbolt
export type NodeKind = 'entity' | 'event' | 'concept' | 'fact';

export interface TypedGraphNode {
  id: string;
  kind: NodeKind;
  label: string;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
}

export interface NodeTypeState {
  byKind: Map<NodeKind, TypedGraphNode[]>;
}

export function createNodeTypeState(): NodeTypeState {
  return { byKind: new Map() };
}

export function addTypedGraphNode(state: NodeTypeState, node: Omit<TypedGraphNode, 'lastAccessed' | 'accessCount'>): NodeTypeState {
  const full: TypedGraphNode = { ...node, lastAccessed: Date.now(), accessCount: 0 };
  const byKind = new Map(state.byKind);
  const list = byKind.get(node.kind) || [];
  byKind.set(node.kind, [...list, full]);
  return { ...state, byKind };
}

export function accessGraphNode(state: NodeTypeState, id: string): NodeTypeState {
  const byKind = new Map(state.byKind);
  for (const [kind, list] of byKind) {
    const idx = list.findIndex((n) => n.id === id);
    if (idx >= 0) {
      const n = list[idx];
      byKind.set(kind, [...list.slice(0, idx), { ...n, lastAccessed: Date.now(), accessCount: n.accessCount + 1 }, ...list.slice(idx + 1)]);
      return { ...state, byKind };
    }
  }
  return state;
}

export function byKind(state: NodeTypeState, kind: NodeKind): TypedGraphNode[] {
  return state.byKind.get(kind) || [];
}

export function totalByKind(state: NodeTypeState): Record<NodeKind, number> {
  const counts: Record<NodeKind, number> = { entity: 0, event: 0, concept: 0, fact: 0 };
  for (const [k, list] of state.byKind) counts[k as NodeKind] = list.length;
  return counts;
}

export function mostAccessed(state: NodeTypeState, topK = 5): TypedGraphNode[] {
  const all: TypedGraphNode[] = [];
  for (const list of state.byKind.values()) all.push(...list);
  all.sort((a, b) => b.accessCount - a.accessCount);
  return all.slice(0, topK);
}

export function nodeTypeHealth(state: NodeTypeState): { total: number; kinds: number; health: number } {
  const total = Array.from(state.byKind.values()).reduce((s, l) => s + l.length, 0);
  return { total, kinds: state.byKind.size, health: total > 0 ? 1 : 0.5 };
}
