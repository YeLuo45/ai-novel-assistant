import { describe, it, expect } from 'vitest';
import { createCacheTTLState, setTTL, getTTL, isExpired, evictExpired, extendTTL, cacheTTLHealth } from './CacheTTL';

describe('V2248 CacheTTL', () => {
  it('should create empty state', () => {
    const s = createCacheTTLState();
    expect(s.entries.size).toBe(0);
  });

  it('should set TTL', () => {
    let s = createCacheTTLState();
    s = setTTL(s, 'k1', 1000);
    expect(s.entries.size).toBe(1);
  });

  it('should get TTL', () => {
    let s = createCacheTTLState();
    s = setTTL(s, 'k1', 1000);
    expect(getTTL(s, 'k1')).toBeGreaterThan(0);
  });

  it('should return 0 for unknown', () => {
    const s = createCacheTTLState();
    expect(getTTL(s, 'nope')).toBe(0);
  });

  it('should detect expired', () => {
    let s = createCacheTTLState();
    s = setTTL(s, 'k1', 1);
    expect(isExpired(s, 'k1', Date.now() + 1000)).toBe(true);
  });

  it('should evict expired', () => {
    let s = createCacheTTLState();
    s = setTTL(s, 'k1', 1);
    s = evictExpired(s, Date.now() + 1000);
    expect(s.totalExpirations).toBe(1);
  });

  it('should extend TTL', () => {
    let s = createCacheTTLState();
    s = setTTL(s, 'k1', 1000);
    s = extendTTL(s, 'k1', 500);
    expect(s.entries.get('k1')?.ttlMs).toBe(1500);
  });

  it('should compute health', () => {
    let s = createCacheTTLState();
    s = setTTL(s, 'k1', 1000);
    const h = cacheTTLHealth(s);
    expect(h.health).toBe(1);
  });
});
