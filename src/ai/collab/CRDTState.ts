// V2212 CRDTState - Direction H Iter 7/30
// CRDT state (counter/register/set/map)
// Source: thunderbolt
export type CRDTType = 'counter' | 'register' | 'set' | 'map';

export interface CRDTEntry {
  key: string;
  type: CRDTType;
  value: unknown;
  authorId: string;
  ts: number;
}

export interface CRDTState {
  entries: Map<string, CRDTEntry>;
}

export function createCRDTState(): CRDTState {
  return { entries: new Map() };
}

export function incrementCRDT(state: CRDTState, key: string, authorId: string, delta = 1): CRDTState {
  const existing = state.entries.get(key);
  const value = (existing?.value as number || 0) + delta;
  return setCRDT(state, key, value, authorId, 'counter');
}

export function setCRDT(state: CRDTState, key: string, value: unknown, authorId: string, type: CRDTType = 'register'): CRDTState {
  const entries = new Map(state.entries);
  entries.set(key, { key, value, type, authorId, ts: Date.now() });
  return { ...state, entries };
}

export function addToSet(state: CRDTState, key: string, item: unknown, authorId: string): CRDTState {
  const existing = state.entries.get(key);
  const set = new Set((existing?.value as unknown[] || []));
  set.add(item);
  return setCRDT(state, key, Array.from(set), authorId, 'set');
}

export function removeFromSet(state: CRDTState, key: string, item: unknown, authorId: string): CRDTState {
  const existing = state.entries.get(key);
  const set = new Set((existing?.value as unknown[] || []));
  set.delete(item);
  return setCRDT(state, key, Array.from(set), authorId, 'set');
}

export function getCRDT(state: CRDTState, key: string): unknown {
  return state.entries.get(key)?.value;
}

export function mergeCRDT(a: CRDTState, b: CRDTState): CRDTState {
  const entries = new Map(a.entries);
  for (const [k, v] of b.entries) {
    const existing = entries.get(k);
    if (!existing || v.ts > existing.ts) entries.set(k, v);
  }
  return { entries };
}

export function crdtHealth(state: CRDTState): { entries: number; health: number } {
  return { entries: state.entries.size, health: state.entries.size > 0 ? 1 : 0.5 };
}
