// V2304 SkillShard - Direction K Iter 9/30
// Distributed skill sharding by hash
// Source: nanobot
export interface SkillShardInfo {
  shardId: string;
  weight: number;
}

export interface SkillShardState {
  shards: SkillShardInfo[];
  ring: Map<number, string>;
}

export function createSkillShardState(): SkillShardState {
  return { shards: [], ring: new Map() };
}

function hashKey(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff;
  return h;
}

function buildRing(shards: SkillShardInfo[]): Map<number, string> {
  const ring = new Map<number, string>();
  for (const s of shards) {
    const h = hashKey(s.shardId);
    for (let i = 0; i < s.weight; i++) ring.set((h + i * 997) % 100000, s.shardId);
  }
  return ring;
}

export function addSkillShard(state: SkillShardState, shardId: string, weight = 1): SkillShardState {
  if (state.shards.some((s) => s.shardId === shardId)) return state;
  const shards = [...state.shards, { shardId, weight }];
  return { ...state, shards, ring: buildRing(shards) };
}

export function removeSkillShard(state: SkillShardState, shardId: string): SkillShardState {
  const shards = state.shards.filter((s) => s.shardId !== shardId);
  return { ...state, shards, ring: buildRing(shards) };
}

export function routeSkillKey(state: SkillShardState, key: string): string | null {
  if (state.ring.size === 0) return null;
  const h = hashKey(key) % 100000;
  const sorted = Array.from(state.ring.keys()).sort((a, b) => a - b);
  for (const k of sorted) {
    if (k >= h) return state.ring.get(k) || null;
  }
  return state.ring.get(sorted[0]) || null;
}

export function skillShardCount(state: SkillShardState): number {
  return state.shards.length;
}

export function skillShardHealth(state: SkillShardState): { shards: number; ringSize: number; health: number } {
  return { shards: state.shards.length, ringSize: state.ring.size, health: state.shards.length > 0 ? 1 : 0 };
}
