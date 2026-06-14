// V2283 ContextWatcher - Direction J Iter 18/30
// Context subscription feed
// Source: ruflo
export type ContextWatchEvent = 'add' | 'update' | 'delete' | 'expire';

export interface ContextWatch {
  watchId: string;
  key: string;
  events: Set<ContextWatchEvent>;
}

export interface ContextWatcherState {
  watches: Map<string, ContextWatch>;
  fired: Map<string, number>;
}

export function createContextWatcherState(): ContextWatcherState {
  return { watches: new Map(), fired: new Map() };
}

export function addContextWatch(state: ContextWatcherState, watchId: string, key: string, events: ContextWatchEvent[]): ContextWatcherState {
  const watches = new Map(state.watches);
  watches.set(watchId, { watchId, key, events: new Set(events) });
  return { ...state, watches };
}

export function removeContextWatch(state: ContextWatcherState, watchId: string): ContextWatcherState {
  const watches = new Map(state.watches);
  watches.delete(watchId);
  const fired = new Map(state.fired);
  fired.delete(watchId);
  return { ...state, watches, fired };
}

export function fireContextWatch(state: ContextWatcherState, event: ContextWatchEvent, key: string): ContextWatcherState {
  const fired = new Map(state.fired);
  for (const w of state.watches.values()) {
    if (w.key === key && w.events.has(event)) {
      fired.set(w.watchId, (fired.get(w.watchId) || 0) + 1);
    }
  }
  return { ...state, fired };
}

export function contextWatchCount(state: ContextWatcherState): number {
  return state.watches.size;
}

export function contextWatchFireCount(state: ContextWatcherState, watchId: string): number {
  return state.fired.get(watchId) || 0;
}

export function contextWatcherHealth(state: ContextWatcherState): { watches: number; fired: number; health: number } {
  const fired = Array.from(state.fired.values()).reduce((s, n) => s + n, 0);
  return { watches: state.watches.size, fired, health: state.watches.size > 0 ? 1 : 0.5 };
}
