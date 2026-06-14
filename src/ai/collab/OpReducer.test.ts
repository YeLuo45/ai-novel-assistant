import { describe, it, expect } from 'vitest';
import { createOpReducerState, reduceOps, reduceFromLamport, getReducedValue, opReducerHealth } from './OpReducer';
import type { CRDTOperation } from './OperationEncoder';

const op = (over: Partial<CRDTOperation>): CRDTOperation => ({
  id: 'op1', kind: 'set', target: 'k', value: 1, authorId: 'alice', lamport: 1, ts: 1, ...over,
});

describe('V2216 OpReducer', () => {
  it('should create empty state', () => {
    const s = createOpReducerState();
    expect(s.applied).toBe(0);
  });

  it('should reduce set ops', () => {
    const s = createOpReducerState();
    const r = reduceOps(s, [op({ target: 'k', value: 1 })]);
    expect(getReducedValue(r, 'k')).toBe(1);
  });

  it('should reduce increment', () => {
    const s = createOpReducerState();
    const r = reduceOps(s, [
      op({ id: 'a', kind: 'increment', target: 'c', value: 1, lamport: 1 }),
      op({ id: 'b', kind: 'increment', target: 'c', value: 2, lamport: 2 }),
    ]);
    expect(getReducedValue(r, 'c')).toBe(3);
  });

  it('should reduce delete', () => {
    const s = createOpReducerState();
    const r = reduceOps(s, [
      op({ id: 'a', target: 'k', value: 1, lamport: 1 }),
      op({ id: 'b', kind: 'delete', target: 'k', lamport: 2 }),
    ]);
    expect(getReducedValue(r, 'k')).toBeUndefined();
  });

  it('should reduce from lamport', () => {
    const s = createOpReducerState();
    const r = reduceFromLamport(s, [
      op({ id: 'a', target: 'k', value: 1, lamport: 1 }),
      op({ id: 'b', target: 'k', value: 2, lamport: 5 }),
    ], 5);
    expect(getReducedValue(r, 'k')).toBe(2);
  });

  it('should compute health', () => {
    const s = createOpReducerState();
    const h = opReducerHealth(s);
    expect(h.health).toBe(0.5);
  });
});
