// V2320 SkillConflictResolver - Direction K Iter 25/30
// LWW/CRDT skill conflict resolver
// Source: chatdev
export type SkillConflictStrategy = 'lww' | 'crdt';

export interface SkillVersion {
  verId: string;
  key: string;
  data: unknown;
  authorId: string;
  ts: number;
}

export interface SkillResolution {
  winner: SkillVersion;
  losers: SkillVersion[];
  strategy: SkillConflictStrategy;
  resolvedAt: number;
}

export interface SkillConflictState {
  history: SkillResolution[];
}

export function createSkillConflictState(): SkillConflictState {
  return { history: [] };
}

export function resolveSkillLWW(conflicts: SkillVersion[]): SkillResolution {
  if (conflicts.length === 0) throw new Error('at least 1 version required');
  const sorted = [...conflicts].sort((a, b) => b.ts - a.ts);
  return { winner: sorted[0], losers: sorted.slice(1), strategy: 'lww', resolvedAt: Date.now() };
}

export function resolveSkillCRDT(conflicts: SkillVersion[]): SkillResolution {
  if (conflicts.length === 0) throw new Error('at least 1 version required');
  const sorted = [...conflicts].sort((a, b) => b.ts - a.ts);
  const merged: Record<string, unknown> = {};
  for (const v of sorted) {
    if (v.data && typeof v.data === 'object' && !Array.isArray(v.data)) Object.assign(merged, v.data as Record<string, unknown>);
  }
  return { winner: { ...sorted[0], data: merged }, losers: sorted.slice(1), strategy: 'crdt', resolvedAt: Date.now() };
}

export function recordSkillResolution(state: SkillConflictState, resolution: SkillResolution): SkillConflictState {
  return { ...state, history: [...state.history, resolution] };
}

export function detectSkillConflict(versions: SkillVersion[]): boolean {
  if (versions.length < 2) return false;
  return new Set(versions.map((v) => v.authorId)).size > 1;
}

export function skillConflictHealth(state: SkillConflictState): { resolved: number; lww: number; crdt: number; health: number } {
  const lww = state.history.filter((h) => h.strategy === 'lww').length;
  const crdt = state.history.filter((h) => h.strategy === 'crdt').length;
  return { resolved: state.history.length, lww, crdt, health: state.history.length > 0 ? 1 : 0.5 };
}
