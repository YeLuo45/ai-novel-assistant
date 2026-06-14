// V2286 ContextRetention - Direction J Iter 21/30
// Time-based context retention
// Source: ruflo
export type ContextRetentionAction = 'archive' | 'delete' | 'keep';

export interface ContextRetentionPolicy {
  policyId: string;
  scope: string;
  ttlMs: number;
  action: ContextRetentionAction;
}

export interface ContextRetentionState {
  policies: Map<string, ContextRetentionPolicy>;
  records: Map<string, { key: string; scope: string; createdAt: number; lastAction?: ContextRetentionAction }>;
  actionsApplied: number;
}

export function createContextRetentionState(): ContextRetentionState {
  return { policies: new Map(), records: new Map(), actionsApplied: 0 };
}

export function addContextRetentionPolicy(state: ContextRetentionState, policy: ContextRetentionPolicy): ContextRetentionState {
  const policies = new Map(state.policies);
  policies.set(policy.policyId, policy);
  return { ...state, policies };
}

export function trackContextRecord(state: ContextRetentionState, key: string, scope: string): ContextRetentionState {
  const records = new Map(state.records);
  records.set(key, { key, scope, createdAt: Date.now() });
  return { ...state, records };
}

export function applyContextRetention(state: ContextRetentionState, now = Date.now()): ContextRetentionState {
  const records = new Map(state.records);
  let actions = 0;
  for (const [k, rec] of records) {
    const policy = Array.from(state.policies.values()).find((p) => p.scope === rec.scope);
    if (!policy) continue;
    if (now - rec.createdAt >= policy.ttlMs) {
      records.set(k, { ...rec, lastAction: policy.action });
      actions++;
    }
  }
  return { ...state, records, actionsApplied: state.actionsApplied + actions };
}

export function contextRetentionHealth(state: ContextRetentionState): { policies: number; records: number; health: number } {
  return { policies: state.policies.size, records: state.records.size, health: state.policies.size > 0 ? 1 : 0.5 };
}
