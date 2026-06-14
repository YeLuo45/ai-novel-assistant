// V2251 CacheLifecycle - Direction I Iter 16/30
// Created/active/stale/expired states
// Source: ruflo
export type CachePhase = 'created' | 'active' | 'stale' | 'expired';

export interface CacheLifecycleEntry {
  key: string;
  phase: CachePhase;
  birthAt: number;
  lastTransition: number;
  maxAgeMs: number;
}

export interface CacheLifecycleState {
  entries: Map<string, CacheLifecycleEntry>;
}

export function createCacheLifecycleState(): CacheLifecycleState {
  return { entries: new Map() };
}

export function birthCacheEntry(state: CacheLifecycleState, key: string, maxAgeMs = 3600000): CacheLifecycleState {
  const entries = new Map(state.entries);
  entries.set(key, { key, phase: 'created', birthAt: Date.now(), lastTransition: Date.now(), maxAgeMs });
  return { ...state, entries };
}

export function activateCacheEntry(state: CacheLifecycleState, key: string): CacheLifecycleState {
  const e = state.entries.get(key);
  if (!e) return state;
  const entries = new Map(state.entries);
  entries.set(key, { ...e, phase: 'active', lastTransition: Date.now() });
  return { ...state, entries };
}

export function staleCacheEntry(state: CacheLifecycleState, key: string): CacheLifecycleState {
  const e = state.entries.get(key);
  if (!e) return state;
  const entries = new Map(state.entries);
  entries.set(key, { ...e, phase: 'stale', lastTransition: Date.now() });
  return { ...state, entries };
}

export function expireCacheEntry(state: CacheLifecycleState, key: string): CacheLifecycleState {
  const e = state.entries.get(key);
  if (!e) return state;
  const entries = new Map(state.entries);
  entries.set(key, { ...e, phase: 'expired', lastTransition: Date.now() });
  return { ...state, entries };
}

export function autoCacheTransition(state: CacheLifecycleState, now = Date.now()): CacheLifecycleState {
  const entries = new Map(state.entries);
  for (const [k, e] of entries) {
    if (now - e.birthAt > e.maxAgeMs && e.phase !== 'expired') {
      entries.set(k, { ...e, phase: 'expired', lastTransition: now });
    }
  }
  return { ...state, entries };
}

export function cacheLifecycleHealth(state: CacheLifecycleState): { total: number; active: number; health: number } {
  const active = Array.from(state.entries.values()).filter((e) => e.phase === 'active' || e.phase === 'created').length;
  return { total: state.entries.size, active, health: state.entries.size > 0 ? 1 : 0.5 };
}
