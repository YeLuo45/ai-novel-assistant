import { describe, it, expect } from 'vitest';
import { createSkillVersioningState, commitSkillVersion, skillVersionsForKey, latestSkillVersion, skillVersionDiff, skillVersioningHealth } from './SkillVersioning';

describe('V2309 SkillVersioning', () => {
  it('should create empty state', () => {
    const s = createSkillVersioningState();
    expect(s.versions).toEqual([]);
  });

  it('should commit version', () => {
    let s = createSkillVersioningState();
    s = commitSkillVersion(s, 'k1', 'v1', 'alice', 'init');
    expect(s.versions).toHaveLength(1);
  });

  it('should query by key', () => {
    let s = createSkillVersioningState();
    s = commitSkillVersion(s, 'k1', 'v1', 'alice', 'init');
    s = commitSkillVersion(s, 'k1', 'v2', 'alice', 'update');
    expect(skillVersionsForKey(s, 'k1')).toHaveLength(2);
  });

  it('should get latest', () => {
    let s = createSkillVersioningState();
    s = commitSkillVersion(s, 'k1', 'v1', 'alice', 'init');
    s = commitSkillVersion(s, 'k1', 'v2', 'alice', 'update');
    expect(latestSkillVersion(s, 'k1')?.content).toBe('v2');
  });

  it('should return undefined for unknown', () => {
    const s = createSkillVersioningState();
    expect(latestSkillVersion(s, 'nope')).toBeUndefined();
  });

  it('should diff versions', () => {
    let s = createSkillVersioningState();
    const a = commitSkillVersion(s, 'k1', 'v1', 'alice', 'init');
    s = a;
    const b = commitSkillVersion(s, 'k1', 'v2', 'alice', 'update');
    s = b;
    const va = skillVersionsForKey(s, 'k1')[0].verId;
    const vb = skillVersionsForKey(s, 'k1')[1].verId;
    const d = skillVersionDiff(s, 'k1', va, vb);
    expect(d?.from.content).toBe('v1');
  });

  it('should return null for missing diff', () => {
    const s = createSkillVersioningState();
    expect(skillVersionDiff(s, 'k1', 'a', 'b')).toBe(null);
  });

  it('should compute health', () => {
    let s = createSkillVersioningState();
    s = commitSkillVersion(s, 'k1', 'v1', 'alice', 'init');
    const h = skillVersioningHealth(s);
    expect(h.health).toBe(1);
  });
});
