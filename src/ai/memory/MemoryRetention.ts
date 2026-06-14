// V2166 MemoryRetention - Direction F Iter 21/30
// GDPR-style retention policy
// Source: ruflo
export type RetentionAction = 'delete' | 'anonymize' | 'archive' | 'keep';

export interface RetentionPolicy {
  policyId: string;
  scope: string;
  ttlMs: number;
  action: RetentionAction;
}

export interface RetentionRecord {
  memId: string;
  scope: string;
  createdAt: number;
  lastAction?: RetentionAction;
}

export interface MemoryRetentionState {
  policies: Map<string, RetentionPolicy>;
  records: Map<string, RetentionRecord>;
  actionsApplied: number;
}

export function createMemoryRetentionState(): MemoryRetentionState {
  return { policies: new Map(), records: new Map(), actionsApplied: 0 };
}

export function addPolicy(state: MemoryRetentionState, policy: RetentionPolicy): MemoryRetentionState {
  const policies = new Map(state.policies);
  policies.set(policy.policyId, policy);
  return { ...state, policies };
}

export function trackRecord(state: MemoryRetentionState, memId: string, scope: string): MemoryRetentionState {
  const records = new Map(state.records);
  records.set(memId, { memId, scope, createdAt: Date.now() });
  return { ...state, records };
}

export function applyRetention(state: MemoryRetentionState, now = Date.now()): MemoryRetentionState {
  const records = new Map(state.records);
  let actionsApplied = 0;
  for (const [id, rec] of records) {
    const age = now - rec.createdAt;
    const policy = Array.from(state.policies.values()).find((p) => p.scope === rec.scope);
    if (!policy) continue;
    if (age >= policy.ttlMs) {
      records.set(id, { ...rec, lastAction: policy.action });
      actionsApplied++;
    }
  }
  return { ...state, records, actionsApplied: state.actionsApplied + actionsApplied };
}

export function policyFor(state: MemoryRetentionState, scope: string): RetentionPolicy | undefined {
  return Array.from(state.policies.values()).find((p) => p.scope === scope);
}

export function expiredRecords(state: MemoryRetentionState, now = Date.now()): RetentionRecord[] {
  const expired: RetentionRecord[] = [];
  for (const rec of state.records.values()) {
    const policy = policyFor(state, rec.scope);
    if (policy && now - rec.createdAt >= policy.ttlMs) expired.push(rec);
  }
  return expired;
}

export function memoryRetentionHealth(state: MemoryRetentionState): { policies: number; records: number; actions: number; health: number } {
  return { policies: state.policies.size, records: state.records.size, actions: state.actionsApplied, health: state.policies.size > 0 ? 1 : 0.5 };
}
