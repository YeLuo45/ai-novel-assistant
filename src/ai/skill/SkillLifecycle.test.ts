import { describe, it, expect } from 'vitest';
import { createSkillLifecycleState, birthSkillEntry, reviewSkillEntry, publishSkillEntry, retireSkillEntry, deprecateSkillEntry, countSkillPhases, skillLifecycleHealth } from './SkillLifecycle';

describe('V2311 SkillLifecycle', () => {
  it('should create empty state', () => {
    const s = createSkillLifecycleState();
    expect(s.entries.size).toBe(0);
  });

  it('should birth entry', () => {
    let s = createSkillLifecycleState();
    s = birthSkillEntry(s, 'k1');
    expect(s.entries.size).toBe(1);
  });

  it('should review entry', () => {
    let s = createSkillLifecycleState();
    s = birthSkillEntry(s, 'k1');
    s = reviewSkillEntry(s, 'k1');
    expect(s.entries.get('k1')?.phase).toBe('review');
  });

  it('should publish entry', () => {
    let s = createSkillLifecycleState();
    s = birthSkillEntry(s, 'k1');
    s = publishSkillEntry(s, 'k1');
    expect(s.entries.get('k1')?.phase).toBe('published');
  });

  it('should retire entry', () => {
    let s = createSkillLifecycleState();
    s = birthSkillEntry(s, 'k1');
    s = retireSkillEntry(s, 'k1');
    expect(s.entries.get('k1')?.phase).toBe('retired');
  });

  it('should deprecate entry', () => {
    let s = createSkillLifecycleState();
    s = birthSkillEntry(s, 'k1');
    s = deprecateSkillEntry(s, 'k1');
    expect(s.entries.get('k1')?.phase).toBe('deprecated');
  });

  it('should count by phase', () => {
    let s = createSkillLifecycleState();
    s = birthSkillEntry(s, 'a');
    s = birthSkillEntry(s, 'b');
    s = publishSkillEntry(s, 'a');
    const counts = countSkillPhases(s);
    expect(counts.published).toBe(1);
  });

  it('should compute health', () => {
    let s = createSkillLifecycleState();
    s = birthSkillEntry(s, 'k1');
    s = publishSkillEntry(s, 'k1');
    const h = skillLifecycleHealth(s);
    expect(h.published).toBe(1);
  });
});
