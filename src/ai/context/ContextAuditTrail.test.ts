import { describe, it, expect } from 'vitest';
import { createContextAuditState, appendContextAudit, verifyContextChain, contextAuditFor, contextAuditHealth } from './ContextAuditTrail';

describe('V2284 ContextAuditTrail', () => {
  it('should create empty audit', () => {
    const s = createContextAuditState();
    expect(s.entries).toEqual([]);
  });

  it('should append audit', () => {
    let s = createContextAuditState();
    s = appendContextAudit(s, 'alice', 'add', 'k1');
    expect(s.entries).toHaveLength(1);
  });

  it('should verify valid chain', () => {
    let s = createContextAuditState();
    s = appendContextAudit(s, 'alice', 'add', 'k1');
    s = appendContextAudit(s, 'bob', 'delete', 'k1');
    expect(verifyContextChain(s).valid).toBe(true);
  });

  it('should detect broken chain', () => {
    let s = createContextAuditState();
    s = appendContextAudit(s, 'alice', 'add', 'k1');
    s = appendContextAudit(s, 'bob', 'delete', 'k1');
    s = { ...s, entries: s.entries.map((e, i) => i === 0 ? { ...e, prevHash: 'ffffffff' } : e) };
    expect(verifyContextChain(s).valid).toBe(false);
  });

  it('should query by key', () => {
    let s = createContextAuditState();
    s = appendContextAudit(s, 'alice', 'add', 'k1');
    s = appendContextAudit(s, 'alice', 'add', 'k2');
    expect(contextAuditFor(s, 'k1')).toHaveLength(1);
  });

  it('should compute health', () => {
    let s = createContextAuditState();
    s = appendContextAudit(s, 'alice', 'add', 'k1');
    const h = contextAuditHealth(s);
    expect(h.health).toBe(1);
  });
});
