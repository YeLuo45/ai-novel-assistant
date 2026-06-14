import { describe, it, expect } from 'vitest';
import { createCacheCompactionState, enqueueCacheEntry, runCacheCompaction, cacheCompactionHealth } from './CacheCompaction';

describe('V2247 CacheCompaction', () => {
  it('should create empty state', () => {
    const s = createCacheCompactionState();
    expect(s.segments).toEqual([]);
  });

  it('should enqueue entry', () => {
    let s = createCacheCompactionState();
    s = enqueueCacheEntry(s, 'k1', { x: 1 });
    expect(s.pending.size).toBe(1);
  });

  it('should run compaction', () => {
    let s = createCacheCompactionState();
    s = enqueueCacheEntry(s, 'k1', 'a');
    s = enqueueCacheEntry(s, 'k2', 'b');
    s = runCacheCompaction(s);
    expect(s.segments).toHaveLength(1);
  });

  it('should not compact empty', () => {
    let s = createCacheCompactionState();
    s = runCacheCompaction(s);
    expect(s.segments).toEqual([]);
  });

  it('should dedupe by key', () => {
    let s = createCacheCompactionState();
    s = enqueueCacheEntry(s, 'k1', 'a');
    s = enqueueCacheEntry(s, 'k1', 'b');
    s = runCacheCompaction(s);
    expect(s.segments[0].finalCount).toBe(1);
  });

  it('should compute health', () => {
    const s = createCacheCompactionState();
    const h = cacheCompactionHealth(s);
    expect(h.health).toBe(0.5);
  });
});
