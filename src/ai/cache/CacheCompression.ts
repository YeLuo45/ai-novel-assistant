// V2240 CacheCompression - Direction I Iter 5/30
// Value compression/decompression
// Source: thunderbolt
export type CompressionFormat = 'none' | 'rle' | 'lzw' | 'deflate';

export interface CacheCompressionState {
  totalCompressions: number;
  totalDecompressions: number;
  bytesSaved: number;
  format: CompressionFormat;
}

export function createCacheCompressionState(format: CompressionFormat = 'none'): CacheCompressionState {
  return { totalCompressions: 0, totalDecompressions: 0, bytesSaved: 0, format };
}

export function compressValue(state: CacheCompressionState, value: unknown): { state: CacheCompressionState; compressed: string } {
  const raw = JSON.stringify(value);
  const compressed = state.format === 'rle' ? rleCompress(raw) : raw;
  return { state: { ...state, totalCompressions: state.totalCompressions + 1, bytesSaved: state.bytesSaved + (raw.length - compressed.length) }, compressed };
}

export function decompressValue(state: CacheCompressionState, compressed: string): { state: CacheCompressionState; value: unknown } {
  const raw = state.format === 'rle' ? rleDecompress(compressed) : compressed;
  return { state: { ...state, totalDecompressions: state.totalDecompressions + 1 }, value: JSON.parse(raw) };
}

function rleCompress(s: string): string {
  if (s.length === 0) return s;
  let result = '';
  let count = 1;
  for (let i = 1; i < s.length; i++) {
    if (s[i] === s[i - 1] && count < 9) count++;
    else { result += count + s[i - 1]; count = 1; }
  }
  result += count + s[s.length - 1];
  return result;
}

function rleDecompress(s: string): string {
  let result = '';
  for (let i = 0; i < s.length; i += 2) {
    const count = parseInt(s[i], 10);
    const char = s[i + 1];
    result += char.repeat(count);
  }
  return result;
}

export function setCompressionFormat(state: CacheCompressionState, format: CompressionFormat): CacheCompressionState {
  return { ...state, format };
}

export function compressionRatio(state: CacheCompressionState): number {
  if (state.totalCompressions === 0) return 1;
  return Math.max(0, 1 - state.bytesSaved / (state.totalCompressions * 100));
}

export function cacheCompressionHealth(state: CacheCompressionState): { compressions: number; bytesSaved: number; health: number } {
  return { compressions: state.totalCompressions, bytesSaved: state.bytesSaved, health: state.totalCompressions > 0 ? 1 : 0.5 };
}
