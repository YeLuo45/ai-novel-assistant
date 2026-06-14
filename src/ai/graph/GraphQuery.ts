// V2178 GraphQuery - Direction G Iter 3/30
// Cypher-like graph query language
// Source: thunderbolt
export type GraphQueryOp = 'eq' | 'neq' | 'gt' | 'lt' | 'has' | 'starts_with';

export interface GraphPattern {
  fromLabel: string;
  edgeLabel: string;
  toLabel: string;
}

export interface GraphQueryFilter {
  prop: string;
  op: GraphQueryOp;
  value: unknown;
}

export interface GraphQueryState {
  storage: import('./GraphStorage').GraphStorageState;
  queryCount: number;
}

export function createGraphQueryState(storage: import('./GraphStorage').GraphStorageState): GraphQueryState {
  return { storage, queryCount: 0 };
}

function matchesFilter(props: Record<string, unknown>, filter: GraphQueryFilter): boolean {
  const v = props[filter.prop];
  switch (filter.op) {
    case 'eq': return v === filter.value;
    case 'neq': return v !== filter.value;
    case 'gt': return typeof v === 'number' && typeof filter.value === 'number' && v > filter.value;
    case 'lt': return typeof v === 'number' && typeof filter.value === 'number' && v < filter.value;
    case 'has': return filter.prop in props;
    case 'starts_with': return typeof v === 'string' && typeof filter.value === 'string' && v.startsWith(filter.value);
    default: return false;
  }
}

export function matchPattern(
  state: GraphQueryState,
  pattern: GraphPattern,
  filters: GraphQueryFilter[] = []
): { state: GraphQueryState; matches: { from: string; to: string }[] } {
  const matches: { from: string; to: string }[] = [];
  for (const edge of state.storage.edges) {
    const from = state.storage.nodes.get(edge.fromId);
    const to = state.storage.nodes.get(edge.toId);
    if (!from || !to) continue;
    if (from.label !== pattern.fromLabel) continue;
    if (to.label !== pattern.toLabel) continue;
    if (filters.length > 0) {
      const allFrom = filters.every((f) => matchesFilter(from.props, f));
      const allTo = filters.every((f) => matchesFilter(to.props, f));
      if (!allFrom && !allTo) continue;
    }
    matches.push({ from: edge.fromId, to: edge.toId });
  }
  return { state: { ...state, queryCount: state.queryCount + 1 }, matches };
}

export function findByLabel(state: GraphQueryState, label: string): string[] {
  return Array.from(state.storage.nodes.values()).filter((n) => n.label === label).map((n) => n.id);
}

export function findByProp(state: GraphQueryState, prop: string, value: unknown): string[] {
  return Array.from(state.storage.nodes.values()).filter((n) => n.props[prop] === value).map((n) => n.id);
}

export function graphQueryHealth(state: GraphQueryState): { queries: number; nodes: number; health: number } {
  return { queries: state.queryCount, nodes: state.storage.nodes.size, health: state.queryCount > 0 ? 1 : 0.5 };
}
