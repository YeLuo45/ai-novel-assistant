// V2256 CacheRetention - Direction I Iter 21/30
// Time-based cache retention
// Source: ruflo
export type CacheRetentionAction = 'archive' | 'delete' | 'keep';

export interface CacheRetentionPolicy {
  policyId: string;
  scope: string;
  ttlMs: number;
  action: CacheRetentionAction;
}

export interface CacheRetentionState {
  policies: Map<string, CacheRetentionPolicy>;
  records: Map<string, { key: string; scope: string; createdAt: number; lastAction?: CacheRetentionAction }>;
  actionsApplied: number;
}

export function createCacheRetentionState(): CacheRetentionState {
  return { policies: new Map(), records: new Map(), actionsApplied: 0 };
}

export function addCacheRetentionPolicy(state: CacheRetentionState, policy: CacheRetentionPolicy): CacheRetentionState {
  const policies = new Map(state.policies);
  policies.set(policy.policyId, policy);
  return { ...state, policies };
}

export function trackCacheRecord(state: CacheRetentionState, key: string, scope: string): CacheRetentionState {
  const records = new Map(state.records);
  records.set(key, { key, scope, createdAt: Date.now() });
  return { ...state, records };
}

export function applyCacheRetention(state: CacheRetentionState, now = Date.now()): CacheRetentionState {
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

export function cacheRetentionHealth(state: CacheRetentionState): { policies: number; records: number; health: number } {
  return { policies: state.policies.size, records: state.records.size, health: state.policies.size > 0 ? 1 : 0.5 };
}
