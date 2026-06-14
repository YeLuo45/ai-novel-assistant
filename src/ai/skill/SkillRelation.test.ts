import { describe, it, expect } from 'vitest';
import { createSkillRelationState, addSkillRelation, relationsFromSkill, relationsToSkill, relationsBySkillKind, skillRelationHealth } from './SkillRelation';

describe('V2302 SkillRelation', () => {
  it('should create empty state', () => {
    const s = createSkillRelationState();
    expect(s.edges).toEqual([]);
  });

  it('should add relation', () => {
    let s = createSkillRelationState();
    s = addSkillRelation(s, 'a', 'b', 'requires');
    expect(s.edges).toHaveLength(1);
  });

  it('should not duplicate', () => {
    let s = createSkillRelationState();
    s = addSkillRelation(s, 'a', 'b', 'requires');
    s = addSkillRelation(s, 'a', 'b', 'requires');
    expect(s.edges).toHaveLength(1);
  });

  it('should query from', () => {
    let s = createSkillRelationState();
    s = addSkillRelation(s, 'a', 'b', 'requires');
    s = addSkillRelation(s, 'a', 'c', 'extends');
    expect(relationsFromSkill(s, 'a')).toHaveLength(2);
  });

  it('should query to', () => {
    let s = createSkillRelationState();
    s = addSkillRelation(s, 'a', 'b', 'requires');
    s = addSkillRelation(s, 'c', 'b', 'requires');
    expect(relationsToSkill(s, 'b')).toHaveLength(2);
  });

  it('should query by kind', () => {
    let s = createSkillRelationState();
    s = addSkillRelation(s, 'a', 'b', 'requires');
    s = addSkillRelation(s, 'a', 'c', 'extends');
    expect(relationsBySkillKind(s, 'requires')).toHaveLength(1);
  });

  it('should compute health', () => {
    let s = createSkillRelationState();
    s = addSkillRelation(s, 'a', 'b', 'requires');
    const h = skillRelationHealth(s);
    expect(h.health).toBe(1);
  });
});
