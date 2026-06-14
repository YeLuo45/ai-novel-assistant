// V2230 OpConflictResolver - Direction H Iter 25/30
// LWW/CRDT op conflict resolver
// Source: chatdev
export type OpConflictStrategy = 'lww' | 'crdt';

export interface OpVersion {
  verId: string;
  opId: string;
  data: unknown;
  authorId: string;
  ts: number;
}

export interface OpResolution {
  winner: OpVersion;
  losers: OpVersion[];
  strategy: OpConflictStrategy;
  resolvedAt: number;
}

export interface OpConflictState {
  history: OpResolution[];
}

export function createOpConflictState(): OpConflictState {
  return { history: [] };
}

export function resolveOpLWW(conflicts: OpVersion[]): OpResolution {
  if (conflicts.length === 0) throw new Error('at least 1 version required');
  const sorted = [...conflicts].sort((a, b) => b.ts - a.ts);
  return { winner: sorted[0], losers: sorted.slice(1), strategy: 'lww', resolvedAt: Date.now() };
}

export function resolveOpCRDT(conflicts: OpVersion[]): OpResolution {
  if (conflicts.length === 0) throw new Error('at least 1 version required');
  const sorted = [...conflicts].sort((a, b) => b.ts - a.ts);
  const merged: Record<string, unknown> = {};
  for (const v of sorted) {
    if (v.data && typeof v.data === 'object' && !Array.isArray(v.data)) Object.assign(merged, v.data as Record<string, unknown>);
  }
  return { winner: { ...sorted[0], data: merged }, losers: sorted.slice(1), strategy: 'crdt', resolvedAt: Date.now() };
}

export function recordOpResolution(state: OpConflictState, resolution: OpResolution): OpConflictState {
  return { ...state, history: [...state.history, resolution] };
}

export function detectOpConflict(versions: OpVersion[]): boolean {
  if (versions.length < 2) return false;
  return new Set(versions.map((v) => v.authorId)).size > 1;
}

export function opConflictHealth(state: OpConflictState): { resolved: number; lww: number; crdt: number; health: number } {
  const lww = state.history.filter((h) => h.strategy === 'lww').length;
  const crdt = state.history.filter((h) => h.strategy === 'crdt').length;
  return { resolved: state.history.length, lww, crdt, health: state.history.length > 0 ? 1 : 0.5 };
}
