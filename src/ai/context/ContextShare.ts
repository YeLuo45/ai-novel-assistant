// V2287 ContextShare - Direction J Iter 22/30
// Cross-agent context sharing
// Source: chatdev
export type ContextShareLevel = 'private' | 'team' | 'public';

export interface ContextShareGrant {
  grantId: string;
  key: string;
  grantee: string;
  level: ContextShareLevel;
  expiresAt: number;
}

export interface ContextShareState {
  grants: Map<string, ContextShareGrant>;
  byKey: Map<string, string[]>;
}

export function createContextShareState(): ContextShareState {
  return { grants: new Map(), byKey: new Map() };
}

export function grantContextShare(state: ContextShareState, key: string, grantee: string, level: ContextShareLevel, ttlMs = 0): ContextShareState {
  const grantId = `cxsg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const grant: ContextShareGrant = { grantId, key, grantee, level, expiresAt: ttlMs > 0 ? Date.now() + ttlMs : 0 };
  const grants = new Map(state.grants);
  grants.set(grantId, grant);
  const byKey = new Map(state.byKey);
  const list = byKey.get(key) || [];
  byKey.set(key, [...list, grantId]);
  return { ...state, grants, byKey };
}

export function revokeContextShare(state: ContextShareState, grantId: string): ContextShareState {
  const grants = new Map(state.grants);
  const grant = grants.get(grantId);
  grants.delete(grantId);
  const byKey = new Map(state.byKey);
  if (grant) byKey.set(grant.key, (byKey.get(grant.key) || []).filter((id) => id !== grantId));
  return { ...state, grants, byKey };
}

export function contextGrantsForKey(state: ContextShareState, key: string): ContextShareGrant[] {
  return (state.byKey.get(key) || []).map((id) => state.grants.get(id)!).filter(Boolean);
}

export function canAccessContext(state: ContextShareState, key: string, grantee: string, now = Date.now()): boolean {
  return contextGrantsForKey(state, key).some((g) => g.grantee === grantee && (g.expiresAt === 0 || g.expiresAt > now));
}

export function contextShareCount(state: ContextShareState): number {
  return state.grants.size;
}

export function contextShareHealth(state: ContextShareState): { grants: number; health: number } {
  return { grants: state.grants.size, health: state.grants.size > 0 ? 1 : 0.5 };
}
