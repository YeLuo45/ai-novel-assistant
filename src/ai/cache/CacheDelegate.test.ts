import { describe, it, expect } from 'vitest';
import { createCacheDelegateState, delegateCache, revokeCacheDelegation, cacheDelegationsTo, canDelegateCache, cacheDelegateCount, cacheDelegateHealth } from './CacheDelegate';

describe('V2259 CacheDelegate', () => {
  it('should create empty state', () => {
    const s = createCacheDelegateState();
    expect(cacheDelegateCount(s)).toBe(0);
  });

  it('should delegate', () => {
    let s = createCacheDelegateState();
    s = delegateCache(s, 'alice', 'bob', 'k1', 'read');
    expect(cacheDelegateCount(s)).toBe(1);
  });

  it('should revoke', () => {
    let s = createCacheDelegateState();
    s = delegateCache(s, 'alice', 'bob', 'k1', 'read');
    const delId = s.delegations.keys().next().value;
    s = revokeCacheDelegation(s, delId);
    expect(cacheDelegateCount(s)).toBe(0);
  });

  it('should find delegations to', () => {
    let s = createCacheDelegateState();
    s = delegateCache(s, 'alice', 'bob', 'k1', 'read');
    s = delegateCache(s, 'eve', 'bob', 'k2', 'write');
    expect(cacheDelegationsTo(s, 'bob')).toHaveLength(2);
  });

  it('should check delegation', () => {
    let s = createCacheDelegateState();
    s = delegateCache(s, 'alice', 'bob', 'k1', 'read');
    expect(canDelegateCache(s, 'bob', 'k1', 'read')).toBe(true);
  });

  it('should deny wrong scope', () => {
    let s = createCacheDelegateState();
    s = delegateCache(s, 'alice', 'bob', 'k1', 'read');
    expect(canDelegateCache(s, 'bob', 'k1', 'write')).toBe(false);
  });

  it('should compute health', () => {
    const s = createCacheDelegateState();
    const h = cacheDelegateHealth(s);
    expect(h.health).toBe(0.5);
  });
});
