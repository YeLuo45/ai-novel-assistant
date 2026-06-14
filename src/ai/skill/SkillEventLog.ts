// V2312 SkillEventLog - Direction K Iter 17/30
// Append-only skill event log
// Source: ruflo
export type SkillLogKind = 'create' | 'update' | 'review' | 'publish' | 'retire';

export interface SkillLogEntry {
  seq: number;
  kind: SkillLogKind;
  key: string;
  ts: number;
}

export interface SkillEventLogState {
  events: SkillLogEntry[];
  nextSeq: number;
}

export function createSkillEventLogState(): SkillEventLogState {
  return { events: [], nextSeq: 1 };
}

export function appendSkillEvent(state: SkillEventLogState, kind: SkillLogKind, key: string): SkillEventLogState {
  const event: SkillLogEntry = { seq: state.nextSeq, kind, key, ts: Date.now() };
  return { ...state, events: [...state.events, event], nextSeq: state.nextSeq + 1 };
}

export function skillEventsForKey(state: SkillEventLogState, key: string): SkillLogEntry[] {
  return state.events.filter((e) => e.key === key);
}

export function skillEventsByKind(state: SkillEventLogState, kind: SkillLogKind): SkillLogEntry[] {
  return state.events.filter((e) => e.kind === kind);
}

export function replaySkillFromSeq(state: SkillEventLogState, fromSeq: number): SkillLogEntry[] {
  return state.events.filter((e) => e.seq >= fromSeq);
}

export function truncateSkillLog(state: SkillEventLogState, keepLastN: number): SkillEventLogState {
  if (state.events.length <= keepLastN) return state;
  return { ...state, events: state.events.slice(-keepLastN) };
}

export function skillEventLogCount(state: SkillEventLogState): number {
  return state.events.length;
}

export function skillEventLogHealth(state: SkillEventLogState): { count: number; health: number } {
  return { count: state.events.length, health: state.events.length > 0 ? 1 : 0.5 };
}
