// V2317 SkillShare - Direction K Iter 22/30
// Cross-agent skill sharing
// Source: chatdev
export type SkillShareLevel = 'private' | 'team' | 'public';

export interface SkillShareGrant {
  grantId: string;
  key: string;
  grantee: string;
  level: SkillShareLevel;
  expiresAt: number;
}

export interface SkillShareState {
  grants: Map<string, SkillShareGrant>;
  byKey: Map<string, string[]>;
}

export function createSkillShareState(): SkillShareState {
  return { grants: new Map(), byKey: new Map() };
}

export function grantSkillShare(state: SkillShareState, key: string, grantee: string, level: SkillShareLevel, ttlMs = 0): SkillShareState {
  const grantId = `sksg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const grant: SkillShareGrant = { grantId, key, grantee, level, expiresAt: ttlMs > 0 ? Date.now() + ttlMs : 0 };
  const grants = new Map(state.grants);
  grants.set(grantId, grant);
  const byKey = new Map(state.byKey);
  const list = byKey.get(key) || [];
  byKey.set(key, [...list, grantId]);
  return { ...state, grants, byKey };
}

export function revokeSkillShare(state: SkillShareState, grantId: string): SkillShareState {
  const grants = new Map(state.grants);
  const grant = grants.get(grantId);
  grants.delete(grantId);
  const byKey = new Map(state.byKey);
  if (grant) byKey.set(grant.key, (byKey.get(grant.key) || []).filter((id) => id !== grantId));
  return { ...state, grants, byKey };
}

export function skillGrantsForKey(state: SkillShareState, key: string): SkillShareGrant[] {
  return (state.byKey.get(key) || []).map((id) => state.grants.get(id)!).filter(Boolean);
}

export function canAccessSkill(state: SkillShareState, key: string, grantee: string, now = Date.now()): boolean {
  return skillGrantsForKey(state, key).some((g) => g.grantee === grantee && (g.expiresAt === 0 || g.expiresAt > now));
}

export function skillShareCount(state: SkillShareState): number {
  return state.grants.size;
}

export function skillShareHealth(state: SkillShareState): { grants: number; health: number } {
  return { grants: state.grants.size, health: state.grants.size > 0 ? 1 : 0.5 };
}
