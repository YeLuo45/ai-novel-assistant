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
});
