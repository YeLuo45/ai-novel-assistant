// V2253 CacheWatcher - Direction I Iter 18/30
// Cache subscription feed
// Source: ruflo
export type CacheWatchEvent = 'set' | 'delete' | 'evict' | 'expire';

export interface CacheWatch {
  watchId: string;
  key: string;
  events: Set<CacheWatchEvent>;
}

export interface CacheWatcherState {
  watches: Map<string, CacheWatch>;
  fired: Map<string, number>;
}

export function createCacheWatcherState(): CacheWatcherState {
  return { watches: new Map(), fired: new Map() };
}

export function addCacheWatch(state: CacheWatcherState, watchId: string, key: string, events: CacheWatchEvent[]): CacheWatcherState {
  const watches = new Map(state.watches);
  watches.set(watchId, { watchId, key, events: new Set(events) });
  return { ...state, watches };
}

export function removeCacheWatch(state: CacheWatcherState, watchId: string): CacheWatcherState {
  const watches = new Map(state.watches);
  watches.delete(watchId);
  const fired = new Map(state.fired);
  fired.delete(watchId);
  return { ...state, watches, fired };
}

export function fireCacheWatch(state: CacheWatcherState, event: CacheWatchEvent, key: string): CacheWatcherState {
  const fired = new Map(state.fired);
  for (const w of state.watches.values()) {
    if (w.key === key && w.events.has(event)) {
      fired.set(w.watchId, (fired.get(w.watchId) || 0) + 1);
    }
  }
  return { ...state, fired };
}

export function cacheWatchCount(state: CacheWatcherState): number {
  return state.watches.size;
}

export function cacheWatchFireCount(state: CacheWatcherState, watchId: string): number {
  return state.fired.get(watchId) || 0;
}

export function cacheWatcherHealth(state: CacheWatcherState): { watches: number; fired: number; health: number } {
  const fired = Array.from(state.fired.values()).reduce((s, n) => s + n, 0);
  return { watches: state.watches.size, fired, health: state.watches.size > 0 ? 1 : 0.5 };
}
