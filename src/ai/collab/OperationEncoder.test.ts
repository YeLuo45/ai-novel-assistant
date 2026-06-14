import { describe, it, expect } from 'vitest';
import { createOpEncoderState, encodeOp, getOp, opsByAuthor, latestOp, opCount, opEncoderHealth } from './OperationEncoder';

describe('V2206 OperationEncoder', () => {
  it('should create empty state', () => {
    const s = createOpEncoderState();
    expect(opCount(s)).toBe(0);
  });

  it('should encode op with auto lamport', () => {
    const s = createOpEncoderState();
    const { op } = encodeOp(s, 'set', 'key1', 'value1', 'alice');
    expect(op.lamport).toBe(1);
  });

  it('should encode multiple ops with incrementing lamport', () => {
    const s = createOpEncoderState();
    const a = encodeOp(s, 'set', 'a', 1, 'alice');
    const b = encodeOp(a.state, 'set', 'b', 2, 'bob');
    expect(b.op.lamport).toBe(2);
  });

  it('should get op by id', () => {
    const s = createOpEncoderState();
    const { op, state } = encodeOp(s, 'set', 'k', 1, 'alice');
    expect(getOp(state, op.id)?.target).toBe('k');
  });

  it('should query by author', () => {
    let s = createOpEncoderState();
    s = encodeOp(s, 'set', 'a', 1, 'alice').state;
    s = encodeOp(s, 'set', 'b', 2, 'bob').state;
    expect(opsByAuthor(s, 'alice')).toHaveLength(1);
  });

  it('should get latest op', () => {
    let s = createOpEncoderState();
    s = encodeOp(s, 'set', 'a', 1, 'alice').state;
    s = encodeOp(s, 'set', 'b', 2, 'bob').state;
    expect(latestOp(s)?.target).toBe('b');
  });

  it('should compute health', () => {
    const s = createOpEncoderState();
    const h = opEncoderHealth(s);
    expect(h.health).toBe(0.5);
  });
});
