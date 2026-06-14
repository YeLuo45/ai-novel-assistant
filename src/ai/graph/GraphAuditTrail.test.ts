import { describe, it, expect } from 'vitest';
import { createGraphAuditState, appendGraphAudit, verifyGraphChain, graphAuditFor, graphAuditBy, graphAuditHealth } from './GraphAuditTrail';

describe('V2194 GraphAuditTrail', () => {
  it('should create empty audit', () => {
    const s = createGraphAuditState();
    expect(s.entries).toEqual([]);
  });

  it('should append audit', () => {
    let s = createGraphAuditState();
    s = appendGraphAudit(s, 'alice', 'add', 'n1');
    expect(s.entries).toHaveLength(1);
  });

  it('should verify valid chain', () => {
    let s = createGraphAuditState();
    s = appendGraphAudit(s, 'alice', 'add', 'n1');
    s = appendGraphAudit(s, 'bob', 'remove', 'n1');
    expect(verifyGraphChain(s).valid).toBe(true);
  });

  it('should detect broken chain', () => {
    let s = createGraphAuditState();
    s = appendGraphAudit(s, 'alice', 'add', 'n1');
    s = appendGraphAudit(s, 'bob', 'remove', 'n1');
    s = { ...s, entries: s.entries.map((e, i) => i === 0 ? { ...e, prevHash: 'ffffffff' } : e) };
    expect(verifyGraphChain(s).valid).toBe(false);
  });

  it('should query by target', () => {
    let s = createGraphAuditState();
    s = appendGraphAudit(s, 'alice', 'add', 'n1');
    s = appendGraphAudit(s, 'alice', 'add', 'n2');
    expect(graphAuditFor(s, 'n1')).toHaveLength(1);
  });

  it('should query by actor', () => {
    let s = createGraphAuditState();
    s = appendGraphAudit(s, 'alice', 'add', 'n1');
    s = appendGraphAudit(s, 'alice', 'remove', 'n1');
    s = appendGraphAudit(s, 'bob', 'add', 'n2');
    expect(graphAuditBy(s, 'alice')).toHaveLength(2);
  });

  it('should compute health', () => {
    let s = createGraphAuditState();
    s = appendGraphAudit(s, 'alice', 'add', 'n1');
    const h = graphAuditHealth(s);
    expect(h.health).toBe(1);
  });
});
