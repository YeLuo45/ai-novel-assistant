// V2159 MemoryEviction - Direction F Iter 14/30
// LRU/LFU/TTL eviction policies
// Source: nanobot
export type EvictionPolicy = 'lru' | 'lfu' | 'ttl' | 'fifo';

export interface EvictableItem {
  id: string;
  size: number;
  lastAccess: number;
  accessCount: number;
  expiresAt: number; // 0 = no expiry
}

export interface MemoryEvictionState {
  items: Map<string, EvictableItem>;
  capacity: number;
  policy: EvictionPolicy;
  evictionCount: number;
}

export function createEvictionState(capacity: number, policy: EvictionPolicy = 'lru'): MemoryEvictionState {
  return { items: new Map(), capacity, policy, evictionCount: 0 };
}

export function putEvictable(state: MemoryEvictionState, id: string, size: number, ttlMs = 0): MemoryEvictionState {
  const items = new Map(state.items);
  items.set(id, { id, size, lastAccess: Date.now(), accessCount: 0, expiresAt: ttlMs > 0 ? Date.now() + ttlMs : 0 });
  // Check capacity
  let s: MemoryEvictionState = { ...state, items };
  if (s.items.size > s.capacity) s = evictOne(s);
  return s;
}

export function accessEvictable(state: MemoryEvictionState, id: string): MemoryEvictionState {
  const it = state.items.get(id);
  if (!it) return state;
  const items = new Map(state.items);
  items.set(id, { ...it, lastAccess: Date.now(), accessCount: it.accessCount + 1 });
  return { ...state, items };
}

function evictOne(state: MemoryEvictionState): MemoryEvictionState {
  if (state.items.size === 0) return state;
  const all = Array.from(state.items.values());
  let victimId = all[0].id;
  if (state.policy === 'lru') {
    victimId = all.reduce((min, x) => x.lastAccess < min.lastAccess ? x : min, all[0]).id;
  } else if (state.policy === 'lfu') {
    victimId = all.reduce((min, x) => x.accessCount < min.accessCount ? x : min, all[0]).id;
  } else if (state.policy === 'ttl') {
    const now = Date.now();
    const expired = all.find((x) => x.expiresAt > 0 && x.expiresAt <= now);
    if (expired) victimId = expired.id;
    else victimId = all.reduce((min, x) => x.expiresAt < min.expiresAt ? x : min, all[0]).id;
  } else if (state.policy === 'fifo') {
    victimId = all.reduce((min, x) => x.lastAccess < min.lastAccess ? x : min, all[0]).id;
  }
  const items = new Map(state.items);
  items.delete(victimId);
  return { ...state, items, evictionCount: state.evictionCount + 1 };
}

export function setPolicy(state: MemoryEvictionState, policy: EvictionPolicy): MemoryEvictionState {
  return { ...state, policy };
}

export function itemCount(state: MemoryEvictionState): number {
  return state.items.size;
}

export function memoryEvictionHealth(state: MemoryEvictionState): { items: number; capacity: number; evictions: number; health: number } {
  return { items: state.items.size, capacity: state.capacity, evictions: state.evictionCount, health: state.items.size <= state.capacity ? 1 : 0.5 };
}
