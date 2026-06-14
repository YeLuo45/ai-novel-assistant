// V2197 GraphShare - Direction G Iter 22/30
// Cross-agent graph sharing
// Source: chatdev
export type GraphShareLevel = 'private' | 'team' | 'public';

export interface GraphShareGrant {
  grantId: string;
  graphId: string;
  grantee: string;
  level: GraphShareLevel;
  grantedAt: number;
  expiresAt: number;
}

export interface GraphShareState {
  grants: Map<string, GraphShareGrant>;
  byGraph: Map<string, string[]>;
}

export function createGraphShareState(): GraphShareState {
  return { grants: new Map(), byGraph: new Map() };
}

export function grantGraphShare(state: GraphShareState, graphId: string, grantee: string, level: GraphShareLevel, ttlMs = 0): GraphShareState {
  const grantId = `gsh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const grant: GraphShareGrant = { grantId, graphId, grantee, level, grantedAt: Date.now(), expiresAt: ttlMs > 0 ? Date.now() + ttlMs : 0 };
  const grants = new Map(state.grants);
  grants.set(grantId, grant);
  const byGraph = new Map(state.byGraph);
  const list = byGraph.get(graphId) || [];
  byGraph.set(graphId, [...list, grantId]);
  return { ...state, grants, byGraph };
}

export function revokeGraphShare(state: GraphShareState, grantId: string): GraphShareState {
  const grants = new Map(state.grants);
  const grant = grants.get(grantId);
  grants.delete(grantId);
  const byGraph = new Map(state.byGraph);
  if (grant) byGraph.set(grant.graphId, (byGraph.get(grant.graphId) || []).filter((id) => id !== grantId));
  return { ...state, grants, byGraph };
}

export function graphGrantsForGraph(state: GraphShareState, graphId: string): GraphShareGrant[] {
  return (state.byGraph.get(graphId) || []).map((id) => state.grants.get(id)!).filter(Boolean);
}

export function canAccessGraph(state: GraphShareState, graphId: string, grantee: string, now = Date.now()): boolean {
  return graphGrantsForGraph(state, graphId).some((g) => g.grantee === grantee && (g.expiresAt === 0 || g.expiresAt > now));
}

export function graphShareCount(state: GraphShareState): number {
  return state.grants.size;
}

export function graphShareHealth(state: GraphShareState): { grants: number; graphs: number; health: number } {
  return { grants: state.grants.size, graphs: state.byGraph.size, health: state.grants.size > 0 ? 1 : 0.5 };
}
