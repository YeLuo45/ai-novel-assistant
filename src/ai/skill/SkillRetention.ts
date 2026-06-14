// V2316 SkillRetention - Direction K Iter 21/30
// Time-based skill retention
// Source: ruflo
export type SkillRetentionAction = 'archive' | 'delete' | 'keep';

export interface SkillRetentionPolicy {
  policyId: string;
  scope: string;
  ttlMs: number;
  action: SkillRetentionAction;
}

export interface SkillRetentionState {
  policies: Map<string, SkillRetentionPolicy>;
  records: Map<string, { key: string; scope: string; createdAt: number; lastAction?: SkillRetentionAction }>;
  actionsApplied: number;
}

export function createSkillRetentionState(): SkillRetentionState {
  return { policies: new Map(), records: new Map(), actionsApplied: 0 };
}

export function addSkillRetentionPolicy(state: SkillRetentionState, policy: SkillRetentionPolicy): SkillRetentionState {
  const policies = new Map(state.policies);
  policies.set(policy.policyId, policy);
  return { ...state, policies };
}

export function trackSkillRecord(state: SkillRetentionState, key: string, scope: string): SkillRetentionState {
  const records = new Map(state.records);
  records.set(key, { key, scope, createdAt: Date.now() });
  return { ...state, records };
}

export function applySkillRetention(state: SkillRetentionState, now = Date.now()): SkillRetentionState {
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

export function skillRetentionHealth(state: SkillRetentionState): { policies: number; records: number; health: number } {
  return { policies: state.policies.size, records: state.records.size, health: state.policies.size > 0 ? 1 : 0.5 };
}
