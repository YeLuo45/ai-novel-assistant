import { describe, it, expect } from 'vitest';
import { createCacheEvictionState, putEvictable, accessEvictable, setEvictionPolicy, cacheEvictionHealth } from './CacheEviction';

describe('V2239 CacheEviction', () => {
  it('should create empty state', () => {
    const s = createCacheEvictionState(10);
    expect(s.entries.size).toBe(0);
  });

  it('should put entry', () => {
    let s = createCacheEvictionState(10);
    s = putEvictable(s, 'k1', 100);
    expect(s.entries.size).toBe(1);
  });

  it('should evict LRU when over capacity', () => {
    let s = createCacheEvictionState(2, 1_000_000, 'lru');
    s = putEvictable(s, 'a', 100);
    s = putEvictable(s, 'b', 100);
    s = putEvictable(s, 'c', 100);
    expect(s.entries.size).toBe(2);
    expect(s.evictionCount).toBe(1);
  });

  it('should evict LFU', () => {
    let s = createCacheEvictionState(2, 1_000_000, 'lfu');
    s = putEvictable(s, 'a', 100);
    s = putEvictable(s, 'b', 100);
    s = accessEvictable(s, 'a');
    s = accessEvictable(s, 'a');
    s = putEvictable(s, 'c', 100);
    expect(s.entries.size).toBe(2);
  });

  it('should evict by max bytes', () => {
    let s = createCacheEvictionState(100, 200, 'lru');
    s = putEvictable(s, 'a', 100);
    s = putEvictable(s, 'b', 100);
    s = putEvictable(s, 'c', 100);
    expect(s.entries.size).toBeLessThanOrEqual(2);
  });

  it('should access entry', () => {
    let s = createCacheEvictionState(10);
    s = putEvictable(s, 'a', 100);
    s = accessEvictable(s, 'a');
    expect(s.entries.get('a')?.accessCount).toBe(1);
  });

  it('should set policy', () => {
    const s = setEvictionPolicy(createCacheEvictionState(10), 'fifo');
    expect(s.policy).toBe('fifo');
  });

  it('should compute health', () => {
    let s = createCacheEvictionState(10);
    s = putEvictable(s, 'k1', 100);
    const h = cacheEvictionHealth(s);
    expect(h.health).toBe(1);
  });
});
