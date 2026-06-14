// V2254 CacheAuditTrail - Direction I Iter 19/30
// Cryptographic audit chain
// Source: ruflo
export interface CacheAuditEntry {
  seq: number;
  actor: string;
  action: string;
  key: string;
  prevHash: string;
  hash: string;
  ts: number;
}

export interface CacheAuditState {
  entries: CacheAuditEntry[];
  nextSeq: number;
}

function fnv(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function createCacheAuditState(): CacheAuditState {
  return { entries: [], nextSeq: 1 };
}

export function appendCacheAudit(state: CacheAuditState, actor: string, action: string, key: string): CacheAuditState {
  const prev = state.entries[state.entries.length - 1];
  const prevHash = prev ? prev.hash : '00000000';
  const payload = `${state.nextSeq}|${actor}|${action}|${key}|${prevHash}|${Date.now()}`;
  const hash = fnv(payload);
  const entry: CacheAuditEntry = { seq: state.nextSeq, actor, action, key, prevHash, hash, ts: Date.now() };
  return { ...state, entries: [...state.entries, entry], nextSeq: state.nextSeq + 1 };
}

export function verifyCacheChain(state: CacheAuditState): { valid: boolean; brokenAt: number | null } {
  let prevHash = '00000000';
  for (const e of state.entries) {
    if (e.prevHash !== prevHash) return { valid: false, brokenAt: e.seq };
    prevHash = e.hash;
  }
  return { valid: true, brokenAt: null };
}

export function cacheAuditFor(state: CacheAuditState, key: string): CacheAuditEntry[] {
  return state.entries.filter((e) => e.key === key);
}

export function cacheAuditHealth(state: CacheAuditState): { count: number; chainValid: boolean; health: number } {
  const v = verifyCacheChain(state);
  return { count: state.entries.length, chainValid: v.valid, health: v.valid ? 1 : 0 };
}
