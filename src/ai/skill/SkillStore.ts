// V2297 SkillStore - Direction K Iter 2/30
// Multi-modal skill store
// Source: thunderbolt
export interface SkillEntry {
  key: string;
  format: 'markdown' | 'code' | 'json' | 'plain';
  content: unknown;
  tokens: number;
  expiresAt: number;
  hits: number;
  lastAccess: number;
}

export interface SkillStoreState {
  store: Map<string, SkillEntry>;
  totalGets: number;
  totalSets: number;
  totalHits: number;
  totalMisses: number;
}

export function createSkillStoreState(): SkillStoreState {
  return { store: new Map(), totalGets: 0, totalSets: 0, totalHits: 0, totalMisses: 0 };
}

export function skillSet(state: SkillStoreState, key: string, content: unknown, format: 'markdown' | 'code' | 'json' | 'plain' = 'markdown', ttlMs = 0): SkillStoreState {
  const tokens = JSON.stringify(content).length / 4;
  const expiresAt = ttlMs > 0 ? Date.now() + ttlMs : 0;
  const entry: SkillEntry = { key, format, content, tokens: Math.ceil(tokens), expiresAt, hits: 0, lastAccess: Date.now() };
  const store = new Map(state.store);
  store.set(key, entry);
  return { ...state, store, totalSets: state.totalSets + 1 };
}

export function skillGet(state: SkillStoreState, key: string): SkillStoreState {
  const entry = state.store.get(key);
  if (!entry || (entry.expiresAt > 0 && entry.expiresAt < Date.now())) {
    return { ...state, totalGets: state.totalGets + 1, totalMisses: state.totalMisses + 1 };
  }
  const store = new Map(state.store);
  store.set(key, { ...entry, hits: entry.hits + 1, lastAccess: Date.now() });
  return { ...state, store, totalGets: state.totalGets + 1, totalHits: state.totalHits + 1 };
}

export function skillDelete(state: SkillStoreState, key: string): SkillStoreState {
  const store = new Map(state.store);
  store.delete(key);
  return { ...state, store };
}

export function skillHas(state: SkillStoreState, key: string): boolean {
  const entry = state.store.get(key);
  if (!entry) return false;
  if (entry.expiresAt > 0 && entry.expiresAt < Date.now()) return false;
  return true;
}

export function skillSize(state: SkillStoreState): number {
  return state.store.size;
}

export function totalSkillTokens(state: SkillStoreState): number {
  return Array.from(state.store.values()).reduce((s, e) => s + e.tokens, 0);
}

export function skillStoreHealth(state: SkillStoreState): { entries: number; hitRate: number; health: number } {
  const hitRate = state.totalGets > 0 ? state.totalHits / state.totalGets : 0;
  return { entries: state.store.size, hitRate, health: state.store.size > 0 ? 1 : 0.5 };
}
