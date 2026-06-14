// V2285 ContextQuota - Direction J Iter 20/30
// Per-user context size quota
// Source: ruflo
export interface ContextQuotaInfo {
  quotaId: string;
  userId: string;
  tokensLimit: number;
  used: number;
}

export interface ContextQuotaState {
  quotas: Map<string, ContextQuotaInfo>;
}

export function createContextQuotaState(): ContextQuotaState {
  return { quotas: new Map() };
}

export function setContextQuota(state: ContextQuotaState, userId: string, tokensLimit: number): ContextQuotaState {
  const existing = Array.from(state.quotas.values()).find((q) => q.userId === userId);
  const quotas = new Map(state.quotas);
  if (existing) { quotas.set(existing.quotaId, { ...existing, tokensLimit }); return { ...state, quotas }; }
  const q: ContextQuotaInfo = { quotaId: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, userId, tokensLimit, used: 0 };
  quotas.set(q.quotaId, q);
  return { ...state, quotas };
}

export function consumeContextQuota(state: ContextQuotaState, userId: string, tokens: number): { state: ContextQuotaState; ok: boolean; remaining: number } {
  const q = Array.from(state.quotas.values()).find((x) => x.userId === userId);
  if (!q) return { state, ok: false, remaining: 0 };
  if (q.used + tokens > q.tokensLimit) return { state, ok: false, remaining: q.tokensLimit - q.used };
  const quotas = new Map(state.quotas);
  quotas.set(q.quotaId, { ...q, used: q.used + tokens });
  return { state: { ...state, quotas }, ok: true, remaining: q.tokensLimit - q.used - tokens };
}

export function releaseContextQuota(state: ContextQuotaState, userId: string, tokens: number): ContextQuotaState {
  const q = Array.from(state.quotas.values()).find((x) => x.userId === userId);
  if (!q) return state;
  const quotas = new Map(state.quotas);
  quotas.set(q.quotaId, { ...q, used: Math.max(0, q.used - tokens) });
  return { ...state, quotas };
}

export function contextQuotaFor(state: ContextQuotaState, userId: string): ContextQuotaInfo | undefined {
  return Array.from(state.quotas.values()).find((q) => q.userId === userId);
}

export function contextQuotaHealth(state: ContextQuotaState): { users: number; health: number } {
  return { users: state.quotas.size, health: state.quotas.size > 0 ? 1 : 0.5 };
}
