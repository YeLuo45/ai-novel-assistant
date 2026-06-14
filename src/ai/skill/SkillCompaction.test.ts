import { describe, it, expect } from 'vitest';
import { createSkillCompactionState, enqueueSkillEntry, runSkillCompaction, skillCompactionHealth } from './SkillCompaction';

describe('V2307 SkillCompaction', () => {
  it('should create empty state', () => {
    const s = createSkillCompactionState();
    expect(s.segments).toEqual([]);
  });

  it('should enqueue', () => {
    let s = createSkillCompactionState();
    s = enqueueSkillEntry(s, 'k1', { x: 1 });
    expect(s.pending.size).toBe(1);
  });

  it('should run compaction', () => {
    let s = createSkillCompactionState();
    s = enqueueSkillEntry(s, 'k1', 'a');
    s = enqueueSkillEntry(s, 'k2', 'b');
    s = runSkillCompaction(s);
    expect(s.segments).toHaveLength(1);
  });

  it('should not compact empty', () => {
    let s = createSkillCompactionState();
    s = runSkillCompaction(s);
    expect(s.segments).toEqual([]);
  });

  it('should dedupe by key', () => {
    let s = createSkillCompactionState();
    s = enqueueSkillEntry(s, 'k1', 'a');
    s = enqueueSkillEntry(s, 'k1', 'b');
    s = runSkillCompaction(s);
    expect(s.segments[0].finalCount).toBe(1);
  });

  it('should compute health', () => {
    const s = createSkillCompactionState();
    const h = skillCompactionHealth(s);
    expect(h.health).toBe(0.5);
  });
});
