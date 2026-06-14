// V2308 SkillTTL - Direction K Iter 13/30
// TTL-based skill expiration
// Source: nanobot
export interface SkillTTLEntry {
  key: string;
  expiresAt: number;
  ttlMs: number;
}

export interface SkillTTLState {
  entries: Map<string, SkillTTLEntry>;
  totalExpirations: number;
}

export function createSkillTTLState(): SkillTTLState {
  return { entries: new Map(), totalExpirations: 0 };
}

export function setSkillTTL(state: SkillTTLState, key: string, ttlMs: number): SkillTTLState {
  const entries = new Map(state.entries);
  entries.set(key, { key, expiresAt: Date.now() + ttlMs, ttlMs });
  return { ...state, entries };
}

export function getSkillTTL(state: SkillTTLState, key: string): number {
  const e = state.entries.get(key);
  if (!e) return 0;
  return Math.max(0, e.expiresAt - Date.now());
}

export function isSkillExpired(state: SkillTTLState, key: string, now = Date.now()): boolean {
  const e = state.entries.get(key);
  return e ? e.expiresAt <= now : true;
}

export function evictSkillExpired(state: SkillTTLState, now = Date.now()): SkillTTLState {
  const entries = new Map(state.entries);
  let count = 0;
  for (const [k, e] of entries) {
    if (e.expiresAt <= now) { entries.delete(k); count++; }
  }
  return { ...state, entries, totalExpirations: state.totalExpirations + count };
}

export function extendSkillTTL(state: SkillTTLState, key: string, additionalMs: number): SkillTTLState {
  const e = state.entries.get(key);
  if (!e) return state;
  const entries = new Map(state.entries);
  entries.set(key, { ...e, expiresAt: e.expiresAt + additionalMs, ttlMs: e.ttlMs + additionalMs });
  return { ...state, entries };
}

export function skillTTLHealth(state: SkillTTLState): { entries: number; expirations: number; health: number } {
  return { entries: state.entries.size, expirations: state.totalExpirations, health: state.entries.size > 0 ? 1 : 0.5 };
}
