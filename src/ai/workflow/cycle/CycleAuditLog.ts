/**
 * V2111 Direction A Iteration 26/30 Round 6: CycleAuditLog
 *
 * Append-only audit log for cycle executions. Records every event with
 * a timestamp and serializable payload, and supports range queries.
 *
 * Inspired by:
 * - ai-superpower: audit log
 * - ruflo-design: hook log
 */

export type AuditEventType =
  | 'start'
  | 'iteration'
  | 'exit-condition'
  | 'quality-gate'
  | 'budget-exceeded'
  | 'sanitizer-violation'
  | 'merge'
  | 'converged'
  | 'failed'
  | 'completed';

export interface AuditEntry {
  id: number;
  cycleId: string;
  type: AuditEventType;
  timestamp: number;
  payload: Record<string, unknown>;
}

export interface CycleAuditLog {
  cycleId: string;
  entries: AuditEntry[];
  nextId: number;
}

export function createAuditLog(cycleId: string): CycleAuditLog {
  return { cycleId, entries: [], nextId: 1 };
}

export function appendEvent(
  log: CycleAuditLog,
  type: AuditEventType,
  payload: Record<string, unknown> = {},
  now: () => number = () => Date.now()
): AuditEntry {
  const entry: AuditEntry = {
    id: log.nextId++,
    cycleId: log.cycleId,
    type,
    timestamp: now(),
    payload,
  };
  log.entries.push(entry);
  return entry;
}

export function queryByType(
  log: CycleAuditLog,
  type: AuditEventType
): AuditEntry[] {
  return log.entries.filter((e) => e.type === type);
}

export function queryByTimeRange(
  log: CycleAuditLog,
  startMs: number,
  endMs: number
): AuditEntry[] {
  return log.entries.filter((e) => e.timestamp >= startMs && e.timestamp <= endMs);
}

export function countByType(log: CycleAuditLog): Record<AuditEventType, number> {
  const counts: Record<AuditEventType, number> = {
    start: 0,
    iteration: 0,
    'exit-condition': 0,
    'quality-gate': 0,
    'budget-exceeded': 0,
    'sanitizer-violation': 0,
    merge: 0,
    converged: 0,
    failed: 0,
    completed: 0,
  };
  for (const e of log.entries) counts[e.type]++;
  return counts;
}

export function lastEntry(log: CycleAuditLog): AuditEntry | null {
  return log.entries.length === 0 ? null : log.entries[log.entries.length - 1];
}

export function exportAuditLog(log: CycleAuditLog): string {
  return JSON.stringify(log.entries, null, 2);
}
