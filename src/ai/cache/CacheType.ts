// V2242 CacheType - Direction I Iter 7/30
// Cache type system (string/json/binary/blob)
// Source: thunderbolt
export type CacheValueType = 'string' | 'json' | 'binary' | 'blob';

export interface TypedCacheEntry {
  key: string;
  type: CacheValueType;
  value: unknown;
  size: number;
}

export interface CacheTypeState {
  entries: Map<string, TypedCacheEntry>;
  byType: Map<CacheValueType, number>;
}

export function createCacheTypeState(): CacheTypeState {
  return { entries: new Map(), byType: new Map() };
}

export function setTypedCache(state: CacheTypeState, key: string, value: unknown, type: CacheValueType): CacheTypeState {
  const size = JSON.stringify(value).length;
  const entry: TypedCacheEntry = { key, type, value, size };
  const entries = new Map(state.entries);
  entries.set(key, entry);
  const byType = new Map(state.byType);
  byType.set(type, (byType.get(type) || 0) + 1);
  return { ...state, entries, byType };
}

export function getTypedCache(state: CacheTypeState, key: string): unknown {
  return state.entries.get(key)?.value;
}

export function getEntryType(state: CacheTypeState, key: string): CacheValueType | undefined {
  return state.entries.get(key)?.type;
}

export function entriesByType(state: CacheTypeState, type: CacheValueType): TypedCacheEntry[] {
  return Array.from(state.entries.values()).filter((e) => e.type === type);
}

export function countByType(state: CacheTypeState): Record<CacheValueType, number> {
  const counts: Record<CacheValueType, number> = { string: 0, json: 0, binary: 0, blob: 0 };
  for (const [k, v] of state.byType) counts[k] = v;
  return counts;
}

export function cacheTypeHealth(state: CacheTypeState): { entries: number; health: number } {
  return { entries: state.entries.size, health: state.entries.size > 0 ? 1 : 0.5 };
}
