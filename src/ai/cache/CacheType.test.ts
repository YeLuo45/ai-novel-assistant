import { describe, it, expect } from 'vitest';
import { createCacheTypeState, setTypedCache, getTypedCache, getEntryType, entriesByType, countByType, cacheTypeHealth } from './CacheType';

describe('V2242 CacheType', () => {
  it('should create empty state', () => {
    const s = createCacheTypeState();
    expect(s.entries.size).toBe(0);
  });

  it('should set typed entry', () => {
    let s = createCacheTypeState();
    s = setTypedCache(s, 'k1', { x: 1 }, 'json');
    expect(getEntryType(s, 'k1')).toBe('json');
  });

  it('should get value', () => {
    let s = createCacheTypeState();
    s = setTypedCache(s, 'k1', 'hello', 'string');
    expect(getTypedCache(s, 'k1')).toBe('hello');
  });

  it('should list by type', () => {
    let s = createCacheTypeState();
    s = setTypedCache(s, 'a', 1, 'string');
    s = setTypedCache(s, 'b', 2, 'string');
    s = setTypedCache(s, 'c', { x: 1 }, 'json');
    expect(entriesByType(s, 'string')).toHaveLength(2);
  });

  it('should count by type', () => {
    let s = createCacheTypeState();
    s = setTypedCache(s, 'a', 1, 'string');
    s = setTypedCache(s, 'b', 2, 'string');
    const counts = countByType(s);
    expect(counts.string).toBe(2);
  });

  it('should compute health', () => {
    let s = createCacheTypeState();
    s = setTypedCache(s, 'k1', 'v1', 'string');
    const h = cacheTypeHealth(s);
    expect(h.health).toBe(1);
  });
});
