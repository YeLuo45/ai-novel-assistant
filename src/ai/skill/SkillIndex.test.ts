import { describe, it, expect } from 'vitest';
import { createSkillHNSWState, addSkillIndexNode, skillHnswSearch, skillHnswNodeCount, skillHnswIndexHealth } from './SkillIndex';

describe('V2299 SkillIndex', () => {
  it('should create empty state', () => {
    const s = createSkillHNSWState();
    expect(skillHnswNodeCount(s)).toBe(0);
  });

  it('should add node', () => {
    let s = createSkillHNSWState();
    s = addSkillIndexNode(s, 'n1', [1, 0, 0]);
    expect(skillHnswNodeCount(s)).toBe(1);
  });

  it('should set entry point', () => {
    let s = createSkillHNSWState();
    s = addSkillIndexNode(s, 'n1', [1, 0, 0]);
    expect(s.entryPoint).toBe('n1');
  });

  it('should search', () => {
    let s = createSkillHNSWState();
    s = addSkillIndexNode(s, 'n1', [1, 0, 0]);
    s = addSkillIndexNode(s, 'n2', [0, 1, 0]);
    const hits = skillHnswSearch(s, [1, 0, 0], 2);
    expect(hits).toHaveLength(2);
  });

  it('should return empty for empty', () => {
    const s = createSkillHNSWState();
    expect(skillHnswSearch(s, [1, 0, 0])).toEqual([]);
  });

  it('should rank by similarity', () => {
    let s = createSkillHNSWState();
    s = addSkillIndexNode(s, 'a', [1, 0, 0]);
    s = addSkillIndexNode(s, 'b', [0, 1, 0]);
    const hits = skillHnswSearch(s, [1, 0, 0], 2);
    expect(hits[0].id).toBe('a');
  });

  it('should compute health', () => {
    let s = createSkillHNSWState();
    s = addSkillIndexNode(s, 'n1', [1, 0, 0]);
    const h = skillHnswIndexHealth(s);
    expect(h.health).toBe(1);
  });
});
