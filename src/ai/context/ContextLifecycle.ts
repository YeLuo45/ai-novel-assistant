// V2281 ContextLifecycle - Direction J Iter 16/30
// Active/decaying/expired context states
// Source: ruflo
export type ContextPhase = 'active' | 'decaying' | 'expired' | 'archived';

export interface ContextLifecycleEntry {
  key: string;
  phase: ContextPhase;
  birthAt: number;
  lastTransition: number;
  decayAt: number;
  expiresAt: number;
}

export interface ContextLifecycleState {
  entries: Map<string, ContextLifecycleEntry>;
}

export function createContextLifecycleState(): ContextLifecycleState {
  return { entries: new Map() };
}

export function birthContextEntry(state: ContextLifecycleState, key: string, decayAt: number, expiresAt: number): ContextLifecycleState {
  const entries = new Map(state.entries);
  entries.set(key, { key, phase: 'active', birthAt: Date.now(), lastTransition: Date.now(), decayAt, expiresAt });
  return { ...state, entries };
}

export function decayContextEntry(state: ContextLifecycleState, key: string): ContextLifecycleState {
  const e = state.entries.get(key);
  if (!e) return state;
  const entries = new Map(state.entries);
  entries.set(key, { ...e, phase: 'decaying', lastTransition: Date.now() });
  return { ...state, entries };
}

export function expireContextEntry(state: ContextLifecycleState, key: string): ContextLifecycleState {
  const e = state.entries.get(key);
  if (!e) return state;
  const entries = new Map(state.entries);
  entries.set(key, { ...e, phase: 'expired', lastTransition: Date.now() });
  return { ...state, entries };
}

export function archiveContextEntry(state: ContextLifecycleState, key: string): ContextLifecycleState {
  const e = state.entries.get(key);
  if (!e) return state;
  const entries = new Map(state.entries);
  entries.set(key, { ...e, phase: 'archived', lastTransition: Date.now() });
  return { ...state, entries };
}

export function autoContextTransition(state: ContextLifecycleState, now = Date.now()): ContextLifecycleState {
  const entries = new Map(state.entries);
  for (const [k, e] of entries) {
    if (now > e.expiresAt && e.phase !== 'expired') entries.set(k, { ...e, phase: 'expired', lastTransition: now });
    else if (now > e.decayAt && e.phase === 'active') entries.set(k, { ...e, phase: 'decaying', lastTransition: now });
  }
  return { ...state, entries };
}

export function contextLifecycleHealth(state: ContextLifecycleState): { total: number; active: number; health: number } {
  const active = Array.from(state.entries.values()).filter((e) => e.phase === 'active' || e.phase === 'decaying').length;
  return { total: state.entries.size, active, health: state.entries.size > 0 ? 1 : 0.5 };
}
