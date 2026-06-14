// V2244 CacheShard - Direction I Iter 9/30
// Distributed sharding by key hash
// Source: nanobot
export interface CacheShardInfo {
  shardId: string;
  weight: number;
}

export interface CacheShardState {
  shards: CacheShardInfo[];
  ring: Map<number, string>;
}

export function createCacheShardState(): CacheShardState {
  return { shards: [], ring: new Map() };
}

function hashKey(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff;
  return h;
}

function buildRing(shards: CacheShardInfo[]): Map<number, string> {
  const ring = new Map<number, string>();
  for (const s of shards) {
    const h = hashKey(s.shardId);
    for (let i = 0; i < s.weight; i++) ring.set((h + i * 997) % 100000, s.shardId);
  }
  return ring;
}

export function addCacheShard(state: CacheShardState, shardId: string, weight = 1): CacheShardState {
  if (state.shards.some((s) => s.shardId === shardId)) return state;
  const shards = [...state.shards, { shardId, weight }];
  return { ...state, shards, ring: buildRing(shards) };
}

export function removeCacheShard(state: CacheShardState, shardId: string): CacheShardState {
  const shards = state.shards.filter((s) => s.shardId !== shardId);
  return { ...state, shards, ring: buildRing(shards) };
}

export function routeCacheKey(state: CacheShardState, key: string): string | null {
  if (state.ring.size === 0) return null;
  const h = hashKey(key) % 100000;
  const sorted = Array.from(state.ring.keys()).sort((a, b) => a - b);
  for (const k of sorted) {
    if (k >= h) return state.ring.get(k) || null;
  }
  return state.ring.get(sorted[0]) || null;
}

export function cacheShardCount(state: CacheShardState): number {
  return state.shards.length;
}

export function cacheShardHealth(state: CacheShardState): { shards: number; ringSize: number; health: number } {
  return { shards: state.shards.length, ringSize: state.ring.size, health: state.shards.length > 0 ? 1 : 0 };
}
