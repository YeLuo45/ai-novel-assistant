// V2165 MemoryQuota - Direction F Iter 20/30
// Per-user/space storage quotas
// Source: ruflo
export interface Quota {
  quotaId: string;
  ownerId: string;
  limit: number; // bytes
  used: number;
}

export interface MemoryQuotaState {
  quotas: Map<string, Quota>;
}

export function createMemoryQuotaState(): MemoryQuotaState {
  return { quotas: new Map() };
}

export function setQuota(state: MemoryQuotaState, ownerId: string, limit: number): MemoryQuotaState {
  const existing = Array.from(state.quotas.values()).find((q) => q.ownerId === ownerId);
  const quotas = new Map(state.quotas);
  if (existing) {
    quotas.set(existing.quotaId, { ...existing, limit });
    return { ...state, quotas };
  }
  const q: Quota = { quotaId: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ownerId, limit, used: 0 };
  quotas.set(q.quotaId, q);
  return { ...state, quotas };
}

export function consumeQuota(state: MemoryQuotaState, ownerId: string, bytes: number): { state: MemoryQuotaState; ok: boolean; remaining: number } {
  const q = Array.from(state.quotas.values()).find((x) => x.ownerId === ownerId);
  if (!q) return { state, ok: false, remaining: 0 };
  if (q.used + bytes > q.limit) return { state, ok: false, remaining: q.limit - q.used };
  const quotas = new Map(state.quotas);
  quotas.set(q.quotaId, { ...q, used: q.used + bytes });
  return { state: { ...state, quotas }, ok: true, remaining: q.limit - q.used - bytes };
}

export function releaseQuota(state: MemoryQuotaState, ownerId: string, bytes: number): MemoryQuotaState {
  const q = Array.from(state.quotas.values()).find((x) => x.ownerId === ownerId);
  if (!q) return state;
  const quotas = new Map(state.quotas);
  quotas.set(q.quotaId, { ...q, used: Math.max(0, q.used - bytes) });
  return { ...state, quotas };
}

export function quotaFor(state: MemoryQuotaState, ownerId: string): Quota | undefined {
  return Array.from(state.quotas.values()).find((q) => q.ownerId === ownerId);
}

export function utilization(state: MemoryQuotaState, ownerId: string): number {
  const q = quotaFor(state, ownerId);
  return q ? q.used / q.limit : 0;
}

export function overQuotaOwners(state: MemoryQuotaState): string[] {
  return Array.from(state.quotas.values()).filter((q) => q.used >= q.limit).map((q) => q.ownerId);
}

export function memoryQuotaHealth(state: MemoryQuotaState): { owners: number; avgUtil: number; health: number } {
  const list = Array.from(state.quotas.values());
  const avg = list.length > 0 ? list.reduce((s, q) => s + q.used / q.limit, 0) / list.length : 0;
  return { owners: list.length, avgUtil: avg, health: avg < 0.9 ? 1 : 0.5 };
}
