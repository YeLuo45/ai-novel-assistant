import { describe, it, expect } from 'vitest';
import { createMemoryDelegateState, delegate, revokeDelegation, delegationsTo, delegationsFrom, canDelegate, delegationCount, memoryDelegateHealth } from './MemoryDelegate';

describe('V2169 MemoryDelegate', () => {
  it('should create empty state', () => {
    const s = createMemoryDelegateState();
    expect(delegationCount(s)).toBe(0);
  });

  it('should delegate', () => {
    let s = createMemoryDelegateState();
    s = delegate(s, 'alice', 'bob', 'm1', 'read');
    expect(delegationCount(s)).toBe(1);
  });

  it('should revoke delegation', () => {
    let s = createMemoryDelegateState();
    s = delegate(s, 'alice', 'bob', 'm1', 'read');
    const delId = s.delegations.keys().next().value;
    s = revokeDelegation(s, delId);
    expect(delegationCount(s)).toBe(0);
  });

  it('should find delegations to user', () => {
    let s = createMemoryDelegateState();
    s = delegate(s, 'alice', 'bob', 'm1', 'read');
    s = delegate(s, 'eve', 'bob', 'm2', 'write');
    expect(delegationsTo(s, 'bob')).toHaveLength(2);
  });

  it('should find delegations from user', () => {
    let s = createMemoryDelegateState();
    s = delegate(s, 'alice', 'bob', 'm1', 'read');
    s = delegate(s, 'alice', 'eve', 'm2', 'write');
    expect(delegationsFrom(s, 'alice')).toHaveLength(2);
  });

  it('should check delegation', () => {
    let s = createMemoryDelegateState();
    s = delegate(s, 'alice', 'bob', 'm1', 'read');
    expect(canDelegate(s, 'bob', 'm1', 'read')).toBe(true);
  });

  it('should deny delegation for wrong scope', () => {
    let s = createMemoryDelegateState();
    s = delegate(s, 'alice', 'bob', 'm1', 'read');
    expect(canDelegate(s, 'bob', 'm1', 'write')).toBe(false);
  });

  it('should compute health', () => {
    const s = createMemoryDelegateState();
    const h = memoryDelegateHealth(s);
    expect(h.health).toBe(0.5);
  });
});
