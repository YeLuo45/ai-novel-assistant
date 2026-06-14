import { describe, it, expect } from 'vitest';
import { createContextShareState, grantContextShare, revokeContextShare, contextGrantsForKey, canAccessContext, contextShareCount, contextShareHealth } from './ContextShare';

describe('V2287 ContextShare', () => {
  it('should create empty state', () => {
    const s = createContextShareState();
    expect(contextShareCount(s)).toBe(0);
  });

  it('should grant share', () => {
    let s = createContextShareState();
    s = grantContextShare(s, 'k1', 'bob', 'private');
    expect(contextShareCount(s)).toBe(1);
  });

  it('should revoke share', () => {
    let s = createContextShareState();
    s = grantContextShare(s, 'k1', 'bob', 'private');
    const grantId = s.grants.keys().next().value;
    s = revokeContextShare(s, grantId);
    expect(contextShareCount(s)).toBe(0);
  });

  it('should get grants for key', () => {
    let s = createContextShareState();
    s = grantContextShare(s, 'k1', 'bob', 'private');
    expect(contextGrantsForKey(s, 'k1')).toHaveLength(1);
  });

  it('should check access', () => {
    let s = createContextShareState();
    s = grantContextShare(s, 'k1', 'bob', 'private');
    expect(canAccessContext(s, 'k1', 'bob')).toBe(true);
  });

  it('should deny non-grantee', () => {
    let s = createContextShareState();
    s = grantContextShare(s, 'k1', 'bob', 'private');
    expect(canAccessContext(s, 'k1', 'eve')).toBe(false);
  });

  it('should deny expired', () => {
    let s = createContextShareState();
    s = grantContextShare(s, 'k1', 'bob', 'private', 1);
    expect(canAccessContext(s, 'k1', 'bob', Date.now() + 1000)).toBe(false);
  });

  it('should compute health', () => {
    const s = createContextShareState();
    const h = contextShareHealth(s);
    expect(h.health).toBe(0.5);
  });
});
