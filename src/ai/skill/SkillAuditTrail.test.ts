import { describe, it, expect } from 'vitest';
import { createSkillAuditState, appendSkillAudit, verifySkillChain, skillAuditFor, skillAuditHealth } from './SkillAuditTrail';

describe('V2314 SkillAuditTrail', () => {
  it('should create empty audit', () => {
    const s = createSkillAuditState();
    expect(s.entries).toEqual([]);
  });

  it('should append audit', () => {
    let s = createSkillAuditState();
    s = appendSkillAudit(s, 'alice', 'create', 'k1');
    expect(s.entries).toHaveLength(1);
  });

  it('should verify valid chain', () => {
    let s = createSkillAuditState();
    s = appendSkillAudit(s, 'alice', 'create', 'k1');
    s = appendSkillAudit(s, 'bob', 'retire', 'k1');
    expect(verifySkillChain(s).valid).toBe(true);
  });

  it('should detect broken chain', () => {
    let s = createSkillAuditState();
    s = appendSkillAudit(s, 'alice', 'create', 'k1');
    s = appendSkillAudit(s, 'bob', 'retire', 'k1');
    s = { ...s, entries: s.entries.map((e, i) => i === 0 ? { ...e, prevHash: 'ffffffff' } : e) };
    expect(verifySkillChain(s).valid).toBe(false);
  });

  it('should query by key', () => {
    let s = createSkillAuditState();
    s = appendSkillAudit(s, 'alice', 'create', 'k1');
    s = appendSkillAudit(s, 'alice', 'create', 'k2');
    expect(skillAuditFor(s, 'k1')).toHaveLength(1);
  });

  it('should compute health', () => {
    let s = createSkillAuditState();
    s = appendSkillAudit(s, 'alice', 'create', 'k1');
    const h = skillAuditHealth(s);
    expect(h.health).toBe(1);
  });
});
