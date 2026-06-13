// V2118 DeltaSyncProtocol - Direction A Iter 3/30
// 增量同步协议 - 操作日志 + 版本向量
// Source: thunderbolt (Delta sync / operational log)

export type OpAspect = 'create' | 'update' | 'delete' | 'noop';

export interface SyncOp {
  opId: string;
  entityId: string;
  aspect: OpAspect;
  payload: Record<string, unknown>;
  vectorClock: Record<string, number>;
  timestamp: number;
}

export interface DeltaState {
  ops: SyncOp[];
  clock: Record<string, number>;
  lastAppliedOpId: string;
}

export function createDeltaState(): DeltaState {
  return { ops: [], clock: {}, lastAppliedOpId: '' };
}

/** Increment vector clock for a node */
export function tickClock(clock: Record<string, number>, node: string): Record<string, number> {
  return { ...clock, [node]: (clock[node] || 0) + 1 };
}

/** Append a new op to the log */
export function appendOp(state: DeltaState, op: Omit<SyncOp, 'timestamp'>): DeltaState {
  const newOp: SyncOp = { ...op, timestamp: Date.now() };
  return {
    ops: [...state.ops, newOp],
    clock: newOp.vectorClock,
    lastAppliedOpId: newOp.opId,
  };
}

/** Filter ops newer than a given vector clock */
export function opsSince(state: DeltaState, sinceClock: Record<string, number>): SyncOp[] {
  return state.ops.filter((op) => {
    for (const [node, ts] of Object.entries(sinceClock)) {
      if ((op.vectorClock[node] || 0) <= ts) return false;
    }
    return true;
  });
}

/** Merge remote delta into local state (LWW per entity) */
export function mergeDelta(state: DeltaState, remote: SyncOp[]): DeltaState {
  const merged: DeltaState = { ...state, ops: [...state.ops] };
  for (const op of remote) {
    const existing = merged.ops.find((o) => o.opId === op.opId);
    if (!existing) {
      merged.ops.push(op);
    }
    for (const [node, ts] of Object.entries(op.vectorClock)) {
      merged.clock[node] = Math.max(merged.clock[node] || 0, ts);
    }
  }
  merged.lastAppliedOpId = remote.length > 0 ? remote[remote.length - 1].opId : merged.lastAppliedOpId;
  return merged;
}

/** Compare two clocks — returns >0 if a > b, <0 if a < b, 0 if concurrent */
export function compareClocks(a: Record<string, number>, b: Record<string, number>): number {
  let aGreater = false;
  let bGreater = false;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const av = a[k] || 0;
    const bv = b[k] || 0;
    if (av > bv) aGreater = true;
    if (av < bv) bGreater = true;
  }
  if (aGreater && !bGreater) return 1;
  if (bGreater && !aGreater) return -1;
  return 0;
}

/** Compact log to last N ops */
export function compactLog(state: DeltaState, keepLastN: number): DeltaState {
  if (state.ops.length <= keepLastN) return state;
  return { ...state, ops: state.ops.slice(-keepLastN) };
}

/** Compute op count by aspect for metrics */
export function opsByAspect(state: DeltaState): Record<OpAspect, number> {
  const counts: Record<OpAspect, number> = { create: 0, update: 0, delete: 0, noop: 0 };
  for (const op of state.ops) counts[op.aspect]++;
  return counts;
}
