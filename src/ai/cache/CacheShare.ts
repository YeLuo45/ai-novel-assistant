// V2257 CacheShare - Direction I Iter 22/30
// Cross-agent cache sharing
// Source: chatdev
export type CacheShareLevel = 'private' | 'team' | 'public';

export interface CacheShareGrant {
  grantId: string;
  key: string;
  grantee: string;
  level: CacheShareLevel;
  expiresAt: number;
}

export interface CacheShareState {
  grants: Map<string, CacheShareGrant>;
  byKey: Map<string, string[]>;
}

export function createCacheShareState(): CacheShareState {
  return { grants: new Map(), byKey: new Map() };
}

export function grantCacheShare(state: CacheShareState, key: string, grantee: string, level: CacheShareLevel, ttlMs = 0): CacheShareState {
  const grantId = `csg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const grant: CacheShareGrant = { grantId, key, grantee, level, expiresAt: ttlMs > 0 ? Date.now() + ttlMs : 0 };
  const grants = new Map(state.grants);
  grants.set(grantId, grant);
  const byKey = new Map(state.byKey);
  const list = byKey.get(key) || [];
  byKey.set(key, [...list, grantId]);
  return { ...state, grants, byKey };
}

export function revokeCacheShare(state: CacheShareState, grantId: string): CacheShareState {
  const grants = new Map(state.grants);
  const grant = grants.get(grantId);
  grants.delete(grantId);
  const byKey = new Map(state.byKey);
  if (grant) byKey.set(grant.key, (byKey.get(grant.key) || []).filter((id) => id !== grantId));
  return { ...state, grants, byKey };
}

export function cacheGrantsForKey(state: CacheShareState, key: string): CacheShareGrant[] {
  return (state.byKey.get(key) || []).map((id) => state.grants.get(id)!).filter(Boolean);
}

export function canAccessCache(state: CacheShareState, key: string, grantee: string, now = Date.now()): boolean {
  return cacheGrantsForKey(state, key).some((g) => g.grantee === grantee && (g.expiresAt === 0 || g.expiresAt > now));
}

export function cacheShareCount(state: CacheShareState): number {
  return state.grants.size;
}

export function cacheShareHealth(state: CacheShareState): { grants: number; health: number } {
  return { grants: state.grants.size, health: state.grants.size > 0 ? 1 : 0.5 };
}
