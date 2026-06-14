import { describe, it, expect } from 'vitest';
import { createContextDelegateState, delegateContext, revokeContextDelegation, contextDelegationsTo, canDelegateContext, contextDelegateCount, contextDelegateHealth } from './ContextDelegate';

describe('V2289 ContextDelegate', () => {
  it('should create empty state', () => {
    const s = createContextDelegateState();
    expect(contextDelegateCount(s)).toBe(0);
  });

  it('should delegate', () => {
    let s = createContextDelegateState();
    s = delegateContext(s, 'alice', 'bob', 'k1', 'read');
    expect(contextDelegateCount(s)).toBe(1);
  });

  it('should revoke', () => {
    let s = createContextDelegateState();
    s = delegateContext(s, 'alice', 'bob', 'k1', 'read');
    const delId = s.delegations.keys().next().value;
    s = revokeContextDelegation(s, delId);
    expect(contextDelegateCount(s)).toBe(0);
  });

  it('should find delegations to', () => {
    let s = createContextDelegateState();
    s = delegateContext(s, 'alice', 'bob', 'k1', 'read');
    s = delegateContext(s, 'eve', 'bob', 'k2', 'write');
    expect(contextDelegationsTo(s, 'bob')).toHaveLength(2);
  });

  it('should check delegation', () => {
    let s = createContextDelegateState();
    s = delegateContext(s, 'alice', 'bob', 'k1', 'read');
    expect(canDelegateContext(s, 'bob', 'k1', 'read')).toBe(true);
  });

  it('should deny wrong scope', () => {
    let s = createContextDelegateState();
    s = delegateContext(s, 'alice', 'bob', 'k1', 'read');
    expect(canDelegateContext(s, 'bob', 'k1', 'write')).toBe(false);
  });

  it('should compute health', () => {
    const s = createContextDelegateState();
    const h = contextDelegateHealth(s);
    expect(h.health).toBe(0.5);
  });
});
