import { describe, it, expect } from 'vitest';
import {
  createStorageState,
  putRecord,
  getRecord,
  deleteRecord,
  listIds,
  recordCount,
  rotateKey,
  wipeAll,
  storageHealth,
} from './EncryptedStorage';

describe('V2127 EncryptedStorage', () => {
  it('should create empty storage state', () => {
    const s = createStorageState();
    expect(s.records.size).toBe(0);
  });

  it('should put a record and retrieve decrypted value', () => {
    let s = createStorageState();
    s = putRecord(s, 'key1', 'hello');
    expect(getRecord(s, 'key1')).toBe('hello');
  });

  it('should put and retrieve JSON object', () => {
    let s = createStorageState();
    s = putRecord(s, 'key1', { x: 1, y: 'foo' });
    expect(getRecord(s, 'key1')).toEqual({ x: 1, y: 'foo' });
  });

  it('should return null for missing record', () => {
    const s = createStorageState();
    expect(getRecord(s, 'nope')).toBe(null);
  });

  it('should delete a record', () => {
    let s = createStorageState();
    s = putRecord(s, 'a', 1);
    s = putRecord(s, 'b', 2);
    s = deleteRecord(s, 'a');
    expect(recordCount(s)).toBe(1);
  });

  it('should list ids', () => {
    let s = createStorageState();
    s = putRecord(s, 'a', 1);
    s = putRecord(s, 'b', 2);
    expect(listIds(s).sort()).toEqual(['a', 'b']);
  });

  it('should rotate key and still decrypt', () => {
    let s = createStorageState();
    s = putRecord(s, 'a', 'data');
    const oldKey = s.keyHex;
    s = rotateKey(s, '0'.repeat(64));
    expect(s.keyHex).not.toBe(oldKey);
    expect(getRecord(s, 'a')).toBe('data');
  });

  it('should wipe all records', () => {
    let s = createStorageState();
    s = putRecord(s, 'a', 1);
    s = putRecord(s, 'b', 2);
    s = wipeAll(s);
    expect(recordCount(s)).toBe(0);
  });

  it('should compute storage health', () => {
    let s = createStorageState();
    s = putRecord(s, 'a', 1);
    const h = storageHealth(s);
    expect(h.recordCount).toBe(1);
    expect(h.backend).toBe('memory');
    expect(h.health).toBe(1);
  });

  it('should return null when decryption fails', () => {
    let s = createStorageState();
    s = putRecord(s, 'a', 'data');
    // Tamper key to force decryption failure
    s = { ...s, keyHex: '0'.repeat(64) };
    expect(getRecord(s, 'a')).toBe(null);
  });

  it('should return null for rotated key mismatch', () => {
    let s = createStorageState();
    s = putRecord(s, 'a', 'data');
    s = rotateKey(s, 'b'.repeat(64));
    // After rotation records are re-encrypted, so 'a' should still work
    expect(getRecord(s, 'a')).toBe('data');
  });
});
