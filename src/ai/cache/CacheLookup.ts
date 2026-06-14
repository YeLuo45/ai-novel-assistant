// V2238 CacheLookup - Direction I Iter 3/30
// Fast cache lookup with index
// Source: thunderbolt
export interface LookupIndex {
  prefix: string;
  keys: Set<string>;
}

export interface CacheLookupState {
  index: Map<string, LookupIndex>; // prefix → keys
  store: Map<string, unknown>;
}

export function createCacheLookupState(): CacheLookupState {
  return { index: new Map(), store: new Map() };
}

export function putCacheEntry(state: CacheLookupState, key: string, value: unknown): CacheLookupState {
  const store = new Map(state.store);
  store.set(key, value);
  // Update prefix index (split by first '.')
  const prefix = key.split('.')[0];
  const index = new Map(state.index);
  const existing = index.get(prefix) || { prefix, keys: new Set() };
  const keys = new Set(existing.keys);
  keys.add(key);
  index.set(prefix, { prefix, keys });
  return { ...state, store, index };
}

export function getCacheEntry(state: CacheLookupState, key: string): unknown {
  return state.store.get(key);
}

export function getKeysByPrefix(state: CacheLookupState, prefix: string): string[] {
  return Array.from(state.index.get(prefix)?.keys || []);
}

export function removeCacheEntry(state: CacheLookupState, key: string): CacheLookupState {
  const store = new Map(state.store);
  store.delete(key);
  const prefix = key.split('.')[0];
  const index = new Map(state.index);
  const existing = index.get(prefix);
  if (existing) {
    const keys = new Set(existing.keys);
    keys.delete(key);
    if (keys.size === 0) index.delete(prefix);
    else index.set(prefix, { prefix, keys });
  }
  return { ...state, store, index };
}

export function prefixCount(state: CacheLookupState): number {
  return state.index.size;
}

export function cacheLookupHealth(state: CacheLookupState): { entries: number; prefixes: number; health: number } {
  return { entries: state.store.size, prefixes: state.index.size, health: state.store.size > 0 ? 1 : 0.5 };
}
