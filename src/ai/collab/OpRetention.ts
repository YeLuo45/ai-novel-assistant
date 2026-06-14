// V2226 OpRetention - Direction H Iter 21/30
// Time-based op retention
// Source: ruflo
export type OpRetentionAction = 'archive' | 'delete' | 'keep';

export interface OpRetentionPolicy {
  policyId: string;
  scope: string;
  ttlMs: number;
  action: OpRetentionAction;
}

export interface OpRetentionState {
  policies: Map<string, OpRetentionPolicy>;
  records: Map<string, { opId: string; scope: string; createdAt: number; lastAction?: OpRetentionAction }>;
  actionsApplied: number;
}

export function createOpRetentionState(): OpRetentionState {
  return { policies: new Map(), records: new Map(), actionsApplied: 0 };
}

export function addOpRetentionPolicy(state: OpRetentionState, policy: OpRetentionPolicy): OpRetentionState {
  const policies = new Map(state.policies);
  policies.set(policy.policyId, policy);
  return { ...state, policies };
}

export function trackOpRecord(state: OpRetentionState, opId: string, scope: string): OpRetentionState {
  const records = new Map(state.records);
  records.set(opId, { opId, scope, createdAt: Date.now() });
  return { ...state, records };
}

export function applyOpRetention(state: OpRetentionState, now = Date.now()): OpRetentionState {
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

export function opRetentionHealth(state: OpRetentionState): { policies: number; records: number; health: number } {
  return { policies: state.policies.size, records: state.records.size, health: state.policies.size > 0 ? 1 : 0.5 };
}
