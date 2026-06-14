// V2274 ContextShard - Direction J Iter 9/30
// Distributed context sharding by embedding hash
// Source: nanobot
export interface ContextShardInfo {
  shardId: string;
  weight: number;
}

export interface ContextShardState {
  shards: ContextShardInfo[];
  ring: Map<number, string>;
}

export function createContextShardState(): ContextShardState {
  return { shards: [], ring: new Map() };
}

function hashKey(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff;
  return h;
}

function buildRing(shards: ContextShardInfo[]): Map<number, string> {
  const ring = new Map<number, string>();
  for (const s of shards) {
    const h = hashKey(s.shardId);
    for (let i = 0; i < s.weight; i++) ring.set((h + i * 997) % 100000, s.shardId);
  }
  return ring;
}

export function addContextShard(state: ContextShardState, shardId: string, weight = 1): ContextShardState {
  if (state.shards.some((s) => s.shardId === shardId)) return state;
  const shards = [...state.shards, { shardId, weight }];
  return { ...state, shards, ring: buildRing(shards) };
}

export function removeContextShard(state: ContextShardState, shardId: string): ContextShardState {
  const shards = state.shards.filter((s) => s.shardId !== shardId);
  return { ...state, shards, ring: buildRing(shards) };
}

export function routeContextKey(state: ContextShardState, key: string): string | null {
  if (state.ring.size === 0) return null;
  const h = hashKey(key) % 100000;
  const sorted = Array.from(state.ring.keys()).sort((a, b) => a - b);
  for (const k of sorted) {
    if (k >= h) return state.ring.get(k) || null;
  }
  return state.ring.get(sorted[0]) || null;
}

export function contextShardCount(state: ContextShardState): number {
  return state.shards.length;
}

export function contextShardHealth(state: ContextShardState): { shards: number; ringSize: number; health: number } {
  return { shards: state.shards.length, ringSize: state.ring.size, health: state.shards.length > 0 ? 1 : 0 };
}
