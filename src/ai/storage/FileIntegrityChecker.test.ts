import { describe, it, expect } from 'vitest';
import {
  fnv1a,
  fnv1a64,
  chainHash,
  createIntegrityState,
  recordFile,
  verifyFile,
  verifyAll,
  getRecord,
  removeRecord,
  recordCount,
  integrityHealth,
} from './FileIntegrityChecker';

describe('V2134 FileIntegrityChecker', () => {
  it('should compute FNV-1a deterministically', () => {
    expect(fnv1a('hello')).toBe(fnv1a('hello'));
    expect(fnv1a('hello')).not.toBe(fnv1a('world'));
  });

  it('should compute 64-bit FNV-1a as 16 hex chars', () => {
    expect(fnv1a64('hello')).toHaveLength(16);
  });

  it('should chain hashes', () => {
    const h1 = chainHash('0'.repeat(16), 'data1');
    const h2 = chainHash('0'.repeat(16), 'data1');
    expect(h1).toBe(h2);
  });

  it('should create empty integrity state', () => {
    const s = createIntegrityState();
    expect(recordCount(s)).toBe(0);
  });

  it('should record file and verify', () => {
    let s = createIntegrityState();
    s = recordFile(s, '/a.txt', 'hello');
    expect(recordCount(s)).toBe(1);
    expect(verifyFile(s, '/a.txt', 'hello').valid).toBe(true);
  });

  it('should detect tampered data', () => {
    let s = createIntegrityState();
    s = recordFile(s, '/a.txt', 'hello');
    expect(verifyFile(s, '/a.txt', 'HELLO').valid).toBe(false);
  });

  it('should report missing record', () => {
    const s = createIntegrityState();
    expect(verifyFile(s, '/a.txt', 'data').valid).toBe(false);
  });

  it('should verify all by root hash', () => {
    let s = createIntegrityState();
    s = recordFile(s, '/a', '1');
    s = recordFile(s, '/b', '2');
    expect(verifyAll(s).valid).toBe(true);
  });

  it('should get record', () => {
    let s = createIntegrityState();
    s = recordFile(s, '/a', '1');
    const r = getRecord(s, '/a');
    expect(r?.path).toBe('/a');
  });

  it('should remove record', () => {
    let s = createIntegrityState();
    s = recordFile(s, '/a', '1');
    s = removeRecord(s, '/a');
    expect(recordCount(s)).toBe(0);
  });

  it('should compute integrity health', () => {
    let s = createIntegrityState();
    s = recordFile(s, '/a', '1');
    const h = integrityHealth(s);
    expect(h.recordCount).toBe(1);
    expect(h.health).toBe(1);
  });
});
