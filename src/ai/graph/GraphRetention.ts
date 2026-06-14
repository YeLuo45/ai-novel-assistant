// V2196 GraphRetention - Direction G Iter 21/30
// Time-based retention policy
// Source: ruflo
export type GraphRetentionAction = 'delete' | 'archive' | 'keep';

export interface GraphRetentionPolicy {
  policyId: string;
  scope: string;
  ttlMs: number;
  action: GraphRetentionAction;
}

export interface GraphRetentionRecord {
  nodeId: string;
  scope: string;
  createdAt: number;
  lastAction?: GraphRetentionAction;
}

export interface GraphRetentionState {
  policies: Map<string, GraphRetentionPolicy>;
  records: Map<string, GraphRetentionRecord>;
  actionsApplied: number;
}

export function createGraphRetentionState(): GraphRetentionState {
  return { policies: new Map(), records: new Map(), actionsApplied: 0 };
}

export function addGraphPolicy(state: GraphRetentionState, policy: GraphRetentionPolicy): GraphRetentionState {
  const policies = new Map(state.policies);
  policies.set(policy.policyId, policy);
  return { ...state, policies };
}

export function trackGraphRecord(state: GraphRetentionState, nodeId: string, scope: string): GraphRetentionState {
  const records = new Map(state.records);
  records.set(nodeId, { nodeId, scope, createdAt: Date.now() });
  return { ...state, records };
}

export function applyGraphRetention(state: GraphRetentionState, now = Date.now()): GraphRetentionState {
  const records = new Map(state.records);
  let actions = 0;
  for (const [id, rec] of records) {
    const policy = Array.from(state.policies.values()).find((p) => p.scope === rec.scope);
    if (!policy) continue;
    if (now - rec.createdAt >= policy.ttlMs) {
      records.set(id, { ...rec, lastAction: policy.action });
      actions++;
    }
  }
  return { ...state, records, actionsApplied: state.actionsApplied + actions };
}

export function graphPolicyFor(state: GraphRetentionState, scope: string): GraphRetentionPolicy | undefined {
  return Array.from(state.policies.values()).find((p) => p.scope === scope);
}

export function graphRetentionHealth(state: GraphRetentionState): { policies: number; records: number; health: number } {
  return { policies: state.policies.size, records: state.records.size, health: state.policies.size > 0 ? 1 : 0.5 };
}
