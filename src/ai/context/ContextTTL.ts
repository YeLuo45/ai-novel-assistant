// V2278 ContextTTL - Direction J Iter 13/30
// TTL-based context expiration
// Source: nanobot
export interface ContextTTLEntry {
  key: string;
  expiresAt: number;
  ttlMs: number;
}

export interface ContextTTLState {
  entries: Map<string, ContextTTLEntry>;
  totalExpirations: number;
}

export function createContextTTLState(): ContextTTLState {
  return { entries: new Map(), totalExpirations: 0 };
}

export function setContextTTL(state: ContextTTLState, key: string, ttlMs: number): ContextTTLState {
  const entries = new Map(state.entries);
  entries.set(key, { key, expiresAt: Date.now() + ttlMs, ttlMs });
  return { ...state, entries };
}

export function getContextTTL(state: ContextTTLState, key: string): number {
  const e = state.entries.get(key);
  if (!e) return 0;
  return Math.max(0, e.expiresAt - Date.now());
}

export function isContextExpired(state: ContextTTLState, key: string, now = Date.now()): boolean {
  const e = state.entries.get(key);
  return e ? e.expiresAt <= now : true;
}

export function evictContextExpired(state: ContextTTLState, now = Date.now()): ContextTTLState {
  const entries = new Map(state.entries);
  let count = 0;
  for (const [k, e] of entries) {
    if (e.expiresAt <= now) { entries.delete(k); count++; }
  }
  return { ...state, entries, totalExpirations: state.totalExpirations + count };
}

export function extendContextTTL(state: ContextTTLState, key: string, additionalMs: number): ContextTTLState {
  const e = state.entries.get(key);
  if (!e) return state;
  const entries = new Map(state.entries);
  entries.set(key, { ...e, expiresAt: e.expiresAt + additionalMs, ttlMs: e.ttlMs + additionalMs });
  return { ...state, entries };
}

export function contextTTLHealth(state: ContextTTLState): { entries: number; expirations: number; health: number } {
  return { entries: state.entries.size, expirations: state.totalExpirations, health: state.entries.size > 0 ? 1 : 0.5 };
}
