import { describe, it, expect } from 'vitest';
import { createMemoryStorage, putMemory, getMemory, getVersion, listKeys, versionCount, deleteMemory, rollbackTo, memoryStorageHealth } from './MemoryStorage';

describe('V2147 MemoryStorage', () => {
  it('should create empty storage', () => {
    const s = createMemoryStorage();
    expect(listKeys(s)).toEqual([]);
  });

  it('should put and get memory', () => {
    let s = createMemoryStorage();
    s = putMemory(s, 'k1', 'data');
    expect(getMemory(s, 'k1')).toBe('data');
  });

  it('should track versions', () => {
    let s = createMemoryStorage();
    s = putMemory(s, 'k1', 'v1');
    s = putMemory(s, 'k1', 'v2');
    expect(versionCount(s, 'k1')).toBe(2);
    expect(getMemory(s, 'k1')).toBe('v2');
  });

  it('should retrieve specific version', () => {
    let s = createMemoryStorage();
    s = putMemory(s, 'k1', 'v1');
    s = putMemory(s, 'k1', 'v2');
    const m = s.store.get('k1')!;
    const oldVersionId = m.versions[0].versionId;
    expect(getVersion(s, 'k1', oldVersionId)).toBe('v1');
  });

  it('should rollback to version', () => {
    let s = createMemoryStorage();
    s = putMemory(s, 'k1', 'v1');
    s = putMemory(s, 'k1', 'v2');
    const m = s.store.get('k1')!;
    const old = m.versions[0].versionId;
    s = rollbackTo(s, 'k1', old);
    expect(getMemory(s, 'k1')).toBe('v1');
  });

  it('should rollback idempotent for missing version', () => {
    let s = createMemoryStorage();
    s = putMemory(s, 'k1', 'v1');
    const out = rollbackTo(s, 'k1', 'no-such');
    expect(getMemory(out, 'k1')).toBe('v1');
  });

  it('should delete memory', () => {
    let s = createMemoryStorage();
    s = putMemory(s, 'k1', 'x');
    s = deleteMemory(s, 'k1');
    expect(getMemory(s, 'k1')).toBe(null);
  });

  it('should return null for missing key', () => {
    const s = createMemoryStorage();
    expect(getMemory(s, 'nope')).toBe(null);
  });

  it('should compute health', () => {
    const s = createMemoryStorage();
    const h = memoryStorageHealth(s);
    expect(h.keys).toBe(0);
    expect(h.health).toBe(0.5);
  });
});
