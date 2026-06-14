// V2146 MemoryEncoder - Direction F Iter 1/30
// Encode memories to compact vectors + tags
// Source: thunderbolt
export type MemoryAspect = 'new' | 'encoded' | 'indexed' | 'stale' | 'archived';

export interface EncodedMemory {
  id: string;
  raw: string;
  vec: number[];
  tags: string[];
  aspect: MemoryAspect;
  weight: number;
  ts: number;
}

export function createMemoryEncoder(): { memories: Map<string, EncodedMemory> } {
  return { memories: new Map() };
}

function hashToVec(s: string, dim = 8): number[] {
  const out: number[] = new Array(dim).fill(0);
  for (let i = 0; i < s.length; i++) {
    out[i % dim] = (out[i % dim] + s.charCodeAt(i) * 0.01) % 1;
  }
  return out.map((v) => Math.round(v * 1000) / 1000);
}

function extractTags(s: string): string[] {
  const words = s.toLowerCase().match(/[a-z\u4e00-\u9fa5]+/g) || [];
  return Array.from(new Set(words)).slice(0, 8);
}

export function encode(state: { memories: Map<string, EncodedMemory> }, raw: string, id?: string): { state: { memories: Map<string, EncodedMemory> }; mem: EncodedMemory } {
  const memId = id || `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const mem: EncodedMemory = { id: memId, raw, vec: hashToVec(raw), tags: extractTags(raw), aspect: 'encoded', weight: 1, ts: Date.now() };
  const memories = new Map(state.memories);
  memories.set(memId, mem);
  return { state: { memories }, mem };
}

export function markIndexed(state: { memories: Map<string, EncodedMemory> }, id: string): { memories: Map<string, EncodedMemory> } {
  const memories = new Map(state.memories);
  const m = memories.get(id);
  if (m) memories.set(id, { ...m, aspect: 'indexed' as const });
  return { memories };
}

export function markStale(state: { memories: Map<string, EncodedMemory> }, id: string): { memories: Map<string, EncodedMemory> } {
  const memories = new Map(state.memories);
  const m = memories.get(id);
  if (m) memories.set(id, { ...m, aspect: 'stale' as const, weight: m.weight * 0.5 });
  return { memories };
}

export function archive(state: { memories: Map<string, EncodedMemory> }, id: string): { memories: Map<string, EncodedMemory> } {
  const memories = new Map(state.memories);
  const m = memories.get(id);
  if (m) memories.set(id, { ...m, aspect: 'archived' as const });
  return { memories };
}

export function setWeight(state: { memories: Map<string, EncodedMemory> }, id: string, w: number): { memories: Map<string, EncodedMemory> } {
  const memories = new Map(state.memories);
  const m = memories.get(id);
  if (m) memories.set(id, { ...m, weight: Math.max(0, Math.min(1, w)) });
  return { memories };
}

export function totalMemories(state: { memories: Map<string, EncodedMemory> }): number {
  return state.memories.size;
}

export function activeMemories(state: { memories: Map<string, EncodedMemory> }): number {
  return Array.from(state.memories.values()).filter((m) => m.aspect !== 'archived' && m.aspect !== 'stale').length;
}

export function memoryHealth(state: { memories: Map<string, EncodedMemory> }): { total: number; active: number; health: number } {
  const total = totalMemories(state);
  const active = activeMemories(state);
  return { total, active, health: total > 0 ? active / total : 1 };
}
