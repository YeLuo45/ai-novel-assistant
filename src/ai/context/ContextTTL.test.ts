import { describe, it, expect } from 'vitest';
import { createContextTTLState, setContextTTL, getContextTTL, isContextExpired, evictContextExpired, extendContextTTL, contextTTLHealth } from './ContextTTL';

describe('V2278 ContextTTL', () => {
  it('should create empty state', () => {
    const s = createContextTTLState();
    expect(s.entries.size).toBe(0);
  });

  it('should set TTL', () => {
    let s = createContextTTLState();
    s = setContextTTL(s, 'k1', 1000);
    expect(s.entries.size).toBe(1);
  });

  it('should get TTL', () => {
    let s = createContextTTLState();
    s = setContextTTL(s, 'k1', 1000);
    expect(getContextTTL(s, 'k1')).toBeGreaterThan(0);
  });

  it('should return 0 for unknown', () => {
    const s = createContextTTLState();
    expect(getContextTTL(s, 'nope')).toBe(0);
  });

  it('should detect expired', () => {
    let s = createContextTTLState();
    s = setContextTTL(s, 'k1', 1);
    expect(isContextExpired(s, 'k1', Date.now() + 1000)).toBe(true);
  });

  it('should evict expired', () => {
    let s = createContextTTLState();
    s = setContextTTL(s, 'k1', 1);
    s = evictContextExpired(s, Date.now() + 1000);
    expect(s.totalExpirations).toBe(1);
  });

  it('should extend TTL', () => {
    let s = createContextTTLState();
    s = setContextTTL(s, 'k1', 1000);
    s = extendContextTTL(s, 'k1', 500);
    expect(s.entries.get('k1')?.ttlMs).toBe(1500);
  });

  it('should compute health', () => {
    let s = createContextTTLState();
    s = setContextTTL(s, 'k1', 1000);
    const h = contextTTLHealth(s);
    expect(h.health).toBe(1);
  });
});
