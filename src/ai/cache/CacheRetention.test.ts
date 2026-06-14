import { describe, it, expect } from 'vitest';
import { createCacheRetentionState, addCacheRetentionPolicy, trackCacheRecord, applyCacheRetention, cacheRetentionHealth } from './CacheRetention';

describe('V2256 CacheRetention', () => {
  it('should create empty state', () => {
    const s = createCacheRetentionState();
    expect(s.policies.size).toBe(0);
  });

  it('should add policy', () => {
    let s = createCacheRetentionState();
    s = addCacheRetentionPolicy(s, { policyId: 'p1', scope: 'k', ttlMs: 1000, action: 'delete' });
    expect(s.policies.size).toBe(1);
  });

  it('should track record', () => {
    let s = createCacheRetentionState();
    s = trackCacheRecord(s, 'k1', 'k');
    expect(s.records.size).toBe(1);
  });

  it('should apply retention', () => {
    let s = createCacheRetentionState();
    s = addCacheRetentionPolicy(s, { policyId: 'p1', scope: 'k', ttlMs: 1, action: 'delete' });
    s = trackCacheRecord(s, 'k1', 'k');
    s = applyCacheRetention(s, Date.now() + 1000);
    expect(s.actionsApplied).toBe(1);
  });

  it('should compute health', () => {
    let s = createCacheRetentionState();
    s = addCacheRetentionPolicy(s, { policyId: 'p1', scope: 'k', ttlMs: 1000, action: 'delete' });
    const h = cacheRetentionHealth(s);
    expect(h.health).toBe(1);
  });
});
