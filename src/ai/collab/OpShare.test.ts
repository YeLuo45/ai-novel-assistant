import { describe, it, expect } from 'vitest';
import { createOpShareState, grantOpShare, revokeOpShare, opGrantsForOp, canAccessOp, opShareCount, opShareHealth } from './OpShare';

describe('V2227 OpShare', () => {
  it('should create empty state', () => {
    const s = createOpShareState();
    expect(opShareCount(s)).toBe(0);
  });

  it('should grant share', () => {
    let s = createOpShareState();
    s = grantOpShare(s, 'op1', 'bob', 'private');
    expect(opShareCount(s)).toBe(1);
  });

  it('should revoke share', () => {
    let s = createOpShareState();
    s = grantOpShare(s, 'op1', 'bob', 'private');
    const grantId = s.grants.keys().next().value;
    s = revokeOpShare(s, grantId);
    expect(opShareCount(s)).toBe(0);
  });

  it('should get grants for op', () => {
    let s = createOpShareState();
    s = grantOpShare(s, 'op1', 'bob', 'private');
    expect(opGrantsForOp(s, 'op1')).toHaveLength(1);
  });

  it('should check access', () => {
    let s = createOpShareState();
    s = grantOpShare(s, 'op1', 'bob', 'private');
    expect(canAccessOp(s, 'op1', 'bob')).toBe(true);
  });

  it('should deny non-grantee', () => {
    let s = createOpShareState();
    s = grantOpShare(s, 'op1', 'bob', 'private');
    expect(canAccessOp(s, 'op1', 'eve')).toBe(false);
  });

  it('should deny expired', () => {
    let s = createOpShareState();
    s = grantOpShare(s, 'op1', 'bob', 'private', 1);
    expect(canAccessOp(s, 'op1', 'bob', Date.now() + 1000)).toBe(false);
  });

  it('should compute health', () => {
    const s = createOpShareState();
    const h = opShareHealth(s);
    expect(h.health).toBe(0.5);
  });
});
