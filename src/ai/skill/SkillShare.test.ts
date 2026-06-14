import { describe, it, expect } from 'vitest';
import { createSkillShareState, grantSkillShare, revokeSkillShare, skillGrantsForKey, canAccessSkill, skillShareCount, skillShareHealth } from './SkillShare';

describe('V2317 SkillShare', () => {
  it('should create empty state', () => {
    const s = createSkillShareState();
    expect(skillShareCount(s)).toBe(0);
  });

  it('should grant share', () => {
    let s = createSkillShareState();
    s = grantSkillShare(s, 'k1', 'bob', 'private');
    expect(skillShareCount(s)).toBe(1);
  });

  it('should revoke share', () => {
    let s = createSkillShareState();
    s = grantSkillShare(s, 'k1', 'bob', 'private');
    const grantId = s.grants.keys().next().value;
    s = revokeSkillShare(s, grantId);
    expect(skillShareCount(s)).toBe(0);
  });

  it('should get grants for key', () => {
    let s = createSkillShareState();
    s = grantSkillShare(s, 'k1', 'bob', 'private');
    expect(skillGrantsForKey(s, 'k1')).toHaveLength(1);
  });

  it('should check access', () => {
    let s = createSkillShareState();
    s = grantSkillShare(s, 'k1', 'bob', 'private');
    expect(canAccessSkill(s, 'k1', 'bob')).toBe(true);
  });

  it('should deny non-grantee', () => {
    let s = createSkillShareState();
    s = grantSkillShare(s, 'k1', 'bob', 'private');
    expect(canAccessSkill(s, 'k1', 'eve')).toBe(false);
  });

  it('should deny expired', () => {
    let s = createSkillShareState();
    s = grantSkillShare(s, 'k1', 'bob', 'private', 1);
    expect(canAccessSkill(s, 'k1', 'bob', Date.now() + 1000)).toBe(false);
  });

  it('should compute health', () => {
    const s = createSkillShareState();
    const h = skillShareHealth(s);
    expect(h.health).toBe(0.5);
  });
});
