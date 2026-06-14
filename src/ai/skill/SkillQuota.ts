// V2315 SkillQuota - Direction K Iter 20/30
// Per-user skill storage quota
// Source: ruflo
export interface SkillQuotaInfo {
  quotaId: string;
  userId: string;
  tokensLimit: number;
  used: number;
}

export interface SkillQuotaState {
  quotas: Map<string, SkillQuotaInfo>;
}

export function createSkillQuotaState(): SkillQuotaState {
  return { quotas: new Map() };
}

export function setSkillQuota(state: SkillQuotaState, userId: string, tokensLimit: number): SkillQuotaState {
  const existing = Array.from(state.quotas.values()).find((q) => q.userId === userId);
  const quotas = new Map(state.quotas);
  if (existing) { quotas.set(existing.quotaId, { ...existing, tokensLimit }); return { ...state, quotas }; }
  const q: SkillQuotaInfo = { quotaId: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, userId, tokensLimit, used: 0 };
  quotas.set(q.quotaId, q);
  return { ...state, quotas };
}

export function consumeSkillQuota(state: SkillQuotaState, userId: string, tokens: number): { state: SkillQuotaState; ok: boolean; remaining: number } {
  const q = Array.from(state.quotas.values()).find((x) => x.userId === userId);
  if (!q) return { state, ok: false, remaining: 0 };
  if (q.used + tokens > q.tokensLimit) return { state, ok: false, remaining: q.tokensLimit - q.used };
  const quotas = new Map(state.quotas);
  quotas.set(q.quotaId, { ...q, used: q.used + tokens });
  return { state: { ...state, quotas }, ok: true, remaining: q.tokensLimit - q.used - tokens };
}

export function releaseSkillQuota(state: SkillQuotaState, userId: string, tokens: number): SkillQuotaState {
  const q = Array.from(state.quotas.values()).find((x) => x.userId === userId);
  if (!q) return state;
  const quotas = new Map(state.quotas);
  quotas.set(q.quotaId, { ...q, used: Math.max(0, q.used - tokens) });
  return { ...state, quotas };
}

export function skillQuotaFor(state: SkillQuotaState, userId: string): SkillQuotaInfo | undefined {
  return Array.from(state.quotas.values()).find((q) => q.userId === userId);
}

export function skillQuotaHealth(state: SkillQuotaState): { users: number; health: number } {
  return { users: state.quotas.size, health: state.quotas.size > 0 ? 1 : 0.5 };
}
