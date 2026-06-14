// V2186 GraphStream - Direction G Iter 11/30
// Streaming graph change channel
// Source: nanobot
export interface GraphStreamEvent {
  id: string;
  topic: string;
  data: unknown;
  ts: number;
}

export interface GraphStreamSub {
  subId: string;
  topic: string;
}

export interface GraphStreamState {
  events: GraphStreamEvent[];
  subs: Map<string, GraphStreamSub>;
  delivered: Map<string, number>;
}

export function createGraphStreamState(): GraphStreamState {
  return { events: [], subs: new Map(), delivered: new Map() };
}

export function publishGraphEvent(state: GraphStreamState, topic: string, data: unknown): GraphStreamState {
  const event: GraphStreamEvent = { id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, topic, data, ts: Date.now() };
  const events = [...state.events, event];
  const delivered = new Map(state.delivered);
  for (const sub of state.subs.values()) {
    if (sub.topic === topic || sub.topic === '*') delivered.set(sub.subId, (delivered.get(sub.subId) || 0) + 1);
  }
  return { ...state, events, delivered };
}

export function subscribeGraph(state: GraphStreamState, subId: string, topic: string): GraphStreamState {
  const subs = new Map(state.subs);
  subs.set(subId, { subId, topic });
  return { ...state, subs };
}

export function unsubscribeGraph(state: GraphStreamState, subId: string): GraphStreamState {
  const subs = new Map(state.subs);
  subs.delete(subId);
  const delivered = new Map(state.delivered);
  delivered.delete(subId);
  return { ...state, subs, delivered };
}

export function graphEventsForTopic(state: GraphStreamState, topic: string): GraphStreamEvent[] {
  return state.events.filter((e) => e.topic === topic);
}

export function graphStreamSubCount(state: GraphStreamState): number {
  return state.subs.size;
}

export function graphStreamHealth(state: GraphStreamState): { events: number; subs: number; health: number } {
  return { events: state.events.length, subs: state.subs.size, health: state.events.length > 0 ? 1 : 0.5 };
}
