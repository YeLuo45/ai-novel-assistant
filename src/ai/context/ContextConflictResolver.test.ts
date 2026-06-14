import { describe, it, expect } from 'vitest';
import { createContextConflictState, resolveContextLWW, resolveContextCRDT, recordContextResolution, detectContextConflict, contextConflictHealth } from './ContextConflictResolver';

describe('V2290 ContextConflictResolver', () => {
  it('should create empty state', () => {
    const s = createContextConflictState();
    expect(s.history).toEqual([]);
  });

  it('should resolve LWW', () => {
    const r = resolveContextLWW([
      { verId: 'a', key: 'k1', data: 1, authorId: 'alice', ts: 1 },
      { verId: 'b', key: 'k1', data: 2, authorId: 'bob', ts: 2 },
    ]);
    expect(r.winner.verId).toBe('b');
  });

  it('should resolve CRDT', () => {
    const r = resolveContextCRDT([
      { verId: 'a', key: 'k1', data: { a: 1 }, authorId: 'alice', ts: 1 },
      { verId: 'b', key: 'k1', data: { b: 2 }, authorId: 'bob', ts: 2 },
    ]);
    expect((r.winner.data as any).a).toBe(1);
  });

  it('should throw on empty LWW', () => {
    expect(() => resolveContextLWW([])).toThrow();
  });

  it('should throw on empty CRDT', () => {
    expect(() => resolveContextCRDT([])).toThrow();
  });

  it('should record resolution', () => {
    let s = createContextConflictState();
    s = recordContextResolution(s, resolveContextLWW([{ verId: 'a', key: 'k1', data: 1, authorId: 'x', ts: 1 }]));
    expect(s.history).toHaveLength(1);
  });

  it('should detect conflict', () => {
    expect(detectContextConflict([
      { verId: 'a', key: 'k1', data: 1, authorId: 'alice', ts: 1 },
      { verId: 'b', key: 'k1', data: 2, authorId: 'bob', ts: 2 },
    ])).toBe(true);
  });

  it('should not detect for single author', () => {
    expect(detectContextConflict([
      { verId: 'a', key: 'k1', data: 1, authorId: 'alice', ts: 1 },
      { verId: 'b', key: 'k1', data: 2, authorId: 'alice', ts: 2 },
    ])).toBe(false);
  });

  it('should compute health', () => {
    let s = createContextConflictState();
    s = recordContextResolution(s, resolveContextLWW([{ verId: 'a', key: 'k1', data: 1, authorId: 'x', ts: 1 }]));
    const h = contextConflictHealth(s);
    expect(h.health).toBe(1);
  });
});
