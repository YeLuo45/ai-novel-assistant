import { describe, it, expect } from 'vitest';
import { createGraphShareState, grantGraphShare, revokeGraphShare, graphGrantsForGraph, canAccessGraph, graphShareCount, graphShareHealth } from './GraphShare';

describe('V2197 GraphShare', () => {
  it('should create empty state', () => {
    const s = createGraphShareState();
    expect(graphShareCount(s)).toBe(0);
  });

  it('should grant share', () => {
    let s = createGraphShareState();
    s = grantGraphShare(s, 'g1', 'bob', 'private');
    expect(graphShareCount(s)).toBe(1);
  });

  it('should revoke share', () => {
    let s = createGraphShareState();
    s = grantGraphShare(s, 'g1', 'bob', 'private');
    const grantId = s.grants.keys().next().value;
    s = revokeGraphShare(s, grantId);
    expect(graphShareCount(s)).toBe(0);
  });

  it('should get grants for graph', () => {
    let s = createGraphShareState();
    s = grantGraphShare(s, 'g1', 'bob', 'private');
    expect(graphGrantsForGraph(s, 'g1')).toHaveLength(1);
  });

  it('should check access', () => {
    let s = createGraphShareState();
    s = grantGraphShare(s, 'g1', 'bob', 'private');
    expect(canAccessGraph(s, 'g1', 'bob')).toBe(true);
  });

  it('should deny access for non-grantee', () => {
    let s = createGraphShareState();
    s = grantGraphShare(s, 'g1', 'bob', 'private');
    expect(canAccessGraph(s, 'g1', 'eve')).toBe(false);
  });

  it('should deny access for expired', () => {
    let s = createGraphShareState();
    s = grantGraphShare(s, 'g1', 'bob', 'private', 1);
    expect(canAccessGraph(s, 'g1', 'bob', Date.now() + 1000)).toBe(false);
  });

  it('should compute health', () => {
    const s = createGraphShareState();
    const h = graphShareHealth(s);
    expect(h.health).toBe(0.5);
  });
});
