import { describe, it, expect } from 'vitest';
import { createReplayState, replayOps, replayFrom, getValue, appliedCount, opReplayHealth } from './OpReplay';
import type { CRDTOperation } from './OperationEncoder';

describe('V2209 OpReplay', () => {
  it('should create empty state', () => {
    const s = createReplayState();
    expect(appliedCount(s)).toBe(0);
  });

  it('should replay set op', () => {
    const s = createReplayState();
    const ops: CRDTOperation[] = [{ id: 'op1', kind: 'set', target: 'k', value: 1, authorId: 'a', lamport: 1, ts: 1 }];
    const r = replayOps(s, ops);
    expect(getValue(r, 'k')).toBe(1);
  });

  it('should replay increment op', () => {
    const s = createReplayState();
    const ops: CRDTOperation[] = [
      { id: 'op1', kind: 'increment', target: 'k', value: 1, authorId: 'a', lamport: 1, ts: 1 },
      { id: 'op2', kind: 'increment', target: 'k', value: 2, authorId: 'a', lamport: 2, ts: 2 },
    ];
    const r = replayOps(s, ops);
    expect(getValue(r, 'k')).toBe(3);
  });

  it('should replay delete op', () => {
    const s = createReplayState();
    const ops: CRDTOperation[] = [
      { id: 'op1', kind: 'set', target: 'k', value: 1, authorId: 'a', lamport: 1, ts: 1 },
      { id: 'op2', kind: 'delete', target: 'k', value: null, authorId: 'a', lamport: 2, ts: 2 },
    ];
    const r = replayOps(s, ops);
    expect(getValue(r, 'k')).toBeUndefined();
  });

  it('should replay in lamport order', () => {
    const s = createReplayState();
    const ops: CRDTOperation[] = [
      { id: 'op1', kind: 'set', target: 'k', value: 1, authorId: 'a', lamport: 2, ts: 2 },
      { id: 'op2', kind: 'set', target: 'k', value: 2, authorId: 'a', lamport: 1, ts: 1 },
    ];
    const r = replayOps(s, ops);
    expect(getValue(r, 'k')).toBe(1);
  });

  it('should replay from lamport', () => {
    const s = createReplayState();
    const ops: CRDTOperation[] = [
      { id: 'op1', kind: 'set', target: 'k', value: 1, authorId: 'a', lamport: 1, ts: 1 },
      { id: 'op2', kind: 'set', target: 'k', value: 2, authorId: 'a', lamport: 5, ts: 5 },
    ];
    const r = replayFrom(s, ops, 5);
    expect(getValue(r, 'k')).toBe(2);
  });

  it('should compute health', () => {
    const s = createReplayState();
    const h = opReplayHealth(s);
    expect(h.health).toBe(0.5);
  });
});
