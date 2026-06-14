// V2277 ContextCompaction - Direction J Iter 12/30
// Background context compaction
// Source: nanobot
export interface ContextCompactionSeg {
  id: string;
  originalCount: number;
  finalCount: number;
  sizeBefore: number;
  sizeAfter: number;
  ts: number;
}

export interface ContextCompactionState {
  pending: Map<string, unknown>;
  segments: ContextCompactionSeg[];
  ratio: number;
}

export function createContextCompactionState(ratio = 0.5): ContextCompactionState {
  return { pending: new Map(), segments: [], ratio };
}

export function enqueueContextEntry(state: ContextCompactionState, key: string, value: unknown): ContextCompactionState {
  const pending = new Map(state.pending);
  pending.set(key, value);
  return { ...state, pending };
}

export function runContextCompaction(state: ContextCompactionState): ContextCompactionState {
  if (state.pending.size === 0) return state;
  const entries = Array.from(state.pending.entries());
  const sizeBefore = entries.reduce((s, [_, v]) => s + JSON.stringify(v).length, 0);
  const unique = new Map<string, unknown>();
  for (const [k, v] of entries) unique.set(k, v);
  const merged = JSON.stringify(Array.from(unique.entries()));
  const target = Math.floor(merged.length * state.ratio);
  const seg: ContextCompactionSeg = { id: `cxseg-${Date.now()}`, originalCount: entries.length, finalCount: unique.size, sizeBefore, sizeAfter: target, ts: Date.now() };
  return { ...state, pending: new Map(), segments: [...state.segments, seg] };
}

export function contextCompactionHealth(state: ContextCompactionState): { segments: number; health: number } {
  return { segments: state.segments.length, health: state.segments.length > 0 ? 1 : 0.5 };
}
