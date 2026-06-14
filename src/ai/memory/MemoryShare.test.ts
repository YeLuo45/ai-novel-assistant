import { describe, it, expect } from 'vitest';
import { createShareState, grantShare, revokeShare, grantsForMem, canAccess, shareCount, memoryShareHealth } from './MemoryShare';

describe('V2167 MemoryShare', () => {
  it('should create empty state', () => {
    const s = createShareState();
    expect(shareCount(s)).toBe(0);
  });

  it('should grant share', () => {
    let s = createShareState();
    s = grantShare(s, 'm1', 'bob', 'private');
    expect(shareCount(s)).toBe(1);
  });

  it('should revoke share', () => {
    let s = createShareState();
    s = grantShare(s, 'm1', 'bob', 'private');
    const grantId = s.grants.keys().next().value;
    s = revokeShare(s, grantId);
    expect(shareCount(s)).toBe(0);
  });

  it('should get grants for memory', () => {
    let s = createShareState();
    s = grantShare(s, 'm1', 'bob', 'private');
    expect(grantsForMem(s, 'm1')).toHaveLength(1);
  });

  it('should check access', () => {
    let s = createShareState();
    s = grantShare(s, 'm1', 'bob', 'private');
    expect(canAccess(s, 'm1', 'bob')).toBe(true);
  });

  it('should deny access for non-grantee', () => {
    let s = createShareState();
    s = grantShare(s, 'm1', 'bob', 'private');
    expect(canAccess(s, 'm1', 'eve')).toBe(false);
  });

  it('should deny access for expired grant', () => {
    let s = createShareState();
    s = grantShare(s, 'm1', 'bob', 'private', 1);
    expect(canAccess(s, 'm1', 'bob', Date.now() + 1000)).toBe(false);
  });

  it('should compute health', () => {
    const s = createShareState();
    const h = memoryShareHealth(s);
    expect(h.health).toBe(0.5);
  });
});
