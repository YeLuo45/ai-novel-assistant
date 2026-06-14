import { describe, it, expect } from 'vitest';
import { createCacheShardState, addCacheShard, removeCacheShard, routeCacheKey, cacheShardCount, cacheShardHealth } from './CacheShard';

describe('V2244 CacheShard', () => {
  it('should create empty state', () => {
    const s = createCacheShardState();
    expect(cacheShardCount(s)).toBe(0);
  });

  it('should add shard', () => {
    let s = createCacheShardState();
    s = addCacheShard(s, 's1');
    expect(cacheShardCount(s)).toBe(1);
  });

  it('should not add duplicate', () => {
    let s = createCacheShardState();
    s = addCacheShard(s, 's1');
    s = addCacheShard(s, 's1');
    expect(cacheShardCount(s)).toBe(1);
  });

  it('should remove shard', () => {
    let s = createCacheShardState();
    s = addCacheShard(s, 's1');
    s = addCacheShard(s, 's2');
    s = removeCacheShard(s, 's1');
    expect(cacheShardCount(s)).toBe(1);
  });

  it('should return null for empty', () => {
    expect(routeCacheKey(createCacheShardState(), 'k')).toBe(null);
  });

  it('should route key', () => {
    let s = createCacheShardState();
    s = addCacheShard(s, 's1');
    s = addCacheShard(s, 's2');
    expect(routeCacheKey(s, 'my-key')).not.toBe(null);
  });

  it('should route consistently', () => {
    let s = createCacheShardState();
    s = addCacheShard(s, 'a');
    s = addCacheShard(s, 'b');
    expect(routeCacheKey(s, 'same')).toBe(routeCacheKey(s, 'same'));
  });

  it('should compute health', () => {
    let s = createCacheShardState();
    s = addCacheShard(s, 's1');
    const h = cacheShardHealth(s);
    expect(h.health).toBe(1);
  });
});
