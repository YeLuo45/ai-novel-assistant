// V2219 OpDeduplicator - Direction H Iter 14/30
// Dedupe operations by id
// Source: nanobot
export interface OpDedupeState {
  seen: Set<string>;
  duplicates: number;
  totalChecked: number;
}

export function createOpDedupeState(): OpDedupeState {
  return { seen: new Set(), duplicates: 0, totalChecked: 0 };
}

export function isNewOp(state: OpDedupeState, opId: string): boolean {
  return !state.seen.has(opId);
}

export function recordOp(state: OpDedupeState, opId: string): OpDedupeState {
  if (state.seen.has(opId)) {
    return { ...state, duplicates: state.duplicates + 1, totalChecked: state.totalChecked + 1 };
  }
  const seen = new Set(state.seen);
  seen.add(opId);
  return { ...state, seen, totalChecked: state.totalChecked + 1 };
}

export function dedupeOps(state: OpDedupeState, opIds: string[]): { state: OpDedupeState; unique: string[]; dups: string[] } {
  const unique: string[] = [];
  const dups: string[] = [];
  let s = state;
  for (const id of opIds) {
    if (s.seen.has(id)) { s = { ...s, duplicates: s.duplicates + 1, totalChecked: s.totalChecked + 1 }; dups.push(id); }
    else { const seen = new Set(s.seen); seen.add(id); s = { ...s, seen, totalChecked: s.totalChecked + 1 }; unique.push(id); }
  }
  return { state: s, unique, dups };
}

export function clearDedupes(state: OpDedupeState): OpDedupeState {
  return { seen: new Set(), duplicates: 0, totalChecked: state.totalChecked };
}

export function dedupeHealth(state: OpDedupeState): { seen: number; dups: number; health: number } {
  return { seen: state.seen.size, dups: state.duplicates, health: state.seen.size > 0 ? 1 : 0.5 };
}
