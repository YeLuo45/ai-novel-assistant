// V2252 CacheEventLog - Direction I Iter 17/30
// Append-only cache event log
// Source: ruflo
export type CacheLogKind = 'set' | 'get' | 'delete' | 'evict' | 'expire';

export interface CacheLogEntry {
  seq: number;
  kind: CacheLogKind;
  key: string;
  ts: number;
}

export interface CacheEventLogState {
  events: CacheLogEntry[];
  nextSeq: number;
}

export function createCacheEventLogState(): CacheEventLogState {
  return { events: [], nextSeq: 1 };
}

export function appendCacheEvent(state: CacheEventLogState, kind: CacheLogKind, key: string): CacheEventLogState {
  const event: CacheLogEntry = { seq: state.nextSeq, kind, key, ts: Date.now() };
  return { ...state, events: [...state.events, event], nextSeq: state.nextSeq + 1 };
}

export function eventsForKey(state: CacheEventLogState, key: string): CacheLogEntry[] {
  return state.events.filter((e) => e.key === key);
}

export function eventsByKind(state: CacheEventLogState, kind: CacheLogKind): CacheLogEntry[] {
  return state.events.filter((e) => e.kind === kind);
}

export function replayFromSeq(state: CacheEventLogState, fromSeq: number): CacheLogEntry[] {
  return state.events.filter((e) => e.seq >= fromSeq);
}

export function truncateCacheLog(state: CacheEventLogState, keepLastN: number): CacheEventLogState {
  if (state.events.length <= keepLastN) return state;
  return { ...state, events: state.events.slice(-keepLastN) };
}

export function cacheEventLogCount(state: CacheEventLogState): number {
  return state.events.length;
}

export function cacheEventLogHealth(state: CacheEventLogState): { count: number; health: number } {
  return { count: state.events.length, health: state.events.length > 0 ? 1 : 0.5 };
}
