import { describe, it, expect } from 'vitest';
import { createMemoryConflictState, resolveMemoryLWW, resolveMemoryCRDT, recordResolution, detectMemoryConflict, memoryConflictHealth } from './MemoryConflictResolver';

describe('V2170 MemoryConflictResolver', () => {
  it('should create empty state', () => {
    const s = createMemoryConflictState();
    expect(s.history).toEqual([]);
  });

  it('should resolve LWW', () => {
    const r = resolveMemoryLWW([
      { verId: 'a', memId: 'm1', data: 1, authorId: 'alice', ts: 100 },
      { verId: 'b', memId: 'm1', data: 2, authorId: 'bob', ts: 200 },
    ]);
    expect(r.winner.verId).toBe('b');
    expect(r.strategy).toBe('lww');
  });

  it('should resolve CRDT', () => {
    const r = resolveMemoryCRDT([
      { verId: 'a', memId: 'm1', data: { a: 1 }, authorId: 'alice', ts: 100 },
      { verId: 'b', memId: 'm1', data: { b: 2 }, authorId: 'bob', ts: 200 },
    ]);
    expect((r.winner.data as any).a).toBe(1);
    expect((r.winner.data as any).b).toBe(2);
  });

  it('should throw on empty for LWW', () => {
    expect(() => resolveMemoryLWW([])).toThrow();
  });

  it('should throw on empty for CRDT', () => {
    expect(() => resolveMemoryCRDT([])).toThrow();
  });

  it('should record resolution', () => {
    let s = createMemoryConflictState();
    const r = resolveMemoryLWW([{ verId: 'a', memId: 'm1', data: 1, authorId: 'x', ts: 1 }]);
    s = recordResolution(s, r);
    expect(s.history).toHaveLength(1);
  });

  it('should detect conflict with multiple authors', () => {
    const v = [
      { verId: 'a', memId: 'm1', data: 1, authorId: 'alice', ts: 1 },
      { verId: 'b', memId: 'm1', data: 2, authorId: 'bob', ts: 2 },
    ];
    expect(detectMemoryConflict(v)).toBe(true);
  });

  it('should not detect conflict with single author', () => {
    const v = [
      { verId: 'a', memId: 'm1', data: 1, authorId: 'alice', ts: 1 },
      { verId: 'b', memId: 'm1', data: 2, authorId: 'alice', ts: 2 },
    ];
    expect(detectMemoryConflict(v)).toBe(false);
  });

  it('should compute health', () => {
    let s = createMemoryConflictState();
    s = recordResolution(s, resolveMemoryLWW([{ verId: 'a', memId: 'm1', data: 1, authorId: 'x', ts: 1 }]));
    const h = memoryConflictHealth(s);
    expect(h.lww).toBe(1);
    expect(h.health).toBe(1);
  });
});
