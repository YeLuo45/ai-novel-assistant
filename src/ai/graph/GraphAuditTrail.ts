// V2194 GraphAuditTrail - Direction G Iter 19/30
// Cryptographic audit chain
// Source: ruflo
export interface GraphAuditEntry {
  seq: number;
  actor: string;
  action: string;
  target: string;
  prevHash: string;
  hash: string;
  ts: number;
}

export interface GraphAuditState {
  entries: GraphAuditEntry[];
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

export function createGraphAuditState(): GraphAuditState {
  return { entries: [], nextSeq: 1 };
}

export function appendGraphAudit(state: GraphAuditState, actor: string, action: string, target: string): GraphAuditState {
  const prev = state.entries[state.entries.length - 1];
  const prevHash = prev ? prev.hash : '00000000';
  const payload = `${state.nextSeq}|${actor}|${action}|${target}|${prevHash}|${Date.now()}`;
  const hash = fnv(payload);
  const entry: GraphAuditEntry = { seq: state.nextSeq, actor, action, target, prevHash, hash, ts: Date.now() };
  return { ...state, entries: [...state.entries, entry], nextSeq: state.nextSeq + 1 };
}

export function verifyGraphChain(state: GraphAuditState): { valid: boolean; brokenAt: number | null } {
  let prevHash = '00000000';
  for (const e of state.entries) {
    if (e.prevHash !== prevHash) return { valid: false, brokenAt: e.seq };
    prevHash = e.hash;
  }
  return { valid: true, brokenAt: null };
}

export function graphAuditFor(state: GraphAuditState, target: string): GraphAuditEntry[] {
  return state.entries.filter((e) => e.target === target);
}

export function graphAuditBy(state: GraphAuditState, actor: string): GraphAuditEntry[] {
  return state.entries.filter((e) => e.actor === actor);
}

export function graphAuditHealth(state: GraphAuditState): { count: number; chainValid: boolean; health: number } {
  const v = verifyGraphChain(state);
  return { count: state.entries.length, chainValid: v.valid, health: v.valid ? 1 : 0 };
}
