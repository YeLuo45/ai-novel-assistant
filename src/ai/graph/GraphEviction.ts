// V2188 GraphEviction - Direction G Iter 13/30
// LRU node eviction
// Source: nanobot
export type GraphEvictionPolicy = 'lru' | 'lfu' | 'fifo';

export interface EvictableGraphNode {
  id: string;
  size: number;
  lastAccess: number;
  accessCount: number;
}

export interface GraphEvictionState {
  items: Map<string, EvictableGraphNode>;
  capacity: number;
  policy: GraphEvictionPolicy;
  evictionCount: number;
}

export function createGraphEvictionState(capacity: number, policy: GraphEvictionPolicy = 'lru'): GraphEvictionState {
  return { items: new Map(), capacity, policy, evictionCount: 0 };
}

export function putEvictableGraphNode(state: GraphEvictionState, id: string, size: number): GraphEvictionState {
  const items = new Map(state.items);
  items.set(id, { id, size, lastAccess: Date.now(), accessCount: 0 });
  let s: GraphEvictionState = { ...state, items };
  while (s.items.size > s.capacity) s = evictOne(s);
  return s;
}

export function accessGraphEvictable(state: GraphEvictionState, id: string): GraphEvictionState {
  const it = state.items.get(id);
  if (!it) return state;
  const items = new Map(state.items);
  items.set(id, { ...it, lastAccess: Date.now(), accessCount: it.accessCount + 1 });
  return { ...state, items };
}

function evictOne(state: GraphEvictionState): GraphEvictionState {
  if (state.items.size === 0) return state;
  const all = Array.from(state.items.values());
  let victim = all[0];
  if (state.policy === 'lru') victim = all.reduce((m, x) => x.lastAccess < m.lastAccess ? x : m, all[0]);
  else if (state.policy === 'lfu') victim = all.reduce((m, x) => x.accessCount < m.accessCount ? x : m, all[0]);
  else victim = all.reduce((m, x) => x.lastAccess < m.lastAccess ? x : m, all[0]);
  const items = new Map(state.items);
  items.delete(victim.id);
  return { ...state, items, evictionCount: state.evictionCount + 1 };
}

export function graphEvictionItemCount(state: GraphEvictionState): number {
  return state.items.size;
}

export function graphEvictionHealth(state: GraphEvictionState): { items: number; evictions: number; health: number } {
  return { items: state.items.size, evictions: state.evictionCount, health: state.items.size <= state.capacity ? 1 : 0.5 };
}
