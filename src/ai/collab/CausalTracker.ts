// V2210 CausalTracker - Direction H Iter 5/30
// Track causal dependencies via vector clock
// Source: thunderbolt
export interface CausalEdge {
  from: string;
  to: string;
  ts: number;
}

export interface CausalTrackerState {
  edges: CausalEdge[];
  causallyBefore: Map<string, Set<string>>;
  causallyAfter: Map<string, Set<string>>;
}

export function createCausalTrackerState(): CausalTrackerState {
  return { edges: [], causallyBefore: new Map(), causallyAfter: new Map() };
}

export function addCausalEdge(state: CausalTrackerState, from: string, to: string): CausalTrackerState {
  if (state.edges.some((e) => e.from === from && e.to === to)) return state;
  const edges = [...state.edges, { from, to, ts: Date.now() }];
  const causallyAfter = new Map(state.causallyAfter);
  const set = new Set(causallyAfter.get(from) || []);
  set.add(to);
  causallyAfter.set(from, set);
  const causallyBefore = new Map(state.causallyBefore);
  const set2 = new Set(causallyBefore.get(to) || []);
  set2.add(from);
  causallyBefore.set(to, set2);
  return { ...state, edges, causallyAfter, causallyBefore };
}

export function isCausallyBefore(state: CausalTrackerState, a: string, b: string): boolean {
  if (a === b) return false;
  return state.causallyBefore.get(b)?.has(a) ?? false;
}

export function causallyBeforeSet(state: CausalTrackerState, target: string): Set<string> {
  return state.causallyBefore.get(target) || new Set();
}

export function causallyAfterSet(state: CausalTrackerState, source: string): Set<string> {
  return state.causallyAfter.get(source) || new Set();
}

export function directChildren(state: CausalTrackerState, from: string): string[] {
  return Array.from(state.causallyAfter.get(from) || []);
}

export function directParents(state: CausalTrackerState, to: string): string[] {
  return Array.from(state.causallyBefore.get(to) || []);
}

export function edgeCount(state: CausalTrackerState): number {
  return state.edges.length;
}

export function causalTrackerHealth(state: CausalTrackerState): { edges: number; health: number } {
  return { edges: state.edges.length, health: state.edges.length > 0 ? 1 : 0.5 };
}
