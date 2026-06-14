import { describe, it, expect } from 'vitest';
import { createCacheLookupState, putCacheEntry, getCacheEntry, getKeysByPrefix, removeCacheEntry, prefixCount, cacheLookupHealth } from './CacheLookup';

describe('V2238 CacheLookup', () => {
  it('should create empty state', () => {
    const s = createCacheLookupState();
    expect(prefixCount(s)).toBe(0);
  });

  it('should put entry', () => {
    let s = createCacheLookupState();
    s = putCacheEntry(s, 'user.1', 'alice');
    expect(getCacheEntry(s, 'user.1')).toBe('alice');
  });

  it('should query by prefix', () => {
    let s = createCacheLookupState();
    s = putCacheEntry(s, 'user.1', 'a');
    s = putCacheEntry(s, 'user.2', 'b');
    s = putCacheEntry(s, 'post.1', 'x');
    expect(getKeysByPrefix(s, 'user')).toHaveLength(2);
  });

  it('should remove entry', () => {
    let s = createCacheLookupState();
    s = putCacheEntry(s, 'user.1', 'a');
    s = removeCacheEntry(s, 'user.1');
    expect(getCacheEntry(s, 'user.1')).toBeUndefined();
  });

  it('should remove prefix when empty', () => {
    let s = createCacheLookupState();
    s = putCacheEntry(s, 'user.1', 'a');
    s = removeCacheEntry(s, 'user.1');
    expect(prefixCount(s)).toBe(0);
  });

  it('should return empty for unknown prefix', () => {
    const s = createCacheLookupState();
    expect(getKeysByPrefix(s, 'unknown')).toEqual([]);
  });

  it('should compute health', () => {
    let s = createCacheLookupState();
    s = putCacheEntry(s, 'k1', 'v1');
    const h = cacheLookupHealth(s);
    expect(h.health).toBe(1);
  });
});
