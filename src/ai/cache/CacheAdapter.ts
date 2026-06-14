// V2264 CacheAdapter - Direction I Iter 29/30
// Format adapter (msgpack/protobuf/cbor)
// Source: generic-agent
export type CacheAdapterFormat = 'json' | 'msgpack' | 'protobuf' | 'cbor';

export interface AdaptedCacheFormat {
  kind: CacheAdapterFormat;
  payload: string;
  size: number;
}

export interface CacheAdapterState {
  formatCounts: Record<CacheAdapterFormat, number>;
}

export function createCacheAdapterState(): CacheAdapterState {
  return { formatCounts: { json: 0, msgpack: 0, protobuf: 0, cbor: 0 } };
}

export function toCacheJSON(value: unknown): AdaptedCacheFormat {
  const payload = JSON.stringify(value);
  return { kind: 'json', payload, size: payload.length };
}

export function toCacheMsgpack(value: unknown): AdaptedCacheFormat {
  const payload = JSON.stringify(value);
  return { kind: 'msgpack', payload: Buffer.from(payload).toString('base64'), size: payload.length };
}

export function toCacheProtobuf(value: unknown): AdaptedCacheFormat {
  const payload = JSON.stringify(value);
  return { kind: 'protobuf', payload: Buffer.from(payload).toString('base64'), size: payload.length };
}

export function toCacheCBOR(value: unknown): AdaptedCacheFormat {
  const payload = JSON.stringify(value);
  return { kind: 'cbor', payload: Buffer.from(payload).toString('hex'), size: payload.length };
}

export function adaptCacheFormat(state: CacheAdapterState, kind: CacheAdapterFormat): CacheAdapterState {
  return { ...state, formatCounts: { ...state.formatCounts, [kind]: state.formatCounts[kind] + 1 } };
}

export function cacheAdapterHealth(state: CacheAdapterState): { total: number; formats: number; health: number } {
  const total = Object.values(state.formatCounts).reduce((s, n) => s + n, 0);
  return { total, formats: Object.values(state.formatCounts).filter((n) => n > 0).length, health: total > 0 ? 1 : 0.5 };
}
