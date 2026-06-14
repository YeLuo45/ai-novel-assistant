import { describe, it, expect } from 'vitest';
import { createSkillTypeState, setSkillEntry, getSkillEntry, getSkillKind, skillsByKind, countSkillsByKind, skillTypeHealth } from './SkillType';

describe('V2301 SkillType', () => {
  it('should create empty state', () => {
    const s = createSkillTypeState();
    expect(s.entries.size).toBe(0);
  });

  it('should set skill entry', () => {
    let s = createSkillTypeState();
    s = setSkillEntry(s, 'k1', 'x', 'ability');
    expect(getSkillKind(s, 'k1')).toBe('ability');
  });

  it('should get content', () => {
    let s = createSkillTypeState();
    s = setSkillEntry(s, 'k1', 'x', 'ability');
    expect(getSkillEntry(s, 'k1')).toBe('x');
  });

  it('should list by kind', () => {
    let s = createSkillTypeState();
    s = setSkillEntry(s, 'a', 1, 'ability');
    s = setSkillEntry(s, 'b', 2, 'ability');
    s = setSkillEntry(s, 'c', 3, 'knowledge');
    expect(skillsByKind(s, 'ability')).toHaveLength(2);
  });

  it('should count by kind', () => {
    let s = createSkillTypeState();
    s = setSkillEntry(s, 'a', 1, 'ability');
    s = setSkillEntry(s, 'b', 2, 'ability');
    const counts = countSkillsByKind(s);
    expect(counts.ability).toBe(2);
  });

  it('should compute health', () => {
    let s = createSkillTypeState();
    s = setSkillEntry(s, 'k1', 1, 'ability');
    const h = skillTypeHealth(s);
    expect(h.health).toBe(1);
  });
});
