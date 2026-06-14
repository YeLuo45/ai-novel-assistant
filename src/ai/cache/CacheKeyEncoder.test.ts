import { describe, it, expect } from 'vitest';
import { createCacheKeyEncoderState, encodeKey, getEncodedKey, keyCount, keysByBucket, cacheKeyEncoderHealth } from './CacheKeyEncoder';

describe('V2236 CacheKeyEncoder', () => {
  it('should create empty state', () => {
    const s = createCacheKeyEncoderState();
    expect(keyCount(s)).toBe(0);
  });

  it('should encode key', () => {
    const s = createCacheKeyEncoderState();
    const { key } = encodeKey(s, 'user:1');
    expect(key.hash).toHaveLength(8);
    expect(key.bucket).toBeGreaterThanOrEqual(0);
  });

  it('should get encoded key', () => {
    const s = createCacheKeyEncoderState();
    const { key, state } = encodeKey(s, 'user:1');
    expect(getEncodedKey(state, 'user:1')?.raw).toBe('user:1');
  });

  it('should return undefined for unknown', () => {
    const s = createCacheKeyEncoderState();
    expect(getEncodedKey(s, 'unknown')).toBeUndefined();
  });

  it('should get keys by bucket', () => {
    let s = createCacheKeyEncoderState();
    s = encodeKey(s, 'k1').state;
    s = encodeKey(s, 'k2').state;
    s = encodeKey(s, 'k3').state;
    const bucket1 = s.encodings.get('k1')!.bucket;
    expect(keysByBucket(s, bucket1).length).toBeGreaterThan(0);
  });

  it('should compute health', () => {
    let s = createCacheKeyEncoderState();
    s = encodeKey(s, 'k1').state;
    const h = cacheKeyEncoderHealth(s);
    expect(h.health).toBe(1);
  });
});
