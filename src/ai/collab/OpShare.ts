// V2227 OpShare - Direction H Iter 22/30
// Cross-agent operation share
// Source: chatdev
export type OpShareLevel = 'private' | 'team' | 'public';

export interface OpShareGrant {
  grantId: string;
  opId: string;
  grantee: string;
  level: OpShareLevel;
  expiresAt: number;
}

export interface OpShareState {
  grants: Map<string, OpShareGrant>;
  byOp: Map<string, string[]>;
}

export function createOpShareState(): OpShareState {
  return { grants: new Map(), byOp: new Map() };
}

export function grantOpShare(state: OpShareState, opId: string, grantee: string, level: OpShareLevel, ttlMs = 0): OpShareState {
  const grantId = `osg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const grant: OpShareGrant = { grantId, opId, grantee, level, expiresAt: ttlMs > 0 ? Date.now() + ttlMs : 0 };
  const grants = new Map(state.grants);
  grants.set(grantId, grant);
  const byOp = new Map(state.byOp);
  const list = byOp.get(opId) || [];
  byOp.set(opId, [...list, grantId]);
  return { ...state, grants, byOp };
}

export function revokeOpShare(state: OpShareState, grantId: string): OpShareState {
  const grants = new Map(state.grants);
  const grant = grants.get(grantId);
  grants.delete(grantId);
  const byOp = new Map(state.byOp);
  if (grant) byOp.set(grant.opId, (byOp.get(grant.opId) || []).filter((id) => id !== grantId));
  return { ...state, grants, byOp };
}

export function opGrantsForOp(state: OpShareState, opId: string): OpShareGrant[] {
  return (state.byOp.get(opId) || []).map((id) => state.grants.get(id)!).filter(Boolean);
}

export function canAccessOp(state: OpShareState, opId: string, grantee: string, now = Date.now()): boolean {
  return opGrantsForOp(state, opId).some((g) => g.grantee === grantee && (g.expiresAt === 0 || g.expiresAt > now));
}

export function opShareCount(state: OpShareState): number {
  return state.grants.size;
}

export function opShareHealth(state: OpShareState): { grants: number; health: number } {
  return { grants: state.grants.size, health: state.grants.size > 0 ? 1 : 0.5 };
}
