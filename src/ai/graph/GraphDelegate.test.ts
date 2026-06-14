import { describe, it, expect } from 'vitest';
import { createGraphDelegateState, delegateGraph, revokeGraphDelegation, graphDelegationsTo, graphDelegationsFrom, canDelegateGraph, graphDelegateCount, graphDelegateHealth } from './GraphDelegate';

describe('V2199 GraphDelegate', () => {
  it('should create empty state', () => {
    const s = createGraphDelegateState();
    expect(graphDelegateCount(s)).toBe(0);
  });

  it('should delegate', () => {
    let s = createGraphDelegateState();
    s = delegateGraph(s, 'alice', 'bob', 'g1', 'read');
    expect(graphDelegateCount(s)).toBe(1);
  });

  it('should revoke', () => {
    let s = createGraphDelegateState();
    s = delegateGraph(s, 'alice', 'bob', 'g1', 'read');
    const delId = s.delegations.keys().next().value;
    s = revokeGraphDelegation(s, delId);
    expect(graphDelegateCount(s)).toBe(0);
  });

  it('should find delegations to', () => {
    let s = createGraphDelegateState();
    s = delegateGraph(s, 'alice', 'bob', 'g1', 'read');
    s = delegateGraph(s, 'eve', 'bob', 'g2', 'write');
    expect(graphDelegationsTo(s, 'bob')).toHaveLength(2);
  });

  it('should find delegations from', () => {
    let s = createGraphDelegateState();
    s = delegateGraph(s, 'alice', 'bob', 'g1', 'read');
    s = delegateGraph(s, 'alice', 'eve', 'g2', 'write');
    expect(graphDelegationsFrom(s, 'alice')).toHaveLength(2);
  });

  it('should check delegation', () => {
    let s = createGraphDelegateState();
    s = delegateGraph(s, 'alice', 'bob', 'g1', 'read');
    expect(canDelegateGraph(s, 'bob', 'g1', 'read')).toBe(true);
  });

  it('should deny wrong scope', () => {
    let s = createGraphDelegateState();
    s = delegateGraph(s, 'alice', 'bob', 'g1', 'read');
    expect(canDelegateGraph(s, 'bob', 'g1', 'write')).toBe(false);
  });

  it('should compute health', () => {
    const s = createGraphDelegateState();
    const h = graphDelegateHealth(s);
    expect(h.health).toBe(0.5);
  });
});
