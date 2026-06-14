import { describe, it, expect } from 'vitest';
import { createSkillReflectorState, reflectOnSkill, skillReflectionsForPeriod, avgSkillEffectiveness, lowEffectivenessPeriods, skillReflectorHealth } from './SkillReflector';

describe('V2322 SkillReflector', () => {
  it('should create empty state', () => {
    const s = createSkillReflectorState();
    expect(s.reflections.size).toBe(0);
  });

  it('should reflect', () => {
    let s = createSkillReflectorState();
    s = reflectOnSkill(s, 'p1', 0.7, ['good']);
    expect(s.reflections.size).toBe(1);
  });

  it('should query by period', () => {
    let s = createSkillReflectorState();
    s = reflectOnSkill(s, 'p1', 0.5, []);
    s = reflectOnSkill(s, 'p2', 0.7, []);
    expect(skillReflectionsForPeriod(s, 'p1')).toHaveLength(1);
  });

  it('should compute avg effectiveness', () => {
    let s = createSkillReflectorState();
    s = reflectOnSkill(s, 'p1', 0.4, []);
    s = reflectOnSkill(s, 'p1', 0.6, []);
    expect(avgSkillEffectiveness(s, 'p1')).toBeCloseTo(0.5);
  });

  it('should find low-effectiveness periods', () => {
    let s = createSkillReflectorState();
    s = reflectOnSkill(s, 'p1', 0.1, []);
    s = reflectOnSkill(s, 'p2', 0.9, []);
    expect(lowEffectivenessPeriods(s, 0.3)).toEqual(['p1']);
  });

  it('should compute health', () => {
    let s = createSkillReflectorState();
    s = reflectOnSkill(s, 'p1', 0.5, []);
    const h = skillReflectorHealth(s);
    expect(h.health).toBe(1);
  });
});
