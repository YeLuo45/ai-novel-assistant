import { describe, it, expect } from 'vitest';
import { createSkillEncoderState, encodeSkill, getEncodedSkill, skillCount, skillsByFormat, skillEncoderHealth } from './SkillEncoder';

describe('V2296 SkillEncoder', () => {
  it('should create empty state', () => {
    const s = createSkillEncoderState();
    expect(skillCount(s)).toBe(0);
  });

  it('should encode skill', () => {
    const s = createSkillEncoderState();
    const { skill } = encodeSkill(s, '# Hello', 'markdown');
    expect(skill.hash).toHaveLength(8);
    expect(skill.tokens).toBeGreaterThan(0);
  });

  it('should get encoded skill', () => {
    const s = createSkillEncoderState();
    const { skill, state } = encodeSkill(s, '# Hello', 'markdown');
    expect(getEncodedSkill(state, '# Hello')?.hash).toBe(skill.hash);
  });

  it('should return undefined for unknown', () => {
    const s = createSkillEncoderState();
    expect(getEncodedSkill(s, 'nope')).toBeUndefined();
  });

  it('should query by format', () => {
    let s = createSkillEncoderState();
    s = encodeSkill(s, 'a', 'markdown').state;
    s = encodeSkill(s, 'b', 'code').state;
    expect(skillsByFormat(s, 'markdown')).toHaveLength(1);
  });

  it('should compute health', () => {
    let s = createSkillEncoderState();
    s = encodeSkill(s, 'a', 'markdown').state;
    const h = skillEncoderHealth(s);
    expect(h.health).toBe(1);
  });
});
