// V2246 CacheStream - Direction I Iter 11/30
// Cache change stream
// Source: nanobot
export interface CacheStreamEvent {
  id: string;
  topic: string;
  key: string;
  ts: number;
}

export interface CacheStreamSub {
  subId: string;
  topic: string;
}

export interface CacheStreamState {
  events: CacheStreamEvent[];
  subs: Map<string, CacheStreamSub>;
  delivered: Map<string, number>;
}

export function createCacheStreamState(): CacheStreamState {
  return { events: [], subs: new Map(), delivered: new Map() };
}

export function publishCacheEvent(state: CacheStreamState, topic: string, key: string): CacheStreamState {
  const event: CacheStreamEvent = { id: `cevt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, topic, key, ts: Date.now() };
  const events = [...state.events, event];
  const delivered = new Map(state.delivered);
  for (const sub of state.subs.values()) {
    if (sub.topic === topic || sub.topic === '*') delivered.set(sub.subId, (delivered.get(sub.subId) || 0) + 1);
  }
  return { ...state, events, delivered };
}

export function subscribeCache(state: CacheStreamState, subId: string, topic: string): CacheStreamState {
  const subs = new Map(state.subs);
  subs.set(subId, { subId, topic });
  return { ...state, subs };
}

export function unsubscribeCache(state: CacheStreamState, subId: string): CacheStreamState {
  const subs = new Map(state.subs);
  subs.delete(subId);
  const delivered = new Map(state.delivered);
  delivered.delete(subId);
  return { ...state, subs, delivered };
}

export function cacheEventsForTopic(state: CacheStreamState, topic: string): CacheStreamEvent[] {
  return state.events.filter((e) => e.topic === topic);
}

export function cacheStreamHealth(state: CacheStreamState): { events: number; subs: number; health: number } {
  return { events: state.events.length, subs: state.subs.size, health: state.events.length > 0 ? 1 : 0.5 };
}
