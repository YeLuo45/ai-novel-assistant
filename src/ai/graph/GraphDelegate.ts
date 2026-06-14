// V2199 GraphDelegate - Direction G Iter 24/30
// Graph access delegation
// Source: chatdev
export interface GraphDelegation {
  delId: string;
  from: string;
  to: string;
  graphId: string;
  scope: 'read' | 'write' | 'all';
  grantedAt: number;
  expiresAt: number;
}

export interface GraphDelegateState {
  delegations: Map<string, GraphDelegation>;
}

export function createGraphDelegateState(): GraphDelegateState {
  return { delegations: new Map() };
}

export function delegateGraph(state: GraphDelegateState, from: string, to: string, graphId: string, scope: 'read' | 'write' | 'all', ttlMs = 0): GraphDelegateState {
  const delId = `gdel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const del: GraphDelegation = { delId, from, to, graphId, scope, grantedAt: Date.now(), expiresAt: ttlMs > 0 ? Date.now() + ttlMs : 0 };
  const delegations = new Map(state.delegations);
  delegations.set(delId, del);
  return { ...state, delegations };
}

export function revokeGraphDelegation(state: GraphDelegateState, delId: string): GraphDelegateState {
  const delegations = new Map(state.delegations);
  delegations.delete(delId);
  return { ...state, delegations };
}

export function graphDelegationsTo(state: GraphDelegateState, to: string): GraphDelegation[] {
  return Array.from(state.delegations.values()).filter((d) => d.to === to);
}

export function graphDelegationsFrom(state: GraphDelegateState, from: string): GraphDelegation[] {
  return Array.from(state.delegations.values()).filter((d) => d.from === from);
}

export function canDelegateGraph(state: GraphDelegateState, to: string, graphId: string, scope: 'read' | 'write', now = Date.now()): boolean {
  return graphDelegationsTo(state, to).some((d) => d.graphId === graphId && (d.scope === 'all' || d.scope === scope) && (d.expiresAt === 0 || d.expiresAt > now));
}

export function graphDelegateCount(state: GraphDelegateState): number {
  return state.delegations.size;
}

export function graphDelegateHealth(state: GraphDelegateState): { count: number; health: number } {
  return { count: state.delegations.size, health: state.delegations.size > 0 ? 1 : 0.5 };
}
