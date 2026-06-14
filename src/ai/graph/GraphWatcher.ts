// V2193 GraphWatcher - Direction G Iter 18/30
// Subscription-based change feed
// Source: ruflo
export type GraphWatchEvent = 'add' | 'remove' | 'update';

export interface GraphWatchHandler {
  watchId: string;
  nodeId: string;
  events: Set<GraphWatchEvent>;
}

export interface GraphWatcherState {
  watches: Map<string, GraphWatchHandler>;
  fired: Map<string, number>;
}

export function createGraphWatcherState(): GraphWatcherState {
  return { watches: new Map(), fired: new Map() };
}

export function addGraphWatch(state: GraphWatcherState, watchId: string, nodeId: string, events: GraphWatchEvent[]): GraphWatcherState {
  const watches = new Map(state.watches);
  watches.set(watchId, { watchId, nodeId, events: new Set(events) });
  return { ...state, watches };
}

export function removeGraphWatch(state: GraphWatcherState, watchId: string): GraphWatcherState {
  const watches = new Map(state.watches);
  watches.delete(watchId);
  const fired = new Map(state.fired);
  fired.delete(watchId);
  return { ...state, watches, fired };
}

export function fireGraphEvent(state: GraphWatcherState, event: GraphWatchEvent, nodeId: string): GraphWatcherState {
  const fired = new Map(state.fired);
  for (const w of state.watches.values()) {
    if (w.nodeId === nodeId && w.events.has(event)) {
      fired.set(w.watchId, (fired.get(w.watchId) || 0) + 1);
    }
  }
  return { ...state, fired };
}

export function graphWatchCount(state: GraphWatcherState): number {
  return state.watches.size;
}

export function graphWatchFireCount(state: GraphWatcherState, watchId: string): number {
  return state.fired.get(watchId) || 0;
}

export function graphWatcherHealth(state: GraphWatcherState): { watches: number; fired: number; health: number } {
  const fired = Array.from(state.fired.values()).reduce((s, n) => s + n, 0);
  return { watches: state.watches.size, fired, health: state.watches.size > 0 ? 1 : 0.5 };
}
