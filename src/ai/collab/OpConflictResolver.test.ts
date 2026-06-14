import { describe, it, expect } from 'vitest';
import { createOpConflictState, resolveOpLWW, resolveOpCRDT, recordOpResolution, detectOpConflict, opConflictHealth } from './OpConflictResolver';

describe('V2230 OpConflictResolver', () => {
  it('should create empty state', () => {
    const s = createOpConflictState();
    expect(s.history).toEqual([]);
  });

  it('should resolve LWW', () => {
    const r = resolveOpLWW([
      { verId: 'a', opId: 'op1', data: 1, authorId: 'alice', ts: 1 },
      { verId: 'b', opId: 'op1', data: 2, authorId: 'bob', ts: 2 },
    ]);
    expect(r.winner.verId).toBe('b');
  });

  it('should resolve CRDT', () => {
    const r = resolveOpCRDT([
      { verId: 'a', opId: 'op1', data: { a: 1 }, authorId: 'alice', ts: 1 },
      { verId: 'b', opId: 'op1', data: { b: 2 }, authorId: 'bob', ts: 2 },
    ]);
    expect((r.winner.data as any).a).toBe(1);
  });

  it('should throw on empty LWW', () => {
    expect(() => resolveOpLWW([])).toThrow();
  });

  it('should throw on empty CRDT', () => {
    expect(() => resolveOpCRDT([])).toThrow();
  });

  it('should record resolution', () => {
    let s = createOpConflictState();
    s = recordOpResolution(s, resolveOpLWW([{ verId: 'a', opId: 'op1', data: 1, authorId: 'x', ts: 1 }]));
    expect(s.history).toHaveLength(1);
  });

  it('should detect conflict', () => {
    expect(detectOpConflict([
      { verId: 'a', opId: 'op1', data: 1, authorId: 'alice', ts: 1 },
      { verId: 'b', opId: 'op1', data: 2, authorId: 'bob', ts: 2 },
    ])).toBe(true);
  });

  it('should not detect for single author', () => {
    expect(detectOpConflict([
      { verId: 'a', opId: 'op1', data: 1, authorId: 'alice', ts: 1 },
      { verId: 'b', opId: 'op1', data: 2, authorId: 'alice', ts: 2 },
    ])).toBe(false);
  });

  it('should compute health', () => {
    let s = createOpConflictState();
    s = recordOpResolution(s, resolveOpLWW([{ verId: 'a', opId: 'op1', data: 1, authorId: 'x', ts: 1 }]));
    const h = opConflictHealth(s);
    expect(h.health).toBe(1);
  });
});
