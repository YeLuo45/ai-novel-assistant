// V2200 GraphConflictResolver - Direction G Iter 25/30
// CRDT + LWW for graph merges
// Source: chatdev
export type GraphConflictStrategy = 'lww' | 'crdt' | 'manual';

export interface GraphVersion {
  verId: string;
  graphId: string;
  data: unknown;
  authorId: string;
  ts: number;
}

export interface GraphResolution {
  winner: GraphVersion;
  losers: GraphVersion[];
  strategy: GraphConflictStrategy;
  resolvedAt: number;
}

export interface GraphConflictState {
  history: GraphResolution[];
}

export function createGraphConflictState(): GraphConflictState {
  return { history: [] };
}

export function resolveGraphLWW(conflicts: GraphVersion[]): GraphResolution {
  if (conflicts.length === 0) throw new Error('at least 1 version required');
  const sorted = [...conflicts].sort((a, b) => b.ts - a.ts);
  return { winner: sorted[0], losers: sorted.slice(1), strategy: 'lww', resolvedAt: Date.now() };
}

export function resolveGraphCRDT(conflicts: GraphVersion[]): GraphResolution {
  if (conflicts.length === 0) throw new Error('at least 1 version required');
  const sorted = [...conflicts].sort((a, b) => b.ts - a.ts);
  const merged: Record<string, unknown> = {};
  for (const v of sorted) {
    if (v.data && typeof v.data === 'object' && !Array.isArray(v.data)) Object.assign(merged, v.data as Record<string, unknown>);
  }
  return { winner: { ...sorted[0], data: merged }, losers: sorted.slice(1), strategy: 'crdt', resolvedAt: Date.now() };
}

export function recordGraphResolution(state: GraphConflictState, resolution: GraphResolution): GraphConflictState {
  return { ...state, history: [...state.history, resolution] };
}

export function detectGraphConflict(versions: GraphVersion[]): boolean {
  if (versions.length < 2) return false;
  return new Set(versions.map((v) => v.authorId)).size > 1;
}

export function graphConflictHealth(state: GraphConflictState): { resolved: number; lww: number; crdt: number; health: number } {
  const lww = state.history.filter((h) => h.strategy === 'lww').length;
  const crdt = state.history.filter((h) => h.strategy === 'crdt').length;
  return { resolved: state.history.length, lww, crdt, health: state.history.length > 0 ? 1 : 0.5 };
}
