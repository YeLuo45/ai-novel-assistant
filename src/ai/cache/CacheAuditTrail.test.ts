import { describe, it, expect } from 'vitest';
import { createCacheAuditState, appendCacheAudit, verifyCacheChain, cacheAuditFor, cacheAuditHealth } from './CacheAuditTrail';

describe('V2254 CacheAuditTrail', () => {
  it('should create empty audit', () => {
    const s = createCacheAuditState();
    expect(s.entries).toEqual([]);
  });

  it('should append audit', () => {
    let s = createCacheAuditState();
    s = appendCacheAudit(s, 'alice', 'set', 'k1');
    expect(s.entries).toHaveLength(1);
  });

  it('should verify valid chain', () => {
    let s = createCacheAuditState();
    s = appendCacheAudit(s, 'alice', 'set', 'k1');
    s = appendCacheAudit(s, 'bob', 'delete', 'k1');
    expect(verifyCacheChain(s).valid).toBe(true);
  });

  it('should detect broken chain', () => {
    let s = createCacheAuditState();
    s = appendCacheAudit(s, 'alice', 'set', 'k1');
    s = appendCacheAudit(s, 'bob', 'delete', 'k1');
    s = { ...s, entries: s.entries.map((e, i) => i === 0 ? { ...e, prevHash: 'ffffffff' } : e) };
    expect(verifyCacheChain(s).valid).toBe(false);
  });

  it('should query by key', () => {
    let s = createCacheAuditState();
    s = appendCacheAudit(s, 'alice', 'set', 'k1');
    s = appendCacheAudit(s, 'alice', 'set', 'k2');
    expect(cacheAuditFor(s, 'k1')).toHaveLength(1);
  });

  it('should compute health', () => {
    let s = createCacheAuditState();
    s = appendCacheAudit(s, 'alice', 'set', 'k1');
    const h = cacheAuditHealth(s);
    expect(h.health).toBe(1);
  });
});
