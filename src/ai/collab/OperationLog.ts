// V2207 OperationLog - Direction H Iter 2/30
// Append-only operation log for replay
// Source: thunderbolt
export interface LogEntry {
  seq: number;
  opId: string;
  authorId: string;
  ts: number;
  applied: boolean;
}

export interface OperationLogState {
  entries: LogEntry[];
  nextSeq: number;
  applied: Set<string>;
}

export function createOperationLogState(): OperationLogState {
  return { entries: [], nextSeq: 1, applied: new Set() };
}

export function appendToLog(state: OperationLogState, opId: string, authorId: string): OperationLogState {
  const entry: LogEntry = { seq: state.nextSeq, opId, authorId, ts: Date.now(), applied: false };
  return { ...state, entries: [...state.entries, entry], nextSeq: state.nextSeq + 1 };
}

export function markApplied(state: OperationLogState, seq: number): OperationLogState {
  const applied = new Set(state.applied);
  const entries = state.entries.map((e) => {
    if (e.seq === seq) { applied.add(e.opId); return { ...e, applied: true }; }
    return e;
  });
  return { ...state, entries, applied };
}

export function getEntry(state: OperationLogState, seq: number): LogEntry | undefined {
  return state.entries.find((e) => e.seq === seq);
}

export function entriesByAuthor(state: OperationLogState, authorId: string): LogEntry[] {
  return state.entries.filter((e) => e.authorId === authorId);
}

export function unappliedCount(state: OperationLogState): number {
  return state.entries.length - state.applied.size;
}

export function truncateLog(state: OperationLogState, keepLastN: number): OperationLogState {
  if (state.entries.length <= keepLastN) return state;
  const dropped = state.entries.slice(0, state.entries.length - keepLastN);
  const applied = new Set(state.applied);
  for (const e of dropped) applied.delete(e.opId);
  return { ...state, entries: state.entries.slice(-keepLastN), applied };
}

export function operationLogHealth(state: OperationLogState): { count: number; unapplied: number; health: number } {
  return { count: state.entries.length, unapplied: unappliedCount(state), health: state.entries.length > 0 ? 1 : 0.5 };
}
