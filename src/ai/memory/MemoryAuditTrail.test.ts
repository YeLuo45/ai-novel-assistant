import { describe, it, expect } from 'vitest';
import { createMemoryAuditState, appendAudit, verifyChain, getAuditFor, getAuditBy, memoryAuditHealth } from './MemoryAuditTrail';

describe('V2164 MemoryAuditTrail', () => {
  it('should create empty audit', () => {
    const s = createMemoryAuditState();
    expect(s.entries).toEqual([]);
  });

  it('should append audit entry', () => {
    let s = createMemoryAuditState();
    s = appendAudit(s, 'alice', 'create', 'm1');
    expect(s.entries).toHaveLength(1);
  });

  it('should verify valid chain', () => {
    let s = createMemoryAuditState();
    s = appendAudit(s, 'alice', 'create', 'm1');
    s = appendAudit(s, 'bob', 'update', 'm1');
    const v = verifyChain(s);
    expect(v.valid).toBe(true);
  });

  it('should detect broken chain', () => {
    let s = createMemoryAuditState();
    s = appendAudit(s, 'alice', 'create', 'm1');
    s = appendAudit(s, 'bob', 'update', 'm1');
    // Tamper with first entry's prevHash
    const newEntries = s.entries.map((e, i) => i === 0 ? { ...e, prevHash: 'ffffffff' } : e);
    s = { ...s, entries: newEntries };
    const v = verifyChain(s);
    expect(v.valid).toBe(false);
  });

  it('should query audit for memory', () => {
    let s = createMemoryAuditState();
    s = appendAudit(s, 'alice', 'create', 'm1');
    s = appendAudit(s, 'bob', 'create', 'm2');
    expect(getAuditFor(s, 'm1')).toHaveLength(1);
  });

  it('should query audit by actor', () => {
    let s = createMemoryAuditState();
    s = appendAudit(s, 'alice', 'create', 'm1');
    s = appendAudit(s, 'alice', 'create', 'm2');
    s = appendAudit(s, 'bob', 'create', 'm3');
    expect(getAuditBy(s, 'alice')).toHaveLength(2);
  });

  it('should compute health', () => {
    let s = createMemoryAuditState();
    s = appendAudit(s, 'alice', 'create', 'm1');
    const h = memoryAuditHealth(s);
    expect(h.chainValid).toBe(true);
    expect(h.health).toBe(1);
  });
});
