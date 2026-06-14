import { describe, it, expect } from 'vitest';
import { createCacheAdapterState, toCacheJSON, toCacheMsgpack, toCacheProtobuf, toCacheCBOR, adaptCacheFormat, cacheAdapterHealth } from './CacheAdapter';

describe('V2264 CacheAdapter', () => {
  it('should create empty state', () => {
    const s = createCacheAdapterState();
    expect(s.formatCounts.json).toBe(0);
  });

  it('should convert to JSON', () => {
    const r = toCacheJSON({ x: 1 });
    expect(r.kind).toBe('json');
  });

  it('should convert to msgpack', () => {
    const r = toCacheMsgpack({ x: 1 });
    expect(r.kind).toBe('msgpack');
  });

  it('should convert to protobuf', () => {
    const r = toCacheProtobuf({ x: 1 });
    expect(r.kind).toBe('protobuf');
  });

  it('should convert to CBOR', () => {
    const r = toCacheCBOR({ x: 1 });
    expect(r.kind).toBe('cbor');
  });

  it('should adapt and count', () => {
    let s = createCacheAdapterState();
    s = adaptCacheFormat(s, 'json');
    s = adaptCacheFormat(s, 'json');
    expect(s.formatCounts.json).toBe(2);
  });

  it('should compute health', () => {
    let s = createCacheAdapterState();
    s = adaptCacheFormat(s, 'json');
    const h = cacheAdapterHealth(s);
    expect(h.health).toBe(1);
  });
});
