// V2167 MemoryShare - Direction F Iter 22/30
// Cross-agent memory sharing protocol
// Source: chatdev
export type ShareLevel = 'private' | 'team' | 'public';

export interface ShareGrant {
  grantId: string;
  memId: string;
  grantee: string;
  level: ShareLevel;
  grantedAt: number;
  expiresAt: number; // 0 = never
}

export interface ShareState {
  grants: Map<string, ShareGrant>;
  byMem: Map<string, string[]>; // memId → grantIds
}

export function createShareState(): ShareState {
  return { grants: new Map(), byMem: new Map() };
}

export function grantShare(state: ShareState, memId: string, grantee: string, level: ShareLevel, ttlMs = 0): ShareState {
  const grantId = `sg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const grant: ShareGrant = { grantId, memId, grantee, level, grantedAt: Date.now(), expiresAt: ttlMs > 0 ? Date.now() + ttlMs : 0 };
  const grants = new Map(state.grants);
  grants.set(grantId, grant);
  const byMem = new Map(state.byMem);
  const list = byMem.get(memId) || [];
  byMem.set(memId, [...list, grantId]);
  return { ...state, grants, byMem };
}

export function revokeShare(state: ShareState, grantId: string): ShareState {
  const grants = new Map(state.grants);
  const grant = grants.get(grantId);
  grants.delete(grantId);
  const byMem = new Map(state.byMem);
  if (grant) {
    const list = (byMem.get(grant.memId) || []).filter((id) => id !== grantId);
    byMem.set(grant.memId, list);
  }
  return { ...state, grants, byMem };
}

export function grantsForMem(state: ShareState, memId: string): ShareGrant[] {
  const ids = state.byMem.get(memId) || [];
  return ids.map((id) => state.grants.get(id)!).filter(Boolean);
}

export function canAccess(state: ShareState, memId: string, grantee: string, now = Date.now()): boolean {
  const grants = grantsForMem(state, memId);
  return grants.some((g) => g.grantee === grantee && (g.expiresAt === 0 || g.expiresAt > now));
}

export function shareCount(state: ShareState): number {
  return state.grants.size;
}

export function memoryShareHealth(state: ShareState): { grants: number; mems: number; health: number } {
  return { grants: state.grants.size, mems: state.byMem.size, health: state.grants.size > 0 ? 1 : 0.5 };
}
