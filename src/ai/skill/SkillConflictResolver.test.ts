import { describe, it, expect } from 'vitest';
import { createSkillConflictState, resolveSkillLWW, resolveSkillCRDT, recordSkillResolution, detectSkillConflict, skillConflictHealth } from './SkillConflictResolver';

describe('V2320 SkillConflictResolver', () => {
  it('should create empty state', () => {
    const s = createSkillConflictState();
    expect(s.history).toEqual([]);
  });

  it('should resolve LWW', () => {
    const r = resolveSkillLWW([
      { verId: 'a', key: 'k1', data: 1, authorId: 'alice', ts: 1 },
      { verId: 'b', key: 'k1', data: 2, authorId: 'bob', ts: 2 },
    ]);
    expect(r.winner.verId).toBe('b');
  });

  it('should resolve CRDT', () => {
    const r = resolveSkillCRDT([
      { verId: 'a', key: 'k1', data: { a: 1 }, authorId: 'alice', ts: 1 },
      { verId: 'b', key: 'k1', data: { b: 2 }, authorId: 'bob', ts: 2 },
    ]);
    expect((r.winner.data as any).a).toBe(1);
  });

  it('should throw on empty LWW', () => {
    expect(() => resolveSkillLWW([])).toThrow();
  });

  it('should throw on empty CRDT', () => {
    expect(() => resolveSkillCRDT([])).toThrow();
  });

  it('should record resolution', () => {
    let s = createSkillConflictState();
    s = recordSkillResolution(s, resolveSkillLWW([{ verId: 'a', key: 'k1', data: 1, authorId: 'x', ts: 1 }]));
    expect(s.history).toHaveLength(1);
  });

  it('should detect conflict', () => {
    expect(detectSkillConflict([
      { verId: 'a', key: 'k1', data: 1, authorId: 'alice', ts: 1 },
      { verId: 'b', key: 'k1', data: 2, authorId: 'bob', ts: 2 },
    ])).toBe(true);
  });

  it('should not detect for single author', () => {
    expect(detectSkillConflict([
      { verId: 'a', key: 'k1', data: 1, authorId: 'alice', ts: 1 },
      { verId: 'b', key: 'k1', data: 2, authorId: 'alice', ts: 2 },
    ])).toBe(false);
  });

  it('should compute health', () => {
    let s = createSkillConflictState();
    s = recordSkillResolution(s, resolveSkillLWW([{ verId: 'a', key: 'k1', data: 1, authorId: 'x', ts: 1 }]));
    const h = skillConflictHealth(s);
    expect(h.health).toBe(1);
  });
});
