// V2302 SkillRelation - Direction K Iter 7/30
// Skill relation graph
// Source: thunderbolt
export type SkillRelKind = 'requires' | 'extends' | 'similar' | 'depends' | 'replaces';

export interface SkillRelEdge {
  from: string;
  to: string;
  kind: SkillRelKind;
  weight: number;
  ts: number;
}

export interface SkillRelationState {
  edges: SkillRelEdge[];
  byKey: Map<string, Set<number>>;
}

export function createSkillRelationState(): SkillRelationState {
  return { edges: [], byKey: new Map() };
}

export function addSkillRelation(state: SkillRelationState, from: string, to: string, kind: SkillRelKind, weight = 1): SkillRelationState {
  if (state.edges.some((e) => e.from === from && e.to === to && e.kind === kind)) return state;
  const edge: SkillRelEdge = { from, to, kind, weight, ts: Date.now() };
  const edges = [...state.edges, edge];
  const byKey = new Map(state.byKey);
  const idx = edges.length - 1;
  const a = new Set(byKey.get(from) || []);
  a.add(idx);
  byKey.set(from, a);
  const b = new Set(byKey.get(to) || []);
  b.add(idx);
  byKey.set(to, b);
  return { ...state, edges, byKey };
}

export function relationsFromSkill(state: SkillRelationState, key: string): SkillRelEdge[] {
  const indices = state.byKey.get(key) || new Set();
  const result: SkillRelEdge[] = [];
  for (const i of indices) {
    if (state.edges[i].from === key) result.push(state.edges[i]);
  }
  return result;
}

export function relationsToSkill(state: SkillRelationState, key: string): SkillRelEdge[] {
  const indices = state.byKey.get(key) || new Set();
  const result: SkillRelEdge[] = [];
  for (const i of indices) {
    if (state.edges[i].to === key) result.push(state.edges[i]);
  }
  return result;
}

export function relationsBySkillKind(state: SkillRelationState, kind: SkillRelKind): SkillRelEdge[] {
  return state.edges.filter((e) => e.kind === kind);
}

export function skillRelationHealth(state: SkillRelationState): { edges: number; health: number } {
  return { edges: state.edges.length, health: state.edges.length > 0 ? 1 : 0.5 };
}
