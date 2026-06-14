// V2177 GraphStorage - Direction G Iter 2/30
// Persistent graph storage (adjacency + properties)
// Source: thunderbolt
export interface GraphEdge {
  fromId: string;
  toId: string;
  weight: number;
}

export interface GraphStorageNode {
  id: string;
  label: string;
  props: Record<string, unknown>;
}

export interface GraphStorageState {
  nodes: Map<string, GraphStorageNode>;
  edges: GraphEdge[];
  adj: Map<string, string[]>; // fromId → toIds
}

export function createGraphStorageState(): GraphStorageState {
  return { nodes: new Map(), edges: [], adj: new Map() };
}

export function addNode(state: GraphStorageState, id: string, label: string, props: Record<string, unknown> = {}): GraphStorageState {
  if (state.nodes.has(id)) return state;
  const nodes = new Map(state.nodes);
  nodes.set(id, { id, label, props });
  return { ...state, nodes };
}

export function addEdge(state: GraphStorageState, fromId: string, toId: string, weight = 1): GraphStorageState {
  if (!state.nodes.has(fromId) || !state.nodes.has(toId)) return state;
  if (state.edges.some((e) => e.fromId === fromId && e.toId === toId)) return state;
  const adj = new Map(state.adj);
  const list = adj.get(fromId) || [];
  adj.set(fromId, [...list, toId]);
  return { ...state, edges: [...state.edges, { fromId, toId, weight }], adj };
}

export function neighborsOf(state: GraphStorageState, id: string): string[] {
  return state.adj.get(id) || [];
}

export function getNode(state: GraphStorageState, id: string): GraphStorageNode | undefined {
  return state.nodes.get(id);
}

export function setProp(state: GraphStorageState, id: string, key: string, value: unknown): GraphStorageState {
  const n = state.nodes.get(id);
  if (!n) return state;
  const nodes = new Map(state.nodes);
  nodes.set(id, { ...n, props: { ...n.props, [key]: value } });
  return { ...state, nodes };
}

export function removeNode(state: GraphStorageState, id: string): GraphStorageState {
  const nodes = new Map(state.nodes);
  nodes.delete(id);
  const adj = new Map(state.adj);
  adj.delete(id);
  for (const [k, v] of adj) {
    adj.set(k, v.filter((x) => x !== id));
  }
  return { ...state, nodes, edges: state.edges.filter((e) => e.fromId !== id && e.toId !== id), adj };
}

export function removeEdge(state: GraphStorageState, fromId: string, toId: string): GraphStorageState {
  const adj = new Map(state.adj);
  const list = (adj.get(fromId) || []).filter((x) => x !== toId);
  adj.set(fromId, list);
  return { ...state, edges: state.edges.filter((e) => !(e.fromId === fromId && e.toId === toId)), adj };
}

export function nodeCount(state: GraphStorageState): number {
  return state.nodes.size;
}

export function edgeCount(state: GraphStorageState): number {
  return state.edges.length;
}

export function graphStorageHealth(state: GraphStorageState): { nodes: number; edges: number; health: number } {
  return { nodes: state.nodes.size, edges: state.edges.length, health: state.nodes.size > 0 ? 1 : 0 };
}
