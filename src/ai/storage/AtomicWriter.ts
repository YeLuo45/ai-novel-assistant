// V2131 AtomicWriter - Direction A Iter 16/30
// 原子写入 - fsync+rename 模式
// Source: ruflo (atomic operations)

export interface WriteOp {
  path: string;
  data: string;
  timestamp: number;
}

export interface WriteLog {
  ops: WriteOp[];
  pendingRenames: Map<string, string>; // path → tempPath
}

export function createWriteLog(): WriteLog {
  return { ops: [], pendingRenames: new Map() };
}

/** Generate temp file path for atomic write */
export function tempPathFor(path: string): string {
  return `${path}.tmp.${Math.random().toString(36).slice(2, 10)}`;
}

/** Plan a write op (stage before commit) */
export function planWrite(log: WriteLog, path: string, data: string): { log: WriteLog; tempPath: string } {
  const tempPath = tempPathFor(path);
  const pendingRenames = new Map(log.pendingRenames);
  pendingRenames.set(path, tempPath);
  return {
    log: { ...log, pendingRenames, ops: [...log.ops, { path, data, timestamp: Date.now() }] },
    tempPath,
  };
}

/** Commit staged write (atomic rename simulation) */
export function commitWrite(log: WriteLog, path: string): WriteLog {
  const pendingRenames = new Map(log.pendingRenames);
  pendingRenames.delete(path);
  return { ...log, pendingRenames };
}

/** Rollback staged write */
export function rollbackWrite(log: WriteLog, path: string): WriteLog {
  const pendingRenames = new Map(log.pendingRenames);
  pendingRenames.delete(path);
  const ops = log.ops.filter((op) => op.path !== path);
  return { ...log, ops, pendingRenames };
}

/** Get all pending writes */
export function pendingWrites(log: WriteLog): string[] {
  return Array.from(log.pendingRenames.keys());
}

/** Count completed operations */
export function opCount(log: WriteLog): number {
  return log.ops.length;
}

/** Get last op for path */
export function lastOpFor(log: WriteLog, path: string): WriteOp | undefined {
  return [...log.ops].reverse().find((op) => op.path === path);
}

/** Check if path has pending write */
export function isPending(log: WriteLog, path: string): boolean {
  return log.pendingRenames.has(path);
}

/** Clear all operations */
export function clearLog(log: WriteLog): WriteLog {
  return { ops: [], pendingRenames: new Map() };
}

/** Write health metric */
export function writeHealth(log: WriteLog): { pending: number; completed: number; health: number } {
  const pending = log.pendingRenames.size;
  const completed = log.ops.length;
  const health = pending === 0 && completed > 0 ? 1 : 0.5;
  return { pending, completed, health };
}
