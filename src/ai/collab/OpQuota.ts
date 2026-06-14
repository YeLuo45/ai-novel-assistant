// V2225 OpQuota - Direction H Iter 20/30
// Per-user operation quota
// Source: ruflo
export interface OpQuotaInfo {
  quotaId: string;
  userId: string;
  opsPerMinute: number;
  used: number;
  resetAt: number;
}

export interface OpQuotaState {
  quotas: Map<string, OpQuotaInfo>;
}

export function createOpQuotaState(): OpQuotaState {
  return { quotas: new Map() };
}

export function setOpQuota(state: OpQuotaState, userId: string, opsPerMinute: number): OpQuotaState {
  const existing = Array.from(state.quotas.values()).find((q) => q.userId === userId);
  const quotas = new Map(state.quotas);
  if (existing) {
    quotas.set(existing.quotaId, { ...existing, opsPerMinute, used: 0, resetAt: Date.now() + 60000 });
    return { ...state, quotas };
  }
  const q: OpQuotaInfo = { quotaId: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, userId, opsPerMinute, used: 0, resetAt: Date.now() + 60000 };
  quotas.set(q.quotaId, q);
  return { ...state, quotas };
}

export function checkOpQuota(state: OpQuotaState, userId: string): { state: OpQuotaState; allowed: boolean; remaining: number } {
  const q = Array.from(state.quotas.values()).find((x) => x.userId === userId);
  if (!q) return { state, allowed: true, remaining: 0 };
  const now = Date.now();
  if (now > q.resetAt) {
    const quotas = new Map(state.quotas);
    quotas.set(q.quotaId, { ...q, used: 0, resetAt: now + 60000 });
    return { state: { ...state, quotas }, allowed: true, remaining: q.opsPerMinute };
  }
  if (q.used >= q.opsPerMinute) return { state, allowed: false, remaining: 0 };
  const quotas = new Map(state.quotas);
  quotas.set(q.quotaId, { ...q, used: q.used + 1 });
  return { state: { ...state, quotas }, allowed: true, remaining: q.opsPerMinute - q.used - 1 };
}

export function opQuotaFor(state: OpQuotaState, userId: string): OpQuotaInfo | undefined {
  return Array.from(state.quotas.values()).find((q) => q.userId === userId);
}

export function opQuotaHealth(state: OpQuotaState): { users: number; health: number } {
  return { users: state.quotas.size, health: state.quotas.size > 0 ? 1 : 0.5 };
}
