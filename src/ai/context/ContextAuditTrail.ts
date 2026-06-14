// V2284 ContextAuditTrail - Direction J Iter 19/30
// Cryptographic audit chain
// Source: ruflo
export interface ContextAuditEntry {
  seq: number;
  actor: string;
  action: string;
  key: string;
  prevHash: string;
  hash: string;
  ts: number;
}

export interface ContextAuditState {
  entries: ContextAuditEntry[];
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

export function createContextAuditState(): ContextAuditState {
  return { entries: [], nextSeq: 1 };
}

export function appendContextAudit(state: ContextAuditState, actor: string, action: string, key: string): ContextAuditState {
  const prev = state.entries[state.entries.length - 1];
  const prevHash = prev ? prev.hash : '00000000';
  const payload = `${state.nextSeq}|${actor}|${action}|${key}|${prevHash}|${Date.now()}`;
  const hash = fnv(payload);
  const entry: ContextAuditEntry = { seq: state.nextSeq, actor, action, key, prevHash, hash, ts: Date.now() };
  return { ...state, entries: [...state.entries, entry], nextSeq: state.nextSeq + 1 };
}

export function verifyContextChain(state: ContextAuditState): { valid: boolean; brokenAt: number | null } {
  let prevHash = '00000000';
  for (const e of state.entries) {
    if (e.prevHash !== prevHash) return { valid: false, brokenAt: e.seq };
    prevHash = e.hash;
  }
  return { valid: true, brokenAt: null };
}

export function contextAuditFor(state: ContextAuditState, key: string): ContextAuditEntry[] {
  return state.entries.filter((e) => e.key === key);
}

export function contextAuditHealth(state: ContextAuditState): { count: number; chainValid: boolean; health: number } {
  const v = verifyContextChain(state);
  return { count: state.entries.length, chainValid: v.valid, health: v.valid ? 1 : 0 };
}
