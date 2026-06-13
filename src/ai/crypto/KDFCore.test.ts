import { describe, it, expect } from 'vitest';
import {
  pbkdf2Sync,
  verifyKey,
  newSalt,
  validateParams,
  estimateMs,
  DEFAULT_KDF_PARAMS,
} from './KDFCore';

describe('V2124 KDFCore', () => {
  it('should derive a deterministic key from password+params', () => {
    const k1 = pbkdf2Sync('password', DEFAULT_KDF_PARAMS);
    const k2 = pbkdf2Sync('password', DEFAULT_KDF_PARAMS);
    expect(k1).toBe(k2);
    expect(k1.length).toBe(64); // 32 bytes hex
  });

  it('should produce different keys for different passwords', () => {
    const a = pbkdf2Sync('passwordA', DEFAULT_KDF_PARAMS);
    const b = pbkdf2Sync('passwordB', DEFAULT_KDF_PARAMS);
    expect(a).not.toBe(b);
  });

  it('should verify matching password', () => {
    const hash = pbkdf2Sync('mypassword', DEFAULT_KDF_PARAMS);
    expect(verifyKey('mypassword', hash, DEFAULT_KDF_PARAMS)).toBe(true);
    expect(verifyKey('wrongpassword', hash, DEFAULT_KDF_PARAMS)).toBe(false);
  });

  it('should generate a salt of expected length', () => {
    const s = newSalt(16);
    expect(s.length).toBe(32); // 16 bytes hex
  });

  it('should validate weak params', () => {
    const result = validateParams({ salt: 'short', iterations: 100, keyLength: 8 });
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('should validate safe params', () => {
    const result = validateParams(DEFAULT_KDF_PARAMS);
    expect(result.valid).toBe(true);
  });

  it('should estimate ms per derive', () => {
    const est = estimateMs(DEFAULT_KDF_PARAMS);
    expect(est.perDerive).toBeGreaterThan(0);
  });

  it('should produce different key for different salts', () => {
    const a = pbkdf2Sync('password', { ...DEFAULT_KDF_PARAMS, salt: 'saltA' });
    const b = pbkdf2Sync('password', { ...DEFAULT_KDF_PARAMS, salt: 'saltB' });
    expect(a).not.toBe(b);
  });

  it('should produce different key for different iterations', () => {
    const a = pbkdf2Sync('password', { ...DEFAULT_KDF_PARAMS, iterations: 1000 });
    const b = pbkdf2Sync('password', { ...DEFAULT_KDF_PARAMS, iterations: 2000 });
    expect(a).not.toBe(b);
  });
});
