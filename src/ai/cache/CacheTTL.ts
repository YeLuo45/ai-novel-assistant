// V2248 CacheTTL - Direction I Iter 13/30
// TTL-based expiration
// Source: nanobot
export interface TTLEntry {
  key: string;
  expiresAt: number;
  ttlMs: number;
}

export interface CacheTTLState {
  entries: Map<string, TTLEntry>;
  totalExpirations: number;
}

export function createCacheTTLState(): CacheTTLState {
  return { entries: new Map(), totalExpirations: 0 };
}

export function setTTL(state: CacheTTLState, key: string, ttlMs: number): CacheTTLState {
  const entries = new Map(state.entries);
  entries.set(key, { key, expiresAt: Date.now() + ttlMs, ttlMs });
  return { ...state, entries };
}

export function getTTL(state: CacheTTLState, key: string): number {
  const e = state.entries.get(key);
  if (!e) return 0;
  return Math.max(0, e.expiresAt - Date.now());
}

export function isExpired(state: CacheTTLState, key: string, now = Date.now()): boolean {
  const e = state.entries.get(key);
  return e ? e.expiresAt <= now : true;
}

export function evictExpired(state: CacheTTLState, now = Date.now()): CacheTTLState {
  const entries = new Map(state.entries);
  let count = 0;
  for (const [k, e] of entries) {
    if (e.expiresAt <= now) { entries.delete(k); count++; }
  }
  return { ...state, entries, totalExpirations: state.totalExpirations + count };
}

export function extendTTL(state: CacheTTLState, key: string, additionalMs: number): CacheTTLState {
  const e = state.entries.get(key);
  if (!e) return state;
  const entries = new Map(state.entries);
  entries.set(key, { ...e, expiresAt: e.expiresAt + additionalMs, ttlMs: e.ttlMs + additionalMs });
  return { ...state, entries };
}

export function cacheTTLHealth(state: CacheTTLState): { entries: number; expirations: number; health: number } {
  return { entries: state.entries.size, expirations: state.totalExpirations, health: state.entries.size > 0 ? 1 : 0.5 };
}
