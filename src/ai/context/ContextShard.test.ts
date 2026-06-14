import { describe, it, expect } from 'vitest';
import { createContextShardState, addContextShard, removeContextShard, routeContextKey, contextShardCount, contextShardHealth } from './ContextShard';

describe('V2274 ContextShard', () => {
  it('should create empty state', () => {
    const s = createContextShardState();
    expect(contextShardCount(s)).toBe(0);
  });

  it('should add shard', () => {
    let s = createContextShardState();
    s = addContextShard(s, 's1');
    expect(contextShardCount(s)).toBe(1);
  });

  it('should not duplicate', () => {
    let s = createContextShardState();
    s = addContextShard(s, 's1');
    s = addContextShard(s, 's1');
    expect(contextShardCount(s)).toBe(1);
  });

  it('should remove shard', () => {
    let s = createContextShardState();
    s = addContextShard(s, 's1');
    s = addContextShard(s, 's2');
    s = removeContextShard(s, 's1');
    expect(contextShardCount(s)).toBe(1);
  });

  it('should return null for empty', () => {
    expect(routeContextKey(createContextShardState(), 'k')).toBe(null);
  });

  it('should route', () => {
    let s = createContextShardState();
    s = addContextShard(s, 'a');
    s = addContextShard(s, 'b');
    expect(routeContextKey(s, 'my-key')).not.toBe(null);
  });

  it('should route consistently', () => {
    let s = createContextShardState();
    s = addContextShard(s, 'a');
    s = addContextShard(s, 'b');
    expect(routeContextKey(s, 'same')).toBe(routeContextKey(s, 'same'));
  });

  it('should compute health', () => {
    let s = createContextShardState();
    s = addContextShard(s, 's1');
    const h = contextShardHealth(s);
    expect(h.health).toBe(1);
  });
});
