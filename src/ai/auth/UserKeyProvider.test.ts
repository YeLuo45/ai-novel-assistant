import { describe, it, expect } from 'vitest';
import {
  createUserKeyState,
  registerUser,
  verifyPassword,
  rotateKey,
  removeUser,
  getEntry,
  userCount,
  userKeyHealth,
} from './UserKeyProvider';

describe('V2142 UserKeyProvider', () => {
  it('should create empty state', () => {
    const s = createUserKeyState();
    expect(userCount(s)).toBe(0);
  });

  it('should register user', () => {
    const s = registerUser(createUserKeyState(), 'u1', 'password123');
    expect(userCount(s)).toBe(1);
  });

  it('should verify correct password', () => {
    let s = createUserKeyState();
    s = registerUser(s, 'u1', 'secret');
    expect(verifyPassword(s, 'u1', 'secret')).toBe(true);
  });

  it('should reject wrong password', () => {
    let s = createUserKeyState();
    s = registerUser(s, 'u1', 'secret');
    expect(verifyPassword(s, 'u1', 'wrong')).toBe(false);
  });

  it('should reject unknown user', () => {
    const s = createUserKeyState();
    expect(verifyPassword(s, 'nope', 'x')).toBe(false);
  });

  it('should rotate key', () => {
    let s = createUserKeyState();
    s = registerUser(s, 'u1', 'old');
    s = rotateKey(s, 'u1', 'new');
    expect(verifyPassword(s, 'u1', 'old')).toBe(false);
    expect(verifyPassword(s, 'u1', 'new')).toBe(true);
  });

  it('should remove user', () => {
    let s = createUserKeyState();
    s = registerUser(s, 'u1', 'x');
    s = removeUser(s, 'u1');
    expect(userCount(s)).toBe(0);
  });

  it('should get entry', () => {
    let s = createUserKeyState();
    s = registerUser(s, 'u1', 'x');
    expect(getEntry(s, 'u1')?.userId).toBe('u1');
  });

  it('should compute health', () => {
    let s = createUserKeyState();
    s = registerUser(s, 'u1', 'x');
    const h = userKeyHealth(s);
    expect(h.userCount).toBe(1);
    expect(h.health).toBe(1);
  });
});
