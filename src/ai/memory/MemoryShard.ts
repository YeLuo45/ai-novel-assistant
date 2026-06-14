// V2155 MemoryShard - Direction F Iter 10/30
// Distributed sharding with consistent hash
// Source: nanobot
export interface Shard {
  shardId: string;
  weight: number;
}

export interface ShardState {
  shards: Shard[];
  ring: Map<number, string>; // hash → shardId
  replicationFactor: number;
}

export function createShardState(replicationFactor = 1): ShardState {
  return { shards: [], ring: new Map(), replicationFactor };
}

function hashKey(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff;
  return h;
}

function buildRing(shards: Shard[]): Map<number, string> {
  const ring = new Map<number, string>();
  for (const s of shards) {
    const h = hashKey(s.shardId);
    for (let i = 0; i < s.weight; i++) ring.set((h + i * 997) % 100000, s.shardId);
  }
  return ring;
}

export function addShard(state: ShardState, shardId: string, weight = 1): ShardState {
  if (state.shards.some((s) => s.shardId === shardId)) return state;
  const shards = [...state.shards, { shardId, weight }];
  return { ...state, shards, ring: buildRing(shards) };
}

export function removeShard(state: ShardState, shardId: string): ShardState {
  const shards = state.shards.filter((s) => s.shardId !== shardId);
  return { ...state, shards, ring: buildRing(shards) };
}

export function routeKey(state: ShardState, key: string): string | null {
  if (state.ring.size === 0) return null;
  const h = hashKey(key) % 100000;
  const sorted = Array.from(state.ring.keys()).sort((a, b) => a - b);
  for (const k of sorted) {
    if (k >= h) return state.ring.get(k) || null;
  }
  return state.ring.get(sorted[0]) || null;
}

export function routeKeyReplicas(state: ShardState, key: string): string[] {
  const primary = routeKey(state, key);
  if (!primary) return [];
  return [primary];
}

export function shardCount(state: ShardState): number {
  return state.shards.length;
}

export function memoryShardHealth(state: ShardState): { shards: number; ringSize: number; health: number } {
  return { shards: state.shards.length, ringSize: state.ring.size, health: state.shards.length > 0 ? 1 : 0 };
}
