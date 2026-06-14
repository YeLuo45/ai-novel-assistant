// V2239 CacheEviction - Direction I Iter 4/30
// LRU/LFU/FIFO/TTL eviction policies
// Source: thunderbolt
export type CacheEvictionPolicy = 'lru' | 'lfu' | 'fifo' | 'ttl';

export interface EvictableEntry {
  key: string;
  size: number;
  lastAccess: number;
  accessCount: number;
  expiresAt: number; // 0 = no expiry
}

export interface CacheEvictionState {
  entries: Map<string, EvictableEntry>;
  capacity: number;
  maxBytes: number;
  policy: CacheEvictionPolicy;
  evictionCount: number;
}

export function createCacheEvictionState(capacity = 100, maxBytes = 10_000_000, policy: CacheEvictionPolicy = 'lru'): CacheEvictionState {
  return { entries: new Map(), capacity, maxBytes, policy, evictionCount: 0 };
}

export function putEvictable(state: CacheEvictionState, key: string, size: number, ttlMs = 0): CacheEvictionState {
  const entries = new Map(state.entries);
  entries.set(key, { key, size, lastAccess: Date.now(), accessCount: 0, expiresAt: ttlMs > 0 ? Date.now() + ttlMs : 0 });
  let s: CacheEvictionState = { ...state, entries };
  while (s.entries.size > s.capacity || totalBytesUsed(s) > s.maxBytes) {
    s = evictOne(s);
    if (s.entries.size === 0) break;
  }
  return s;
}

export function accessEvictable(state: CacheEvictionState, key: string): CacheEvictionState {
  const e = state.entries.get(key);
  if (!e) return state;
  const entries = new Map(state.entries);
  entries.set(key, { ...e, lastAccess: Date.now(), accessCount: e.accessCount + 1 });
  return { ...state, entries };
}

function totalBytesUsed(state: CacheEvictionState): number {
  return Array.from(state.entries.values()).reduce((s, e) => s + e.size, 0);
}

function evictOne(state: CacheEvictionState): CacheEvictionState {
  if (state.entries.size === 0) return state;
  const all = Array.from(state.entries.values());
  let victim = all[0];
  const now = Date.now();
  if (state.policy === 'lru') victim = all.reduce((m, x) => x.lastAccess < m.lastAccess ? x : m, all[0]);
  else if (state.policy === 'lfu') victim = all.reduce((m, x) => x.accessCount < m.accessCount ? x : m, all[0]);
  else if (state.policy === 'ttl') {
    const expired = all.find((x) => x.expiresAt > 0 && x.expiresAt <= now);
    if (expired) victim = expired;
    else victim = all.reduce((m, x) => x.expiresAt < m.expiresAt ? x : m, all[0]);
  } else victim = all.reduce((m, x) => x.lastAccess < m.lastAccess ? x : m, all[0]);
  const entries = new Map(state.entries);
  entries.delete(victim.key);
  return { ...state, entries, evictionCount: state.evictionCount + 1 };
}

export function setEvictionPolicy(state: CacheEvictionState, policy: CacheEvictionPolicy): CacheEvictionState {
  return { ...state, policy };
}

export function cacheEvictionHealth(state: CacheEvictionState): { items: number; evictions: number; health: number } {
  return { items: state.entries.size, evictions: state.evictionCount, health: state.entries.size <= state.capacity ? 1 : 0.5 };
}
