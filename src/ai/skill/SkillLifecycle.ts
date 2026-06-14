// V2311 SkillLifecycle - Direction K Iter 16/30
// Draft/published/retired skill states
// Source: ruflo
export type SkillPhase = 'draft' | 'review' | 'published' | 'retired' | 'deprecated';

export interface SkillLifecycleEntry {
  key: string;
  phase: SkillPhase;
  birthAt: number;
  lastTransition: number;
}

export interface SkillLifecycleState {
  entries: Map<string, SkillLifecycleEntry>;
}

export function createSkillLifecycleState(): SkillLifecycleState {
  return { entries: new Map() };
}

export function birthSkillEntry(state: SkillLifecycleState, key: string): SkillLifecycleState {
  const entries = new Map(state.entries);
  entries.set(key, { key, phase: 'draft', birthAt: Date.now(), lastTransition: Date.now() });
  return { ...state, entries };
}

export function reviewSkillEntry(state: SkillLifecycleState, key: string): SkillLifecycleState {
  const e = state.entries.get(key);
  if (!e) return state;
  const entries = new Map(state.entries);
  entries.set(key, { ...e, phase: 'review', lastTransition: Date.now() });
  return { ...state, entries };
}

export function publishSkillEntry(state: SkillLifecycleState, key: string): SkillLifecycleState {
  const e = state.entries.get(key);
  if (!e) return state;
  const entries = new Map(state.entries);
  entries.set(key, { ...e, phase: 'published', lastTransition: Date.now() });
  return { ...state, entries };
}

export function retireSkillEntry(state: SkillLifecycleState, key: string): SkillLifecycleState {
  const e = state.entries.get(key);
  if (!e) return state;
  const entries = new Map(state.entries);
  entries.set(key, { ...e, phase: 'retired', lastTransition: Date.now() });
  return { ...state, entries };
}

export function deprecateSkillEntry(state: SkillLifecycleState, key: string): SkillLifecycleState {
  const e = state.entries.get(key);
  if (!e) return state;
  const entries = new Map(state.entries);
  entries.set(key, { ...e, phase: 'deprecated', lastTransition: Date.now() });
  return { ...state, entries };
}

export function countSkillPhases(state: SkillLifecycleState): Record<SkillPhase, number> {
  const counts: Record<SkillPhase, number> = { draft: 0, review: 0, published: 0, retired: 0, deprecated: 0 };
  for (const e of state.entries.values()) counts[e.phase]++;
  return counts;
}

export function skillLifecycleHealth(state: SkillLifecycleState): { total: number; published: number; health: number } {
  const counts = countSkillPhases(state);
  return { total: state.entries.size, published: counts.published, health: state.entries.size > 0 ? 1 : 0.5 };
}
