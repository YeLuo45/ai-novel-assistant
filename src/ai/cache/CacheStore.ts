// V2237 CacheStore - Direction I Iter 2/30
// Distributed key-value store with TTL
// Source: thunderbolt
export interface CacheEntry {
  key: string;
  value: unknown;
  size: number;
  expiresAt: number; // 0 = no expiry
  hits: number;
  lastAccess: number;
}

export interface CacheStoreState {
  store: Map<string, CacheEntry>;
  totalGets: number;
  totalSets: number;
  totalHits: number;
  totalMisses: number;
}

export function createCacheStoreState(): CacheStoreState {
  return { store: new Map(), totalGets: 0, totalSets: 0, totalHits: 0, totalMisses: 0 };
}

export function cacheSet(state: CacheStoreState, key: string, value: unknown, ttlMs = 0): CacheStoreState {
  const size = JSON.stringify(value).length;
  const expiresAt = ttlMs > 0 ? Date.now() + ttlMs : 0;
  const entry: CacheEntry = { key, value, size, expiresAt, hits: 0, lastAccess: Date.now() };
  const store = new Map(state.store);
  store.set(key, entry);
  return { ...state, store, totalSets: state.totalSets + 1 };
}

export function cacheGet(state: CacheStoreState, key: string): CacheStoreState {
  const entry = state.store.get(key);
  if (!entry || (entry.expiresAt > 0 && entry.expiresAt < Date.now())) {
    return { ...state, totalGets: state.totalGets + 1, totalMisses: state.totalMisses + 1 };
  }
  const store = new Map(state.store);
  store.set(key, { ...entry, hits: entry.hits + 1, lastAccess: Date.now() });
  return { ...state, store, totalGets: state.totalGets + 1, totalHits: state.totalHits + 1 };
}

export function cacheDelete(state: CacheStoreState, key: string): CacheStoreState {
  const store = new Map(state.store);
  store.delete(key);
  return { ...state, store };
}

export function cacheHas(state: CacheStoreState, key: string): boolean {
  const entry = state.store.get(key);
  if (!entry) return false;
  if (entry.expiresAt > 0 && entry.expiresAt < Date.now()) return false;
  return true;
}

export function cacheSize(state: CacheStoreState): number {
  return state.store.size;
}

export function totalBytes(state: CacheStoreState): number {
  return Array.from(state.store.values()).reduce((s, e) => s + e.size, 0);
}

export function cacheStoreHealth(state: CacheStoreState): { entries: number; hitRate: number; health: number } {
  const hitRate = state.totalGets > 0 ? state.totalHits / state.totalGets : 0;
  return { entries: state.store.size, hitRate, health: state.store.size > 0 ? 1 : 0.5 };
}
