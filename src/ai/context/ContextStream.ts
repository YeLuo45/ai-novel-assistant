// V2276 ContextStream - Direction J Iter 11/30
// Context change stream
// Source: nanobot
export interface ContextStreamEvent {
  id: string;
  topic: string;
  key: string;
  ts: number;
}

export interface ContextStreamSub {
  subId: string;
  topic: string;
}

export interface ContextStreamState {
  events: ContextStreamEvent[];
  subs: Map<string, ContextStreamSub>;
  delivered: Map<string, number>;
}

export function createContextStreamState(): ContextStreamState {
  return { events: [], subs: new Map(), delivered: new Map() };
}

export function publishContextEvent(state: ContextStreamState, topic: string, key: string): ContextStreamState {
  const event: ContextStreamEvent = { id: `csev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, topic, key, ts: Date.now() };
  const events = [...state.events, event];
  const delivered = new Map(state.delivered);
  for (const sub of state.subs.values()) {
    if (sub.topic === topic || sub.topic === '*') delivered.set(sub.subId, (delivered.get(sub.subId) || 0) + 1);
  }
  return { ...state, events, delivered };
}

export function subscribeContext(state: ContextStreamState, subId: string, topic: string): ContextStreamState {
  const subs = new Map(state.subs);
  subs.set(subId, { subId, topic });
  return { ...state, subs };
}

export function unsubscribeContext(state: ContextStreamState, subId: string): ContextStreamState {
  const subs = new Map(state.subs);
  subs.delete(subId);
  const delivered = new Map(state.delivered);
  delivered.delete(subId);
  return { ...state, subs, delivered };
}

export function contextEventsForTopic(state: ContextStreamState, topic: string): ContextStreamEvent[] {
  return state.events.filter((e) => e.topic === topic);
}

export function contextStreamHealth(state: ContextStreamState): { events: number; subs: number; health: number } {
  return { events: state.events.length, subs: state.subs.size, health: state.events.length > 0 ? 1 : 0.5 };
}
