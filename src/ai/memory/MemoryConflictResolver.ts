// V2170 MemoryConflictResolver - Direction F Iter 25/30
// CRDT + LWW for memory merges
// Source: chatdev
export type ConflictStrategy = 'lww' | 'crdt' | 'manual';

export interface MemoryVersion {
  verId: string;
  memId: string;
  data: unknown;
  authorId: string;
  ts: number;
}

export interface ResolutionOutcome {
  winner: MemoryVersion;
  losers: MemoryVersion[];
  strategy: ConflictStrategy;
  resolvedAt: number;
}

export interface MemoryConflictState {
  history: ResolutionOutcome[];
}

export function createMemoryConflictState(): MemoryConflictState {
  return { history: [] };
}

export function resolveMemoryLWW(conflicts: MemoryVersion[]): ResolutionOutcome {
  if (conflicts.length === 0) throw new Error('at least 1 version required');
  const sorted = [...conflicts].sort((a, b) => b.ts - a.ts);
  return { winner: sorted[0], losers: sorted.slice(1), strategy: 'lww', resolvedAt: Date.now() };
}

export function resolveMemoryCRDT(conflicts: MemoryVersion[]): ResolutionOutcome {
  if (conflicts.length === 0) throw new Error('at least 1 version required');
  const sorted = [...conflicts].sort((a, b) => b.ts - a.ts);
  const merged: Record<string, unknown> = {};
  for (const v of sorted) {
    if (v.data && typeof v.data === 'object' && !Array.isArray(v.data)) {
      Object.assign(merged, v.data as Record<string, unknown>);
    }
  }
  return { winner: { ...sorted[0], data: merged }, losers: sorted.slice(1), strategy: 'crdt', resolvedAt: Date.now() };
}

export function recordResolution(state: MemoryConflictState, outcome: ResolutionOutcome): MemoryConflictState {
  return { ...state, history: [...state.history, outcome] };
}

export function detectMemoryConflict(versions: MemoryVersion[]): boolean {
  if (versions.length < 2) return false;
  const authors = new Set(versions.map((v) => v.authorId));
  return authors.size > 1;
}

export function memoryConflictHealth(state: MemoryConflictState): { resolved: number; lww: number; crdt: number; health: number } {
  const lww = state.history.filter((h) => h.strategy === 'lww').length;
  const crdt = state.history.filter((h) => h.strategy === 'crdt').length;
  return { resolved: state.history.length, lww, crdt, health: state.history.length > 0 ? 1 : 0.5 };
}
