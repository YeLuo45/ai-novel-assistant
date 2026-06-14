import { describe, it, expect } from 'vitest';
import { createShardState, addShard, removeShard, routeKey, shardCount, memoryShardHealth } from './MemoryShard';

describe('V2155 MemoryShard', () => {
  it('should create empty state', () => {
    const s = createShardState();
    expect(shardCount(s)).toBe(0);
  });

  it('should add shard', () => {
    let s = createShardState();
    s = addShard(s, 'shard1');
    expect(shardCount(s)).toBe(1);
  });

  it('should not add duplicate shard', () => {
    let s = createShardState();
    s = addShard(s, 'shard1');
    s = addShard(s, 'shard1');
    expect(shardCount(s)).toBe(1);
  });

  it('should remove shard', () => {
    let s = createShardState();
    s = addShard(s, 'shard1');
    s = addShard(s, 'shard2');
    s = removeShard(s, 'shard1');
    expect(shardCount(s)).toBe(1);
  });

  it('should return null for empty ring', () => {
    expect(routeKey(createShardState(), 'any-key')).toBe(null);
  });

  it('should route a key to a shard', () => {
    let s = createShardState();
    s = addShard(s, 'shard1');
    s = addShard(s, 'shard2');
    s = addShard(s, 'shard3');
    const r = routeKey(s, 'my-key-1');
    expect(r).not.toBe(null);
  });

  it('should route consistently', () => {
    let s = createShardState();
    s = addShard(s, 'a');
    s = addShard(s, 'b');
    s = addShard(s, 'c');
    const r1 = routeKey(s, 'same-key');
    const r2 = routeKey(s, 'same-key');
    expect(r1).toBe(r2);
  });

  it('should compute health', () => {
    let s = createShardState();
    s = addShard(s, 's1');
    const h = memoryShardHealth(s);
    expect(h.health).toBe(1);
  });
});
