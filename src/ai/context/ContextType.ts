// V2271 ContextType - Direction J Iter 6/30
// Context type system
// Source: thunderbolt
export type ContextKind = 'message' | 'document' | 'snippet' | 'entity';

export interface ContextKindEntry {
  key: string;
  kind: ContextKind;
  content: unknown;
  refCount: number;
  ts: number;
}

export interface ContextTypeState {
  entries: Map<string, ContextKindEntry>;
  byKind: Map<ContextKind, number>;
}

export function createContextTypeState(): ContextTypeState {
  return { entries: new Map(), byKind: new Map() };
}

export function setContextEntry(state: ContextTypeState, key: string, content: unknown, kind: ContextKind): ContextTypeState {
  const entry: ContextKindEntry = { key, kind, content, refCount: 0, ts: Date.now() };
  const entries = new Map(state.entries);
  entries.set(key, entry);
  const byKind = new Map(state.byKind);
  byKind.set(kind, (byKind.get(kind) || 0) + 1);
  return { ...state, entries, byKind };
}

export function getContextEntry(state: ContextTypeState, key: string): unknown {
  return state.entries.get(key)?.content;
}

export function getContextKind(state: ContextTypeState, key: string): ContextKind | undefined {
  return state.entries.get(key)?.kind;
}

export function entriesByKind(state: ContextTypeState, kind: ContextKind): ContextKindEntry[] {
  return Array.from(state.entries.values()).filter((e) => e.kind === kind);
}

export function countByKind(state: ContextTypeState): Record<ContextKind, number> {
  const counts: Record<ContextKind, number> = { message: 0, document: 0, snippet: 0, entity: 0 };
  for (const [k, v] of state.byKind) counts[k] = v;
  return counts;
}

export function contextTypeHealth(state: ContextTypeState): { entries: number; health: number } {
  return { entries: state.entries.size, health: state.entries.size > 0 ? 1 : 0.5 };
}
