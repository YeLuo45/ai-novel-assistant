// V2221 OpLifecycle - Direction H Iter 16/30
// Create/apply/applied/rejected states
// Source: ruflo
export type OpLifecyclePhase = 'created' | 'applied' | 'rejected' | 'expired';

export interface OpLifecycleEntry {
  opId: string;
  phase: OpLifecyclePhase;
  createdAt: number;
  lastTransition: number;
  ttlMs: number;
}

export interface OpLifecycleState {
  entries: Map<string, OpLifecycleEntry>;
}

export function createOpLifecycleState(): OpLifecycleState {
  return { entries: new Map() };
}

export function createOpEntry(state: OpLifecycleState, opId: string, ttlMs = 3600000): OpLifecycleState {
  const entries = new Map(state.entries);
  entries.set(opId, { opId, phase: 'created', createdAt: Date.now(), lastTransition: Date.now(), ttlMs });
  return { ...state, entries };
}

export function markOpApplied(state: OpLifecycleState, opId: string): OpLifecycleState {
  const e = state.entries.get(opId);
  if (!e) return state;
  const entries = new Map(state.entries);
  entries.set(opId, { ...e, phase: 'applied', lastTransition: Date.now() });
  return { ...state, entries };
}

export function markOpRejected(state: OpLifecycleState, opId: string): OpLifecycleState {
  const e = state.entries.get(opId);
  if (!e) return state;
  const entries = new Map(state.entries);
  entries.set(opId, { ...e, phase: 'rejected', lastTransition: Date.now() });
  return { ...state, entries };
}

export function expireOp(state: OpLifecycleState, opId: string): OpLifecycleState {
  const e = state.entries.get(opId);
  if (!e) return state;
  const entries = new Map(state.entries);
  entries.set(opId, { ...e, phase: 'expired', lastTransition: Date.now() });
  return { ...state, entries };
}

export function autoExpireOps(state: OpLifecycleState, now = Date.now()): OpLifecycleState {
  const entries = new Map(state.entries);
  for (const [id, e] of entries) {
    if (now - e.createdAt > e.ttlMs && e.phase !== 'expired') {
      entries.set(id, { ...e, phase: 'expired', lastTransition: now });
    }
  }
  return { ...state, entries };
}

export function countOpPhases(state: OpLifecycleState): Record<OpLifecyclePhase, number> {
  const counts: Record<OpLifecyclePhase, number> = { created: 0, applied: 0, rejected: 0, expired: 0 };
  for (const e of state.entries.values()) counts[e.phase]++;
  return counts;
}

export function opLifecycleHealth(state: OpLifecycleState): { total: number; active: number; health: number } {
  const counts = countOpPhases(state);
  const active = counts.created + counts.applied;
  return { total: state.entries.size, active, health: state.entries.size > 0 ? 1 : 0.5 };
}
