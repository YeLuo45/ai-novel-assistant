// V2223 OpWatcher - Direction H Iter 18/30
// Operation subscription feed
// Source: ruflo
export type OpWatchEvent = 'enqueue' | 'apply' | 'reject' | 'expire';

export interface OpWatch {
  watchId: string;
  opId: string;
  events: Set<OpWatchEvent>;
}

export interface OpWatcherState {
  watches: Map<string, OpWatch>;
  fired: Map<string, number>;
}

export function createOpWatcherState(): OpWatcherState {
  return { watches: new Map(), fired: new Map() };
}

export function addOpWatch(state: OpWatcherState, watchId: string, opId: string, events: OpWatchEvent[]): OpWatcherState {
  const watches = new Map(state.watches);
  watches.set(watchId, { watchId, opId, events: new Set(events) });
  return { ...state, watches };
}

export function removeOpWatch(state: OpWatcherState, watchId: string): OpWatcherState {
  const watches = new Map(state.watches);
  watches.delete(watchId);
  const fired = new Map(state.fired);
  fired.delete(watchId);
  return { ...state, watches, fired };
}

export function fireOpWatch(state: OpWatcherState, event: OpWatchEvent, opId: string): OpWatcherState {
  const fired = new Map(state.fired);
  for (const w of state.watches.values()) {
    if (w.opId === opId && w.events.has(event)) {
      fired.set(w.watchId, (fired.get(w.watchId) || 0) + 1);
    }
  }
  return { ...state, fired };
}

export function opWatchCount(state: OpWatcherState): number {
  return state.watches.size;
}

export function opWatchFireCount(state: OpWatcherState, watchId: string): number {
  return state.fired.get(watchId) || 0;
}

export function opWatcherHealth(state: OpWatcherState): { watches: number; fired: number; health: number } {
  const fired = Array.from(state.fired.values()).reduce((s, n) => s + n, 0);
  return { watches: state.watches.size, fired, health: state.watches.size > 0 ? 1 : 0.5 };
}
