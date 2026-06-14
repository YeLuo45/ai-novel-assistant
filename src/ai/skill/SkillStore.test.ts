import { describe, it, expect } from 'vitest';
import { createSkillStoreState, skillSet, skillGet, skillDelete, skillHas, skillSize, totalSkillTokens, skillStoreHealth } from './SkillStore';

describe('V2297 SkillStore', () => {
  it('should create empty store', () => {
    const s = createSkillStoreState();
    expect(skillSize(s)).toBe(0);
  });

  it('should set skill', () => {
    let s = createSkillStoreState();
    s = skillSet(s, 'k1', '# Hello', 'markdown');
    expect(s.totalSets).toBe(1);
  });

  it('should get skill (hit)', () => {
    let s = createSkillStoreState();
    s = skillSet(s, 'k1', '# Hello', 'markdown');
    s = skillGet(s, 'k1');
    expect(s.totalHits).toBe(1);
  });

  it('should get miss', () => {
    let s = createSkillStoreState();
    s = skillGet(s, 'nope');
    expect(s.totalMisses).toBe(1);
  });

  it('should delete', () => {
    let s = createSkillStoreState();
    s = skillSet(s, 'k1', 'x', 'plain');
    s = skillDelete(s, 'k1');
    expect(skillSize(s)).toBe(0);
  });

  it('should check has', () => {
    let s = createSkillStoreState();
    s = skillSet(s, 'k1', 'x', 'plain');
    expect(skillHas(s, 'k1')).toBe(true);
  });

  it('should total tokens', () => {
    let s = createSkillStoreState();
    s = skillSet(s, 'k1', '# Hello world', 'markdown');
    expect(totalSkillTokens(s)).toBeGreaterThan(0);
  });

  it('should compute health', () => {
    let s = createSkillStoreState();
    s = skillSet(s, 'k1', 'x', 'plain');
    s = skillGet(s, 'k1');
    const h = skillStoreHealth(s);
    expect(h.hitRate).toBe(1);
  });
});
