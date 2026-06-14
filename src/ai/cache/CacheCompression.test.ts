import { describe, it, expect } from 'vitest';
import { createCacheCompressionState, compressValue, decompressValue, setCompressionFormat, compressionRatio, cacheCompressionHealth } from './CacheCompression';

describe('V2240 CacheCompression', () => {
  it('should create state', () => {
    const s = createCacheCompressionState();
    expect(s.totalCompressions).toBe(0);
  });

  it('should compress with none format', () => {
    const s = createCacheCompressionState('none');
    const r = compressValue(s, { x: 1 });
    expect(r.compressed).toContain('x');
  });

  it('should roundtrip with none', () => {
    const s = createCacheCompressionState('none');
    const r = compressValue(s, { x: 1 });
    const d = decompressValue(s, r.compressed);
    expect(d.value).toEqual({ x: 1 });
  });

  it('should compress RLE', () => {
    const s = createCacheCompressionState('rle');
    const r = compressValue(s, 'aaabbbcccdddeee');
    expect(r.compressed.length).toBeLessThan('aaabbbcccdddeee'.length);
  });

  it('should roundtrip RLE', () => {
    const s = createCacheCompressionState('rle');
    const r = compressValue(s, 'aaabbbcccdddeee');
    const d = decompressValue(s, r.compressed);
    expect(d.value).toBe('aaabbbcccdddeee');
  });

  it('should set format', () => {
    let s = createCacheCompressionState();
    s = setCompressionFormat(s, 'lzw');
    expect(s.format).toBe('lzw');
  });

  it('should compute compression ratio', () => {
    const s = createCacheCompressionState();
    expect(compressionRatio(s)).toBe(1);
  });

  it('should compute health', () => {
    let s = createCacheCompressionState();
    s = compressValue(s, 'x');
    const h = cacheCompressionHealth(s);
    expect(h.health).toBe(1);
  });
});
