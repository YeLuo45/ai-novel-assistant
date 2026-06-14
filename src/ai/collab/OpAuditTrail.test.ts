import { describe, it, expect } from 'vitest';
import { createOpAuditState, appendOpAudit, verifyOpChain, opAuditFor, opAuditBy, opAuditHealth } from './OpAuditTrail';

describe('V2224 OpAuditTrail', () => {
  it('should create empty audit', () => {
    const s = createOpAuditState();
    expect(s.entries).toEqual([]);
  });

  it('should append audit', () => {
    let s = createOpAuditState();
    s = appendOpAudit(s, 'alice', 'enqueue', 'op1');
    expect(s.entries).toHaveLength(1);
  });

  it('should verify valid chain', () => {
    let s = createOpAuditState();
    s = appendOpAudit(s, 'alice', 'enqueue', 'op1');
    s = appendOpAudit(s, 'bob', 'apply', 'op1');
    expect(verifyOpChain(s).valid).toBe(true);
  });

  it('should detect broken chain', () => {
    let s = createOpAuditState();
    s = appendOpAudit(s, 'alice', 'enqueue', 'op1');
    s = appendOpAudit(s, 'bob', 'apply', 'op1');
    s = { ...s, entries: s.entries.map((e, i) => i === 0 ? { ...e, prevHash: 'ffffffff' } : e) };
    expect(verifyOpChain(s).valid).toBe(false);
  });

  it('should query by opId', () => {
    let s = createOpAuditState();
    s = appendOpAudit(s, 'alice', 'enqueue', 'op1');
    s = appendOpAudit(s, 'alice', 'enqueue', 'op2');
    expect(opAuditFor(s, 'op1')).toHaveLength(1);
  });

  it('should query by actor', () => {
    let s = createOpAuditState();
    s = appendOpAudit(s, 'alice', 'enqueue', 'op1');
    s = appendOpAudit(s, 'bob', 'enqueue', 'op2');
    expect(opAuditBy(s, 'alice')).toHaveLength(1);
  });

  it('should compute health', () => {
    let s = createOpAuditState();
    s = appendOpAudit(s, 'alice', 'enqueue', 'op1');
    const h = opAuditHealth(s);
    expect(h.health).toBe(1);
  });
});
