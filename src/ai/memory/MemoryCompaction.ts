// V2158 MemoryCompaction - Direction F Iter 13/30
// Background memory compaction
// Source: nanobot
export interface CompactedSegment {
  id: string;
  originalIds: string[];
  sizeBefore: number;
  sizeAfter: number;
  ts: number;
}

export interface MemoryCompactionState {
  pending: Map<string, string>; // id → content
  compacted: CompactedSegment[];
  ratio: number;
}

export function createCompactionState(ratio = 0.5): MemoryCompactionState {
  return { pending: new Map(), compacted: [], ratio };
}

export function enqueueCompact(state: MemoryCompactionState, id: string, content: string): MemoryCompactionState {
  const pending = new Map(state.pending);
  pending.set(id, content);
  return { ...state, pending };
}

export function runCompaction(state: MemoryCompactionState): MemoryCompactionState {
  if (state.pending.size === 0) return state;
  const ids = Array.from(state.pending.keys());
  const originals = Array.from(state.pending.values());
  const sizeBefore = originals.reduce((s, c) => s + c.length, 0);
  // Deduplicate by removing redundant whitespace
  const merged = originals.map((c) => c.replace(/\s+/g, ' ').trim()).join(' ');
  // Compress by ratio
  const target = Math.floor(merged.length * state.ratio);
  const compressed = merged.substring(0, target);
  const sizeAfter = compressed.length;
  const seg: CompactedSegment = { id: `seg-${Date.now()}`, originalIds: ids, sizeBefore, sizeAfter, ts: Date.now() };
  return { ...state, pending: new Map(), compacted: [...state.compacted, seg] };
}

export function pendingCount(state: MemoryCompactionState): number {
  return state.pending.size;
}

export function totalCompression(state: MemoryCompactionState): number {
  const before = state.compacted.reduce((s, c) => s + c.sizeBefore, 0);
  const after = state.compacted.reduce((s, c) => s + c.sizeAfter, 0);
  if (before === 0) return 0;
  return 1 - after / before;
}

export function setRatio(state: MemoryCompactionState, ratio: number): MemoryCompactionState {
  return { ...state, ratio: Math.max(0, Math.min(1, ratio)) };
}

export function memoryCompactionHealth(state: MemoryCompactionState): { segments: number; compression: number; health: number } {
  const compression = totalCompression(state);
  return { segments: state.compacted.length, compression, health: state.compacted.length > 0 ? 1 : 0.5 };
}
