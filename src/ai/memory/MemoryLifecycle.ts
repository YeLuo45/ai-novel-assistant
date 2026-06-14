// V2161 MemoryLifecycle - Direction F Iter 16/30
// Create/mature/decay/expire states
// Source: ruflo
export type LifecyclePhase = 'create' | 'mature' | 'decay' | 'expire';

export interface LifecycleEntry {
  id: string;
  phase: LifecyclePhase;
  birthAt: number;
  lastTransition: number;
  decayRate: number; // 0-1 per second
  maxAgeMs: number;
}

export interface MemoryLifecycleState {
  entries: Map<string, LifecycleEntry>;
}

export function createMemoryLifecycleState(): MemoryLifecycleState {
  return { entries: new Map() };
}

export function birth(state: MemoryLifecycleState, id: string, decayRate = 0.01, maxAgeMs = 86400000): MemoryLifecycleState {
  const entries = new Map(state.entries);
  entries.set(id, { id, phase: 'create', birthAt: Date.now(), lastTransition: Date.now(), decayRate, maxAgeMs });
  return { ...state, entries };
}

export function mature(state: MemoryLifecycleState, id: string): MemoryLifecycleState {
  const e = state.entries.get(id);
  if (!e) return state;
  const entries = new Map(state.entries);
  entries.set(id, { ...e, phase: 'mature', lastTransition: Date.now() });
  return { ...state, entries };
}

export function decay(state: MemoryLifecycleState, id: string): MemoryLifecycleState {
  const e = state.entries.get(id);
  if (!e) return state;
  const entries = new Map(state.entries);
  entries.set(id, { ...e, phase: 'decay', lastTransition: Date.now() });
  return { ...state, entries };
}

export function expire(state: MemoryLifecycleState, id: string): MemoryLifecycleState {
  const e = state.entries.get(id);
  if (!e) return state;
  const entries = new Map(state.entries);
  entries.set(id, { ...e, phase: 'expire', lastTransition: Date.now() });
  return { ...state, entries };
}

export function autoTransition(state: MemoryLifecycleState, now = Date.now()): MemoryLifecycleState {
  const entries = new Map(state.entries);
  for (const [id, e] of entries) {
    const age = now - e.birthAt;
    if (age > e.maxAgeMs && e.phase !== 'expire') {
      entries.set(id, { ...e, phase: 'expire', lastTransition: now });
    }
  }
  return { ...state, entries };
}

export function countByPhase(state: MemoryLifecycleState): Record<LifecyclePhase, number> {
  const counts: Record<LifecyclePhase, number> = { create: 0, mature: 0, decay: 0, expire: 0 };
  for (const e of state.entries.values()) counts[e.phase]++;
  return counts;
}

export function ageOf(state: MemoryLifecycleState, id: string, now = Date.now()): number {
  const e = state.entries.get(id);
  return e ? now - e.birthAt : 0;
}

export function memoryLifecycleHealth(state: MemoryLifecycleState): { total: number; active: number; health: number } {
  const counts = countByPhase(state);
  const active = counts.create + counts.mature + counts.decay;
  return { total: state.entries.size, active, health: state.entries.size > 0 ? active / state.entries.size : 1 };
}
