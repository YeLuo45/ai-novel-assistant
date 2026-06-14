import { describe, it, expect } from 'vitest';
import { createGraphConflictState, resolveGraphLWW, resolveGraphCRDT, recordGraphResolution, detectGraphConflict, graphConflictHealth } from './GraphConflictResolver';

describe('V2200 GraphConflictResolver', () => {
  it('should create empty state', () => {
    const s = createGraphConflictState();
    expect(s.history).toEqual([]);
  });

  it('should resolve LWW', () => {
    const r = resolveGraphLWW([
      { verId: 'a', graphId: 'g1', data: 1, authorId: 'alice', ts: 100 },
      { verId: 'b', graphId: 'g1', data: 2, authorId: 'bob', ts: 200 },
    ]);
    expect(r.winner.verId).toBe('b');
  });

  it('should resolve CRDT', () => {
    const r = resolveGraphCRDT([
      { verId: 'a', graphId: 'g1', data: { a: 1 }, authorId: 'alice', ts: 100 },
      { verId: 'b', graphId: 'g1', data: { b: 2 }, authorId: 'bob', ts: 200 },
    ]);
    expect((r.winner.data as any).a).toBe(1);
    expect((r.winner.data as any).b).toBe(2);
  });

  it('should throw on empty LWW', () => {
    expect(() => resolveGraphLWW([])).toThrow();
  });

  it('should throw on empty CRDT', () => {
    expect(() => resolveGraphCRDT([])).toThrow();
  });

  it('should record resolution', () => {
    let s = createGraphConflictState();
    s = recordGraphResolution(s, resolveGraphLWW([{ verId: 'a', graphId: 'g1', data: 1, authorId: 'x', ts: 1 }]));
    expect(s.history).toHaveLength(1);
  });

  it('should detect conflict', () => {
    expect(detectGraphConflict([
      { verId: 'a', graphId: 'g1', data: 1, authorId: 'alice', ts: 1 },
      { verId: 'b', graphId: 'g1', data: 2, authorId: 'bob', ts: 2 },
    ])).toBe(true);
  });

  it('should not detect conflict single author', () => {
    expect(detectGraphConflict([
      { verId: 'a', graphId: 'g1', data: 1, authorId: 'alice', ts: 1 },
      { verId: 'b', graphId: 'g1', data: 2, authorId: 'alice', ts: 2 },
    ])).toBe(false);
  });

  it('should compute health', () => {
    let s = createGraphConflictState();
    s = recordGraphResolution(s, resolveGraphLWW([{ verId: 'a', graphId: 'g1', data: 1, authorId: 'x', ts: 1 }]));
    const h = graphConflictHealth(s);
    expect(h.health).toBe(1);
  });
});
