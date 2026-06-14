import { describe, it, expect } from 'vitest';
import { createCacheLifecycleState, birthCacheEntry, activateCacheEntry, staleCacheEntry, expireCacheEntry, autoCacheTransition, cacheLifecycleHealth } from './CacheLifecycle';

describe('V2251 CacheLifecycle', () => {
  it('should create empty state', () => {
    const s = createCacheLifecycleState();
    expect(s.entries.size).toBe(0);
  });

  it('should birth entry', () => {
    let s = createCacheLifecycleState();
    s = birthCacheEntry(s, 'k1');
    expect(s.entries.size).toBe(1);
  });

  it('should activate entry', () => {
    let s = createCacheLifecycleState();
    s = birthCacheEntry(s, 'k1');
    s = activateCacheEntry(s, 'k1');
    expect(s.entries.get('k1')?.phase).toBe('active');
  });

  it('should stale entry', () => {
    let s = createCacheLifecycleState();
    s = birthCacheEntry(s, 'k1');
    s = staleCacheEntry(s, 'k1');
    expect(s.entries.get('k1')?.phase).toBe('stale');
  });

  it('should expire entry', () => {
    let s = createCacheLifecycleState();
    s = birthCacheEntry(s, 'k1');
    s = expireCacheEntry(s, 'k1');
    expect(s.entries.get('k1')?.phase).toBe('expired');
  });

  it('should auto-transition', () => {
    let s = createCacheLifecycleState();
    s = birthCacheEntry(s, 'k1', 1);
    s = autoCacheTransition(s, Date.now() + 1000);
    expect(s.entries.get('k1')?.phase).toBe('expired');
  });

  it('should compute health', () => {
    let s = createCacheLifecycleState();
    s = birthCacheEntry(s, 'k1');
    s = activateCacheEntry(s, 'k1');
    const h = cacheLifecycleHealth(s);
    expect(h.active).toBe(1);
  });
});
