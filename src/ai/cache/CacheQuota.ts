// V2255 CacheQuota - Direction I Iter 20/30
// Per-user cache size quota
// Source: ruflo
export interface CacheQuotaInfo {
  quotaId: string;
  userId: string;
  bytesLimit: number;
  used: number;
}

export interface CacheQuotaState {
  quotas: Map<string, CacheQuotaInfo>;
}

export function createCacheQuotaState(): CacheQuotaState {
  return { quotas: new Map() };
}

export function setCacheQuota(state: CacheQuotaState, userId: string, bytesLimit: number): CacheQuotaState {
  const existing = Array.from(state.quotas.values()).find((q) => q.userId === userId);
  const quotas = new Map(state.quotas);
  if (existing) {
    quotas.set(existing.quotaId, { ...existing, bytesLimit });
    return { ...state, quotas };
  }
  const q: CacheQuotaInfo = { quotaId: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, userId, bytesLimit, used: 0 };
  quotas.set(q.quotaId, q);
  return { ...state, quotas };
}

export function consumeCacheQuota(state: CacheQuotaState, userId: string, bytes: number): { state: CacheQuotaState; ok: boolean; remaining: number } {
  const q = Array.from(state.quotas.values()).find((x) => x.userId === userId);
  if (!q) return { state, ok: false, remaining: 0 };
  if (q.used + bytes > q.bytesLimit) return { state, ok: false, remaining: q.bytesLimit - q.used };
  const quotas = new Map(state.quotas);
  quotas.set(q.quotaId, { ...q, used: q.used + bytes });
  return { state: { ...state, quotas }, ok: true, remaining: q.bytesLimit - q.used - bytes };
}

export function releaseCacheQuota(state: CacheQuotaState, userId: string, bytes: number): CacheQuotaState {
  const q = Array.from(state.quotas.values()).find((x) => x.userId === userId);
  if (!q) return state;
  const quotas = new Map(state.quotas);
  quotas.set(q.quotaId, { ...q, used: Math.max(0, q.used - bytes) });
  return { ...state, quotas };
}

export function cacheQuotaFor(state: CacheQuotaState, userId: string): CacheQuotaInfo | undefined {
  return Array.from(state.quotas.values()).find((q) => q.userId === userId);
}

export function cacheQuotaHealth(state: CacheQuotaState): { users: number; health: number } {
  return { users: state.quotas.size, health: state.quotas.size > 0 ? 1 : 0.5 };
}
