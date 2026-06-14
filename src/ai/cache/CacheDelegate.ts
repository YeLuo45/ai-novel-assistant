// V2259 CacheDelegate - Direction I Iter 24/30
// Cache access delegation
// Source: chatdev
export interface CacheDelegation {
  delId: string;
  from: string;
  to: string;
  key: string;
  scope: 'read' | 'write' | 'all';
  expiresAt: number;
}

export interface CacheDelegateState {
  delegations: Map<string, CacheDelegation>;
}

export function createCacheDelegateState(): CacheDelegateState {
  return { delegations: new Map() };
}

export function delegateCache(state: CacheDelegateState, from: string, to: string, key: string, scope: 'read' | 'write' | 'all', ttlMs = 0): CacheDelegateState {
  const delId = `cdel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const del: CacheDelegation = { delId, from, to, key, scope, expiresAt: ttlMs > 0 ? Date.now() + ttlMs : 0 };
  const delegations = new Map(state.delegations);
  delegations.set(delId, del);
  return { ...state, delegations };
}

export function revokeCacheDelegation(state: CacheDelegateState, delId: string): CacheDelegateState {
  const delegations = new Map(state.delegations);
  delegations.delete(delId);
  return { ...state, delegations };
}

export function cacheDelegationsTo(state: CacheDelegateState, to: string): CacheDelegation[] {
  return Array.from(state.delegations.values()).filter((d) => d.to === to);
}

export function canDelegateCache(state: CacheDelegateState, to: string, key: string, scope: 'read' | 'write', now = Date.now()): boolean {
  return cacheDelegationsTo(state, to).some((d) => d.key === key && (d.scope === 'all' || d.scope === scope) && (d.expiresAt === 0 || d.expiresAt > now));
}

export function cacheDelegateCount(state: CacheDelegateState): number {
  return state.delegations.size;
}

export function cacheDelegateHealth(state: CacheDelegateState): { count: number; health: number } {
  return { count: state.delegations.size, health: state.delegations.size > 0 ? 1 : 0.5 };
}
