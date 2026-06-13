// V2120 ConflictResolver - Direction A Iter 5/30
// 冲突解决器 - CRDT + Last-Write-Wins
// Source: thunderbolt (Conflict resolution / CRDT)

export type ResolutionStrategy = 'lww' | 'crdt_merge' | 'manual' | 'reject';

export interface ConflictingOp {
  opId: string;
  entityId: string;
  value: unknown;
  timestamp: number;
  actor: string;
}

export interface ResolutionResult {
  winner: ConflictingOp;
  losers: ConflictingOp[];
  strategy: ResolutionStrategy;
  resolutionTime: number;
}

export function createConflictResolver(): { history: ResolutionResult[] } {
  return { history: [] };
}

/** Resolve conflicts using Last-Write-Wins */
export function resolveLWW(conflicts: ConflictingOp[]): ResolutionResult {
  if (conflicts.length === 0) {
    throw new Error('resolveLWW requires at least 1 conflict');
  }
  const sorted = [...conflicts].sort((a, b) => b.timestamp - a.timestamp);
  return {
    winner: sorted[0],
    losers: sorted.slice(1),
    strategy: 'lww',
    resolutionTime: Date.now(),
  };
}

/** Resolve using simple CRDT merge (LWW per field) */
export function resolveCRDT(conflicts: ConflictingOp[]): ResolutionResult {
  if (conflicts.length === 0) {
    throw new Error('resolveCRDT requires at least 1 conflict');
  }
  const sorted = [...conflicts].sort((a, b) => b.timestamp - a.timestamp);
  const merged: Record<string, unknown> = {};
  for (const op of sorted) {
    if (op.value && typeof op.value === 'object' && !Array.isArray(op.value)) {
      Object.assign(merged, op.value as Record<string, unknown>);
    } else {
      merged[op.entityId] = op.value;
    }
  }
  return {
    winner: { ...sorted[0], value: merged },
    losers: sorted.slice(1),
    strategy: 'crdt_merge',
    resolutionTime: Date.now(),
  };
}

/** Record resolution in history */
export function recordResolution(
  state: { history: ResolutionResult[] },
  result: ResolutionResult
): { history: ResolutionResult[] } {
  return { history: [...state.history, result] };
}

/** Detect if a set of ops is in conflict (concurrent edits) */
export function hasConflict(ops: ConflictingOp[]): boolean {
  if (ops.length < 2) return false;
  const actors = new Set(ops.map((o) => o.actor));
  return actors.size > 1;
}

/** Count conflicts by actor */
export function conflictsByActor(ops: ConflictingOp[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const op of ops) counts[op.actor] = (counts[op.actor] || 0) + 1;
  return counts;
}

/** Get resolution master metric */
export function resolutionHealth(state: { history: ResolutionResult[] }): {
  totalResolved: number;
  lwwCount: number;
  crdtCount: number;
  manualCount: number;
  healthScore: number;
} {
  const lwwCount = state.history.filter((r) => r.strategy === 'lww').length;
  const crdtCount = state.history.filter((r) => r.strategy === 'crdt_merge').length;
  const manualCount = state.history.filter((r) => r.strategy === 'manual').length;
  const total = state.history.length;
  const healthScore = total > 0 ? 1 - manualCount / total : 1;
  return { totalResolved: total, lwwCount, crdtCount, manualCount, healthScore };
}
