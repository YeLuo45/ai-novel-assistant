// V2236 CacheKeyEncoder - Direction I Iter 1/30
// Encode cache keys to compact wire format
// Source: thunderbolt
export interface EncodedKey {
  raw: string;
  hash: string;
  bucket: number;
  ts: number;
}

export interface CacheKeyEncoderState {
  encodings: Map<string, EncodedKey>;
  counter: number;
}

export function createCacheKeyEncoderState(): CacheKeyEncoderState {
  return { encodings: new Map(), counter: 0 };
}

function fnv1a(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function encodeKey(state: CacheKeyEncoderState, raw: string): { state: CacheKeyEncoderState; key: EncodedKey } {
  state.counter++;
  const key: EncodedKey = { raw, hash: fnv1a(raw), bucket: state.counter % 256, ts: Date.now() };
  const encodings = new Map(state.encodings);
  encodings.set(raw, key);
  return { state: { ...state, encodings }, key };
}

export function getEncodedKey(state: CacheKeyEncoderState, raw: string): EncodedKey | undefined {
  return state.encodings.get(raw);
}

export function keyCount(state: CacheKeyEncoderState): number {
  return state.encodings.size;
}

export function keysByBucket(state: CacheKeyEncoderState, bucket: number): EncodedKey[] {
  return Array.from(state.encodings.values()).filter((k) => k.bucket === bucket);
}

export function cacheKeyEncoderHealth(state: CacheKeyEncoderState): { count: number; health: number } {
  return { count: state.encodings.size, health: state.encodings.size > 0 ? 1 : 0.5 };
}
