// V2157 MemoryStream - Direction F Iter 12/30
// Streaming memory update channel
// Source: nanobot
export interface StreamEvent {
  id: string;
  topic: string;
  data: unknown;
  ts: number;
}

export interface Subscription {
  subId: string;
  topic: string;
  callback: (e: StreamEvent) => void;
}

export interface MemoryStreamState {
  events: StreamEvent[];
  subs: Map<string, Subscription>;
  delivered: Map<string, number>; // subId → count
}

export function createMemoryStreamState(): MemoryStreamState {
  return { events: [], subs: new Map(), delivered: new Map() };
}

export function publish(state: MemoryStreamState, topic: string, data: unknown): MemoryStreamState {
  const event: StreamEvent = { id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, topic, data, ts: Date.now() };
  const events = [...state.events, event];
  // Deliver to subs
  const delivered = new Map(state.delivered);
  for (const sub of state.subs.values()) {
    if (sub.topic === topic || sub.topic === '*') {
      delivered.set(sub.subId, (delivered.get(sub.subId) || 0) + 1);
    }
  }
  return { ...state, events, delivered };
}

export function subscribe(state: MemoryStreamState, subId: string, topic: string, callback: (e: StreamEvent) => void): MemoryStreamState {
  const subs = new Map(state.subs);
  subs.set(subId, { subId, topic, callback });
  return { ...state, subs };
}

export function unsubscribe(state: MemoryStreamState, subId: string): MemoryStreamState {
  const subs = new Map(state.subs);
  subs.delete(subId);
  const delivered = new Map(state.delivered);
  delivered.delete(subId);
  return { ...state, subs, delivered };
}

export function eventsForTopic(state: MemoryStreamState, topic: string): StreamEvent[] {
  return state.events.filter((e) => e.topic === topic);
}

export function subCount(state: MemoryStreamState): number {
  return state.subs.size;
}

export function deliveredCount(state: MemoryStreamState, subId: string): number {
  return state.delivered.get(subId) || 0;
}

export function memoryStreamHealth(state: MemoryStreamState): { events: number; subs: number; health: number } {
  return { events: state.events.length, subs: state.subs.size, health: state.events.length > 0 ? 1 : 0.5 };
}
