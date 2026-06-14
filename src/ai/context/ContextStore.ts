// V2267 ContextStore - Direction J Iter 2/30
// Multi-modal context store
// Source: thunderbolt
export interface ContextEntry {
  key: string;
  modality: 'text' | 'json' | 'binary' | 'embedding';
  content: unknown;
  tokens: number;
  expiresAt: number;
  hits: number;
  lastAccess: number;
}

export interface ContextStoreState {
  store: Map<string, ContextEntry>;
  totalGets: number;
  totalSets: number;
  totalHits: number;
  totalMisses: number;
}

export function createContextStoreState(): ContextStoreState {
  return { store: new Map(), totalGets: 0, totalSets: 0, totalHits: 0, totalMisses: 0 };
}

export function contextSet(state: ContextStoreState, key: string, content: unknown, modality: 'text' | 'json' | 'binary' | 'embedding' = 'text', ttlMs = 0): ContextStoreState {
  const tokens = JSON.stringify(content).length / 4;
  const expiresAt = ttlMs > 0 ? Date.now() + ttlMs : 0;
  const entry: ContextEntry = { key, modality, content, tokens: Math.ceil(tokens), expiresAt, hits: 0, lastAccess: Date.now() };
  const store = new Map(state.store);
  store.set(key, entry);
  return { ...state, store, totalSets: state.totalSets + 1 };
}

export function contextGet(state: ContextStoreState, key: string): ContextStoreState {
  const entry = state.store.get(key);
  if (!entry || (entry.expiresAt > 0 && entry.expiresAt < Date.now())) {
    return { ...state, totalGets: state.totalGets + 1, totalMisses: state.totalMisses + 1 };
  }
  const store = new Map(state.store);
  store.set(key, { ...entry, hits: entry.hits + 1, lastAccess: Date.now() });
  return { ...state, store, totalGets: state.totalGets + 1, totalHits: state.totalHits + 1 };
}

export function contextDelete(state: ContextStoreState, key: string): ContextStoreState {
  const store = new Map(state.store);
  store.delete(key);
  return { ...state, store };
}

export function contextHas(state: ContextStoreState, key: string): boolean {
  const entry = state.store.get(key);
  if (!entry) return false;
  if (entry.expiresAt > 0 && entry.expiresAt < Date.now()) return false;
  return true;
}

export function contextSize(state: ContextStoreState): number {
  return state.store.size;
}

export function totalContextTokens(state: ContextStoreState): number {
  return Array.from(state.store.values()).reduce((s, e) => s + e.tokens, 0);
}

export function contextStoreHealth(state: ContextStoreState): { entries: number; hitRate: number; health: number } {
  const hitRate = state.totalGets > 0 ? state.totalHits / state.totalGets : 0;
  return { entries: state.store.size, hitRate, health: state.store.size > 0 ? 1 : 0.5 };
}
