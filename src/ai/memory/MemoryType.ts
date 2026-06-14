// V2151 MemoryType - Direction F Iter 6/30
// Type system (episodic/semantic/procedural/working)
// Source: thunderbolt
export type MemoryKind = 'episodic' | 'semantic' | 'procedural' | 'working';

export interface TypedMemory {
  id: string;
  kind: MemoryKind;
  content: string;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
  importance: number;
}

export interface MemoryTypeState {
  byKind: Map<MemoryKind, TypedMemory[]>;
}

export function createMemoryTypeState(): MemoryTypeState {
  return { byKind: new Map() };
}

export function addTypedMemory(state: MemoryTypeState, mem: Omit<TypedMemory, 'lastAccessed' | 'accessCount'>): MemoryTypeState {
  const full: TypedMemory = { ...mem, lastAccessed: Date.now(), accessCount: 0 };
  const byKind = new Map(state.byKind);
  const list = byKind.get(mem.kind) || [];
  byKind.set(mem.kind, [...list, full]);
  return { ...state, byKind };
}

export function accessMemory(state: MemoryTypeState, id: string): MemoryTypeState {
  const byKind = new Map(state.byKind);
  for (const [kind, list] of byKind) {
    const idx = list.findIndex((m) => m.id === id);
    if (idx >= 0) {
      const m = list[idx];
      byKind.set(kind, [...list.slice(0, idx), { ...m, lastAccessed: Date.now(), accessCount: m.accessCount + 1 }, ...list.slice(idx + 1)]);
      return { ...state, byKind };
    }
  }
  return state;
}

export function setImportance(state: MemoryTypeState, id: string, importance: number): MemoryTypeState {
  const byKind = new Map(state.byKind);
  for (const [kind, list] of byKind) {
    const idx = list.findIndex((m) => m.id === id);
    if (idx >= 0) {
      const m = list[idx];
      byKind.set(kind, [...list.slice(0, idx), { ...m, importance: Math.max(0, Math.min(1, importance)) }, ...list.slice(idx + 1)]);
      return { ...state, byKind };
    }
  }
  return state;
}

export function byKind(state: MemoryTypeState, kind: MemoryKind): TypedMemory[] {
  return state.byKind.get(kind) || [];
}

export function totalByKind(state: MemoryTypeState): Record<MemoryKind, number> {
  const counts: Record<MemoryKind, number> = { episodic: 0, semantic: 0, procedural: 0, working: 0 };
  for (const [k, list] of state.byKind) counts[k as MemoryKind] = list.length;
  return counts;
}

export function mostAccessed(state: MemoryTypeState, topK = 5): TypedMemory[] {
  const all: TypedMemory[] = [];
  for (const list of state.byKind.values()) all.push(...list);
  all.sort((a, b) => b.accessCount - a.accessCount);
  return all.slice(0, topK);
}

export function evictLeastImportant(state: MemoryTypeState, kind: MemoryKind, keepN: number): MemoryTypeState {
  const list = state.byKind.get(kind) || [];
  if (list.length <= keepN) return state;
  const sorted = [...list].sort((a, b) => b.importance - a.importance);
  const byKind = new Map(state.byKind);
  byKind.set(kind, sorted.slice(0, keepN));
  return { ...state, byKind };
}

export function memoryTypeHealth(state: MemoryTypeState): { total: number; kinds: number; health: number } {
  const total = Array.from(state.byKind.values()).reduce((s, l) => s + l.length, 0);
  return { total, kinds: state.byKind.size, health: total > 0 ? 1 : 0.5 };
}
