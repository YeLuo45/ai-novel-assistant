// V2222 OpEventLog - Direction H Iter 17/30
// Operation event log
// Source: ruflo
export type OpEventKind = 'enqueue' | 'apply' | 'reject' | 'expire' | 'broadcast';

export interface OpEvent {
  seq: number;
  opId: string;
  kind: OpEventKind;
  actor: string;
  ts: number;
}

export interface OpEventLogState {
  events: OpEvent[];
  nextSeq: number;
}

export function createOpEventLogState(): OpEventLogState {
  return { events: [], nextSeq: 1 };
}

export function appendOpEvent(state: OpEventLogState, opId: string, kind: OpEventKind, actor: string): OpEventLogState {
  const event: OpEvent = { seq: state.nextSeq, opId, kind, actor, ts: Date.now() };
  return { ...state, events: [...state.events, event], nextSeq: state.nextSeq + 1 };
}

export function eventsForOp(state: OpEventLogState, opId: string): OpEvent[] {
  return state.events.filter((e) => e.opId === opId);
}

export function eventsOfKind(state: OpEventLogState, kind: OpEventKind): OpEvent[] {
  return state.events.filter((e) => e.kind === kind);
}

export function eventsByActor(state: OpEventLogState, actor: string): OpEvent[] {
  return state.events.filter((e) => e.actor === actor);
}

export function replayOpEvents(state: OpEventLogState, fromSeq: number): OpEvent[] {
  return state.events.filter((e) => e.seq >= fromSeq);
}

export function truncateOpLog(state: OpEventLogState, keepLastN: number): OpEventLogState {
  if (state.events.length <= keepLastN) return state;
  return { ...state, events: state.events.slice(-keepLastN) };
}

export function opEventLogCount(state: OpEventLogState): number {
  return state.events.length;
}

export function opEventLogHealth(state: OpEventLogState): { count: number; health: number } {
  return { count: state.events.length, health: state.events.length > 0 ? 1 : 0.5 };
}
