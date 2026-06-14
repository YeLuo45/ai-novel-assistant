// V2184 GraphShard - Direction G Iter 9/30
// Distributed sharding with consistent hash
// Source: nanobot
export interface GraphShardInfo {
  shardId: string;
  weight: number;
}

export interface GraphShardState {
  shards: GraphShardInfo[];
  ring: Map<number, string>;
}

export function createGraphShardState(): GraphShardState {
  return { shards: [], ring: new Map() };
}

function hashKey(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff;
  return h;
}

function buildRing(shards: GraphShardInfo[]): Map<number, string> {
  const ring = new Map<number, string>();
  for (const s of shards) {
    const h = hashKey(s.shardId);
    for (let i = 0; i < s.weight; i++) ring.set((h + i * 997) % 100000, s.shardId);
  }
  return ring;
}

export function addGraphShard(state: GraphShardState, shardId: string, weight = 1): GraphShardState {
  if (state.shards.some((s) => s.shardId === shardId)) return state;
  const shards = [...state.shards, { shardId, weight }];
  return { ...state, shards, ring: buildRing(shards) };
}

export function removeGraphShard(state: GraphShardState, shardId: string): GraphShardState {
  const shards = state.shards.filter((s) => s.shardId !== shardId);
  return { ...state, shards, ring: buildRing(shards) };
}

export function routeNodeToShard(state: GraphShardState, nodeId: string): string | null {
  if (state.ring.size === 0) return null;
  const h = hashKey(nodeId) % 100000;
  const sorted = Array.from(state.ring.keys()).sort((a, b) => a - b);
  for (const k of sorted) {
    if (k >= h) return state.ring.get(k) || null;
  }
  return state.ring.get(sorted[0]) || null;
}

export function graphShardCount(state: GraphShardState): number {
  return state.shards.length;
}

export function graphShardHealth(state: GraphShardState): { shards: number; ringSize: number; health: number } {
  return { shards: state.shards.length, ringSize: state.ring.size, health: state.shards.length > 0 ? 1 : 0 };
}
