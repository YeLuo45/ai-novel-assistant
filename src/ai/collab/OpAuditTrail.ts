// V2224 OpAuditTrail - Direction H Iter 19/30
// Cryptographic audit chain for ops
// Source: ruflo
export interface OpAuditEntry {
  seq: number;
  actor: string;
  action: string;
  opId: string;
  prevHash: string;
  hash: string;
  ts: number;
}

export interface OpAuditState {
  entries: OpAuditEntry[];
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

export function createOpAuditState(): OpAuditState {
  return { entries: [], nextSeq: 1 };
}

export function appendOpAudit(state: OpAuditState, actor: string, action: string, opId: string): OpAuditState {
  const prev = state.entries[state.entries.length - 1];
  const prevHash = prev ? prev.hash : '00000000';
  const payload = `${state.nextSeq}|${actor}|${action}|${opId}|${prevHash}|${Date.now()}`;
  const hash = fnv(payload);
  const entry: OpAuditEntry = { seq: state.nextSeq, actor, action, opId, prevHash, hash, ts: Date.now() };
  return { ...state, entries: [...state.entries, entry], nextSeq: state.nextSeq + 1 };
}

export function verifyOpChain(state: OpAuditState): { valid: boolean; brokenAt: number | null } {
  let prevHash = '00000000';
  for (const e of state.entries) {
    if (e.prevHash !== prevHash) return { valid: false, brokenAt: e.seq };
    prevHash = e.hash;
  }
  return { valid: true, brokenAt: null };
}

export function opAuditFor(state: OpAuditState, opId: string): OpAuditEntry[] {
  return state.entries.filter((e) => e.opId === opId);
}

export function opAuditBy(state: OpAuditState, actor: string): OpAuditEntry[] {
  return state.entries.filter((e) => e.actor === actor);
}

export function opAuditHealth(state: OpAuditState): { count: number; chainValid: boolean; health: number } {
  const v = verifyOpChain(state);
  return { count: state.entries.length, chainValid: v.valid, health: v.valid ? 1 : 0 };
}
