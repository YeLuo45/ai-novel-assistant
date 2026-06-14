import { describe, it, expect } from 'vitest';
import { createOpDelegateState, delegateOp, revokeOpDelegation, opDelegationsTo, canDelegateOp, opDelegateCount, opDelegateHealth } from './OpDelegate';

describe('V2229 OpDelegate', () => {
  it('should create empty state', () => {
    const s = createOpDelegateState();
    expect(opDelegateCount(s)).toBe(0);
  });

  it('should delegate', () => {
    let s = createOpDelegateState();
    s = delegateOp(s, 'alice', 'bob', 'op1', 'read');
    expect(opDelegateCount(s)).toBe(1);
  });

  it('should revoke', () => {
    let s = createOpDelegateState();
    s = delegateOp(s, 'alice', 'bob', 'op1', 'read');
    const delId = s.delegations.keys().next().value;
    s = revokeOpDelegation(s, delId);
    expect(opDelegateCount(s)).toBe(0);
  });

  it('should find delegations to', () => {
    let s = createOpDelegateState();
    s = delegateOp(s, 'alice', 'bob', 'op1', 'read');
    s = delegateOp(s, 'eve', 'bob', 'op2', 'write');
    expect(opDelegationsTo(s, 'bob')).toHaveLength(2);
  });

  it('should check delegation', () => {
    let s = createOpDelegateState();
    s = delegateOp(s, 'alice', 'bob', 'op1', 'read');
    expect(canDelegateOp(s, 'bob', 'op1', 'read')).toBe(true);
  });

  it('should deny wrong scope', () => {
    let s = createOpDelegateState();
    s = delegateOp(s, 'alice', 'bob', 'op1', 'read');
    expect(canDelegateOp(s, 'bob', 'op1', 'write')).toBe(false);
  });

  it('should compute health', () => {
    const s = createOpDelegateState();
    const h = opDelegateHealth(s);
    expect(h.health).toBe(0.5);
  });
});
