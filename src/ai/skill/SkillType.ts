// V2301 SkillType - Direction K Iter 6/30
// Skill type system
// Source: thunderbolt
export type SkillKind = 'ability' | 'knowledge' | 'workflow';

export interface SkillKindEntry {
  key: string;
  kind: SkillKind;
  content: unknown;
  refCount: number;
  ts: number;
}

export interface SkillTypeState {
  entries: Map<string, SkillKindEntry>;
  byKind: Map<SkillKind, number>;
}

export function createSkillTypeState(): SkillTypeState {
  return { entries: new Map(), byKind: new Map() };
}

export function setSkillEntry(state: SkillTypeState, key: string, content: unknown, kind: SkillKind): SkillTypeState {
  const entry: SkillKindEntry = { key, kind, content, refCount: 0, ts: Date.now() };
  const entries = new Map(state.entries);
  entries.set(key, entry);
  const byKind = new Map(state.byKind);
  byKind.set(kind, (byKind.get(kind) || 0) + 1);
  return { ...state, entries, byKind };
}

export function getSkillEntry(state: SkillTypeState, key: string): unknown {
  return state.entries.get(key)?.content;
}

export function getSkillKind(state: SkillTypeState, key: string): SkillKind | undefined {
  return state.entries.get(key)?.kind;
}

export function skillsByKind(state: SkillTypeState, kind: SkillKind): SkillKindEntry[] {
  return Array.from(state.entries.values()).filter((e) => e.kind === kind);
}

export function countSkillsByKind(state: SkillTypeState): Record<SkillKind, number> {
  const counts: Record<SkillKind, number> = { ability: 0, knowledge: 0, workflow: 0 };
  for (const [k, v] of state.byKind) counts[k] = v;
  return counts;
}

export function skillTypeHealth(state: SkillTypeState): { entries: number; health: number } {
  return { entries: state.entries.size, health: state.entries.size > 0 ? 1 : 0.5 };
}
