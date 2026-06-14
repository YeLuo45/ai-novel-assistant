import { describe, it, expect } from 'vitest';
import { createCacheQuotaState, setCacheQuota, consumeCacheQuota, releaseCacheQuota, cacheQuotaFor, cacheQuotaHealth } from './CacheQuota';

describe('V2255 CacheQuota', () => {
  it('should create empty state', () => {
    const s = createCacheQuotaState();
    expect(s.quotas.size).toBe(0);
  });

  it('should set quota', () => {
    let s = createCacheQuotaState();
    s = setCacheQuota(s, 'u1', 1000);
    expect(s.quotas.size).toBe(1);
  });

  it('should update existing', () => {
    let s = createCacheQuotaState();
    s = setCacheQuota(s, 'u1', 1000);
    s = setCacheQuota(s, 'u1', 2000);
    expect(cacheQuotaFor(s, 'u1')?.bytesLimit).toBe(2000);
  });

  it('should consume within limit', () => {
    let s = createCacheQuotaState();
    s = setCacheQuota(s, 'u1', 1000);
    s = consumeCacheQuota(s, 'u1', 500).state;
    expect(cacheQuotaFor(s, 'u1')?.used).toBe(500);
  });

  it('should deny over limit', () => {
    let s = createCacheQuotaState();
    s = setCacheQuota(s, 'u1', 100);
    const r = consumeCacheQuota(s, 'u1', 200);
    expect(r.ok).toBe(false);
  });

  it('should release quota', () => {
    let s = createCacheQuotaState();
    s = setCacheQuota(s, 'u1', 1000);
    s = consumeCacheQuota(s, 'u1', 500).state;
    s = releaseCacheQuota(s, 'u1', 200);
    expect(cacheQuotaFor(s, 'u1')?.used).toBe(300);
  });

  it('should compute health', () => {
    let s = createCacheQuotaState();
    s = setCacheQuota(s, 'u1', 1000);
    s = consumeCacheQuota(s, 'u1', 100).state;
    const h = cacheQuotaHealth(s);
    expect(h.health).toBe(1);
  });
});
