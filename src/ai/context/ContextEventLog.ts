// V2282 ContextEventLog - Direction J Iter 17/30
// Append-only context event log
// Source: ruflo
export type ContextLogKind = 'add' | 'update' | 'delete' | 'retrieve' | 'archive';

export interface ContextLogEntry {
  seq: number;
  kind: ContextLogKind;
  key: string;
  ts: number;
}

export interface ContextEventLogState {
  events: ContextLogEntry[];
  nextSeq: number;
}

export function createContextEventLogState(): ContextEventLogState {
  return { events: [], nextSeq: 1 };
}

export function appendContextEvent(state: ContextEventLogState, kind: ContextLogKind, key: string): ContextEventLogState {
  const event: ContextLogEntry = { seq: state.nextSeq, kind, key, ts: Date.now() };
  return { ...state, events: [...state.events, event], nextSeq: state.nextSeq + 1 };
}

export function eventsForContextKey(state: ContextEventLogState, key: string): ContextLogEntry[] {
  return state.events.filter((e) => e.key === key);
}

export function eventsOfContextKind(state: ContextEventLogState, kind: ContextLogKind): ContextLogEntry[] {
  return state.events.filter((e) => e.kind === kind);
}

export function replayContextFromSeq(state: ContextEventLogState, fromSeq: number): ContextLogEntry[] {
  return state.events.filter((e) => e.seq >= fromSeq);
}

export function truncateContextLog(state: ContextEventLogState, keepLastN: number): ContextEventLogState {
  if (state.events.length <= keepLastN) return state;
  return { ...state, events: state.events.slice(-keepLastN) };
}

export function contextEventLogCount(state: ContextEventLogState): number {
  return state.events.length;
}

export function contextEventLogHealth(state: ContextEventLogState): { count: number; health: number } {
  return { count: state.events.length, health: state.events.length > 0 ? 1 : 0.5 };
}
