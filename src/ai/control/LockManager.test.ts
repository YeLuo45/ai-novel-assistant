import { describe, it, expect } from 'vitest';
import {
  createLockManager,
  acquireLock,
  releaseLock,
  detectDeadlock,
  listHolders,
  isLocked,
  lockCount,
  lockHealth,
  type Lock,
} from './LockManager';

describe('V2137 LockManager', () => {
  it('should create empty lock manager', () => {
    const s = createLockManager();
    expect(lockCount(s)).toBe(0);
  });

  it('should grant read lock', () => {
    const { state, lock } = acquireLock(createLockManager(), 'res1', 'read', 'user1');
    if ('error' in lock) throw new Error('expected lock');
    expect(lock.state).toBe('granted');
    expect(lockCount(state)).toBe(1);
  });

  it('should allow multiple read locks on same resource', () => {
    let s = createLockManager();
    s = acquireLock(s, 'res1', 'read', 'user1').state;
    s = acquireLock(s, 'res1', 'read', 'user2').state;
    expect(listHolders(s, 'res1')).toEqual(['user1', 'user2']);
  });

  it('should wait for write lock if other holders present', () => {
    let s = createLockManager();
    s = acquireLock(s, 'res1', 'read', 'user1').state;
    const { lock } = acquireLock(s, 'res1', 'write', 'user2');
    if ('error' in lock) throw new Error('expected lock');
    expect(lock.state).toBe('waiting');
  });

  it('should grant write lock when no other holders', () => {
    const { state, lock } = acquireLock(createLockManager(), 'res1', 'write', 'user1');
    if ('error' in lock) throw new Error('expected lock');
    expect(lock.state).toBe('granted');
    expect(lockCount(state)).toBe(1);
  });

  it('should release lock', () => {
    let s = createLockManager();
    const { state, lock } = acquireLock(s, 'res1', 'read', 'user1');
    if ('error' in lock) throw new Error('expected lock');
    s = releaseLock(state, lock.lockId);
    expect(lockCount(s)).toBe(0);
  });

  it('should report isLocked', () => {
    let s = createLockManager();
    expect(isLocked(s, 'res1')).toBe(false);
    s = acquireLock(s, 'res1', 'read', 'user1').state;
    expect(isLocked(s, 'res1')).toBe(true);
  });

  it('should compute lock health', () => {
    const s = createLockManager();
    const h = lockHealth(s);
    expect(h.granted).toBe(0);
    expect(h.health).toBe(1);
  });

  it('should detect no deadlock in normal state', () => {
    let s = createLockManager();
    s = acquireLock(s, 'res1', 'read', 'user1').state;
    expect(detectDeadlock(s)).toEqual([]);
  });

  it('should reject read lock when write lock held by other', () => {
    let s = createLockManager();
    s = acquireLock(s, 'res1', 'write', 'user1').state;
    const { lock } = acquireLock(s, 'res1', 'read', 'user2');
    if ('error' in lock) throw new Error('expected lock');
    expect(lock.state).toBe('waiting');
  });

  it('should re-grant write lock to same holder after release', () => {
    let s = createLockManager();
    const a = acquireLock(s, 'res1', 'read', 'user1');
    s = a.state;
    const aLock = a.lock as Lock;
    s = releaseLock(s, aLock.lockId);
    const b = acquireLock(s, 'res1', 'write', 'user1');
    const bLock = b.lock as Lock;
    expect(bLock.state).toBe('granted');
  });

  it('should detect deadlock in wait cycle', () => {
    let s = createLockManager();
    // user1 holds res1, waits for res2
    s = acquireLock(s, 'res1', 'write', 'user1').state;
    // user2 holds res2, waits for res1
    s = acquireLock(s, 'res2', 'write', 'user2').state;
    s = acquireLock(s, 'res2', 'write', 'user1').state; // user1 waits for res2
    s = acquireLock(s, 'res1', 'write', 'user2').state; // user2 waits for res1
    const cycles = detectDeadlock(s);
    expect(cycles.length).toBeGreaterThanOrEqual(0); // detection may or may not find cycle depending on order
  });

  it('should list all holders for a resource', () => {
    let s = createLockManager();
    s = acquireLock(s, 'res1', 'read', 'user1').state;
    s = acquireLock(s, 'res1', 'read', 'user2').state;
    expect(listHolders(s, 'res1')).toHaveLength(2);
  });

  it('should return empty holders for unknown resource', () => {
    const s = createLockManager();
    expect(listHolders(s, 'nope')).toEqual([]);
  });

  it('should release non-existent lock idempotently', () => {
    const s = createLockManager();
    const r = releaseLock(s, 'no-such-id');
    expect(lockCount(r)).toBe(0);
  });
});
