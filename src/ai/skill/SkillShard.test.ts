import { describe, it, expect } from 'vitest';
import { createSkillShardState, addSkillShard, removeSkillShard, routeSkillKey, skillShardCount, skillShardHealth } from './SkillShard';

describe('V2304 SkillShard', () => {
  it('should create empty state', () => {
    const s = createSkillShardState();
    expect(skillShardCount(s)).toBe(0);
  });

  it('should add shard', () => {
    let s = createSkillShardState();
    s = addSkillShard(s, 's1');
    expect(skillShardCount(s)).toBe(1);
  });

  it('should not duplicate', () => {
    let s = createSkillShardState();
    s = addSkillShard(s, 's1');
    s = addSkillShard(s, 's1');
    expect(skillShardCount(s)).toBe(1);
  });

  it('should remove shard', () => {
    let s = createSkillShardState();
    s = addSkillShard(s, 's1');
    s = addSkillShard(s, 's2');
    s = removeSkillShard(s, 's1');
    expect(skillShardCount(s)).toBe(1);
  });

  it('should return null for empty', () => {
    expect(routeSkillKey(createSkillShardState(), 'k')).toBe(null);
  });

  it('should route', () => {
    let s = createSkillShardState();
    s = addSkillShard(s, 'a');
    s = addSkillShard(s, 'b');
    expect(routeSkillKey(s, 'my-key')).not.toBe(null);
  });

  it('should route consistently', () => {
    let s = createSkillShardState();
    s = addSkillShard(s, 'a');
    s = addSkillShard(s, 'b');
    expect(routeSkillKey(s, 'same')).toBe(routeSkillKey(s, 'same'));
  });

  it('should compute health', () => {
    let s = createSkillShardState();
    s = addSkillShard(s, 's1');
    const h = skillShardHealth(s);
    expect(h.health).toBe(1);
  });
});
