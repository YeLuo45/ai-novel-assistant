// V2132 WriteAheadLog - Direction A Iter 17/30
// 预写日志 - 崩溃恢复保证
// Source: ruflo (WAL pattern)

export type WALOpType = 'insert' | 'update' | 'delete' | 'commit' | 'rollback';

export interface WALEntry {
  lsn: number;          // log sequence number
  txId: string;
  opType: WALOpType;
  entity: string;
  data?: unknown;
  timestamp: number;
  checksum: number;
}

export interface WALState {
  entries: WALEntry[];
  nextLsn: number;
  activeTx: Set<string>;
  flushedLsn: number;
}

export function createWALState(): WALState {
  return { entries: [], nextLsn: 1, activeTx: new Set(), flushedLsn: 0 };
}

/** Compute simple checksum (FNV-1a) */
function checksum(entry: Omit<WALEntry, 'lsn' | 'timestamp' | 'checksum'>): number {
  const s = JSON.stringify(entry);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Append a new entry to the WAL */
export function appendWAL(state: WALState, entry: Omit<WALEntry, 'lsn' | 'timestamp' | 'checksum'>): { state: WALState; entry: WALEntry } {
  const fullEntry: WALEntry = {
    ...entry,
    lsn: state.nextLsn,
    timestamp: Date.now(),
    checksum: checksum(entry),
  };
  const activeTx = new Set(state.activeTx);
  if (entry.opType === 'insert' || entry.opType === 'update' || entry.opType === 'delete') {
    activeTx.add(entry.txId);
  } else if (entry.opType === 'commit' || entry.opType === 'rollback') {
    activeTx.delete(entry.txId);
  }
  return {
    state: {
      entries: [...state.entries, fullEntry],
      nextLsn: state.nextLsn + 1,
      activeTx,
      flushedLsn: state.flushedLsn,
    },
    entry: fullEntry,
  };
}

/** Mark WAL as flushed up to a given LSN */
export function markFlushed(state: WALState, lsn: number): WALState {
  return { ...state, flushedLsn: Math.max(state.flushedLsn, lsn) };
}

/** Replay WAL from a checkpoint */
export function replayWAL(state: WALState, fromLsn: number): WALEntry[] {
  return state.entries.filter((e) => e.lsn >= fromLsn);
}

/** Find uncommitted transactions (for crash recovery) */
export function uncommittedTx(state: WALState): string[] {
  return Array.from(state.activeTx);
}

/** Verify checksum integrity */
export function verifyEntry(entry: WALEntry): boolean {
  const { checksum: _c, lsn: _l, timestamp: _t, ...rest } = entry;
  return checksum(rest as Omit<WALEntry, 'lsn' | 'timestamp' | 'checksum'>) === entry.checksum;
}

/** Count entries by op type */
export function countByOpType(state: WALState): Record<WALOpType, number> {
  const counts: Record<WALOpType, number> = { insert: 0, update: 0, delete: 0, commit: 0, rollback: 0 };
  for (const e of state.entries) counts[e.opType]++;
  return counts;
}

/** Trim old committed entries */
export function compactWAL(state: WALState, keepLastN: number): WALState {
  if (state.entries.length <= keepLastN) return state;
  return { ...state, entries: state.entries.slice(-keepLastN) };
}

/** WAL health metric */
export function walHealth(state: WALState): { entryCount: number; activeTx: number; uncommittedRatio: number; health: number } {
  const uncommitted = state.activeTx.size;
  const ratio = state.entries.length > 0 ? uncommitted / state.entries.length : 0;
  const health = 1 - Math.min(1, ratio);
  return { entryCount: state.entries.length, activeTx: uncommitted, uncommittedRatio: ratio, health };
}
