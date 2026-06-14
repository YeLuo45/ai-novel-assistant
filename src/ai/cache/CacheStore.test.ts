import { describe, it, expect } from 'vitest';
import { createCacheStoreState, cacheSet, cacheGet, cacheDelete, cacheHas, cacheSize, totalBytes, cacheStoreHealth } from './CacheStore';

describe('V2237 CacheStore', () => {
  it('should create empty store', () => {
    const s = createCacheStoreState();
    expect(cacheSize(s)).toBe(0);
  });

  it('should set value', () => {
    let s = createCacheStoreState();
    s = cacheSet(s, 'k1', 'v1');
    expect(s.totalSets).toBe(1);
  });

  it('should get value (hit)', () => {
    let s = createCacheStoreState();
    s = cacheSet(s, 'k1', 'v1');
    s = cacheGet(s, 'k1');
    expect(s.totalHits).toBe(1);
  });

  it('should get miss', () => {
    let s = createCacheStoreState();
    s = cacheGet(s, 'nope');
    expect(s.totalMisses).toBe(1);
  });

  it('should delete', () => {
    let s = createCacheStoreState();
    s = cacheSet(s, 'k1', 'v1');
    s = cacheDelete(s, 'k1');
    expect(cacheSize(s)).toBe(0);
  });

  it('should check has', () => {
    let s = createCacheStoreState();
    s = cacheSet(s, 'k1', 'v1');
    expect(cacheHas(s, 'k1')).toBe(true);
  });

  it('should not have unknown', () => {
    const s = createCacheStoreState();
    expect(cacheHas(s, 'nope')).toBe(false);
  });

  it('should compute total bytes', () => {
    let s = createCacheStoreState();
    s = cacheSet(s, 'k1', { a: 1 });
    expect(totalBytes(s)).toBeGreaterThan(0);
  });

  it('should compute health', () => {
    let s = createCacheStoreState();
    s = cacheSet(s, 'k1', 'v1');
    s = cacheGet(s, 'k1');
    const h = cacheStoreHealth(s);
    expect(h.hitRate).toBe(1);
  });
});
