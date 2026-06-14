// V2307 SkillCompaction - Direction K Iter 12/30
// Background skill compaction
// Source: nanobot
export interface SkillCompactionSeg {
  id: string;
  originalCount: number;
  finalCount: number;
  sizeBefore: number;
  sizeAfter: number;
  ts: number;
}

export interface SkillCompactionState {
  pending: Map<string, unknown>;
  segments: SkillCompactionSeg[];
  ratio: number;
}

export function createSkillCompactionState(ratio = 0.5): SkillCompactionState {
  return { pending: new Map(), segments: [], ratio };
}

export function enqueueSkillEntry(state: SkillCompactionState, key: string, value: unknown): SkillCompactionState {
  const pending = new Map(state.pending);
  pending.set(key, value);
  return { ...state, pending };
}

export function runSkillCompaction(state: SkillCompactionState): SkillCompactionState {
  if (state.pending.size === 0) return state;
  const entries = Array.from(state.pending.entries());
  const sizeBefore = entries.reduce((s, [_, v]) => s + JSON.stringify(v).length, 0);
  const unique = new Map<string, unknown>();
  for (const [k, v] of entries) unique.set(k, v);
  const merged = JSON.stringify(Array.from(unique.entries()));
  const target = Math.floor(merged.length * state.ratio);
  const seg: SkillCompactionSeg = { id: `skseg-${Date.now()}`, originalCount: entries.length, finalCount: unique.size, sizeBefore, sizeAfter: target, ts: Date.now() };
  return { ...state, pending: new Map(), segments: [...state.segments, seg] };
}

export function skillCompactionHealth(state: SkillCompactionState): { segments: number; health: number } {
  return { segments: state.segments.length, health: state.segments.length > 0 ? 1 : 0.5 };
}
