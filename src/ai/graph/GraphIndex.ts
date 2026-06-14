// V2190 GraphIndex - Direction G Iter 15/30
// Multi-attribute secondary index
// Source: nanobot
export interface GraphIndexState {
  byProp: Map<string, Map<unknown, Set<string>>>; // propName → value → nodeIds
  byLabel: Map<string, Set<string>>;
}

export function createGraphIndexState(): GraphIndexState {
  return { byProp: new Map(), byLabel: new Map() };
}

export function indexNode(state: GraphIndexState, nodeId: string, label: string, props: Record<string, unknown>): GraphIndexState {
  const byLabel = new Map(state.byLabel);
  if (!byLabel.has(label)) byLabel.set(label, new Set());
  byLabel.get(label)!.add(nodeId);
  const byProp = new Map(state.byProp);
  for (const [k, v] of Object.entries(props)) {
    if (!byProp.has(k)) byProp.set(k, new Map());
    const inner = byProp.get(k)!;
    if (!inner.has(v)) inner.set(v, new Set());
    inner.get(v)!.add(nodeId);
  }
  return { ...state, byLabel, byProp };
}

export function lookupByLabel(state: GraphIndexState, label: string): string[] {
  return Array.from(state.byLabel.get(label) || []);
}

export function lookupByProp(state: GraphIndexState, propName: string, value: unknown): string[] {
  return Array.from(state.byProp.get(propName)?.get(value) || []);
}

export function removeFromIndex(state: GraphIndexState, nodeId: string, label: string, props: Record<string, unknown>): GraphIndexState {
  const byLabel = new Map(state.byLabel);
  byLabel.get(label)?.delete(nodeId);
  const byProp = new Map(state.byProp);
  for (const [k, v] of Object.entries(props)) {
    byProp.get(k)?.get(v)?.delete(nodeId);
  }
  return { ...state, byLabel, byProp };
}

export function indexSize(state: GraphIndexState): number {
  let n = 0;
  for (const s of state.byLabel.values()) n += s.size;
  return n;
}

export function graphIndexHealth(state: GraphIndexState): { indexSize: number; propIndexes: number; health: number } {
  return { indexSize: indexSize(state), propIndexes: state.byProp.size, health: state.byLabel.size > 0 ? 1 : 0.5 };
}
