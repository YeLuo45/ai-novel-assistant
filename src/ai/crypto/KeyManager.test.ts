import { describe, it, expect } from 'vitest';
import {
  createKeyManagerState,
  deriveAndStore,
  generateAndStore,
  getKey,
  revokeKey,
  destroyKey,
  activeKeys,
  encryptWithKey,
  decryptWithKey,
  keyInventory,
} from './KeyManager';

describe('V2126 KeyManager', () => {
  it('should create empty key manager', () => {
    const s = createKeyManagerState();
    expect(s.keys).toEqual([]);
    expect(s.defaultKeyId).toBe('');
  });

  it('should derive key from password', () => {
    const { state, key } = deriveAndStore(createKeyManagerState(), 'mypassword', 'data-encryption');
    expect(state.keys).toHaveLength(1);
    expect(key.status).toBe('active');
    expect(state.defaultKeyId).toBe(key.id);
  });

  it('should generate random key', () => {
    const { state, key } = generateAndStore(createKeyManagerState(), 'session');
    expect(key.keyHex.length).toBe(64);
    expect(state.defaultKeyId).toBe(key.id);
  });

  it('should look up key by id', () => {
    const { state, key } = generateAndStore(createKeyManagerState(), 'x');
    expect(getKey(state, key.id)?.id).toBe(key.id);
    expect(getKey(state, 'nope')).toBeUndefined();
  });

  it('should revoke key', () => {
    const { state, key } = generateAndStore(createKeyManagerState(), 'x');
    const r = revokeKey(state, key.id);
    expect(getKey(r, key.id)?.status).toBe('revoked');
  });

  it('should destroy key by overwriting hex', () => {
    const { state, key } = generateAndStore(createKeyManagerState(), 'x');
    const d = destroyKey(state, key.id);
    const k = getKey(d, key.id);
    expect(k?.keyHex).toBe('0'.repeat(key.keyHex.length));
    expect(k?.status).toBe('destroyed');
  });

  it('should list active keys only', () => {
    let s = createKeyManagerState();
    const { state: s1, key: k1 } = generateAndStore(s, 'a');
    s = s1;
    const { state: s2, key: k2 } = generateAndStore(s, 'b');
    s = revokeKey(s2, k2.id);
    const active = activeKeys(s);
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe(k1.id);
  });

  it('should encrypt and decrypt with managed key', () => {
    const { state, key } = generateAndStore(createKeyManagerState(), 'test');
    const enc = encryptWithKey(state, 'secret data', key.id);
    expect('ciphertext' in enc).toBe(true);
    if ('ciphertext' in enc) {
      const dec = decryptWithKey(state, enc.ciphertext, key.id);
      expect(dec).toBe('secret data');
    }
  });

  it('should fail encrypt with revoked key', () => {
    const { state, key } = generateAndStore(createKeyManagerState(), 'test');
    const revoked = revokeKey(state, key.id);
    const enc = encryptWithKey(revoked, 'x', key.id);
    expect('error' in enc).toBe(true);
  });

  it('should fail decrypt with destroyed key', () => {
    const { state, key } = generateAndStore(createKeyManagerState(), 'test');
    const enc = encryptWithKey(state, 'x', key.id);
    if (!('ciphertext' in enc)) throw new Error('expected ciphertext');
    const destroyed = destroyKey(state, key.id);
    const dec = decryptWithKey(destroyed, enc.ciphertext, key.id);
    expect('error' in (dec as any)).toBe(true);
  });

  it('should count keys by status', () => {
    let s = createKeyManagerState();
    const { state: s1, key: k1 } = generateAndStore(s, 'a');
    s = revokeKey(s1, k1.id);
    const inv = keyInventory(s);
    expect(inv.revoked).toBe(1);
    expect(inv.active).toBe(0);
  });
});
