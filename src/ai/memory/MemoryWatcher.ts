// V2163 MemoryWatcher - Direction F Iter 18/30
// Subscription-based change feed
// Source: ruflo
export type WatchEvent = 'create' | 'update' | 'delete' | 'expire';

export interface WatchHandler {
  watchId: string;
  memId: string;
  events: Set<WatchEvent>;
  callback: (event: WatchEvent, memId: string) => void;
}

export interface WatcherState {
  watches: Map<string, WatchHandler>;
  fired: Map<string, number>;
}

export function createWatcherState(): WatcherState {
  return { watches: new Map(), fired: new Map() };
}

export function addWatch(state: WatcherState, watchId: string, memId: string, events: WatchEvent[], callback: (event: WatchEvent, memId: string) => void): WatcherState {
  const watches = new Map(state.watches);
  watches.set(watchId, { watchId, memId, events: new Set(events), callback });
  return { ...state, watches };
}

export function removeWatch(state: WatcherState, watchId: string): WatcherState {
  const watches = new Map(state.watches);
  watches.delete(watchId);
  const fired = new Map(state.fired);
  fired.delete(watchId);
  return { ...state, watches, fired };
}

export function fireEvent(state: WatcherState, event: WatchEvent, memId: string): WatcherState {
  const fired = new Map(state.fired);
  for (const w of state.watches.values()) {
    if (w.memId === memId && w.events.has(event)) {
      fired.set(w.watchId, (fired.get(w.watchId) || 0) + 1);
    }
  }
  return { ...state, fired };
}

export function watchCount(state: WatcherState): number {
  return state.watches.size;
}

export function getFireCount(state: WatcherState, watchId: string): number {
  return state.fired.get(watchId) || 0;
}

export function watchesForMemory(state: WatcherState, memId: string): WatchHandler[] {
  return Array.from(state.watches.values()).filter((w) => w.memId === memId);
}

export function memoryWatcherHealth(state: WatcherState): { watches: number; fired: number; health: number } {
  const fired = Array.from(state.fired.values()).reduce((s, n) => s + n, 0);
  return { watches: state.watches.size, fired, health: state.watches.size > 0 ? 1 : 0.5 };
}
