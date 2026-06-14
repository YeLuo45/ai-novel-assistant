import { describe, it, expect } from 'vitest';
import { createSkillEvolverState, observeSkillPattern, detectSkillEvolution, skillEvolutionEventsByKind, skillEvolutionEventCount, skillEvolverHealth } from './SkillEvolver';

describe('V2323 SkillEvolver', () => {
  it('should create empty state', () => {
    const s = createSkillEvolverState();
    expect(s.events).toEqual([]);
  });

  it('should observe pattern', () => {
    let s = createSkillEvolverState();
    s = observeSkillPattern(s, 'p1', ['newSkill'], ['a,b']);
    expect(s.patterns.size).toBe(1);
  });

  it('should accumulate', () => {
    let s = createSkillEvolverState();
    s = observeSkillPattern(s, 'p1', [], []);
    s = observeSkillPattern(s, 'p1', [], []);
    expect(s.patterns.get('p1')?.observations).toBe(2);
  });

  it('should detect add_skill', () => {
    let s = createSkillEvolverState();
    for (let i = 0; i < 5; i++) s = observeSkillPattern(s, 'p1', ['newSkill'], []);
    s = detectSkillEvolution(s, 5);
    expect(skillEvolutionEventsByKind(s, 'add_skill').length).toBeGreaterThan(0);
  });

  it('should detect merge_skill', () => {
    let s = createSkillEvolverState();
    for (let i = 0; i < 5; i++) s = observeSkillPattern(s, 'p1', [], ['a,b']);
    s = detectSkillEvolution(s, 5);
    expect(skillEvolutionEventsByKind(s, 'merge_skill').length).toBeGreaterThan(0);
  });

  it('should not detect below threshold', () => {
    let s = createSkillEvolverState();
    s = observeSkillPattern(s, 'p1', ['newSkill'], []);
    s = detectSkillEvolution(s, 5);
    expect(skillEvolutionEventCount(s)).toBe(0);
  });

  it('should compute health', () => {
    let s = createSkillEvolverState();
    s = observeSkillPattern(s, 'p1', ['a'], []);
    const h = skillEvolverHealth(s);
    expect(h.health).toBe(0.5);
  });
});
