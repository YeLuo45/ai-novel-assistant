import { describe, it, expect } from 'vitest';
import { createCacheConflictState, resolveCacheLWW, resolveCacheCRDT, recordCacheResolution, detectCacheConflict, cacheConflictHealth } from './CacheConflictResolver';

describe('V2260 CacheConflictResolver', () => {
  it('should create empty state', () => {
    const s = createCacheConflictState();
    expect(s.history).toEqual([]);
  });

  it('should resolve LWW', () => {
    const r = resolveCacheLWW([
      { verId: 'a', key: 'k1', data: 1, authorId: 'alice', ts: 1 },
      { verId: 'b', key: 'k1', data: 2, authorId: 'bob', ts: 2 },
    ]);
    expect(r.winner.verId).toBe('b');
  });

  it('should resolve CRDT', () => {
    const r = resolveCacheCRDT([
      { verId: 'a', key: 'k1', data: { a: 1 }, authorId: 'alice', ts: 1 },
      { verId: 'b', key: 'k1', data: { b: 2 }, authorId: 'bob', ts: 2 },
    ]);
    expect((r.winner.data as any).a).toBe(1);
  });

  it('should throw on empty LWW', () => {
    expect(() => resolveCacheLWW([])).toThrow();
  });

  it('should throw on empty CRDT', () => {
    expect(() => resolveCacheCRDT([])).toThrow();
  });

  it('should record resolution', () => {
    let s = createCacheConflictState();
    s = recordCacheResolution(s, resolveCacheLWW([{ verId: 'a', key: 'k1', data: 1, authorId: 'x', ts: 1 }]));
    expect(s.history).toHaveLength(1);
  });

  it('should detect conflict', () => {
    expect(detectCacheConflict([
      { verId: 'a', key: 'k1', data: 1, authorId: 'alice', ts: 1 },
      { verId: 'b', key: 'k1', data: 2, authorId: 'bob', ts: 2 },
    ])).toBe(true);
  });

  it('should not detect for single author', () => {
    expect(detectCacheConflict([
      { verId: 'a', key: 'k1', data: 1, authorId: 'alice', ts: 1 },
      { verId: 'b', key: 'k1', data: 2, authorId: 'alice', ts: 2 },
    ])).toBe(false);
  });

  it('should compute health', () => {
    let s = createCacheConflictState();
    s = recordCacheResolution(s, resolveCacheLWW([{ verId: 'a', key: 'k1', data: 1, authorId: 'x', ts: 1 }]));
    const h = cacheConflictHealth(s);
    expect(h.health).toBe(1);
  });
});
