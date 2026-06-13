import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, generateKey, validateKey, selfTest } from './AESGCMCipher';

describe('V2125 AESGCMCipher', () => {
  it('should encrypt and decrypt round-trip', () => {
    const k = generateKey();
    const pt = 'Hello, World! 你好世界';
    const ct = encrypt(pt, k);
    expect(ct).not.toBe(pt);
    expect(decrypt(ct, k)).toBe(pt);
  });

  it('should produce different ciphertext each time (random IV)', () => {
    const k = generateKey();
    const pt = 'same plaintext';
    const a = encrypt(pt, k);
    const b = encrypt(pt, k);
    expect(a).not.toBe(b);
  });

  it('should fail decrypt with wrong key', () => {
    const k1 = generateKey();
    const k2 = generateKey();
    const ct = encrypt('secret', k1);
    expect(() => decrypt(ct, k2)).toThrow();
  });

  it('should respect AAD in authentication', () => {
    const k = generateKey();
    const ct = encrypt('data', k, 'context1');
    expect(() => decrypt(ct, k, 'context2')).toThrow();
    expect(decrypt(ct, k, 'context1')).toBe('data');
  });

  it('should validate key format', () => {
    const k = generateKey();
    expect(validateKey(k).valid).toBe(true);
    expect(validateKey('tooshort').valid).toBe(false);
    expect(validateKey('z'.repeat(64)).valid).toBe(false);
  });

  it('should run self-test successfully', () => {
    const r = selfTest();
    expect(r.ok).toBe(true);
  });

  it('should throw on too-short ciphertext', () => {
    const k = generateKey();
    expect(() => decrypt('abcd', k)).toThrow();
  });

  it('should encrypt empty string', () => {
    const k = generateKey();
    const ct = encrypt('', k);
    expect(decrypt(ct, k)).toBe('');
  });

  it('should handle UTF-8 multibyte', () => {
    const k = generateKey();
    const pt = '🎉🌟中文测试';
    const ct = encrypt(pt, k);
    expect(decrypt(ct, k)).toBe(pt);
  });

  it('should handle long plaintext', () => {
    const k = generateKey();
    const pt = 'A'.repeat(10000);
    const ct = encrypt(pt, k);
    expect(decrypt(ct, k)).toBe(pt);
  });
});
