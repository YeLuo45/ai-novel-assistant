// V2195 GraphQuota - Direction G Iter 20/30
// Per-owner node/edge quotas
// Source: ruflo
export interface GraphQuotaInfo {
  quotaId: string;
  ownerId: string;
  nodeLimit: number;
  edgeLimit: number;
  nodes: number;
  edges: number;
}

export interface GraphQuotaState {
  quotas: Map<string, GraphQuotaInfo>;
}

export function createGraphQuotaState(): GraphQuotaState {
  return { quotas: new Map() };
}

export function setGraphQuota(state: GraphQuotaState, ownerId: string, nodeLimit: number, edgeLimit: number): GraphQuotaState {
  const existing = Array.from(state.quotas.values()).find((q) => q.ownerId === ownerId);
  const quotas = new Map(state.quotas);
  if (existing) {
    quotas.set(existing.quotaId, { ...existing, nodeLimit, edgeLimit });
    return { ...state, quotas };
  }
  const q: GraphQuotaInfo = { quotaId: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ownerId, nodeLimit, edgeLimit, nodes: 0, edges: 0 };
  quotas.set(q.quotaId, q);
  return { ...state, quotas };
}

export function addNodeForOwner(state: GraphQuotaState, ownerId: string, count = 1): { state: GraphQuotaState; ok: boolean } {
  const q = Array.from(state.quotas.values()).find((x) => x.ownerId === ownerId);
  if (!q) return { state, ok: false };
  if (q.nodes + count > q.nodeLimit) return { state, ok: false };
  const quotas = new Map(state.quotas);
  quotas.set(q.quotaId, { ...q, nodes: q.nodes + count });
  return { state: { ...state, quotas }, ok: true };
}

export function addEdgeForOwner(state: GraphQuotaState, ownerId: string, count = 1): { state: GraphQuotaState; ok: boolean } {
  const q = Array.from(state.quotas.values()).find((x) => x.ownerId === ownerId);
  if (!q) return { state, ok: false };
  if (q.edges + count > q.edgeLimit) return { state, ok: false };
  const quotas = new Map(state.quotas);
  quotas.set(q.quotaId, { ...q, edges: q.edges + count });
  return { state: { ...state, quotas }, ok: true };
}

export function graphQuotaFor(state: GraphQuotaState, ownerId: string): GraphQuotaInfo | undefined {
  return Array.from(state.quotas.values()).find((q) => q.ownerId === ownerId);
}

export function graphQuotaHealth(state: GraphQuotaState): { owners: number; health: number } {
  return { owners: state.quotas.size, health: state.quotas.size > 0 ? 1 : 0.5 };
}
