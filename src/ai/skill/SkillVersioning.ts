// V2309 SkillVersioning - Direction K Iter 14/30
// Skill version history
// Source: nanobot
export interface SkillVersion {
  verId: string;
  key: string;
  content: unknown;
  authorId: string;
  ts: number;
  message: string;
}

export interface SkillVersioningState {
  versions: SkillVersion[];
  byKey: Map<string, string[]>;
  counter: number;
}

export function createSkillVersioningState(): SkillVersioningState {
  return { versions: [], byKey: new Map(), counter: 0 };
}

export function commitSkillVersion(state: SkillVersioningState, key: string, content: unknown, authorId: string, message: string): SkillVersioningState {
  state.counter++;
  const v: SkillVersion = { verId: `skv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, key, content, authorId, ts: Date.now(), message };
  const versions = [...state.versions, v];
  const byKey = new Map(state.byKey);
  byKey.set(key, [...(byKey.get(key) || []), v.verId]);
  return { ...state, versions, byKey };
}

export function skillVersionsForKey(state: SkillVersioningState, key: string): SkillVersion[] {
  return (state.byKey.get(key) || []).map((id) => state.versions.find((v) => v.verId === id)!).filter(Boolean);
}

export function latestSkillVersion(state: SkillVersioningState, key: string): SkillVersion | undefined {
  const vs = skillVersionsForKey(state, key);
  return vs.length > 0 ? vs[vs.length - 1] : undefined;
}

export function skillVersionDiff(state: SkillVersioningState, key: string, verIdA: string, verIdB: string): { from: SkillVersion; to: SkillVersion } | null {
  const a = state.versions.find((v) => v.verId === verIdA);
  const b = state.versions.find((v) => v.verId === verIdB);
  if (!a || !b) return null;
  return { from: a, to: b };
}

export function skillVersioningHealth(state: SkillVersioningState): { versions: number; keys: number; health: number } {
  return { versions: state.versions.length, keys: state.byKey.size, health: state.versions.length > 0 ? 1 : 0.5 };
}
