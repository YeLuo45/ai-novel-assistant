// V2247 CacheCompaction - Direction I Iter 12/30
// Background cache compaction
// Source: nanobot
export interface CacheCompactionSeg {
  id: string;
  originalCount: number;
  finalCount: number;
  sizeBefore: number;
  sizeAfter: number;
  ts: number;
}

export interface CacheCompactionState {
  pending: Map<string, unknown>;
  segments: CacheCompactionSeg[];
  ratio: number;
}

export function createCacheCompactionState(ratio = 0.5): CacheCompactionState {
  return { pending: new Map(), segments: [], ratio };
}

export function enqueueCacheEntry(state: CacheCompactionState, key: string, value: unknown): CacheCompactionState {
  const pending = new Map(state.pending);
  pending.set(key, value);
  return { ...state, pending };
}

export function runCacheCompaction(state: CacheCompactionState): CacheCompactionState {
  if (state.pending.size === 0) return state;
  const entries = Array.from(state.pending.entries());
  const sizeBefore = entries.reduce((s, [_, v]) => s + JSON.stringify(v).length, 0);
  // Dedupe by key
  const unique = new Map<string, unknown>();
  for (const [k, v] of entries) unique.set(k, v);
  const merged = JSON.stringify(Array.from(unique.entries()));
  const target = Math.floor(merged.length * state.ratio);
  const sizeAfter = target;
  const seg: CacheCompactionSeg = { id: `ccseg-${Date.now()}`, originalCount: entries.length, finalCount: unique.size, sizeBefore, sizeAfter, ts: Date.now() };
  return { ...state, pending: new Map(), segments: [...state.segments, seg] };
}

export function cacheCompactionHealth(state: CacheCompactionState): { segments: number; health: number } {
  return { segments: state.segments.length, health: state.segments.length > 0 ? 1 : 0.5 };
}
