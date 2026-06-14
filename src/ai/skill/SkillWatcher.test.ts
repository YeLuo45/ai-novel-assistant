import { describe, it, expect } from 'vitest';
import { createSkillWatcherState, addSkillWatch, removeSkillWatch, fireSkillWatch, skillWatchCount, skillWatchFireCount, skillWatcherHealth } from './SkillWatcher';

describe('V2313 SkillWatcher', () => {
  it('should create empty state', () => {
    const s = createSkillWatcherState();
    expect(skillWatchCount(s)).toBe(0);
  });

  it('should add watch', () => {
    let s = createSkillWatcherState();
    s = addSkillWatch(s, 'w1', 'k1', ['create']);
    expect(skillWatchCount(s)).toBe(1);
  });

  it('should remove watch', () => {
    let s = createSkillWatcherState();
    s = addSkillWatch(s, 'w1', 'k1', ['create']);
    s = removeSkillWatch(s, 'w1');
    expect(skillWatchCount(s)).toBe(0);
  });

  it('should fire on matching event', () => {
    let s = createSkillWatcherState();
    s = addSkillWatch(s, 'w1', 'k1', ['create']);
    s = fireSkillWatch(s, 'create', 'k1');
    expect(skillWatchFireCount(s, 'w1')).toBe(1);
  });

  it('should not fire on non-matching event', () => {
    let s = createSkillWatcherState();
    s = addSkillWatch(s, 'w1', 'k1', ['create']);
    s = fireSkillWatch(s, 'retire', 'k1');
    expect(skillWatchFireCount(s, 'w1')).toBe(0);
  });

  it('should not fire on non-matching key', () => {
    let s = createSkillWatcherState();
    s = addSkillWatch(s, 'w1', 'k1', ['create']);
    s = fireSkillWatch(s, 'create', 'k2');
    expect(skillWatchFireCount(s, 'w1')).toBe(0);
  });

  it('should compute health', () => {
    const s = createSkillWatcherState();
    const h = skillWatcherHealth(s);
    expect(h.health).toBe(0.5);
  });
});
