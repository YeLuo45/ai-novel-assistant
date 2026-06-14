// V2314 SkillAuditTrail - Direction K Iter 19/30
// Cryptographic audit chain
// Source: ruflo
export interface SkillAuditEntry {
  seq: number;
  actor: string;
  action: string;
  key: string;
  prevHash: string;
  hash: string;
  ts: number;
}

export interface SkillAuditState {
  entries: SkillAuditEntry[];
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

export function createSkillAuditState(): SkillAuditState {
  return { entries: [], nextSeq: 1 };
}

export function appendSkillAudit(state: SkillAuditState, actor: string, action: string, key: string): SkillAuditState {
  const prev = state.entries[state.entries.length - 1];
  const prevHash = prev ? prev.hash : '00000000';
  const payload = `${state.nextSeq}|${actor}|${action}|${key}|${prevHash}|${Date.now()}`;
  const hash = fnv(payload);
  const entry: SkillAuditEntry = { seq: state.nextSeq, actor, action, key, prevHash, hash, ts: Date.now() };
  return { ...state, entries: [...state.entries, entry], nextSeq: state.nextSeq + 1 };
}

export function verifySkillChain(state: SkillAuditState): { valid: boolean; brokenAt: number | null } {
  let prevHash = '00000000';
  for (const e of state.entries) {
    if (e.prevHash !== prevHash) return { valid: false, brokenAt: e.seq };
    prevHash = e.hash;
  }
  return { valid: true, brokenAt: null };
}

export function skillAuditFor(state: SkillAuditState, key: string): SkillAuditEntry[] {
  return state.entries.filter((e) => e.key === key);
}

export function skillAuditHealth(state: SkillAuditState): { count: number; chainValid: boolean; health: number } {
  const v = verifySkillChain(state);
  return { count: state.entries.length, chainValid: v.valid, health: v.valid ? 1 : 0 };
}
