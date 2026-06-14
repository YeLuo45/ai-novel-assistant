// V2162 MemoryEventLog - Direction F Iter 17/30
// Append-only event sourcing
// Source: ruflo
export type MemoryEventKind = 'add' | 'update' | 'access' | 'delete' | 'snapshot';

export interface MemoryLogEvent {
  seq: number;
  kind: MemoryEventKind;
  memId: string;
  data: unknown;
  ts: number;
}

export interface MemoryEventLogState {
  events: MemoryLogEvent[];
  nextSeq: number;
}

export function createMemoryEventLogState(): MemoryEventLogState {
  return { events: [], nextSeq: 1 };
}

export function appendLogEvent(state: MemoryEventLogState, kind: MemoryEventKind, memId: string, data: unknown): MemoryEventLogState {
  const event: MemoryLogEvent = { seq: state.nextSeq, kind, memId, data, ts: Date.now() };
  return { ...state, events: [...state.events, event], nextSeq: state.nextSeq + 1 };
}

export function eventsFor(state: MemoryEventLogState, memId: string): MemoryLogEvent[] {
  return state.events.filter((e) => e.memId === memId);
}

export function eventsByKind(state: MemoryEventLogState, kind: MemoryEventKind): MemoryLogEvent[] {
  return state.events.filter((e) => e.kind === kind);
}

export function replayFrom(state: MemoryEventLogState, fromSeq: number): MemoryLogEvent[] {
  return state.events.filter((e) => e.seq >= fromSeq);
}

export function eventCount(state: MemoryEventLogState): number {
  return state.events.length;
}

export function latestEvent(state: MemoryEventLogState): MemoryLogEvent | undefined {
  if (state.events.length === 0) return undefined;
  return state.events[state.events.length - 1];
}

export function truncateLog(state: MemoryEventLogState, keepLastN: number): MemoryEventLogState {
  if (state.events.length <= keepLastN) return state;
  return { ...state, events: state.events.slice(-keepLastN) };
}

export function memoryEventLogHealth(state: MemoryEventLogState): { count: number; nextSeq: number; health: number } {
  return { count: state.events.length, nextSeq: state.nextSeq, health: state.events.length > 0 ? 1 : 0.5 };
}
