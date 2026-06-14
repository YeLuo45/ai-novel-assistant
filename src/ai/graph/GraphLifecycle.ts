// V2191 GraphLifecycle - Direction G Iter 16/30
// Create/active/decay/expire states
// Source: ruflo
export type GraphPhase = 'create' | 'active' | 'decay' | 'expire';

export interface GraphLifecycleEntry {
  id: string;
  phase: GraphPhase;
  birthAt: number;
  lastTransition: number;
  maxAgeMs: number;
}

export interface GraphLifecycleState {
  entries: Map<string, GraphLifecycleEntry>;
}

export function createGraphLifecycleState(): GraphLifecycleState {
  return { entries: new Map() };
}

export function birthGraphEntry(state: GraphLifecycleState, id: string, maxAgeMs = 86400000): GraphLifecycleState {
  const entries = new Map(state.entries);
  entries.set(id, { id, phase: 'create', birthAt: Date.now(), lastTransition: Date.now(), maxAgeMs });
  return { ...state, entries };
}

export function activateGraphEntry(state: GraphLifecycleState, id: string): GraphLifecycleState {
  const e = state.entries.get(id);
  if (!e) return state;
  const entries = new Map(state.entries);
  entries.set(id, { ...e, phase: 'active', lastTransition: Date.now() });
  return { ...state, entries };
}

export function decayGraphEntry(state: GraphLifecycleState, id: string): GraphLifecycleState {
  const e = state.entries.get(id);
  if (!e) return state;
  const entries = new Map(state.entries);
  entries.set(id, { ...e, phase: 'decay', lastTransition: Date.now() });
  return { ...state, entries };
}

export function expireGraphEntry(state: GraphLifecycleState, id: string): GraphLifecycleState {
  const e = state.entries.get(id);
  if (!e) return state;
  const entries = new Map(state.entries);
  entries.set(id, { ...e, phase: 'expire', lastTransition: Date.now() });
  return { ...state, entries };
}

export function autoGraphTransition(state: GraphLifecycleState, now = Date.now()): GraphLifecycleState {
  const entries = new Map(state.entries);
  for (const [id, e] of entries) {
    if (now - e.birthAt > e.maxAgeMs && e.phase !== 'expire') {
      entries.set(id, { ...e, phase: 'expire', lastTransition: now });
    }
  }
  return { ...state, entries };
}

export function countGraphPhase(state: GraphLifecycleState): Record<GraphPhase, number> {
  const counts: Record<GraphPhase, number> = { create: 0, active: 0, decay: 0, expire: 0 };
  for (const e of state.entries.values()) counts[e.phase]++;
  return counts;
}

export function graphLifecycleHealth(state: GraphLifecycleState): { total: number; active: number; health: number } {
  const counts = countGraphPhase(state);
  const active = counts.create + counts.active + counts.decay;
  return { total: state.entries.size, active, health: state.entries.size > 0 ? active / state.entries.size : 1 };
}
