import { describe, it, expect } from 'vitest';
import { createSkillDelegateState, delegateSkill, revokeSkillDelegation, skillDelegationsTo, canDelegateSkill, skillDelegateCount, skillDelegateHealth } from './SkillDelegate';

describe('V2319 SkillDelegate', () => {
  it('should create empty state', () => {
    const s = createSkillDelegateState();
    expect(skillDelegateCount(s)).toBe(0);
  });

  it('should delegate', () => {
    let s = createSkillDelegateState();
    s = delegateSkill(s, 'alice', 'bob', 'k1', 'read');
    expect(skillDelegateCount(s)).toBe(1);
  });

  it('should revoke', () => {
    let s = createSkillDelegateState();
    s = delegateSkill(s, 'alice', 'bob', 'k1', 'read');
    const delId = s.delegations.keys().next().value;
    s = revokeSkillDelegation(s, delId);
    expect(skillDelegateCount(s)).toBe(0);
  });

  it('should find delegations to', () => {
    let s = createSkillDelegateState();
    s = delegateSkill(s, 'alice', 'bob', 'k1', 'read');
    s = delegateSkill(s, 'eve', 'bob', 'k2', 'write');
    expect(skillDelegationsTo(s, 'bob')).toHaveLength(2);
  });

  it('should check delegation', () => {
    let s = createSkillDelegateState();
    s = delegateSkill(s, 'alice', 'bob', 'k1', 'read');
    expect(canDelegateSkill(s, 'bob', 'k1', 'read')).toBe(true);
  });

  it('should deny wrong scope', () => {
    let s = createSkillDelegateState();
    s = delegateSkill(s, 'alice', 'bob', 'k1', 'read');
    expect(canDelegateSkill(s, 'bob', 'k1', 'write')).toBe(false);
  });

  it('should compute health', () => {
    const s = createSkillDelegateState();
    const h = skillDelegateHealth(s);
    expect(h.health).toBe(0.5);
  });
});
