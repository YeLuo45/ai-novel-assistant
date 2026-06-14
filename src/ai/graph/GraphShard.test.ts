import { describe, it, expect } from 'vitest';
import { createGraphShardState, addGraphShard, removeGraphShard, routeNodeToShard, graphShardCount, graphShardHealth } from './GraphShard';

describe('V2184 GraphShard', () => {
  it('should create empty state', () => {
    const s = createGraphShardState();
    expect(graphShardCount(s)).toBe(0);
  });

  it('should add shard', () => {
    let s = createGraphShardState();
    s = addGraphShard(s, 's1');
    expect(graphShardCount(s)).toBe(1);
  });

  it('should not add duplicate', () => {
    let s = createGraphShardState();
    s = addGraphShard(s, 's1');
    s = addGraphShard(s, 's1');
    expect(graphShardCount(s)).toBe(1);
  });

  it('should remove shard', () => {
    let s = createGraphShardState();
    s = addGraphShard(s, 's1');
    s = addGraphShard(s, 's2');
    s = removeGraphShard(s, 's1');
    expect(graphShardCount(s)).toBe(1);
  });

  it('should return null for empty ring', () => {
    expect(routeNodeToShard(createGraphShardState(), 'any-node')).toBe(null);
  });

  it('should route node to shard', () => {
    let s = createGraphShardState();
    s = addGraphShard(s, 's1');
    s = addGraphShard(s, 's2');
    const r = routeNodeToShard(s, 'my-node-1');
    expect(r).not.toBe(null);
  });

  it('should route consistently', () => {
    let s = createGraphShardState();
    s = addGraphShard(s, 'a');
    s = addGraphShard(s, 'b');
    expect(routeNodeToShard(s, 'same')).toBe(routeNodeToShard(s, 'same'));
  });

  it('should compute health', () => {
    let s = createGraphShardState();
    s = addGraphShard(s, 's1');
    const h = graphShardHealth(s);
    expect(h.health).toBe(1);
  });
});
