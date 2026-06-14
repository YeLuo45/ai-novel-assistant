import { describe, it, expect } from 'vitest';
import { createCacheShareState, grantCacheShare, revokeCacheShare, cacheGrantsForKey, canAccessCache, cacheShareCount, cacheShareHealth } from './CacheShare';

describe('V2257 CacheShare', () => {
  it('should create empty state', () => {
    const s = createCacheShareState();
    expect(cacheShareCount(s)).toBe(0);
  });

  it('should grant share', () => {
    let s = createCacheShareState();
    s = grantCacheShare(s, 'k1', 'bob', 'private');
    expect(cacheShareCount(s)).toBe(1);
  });

  it('should revoke share', () => {
    let s = createCacheShareState();
    s = grantCacheShare(s, 'k1', 'bob', 'private');
    const grantId = s.grants.keys().next().value;
    s = revokeCacheShare(s, grantId);
    expect(cacheShareCount(s)).toBe(0);
  });

  it('should get grants for key', () => {
    let s = createCacheShareState();
    s = grantCacheShare(s, 'k1', 'bob', 'private');
    expect(cacheGrantsForKey(s, 'k1')).toHaveLength(1);
  });

  it('should check access', () => {
    let s = createCacheShareState();
    s = grantCacheShare(s, 'k1', 'bob', 'private');
    expect(canAccessCache(s, 'k1', 'bob')).toBe(true);
  });

  it('should deny non-grantee', () => {
    let s = createCacheShareState();
    s = grantCacheShare(s, 'k1', 'bob', 'private');
    expect(canAccessCache(s, 'k1', 'eve')).toBe(false);
  });

  it('should deny expired', () => {
    let s = createCacheShareState();
    s = grantCacheShare(s, 'k1', 'bob', 'private', 1);
    expect(canAccessCache(s, 'k1', 'bob', Date.now() + 1000)).toBe(false);
  });

  it('should compute health', () => {
    const s = createCacheShareState();
    const h = cacheShareHealth(s);
    expect(h.health).toBe(0.5);
  });
});
