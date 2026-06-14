import { describe, it, expect } from 'vitest';
import { createCacheWatcherState, addCacheWatch, removeCacheWatch, fireCacheWatch, cacheWatchCount, cacheWatchFireCount, cacheWatcherHealth } from './CacheWatcher';

describe('V2253 CacheWatcher', () => {
  it('should create empty state', () => {
    const s = createCacheWatcherState();
    expect(cacheWatchCount(s)).toBe(0);
  });

  it('should add watch', () => {
    let s = createCacheWatcherState();
    s = addCacheWatch(s, 'w1', 'k1', ['set']);
    expect(cacheWatchCount(s)).toBe(1);
  });

  it('should remove watch', () => {
    let s = createCacheWatcherState();
    s = addCacheWatch(s, 'w1', 'k1', ['set']);
    s = removeCacheWatch(s, 'w1');
    expect(cacheWatchCount(s)).toBe(0);
  });

  it('should fire on matching event', () => {
    let s = createCacheWatcherState();
    s = addCacheWatch(s, 'w1', 'k1', ['set']);
    s = fireCacheWatch(s, 'set', 'k1');
    expect(cacheWatchFireCount(s, 'w1')).toBe(1);
  });

  it('should not fire on non-matching event', () => {
    let s = createCacheWatcherState();
    s = addCacheWatch(s, 'w1', 'k1', ['set']);
    s = fireCacheWatch(s, 'delete', 'k1');
    expect(cacheWatchFireCount(s, 'w1')).toBe(0);
  });

  it('should not fire on non-matching key', () => {
    let s = createCacheWatcherState();
    s = addCacheWatch(s, 'w1', 'k1', ['set']);
    s = fireCacheWatch(s, 'set', 'k2');
    expect(cacheWatchFireCount(s, 'w1')).toBe(0);
  });

  it('should compute health', () => {
    const s = createCacheWatcherState();
    const h = cacheWatcherHealth(s);
    expect(h.health).toBe(0.5);
  });
});
