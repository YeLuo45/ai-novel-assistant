import { describe, it, expect } from 'vitest';
import { createMergeState, mergeByLamport, mergeByAuthorThenTime, detectConcurrentPairs, mergeWithLWW, mergeOps, mergeHealth } from './OpMerger';
import type { CRDTOperation } from './OperationEncoder';

const op = (over: Partial<CRDTOperation>): CRDTOperation => ({
  id: 'op1', kind: 'set', target: 'k', value: 1, authorId: 'alice', lamport: 1, ts: 1, ...over,
});

describe('V2215 OpMerger', () => {
  it('should create empty state', () => {
    const s = createMergeState();
    expect(s.merged).toEqual([]);
  });

  it('should merge by lamport', () => {
    const r = mergeByLamport([op({ id: 'a', lamport: 3 }), op({ id: 'b', lamport: 1 })]);
    expect(r[0].id).toBe('b');
  });

  it('should merge by author then time', () => {
    const r = mergeByAuthorThenTime([op({ id: 'a', authorId: 'bob' }), op({ id: 'b', authorId: 'alice' })]);
    expect(r[0].authorId).toBe('alice');
  });

  it('should detect concurrent pairs', () => {
    const conflicts = detectConcurrentPairs([
      op({ id: 'a', authorId: 'alice', target: 'k' }),
      op({ id: 'b', authorId: 'bob', target: 'k' }),
    ]);
    expect(conflicts).toHaveLength(1);
  });

  it('should not detect for different keys', () => {
    const conflicts = detectConcurrentPairs([
      op({ id: 'a', authorId: 'alice', target: 'k1' }),
      op({ id: 'b', authorId: 'bob', target: 'k2' }),
    ]);
    expect(conflicts).toHaveLength(0);
  });

  it('should LWW pick latest', () => {
    const r = mergeWithLWW(op({ id: 'a', ts: 1 }), op({ id: 'b', ts: 2 }));
    expect(r.id).toBe('b');
  });

  it('should merge ops and detect conflicts', () => {
    let s = createMergeState();
    s = mergeOps(s, [
      op({ id: 'a', authorId: 'alice', target: 'k' }),
      op({ id: 'b', authorId: 'bob', target: 'k' }),
    ]);
    expect(s.conflicts).toHaveLength(1);
  });

  it('should compute health', () => {
    let s = createMergeState();
    s = mergeOps(s, [op({})]);
    const h = mergeHealth(s);
    expect(h.health).toBe(1);
  });
});
