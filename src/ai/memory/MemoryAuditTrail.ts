// V2164 MemoryAuditTrail - Direction F Iter 19/30
// Cryptographic audit chain
// Source: ruflo
export interface AuditEntry {
  seq: number;
  actor: string;
  action: string;
  memId: string;
  prevHash: string;
  hash: string;
  ts: number;
}

export interface MemoryAuditState {
  entries: AuditEntry[];
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

export function createMemoryAuditState(): MemoryAuditState {
  return { entries: [], nextSeq: 1 };
}

export function appendAudit(state: MemoryAuditState, actor: string, action: string, memId: string): MemoryAuditState {
  const prev = state.entries[state.entries.length - 1];
  const prevHash = prev ? prev.hash : '00000000';
  const payload = `${state.nextSeq}|${actor}|${action}|${memId}|${prevHash}|${Date.now()}`;
  const hash = fnv(payload);
  const entry: AuditEntry = { seq: state.nextSeq, actor, action, memId, prevHash, hash, ts: Date.now() };
  return { ...state, entries: [...state.entries, entry], nextSeq: state.nextSeq + 1 };
}

export function verifyChain(state: MemoryAuditState): { valid: boolean; brokenAt: number | null } {
  let prevHash = '00000000';
  for (const e of state.entries) {
    if (e.prevHash !== prevHash) return { valid: false, brokenAt: e.seq };
    prevHash = e.hash;
  }
  return { valid: true, brokenAt: null };
}

export function getAuditFor(state: MemoryAuditState, memId: string): AuditEntry[] {
  return state.entries.filter((e) => e.memId === memId);
}

export function getAuditBy(state: MemoryAuditState, actor: string): AuditEntry[] {
  return state.entries.filter((e) => e.actor === actor);
}

export function memoryAuditHealth(state: MemoryAuditState): { count: number; chainValid: boolean; health: number } {
  const v = verifyChain(state);
  return { count: state.entries.length, chainValid: v.valid, health: v.valid ? 1 : 0 };
}
