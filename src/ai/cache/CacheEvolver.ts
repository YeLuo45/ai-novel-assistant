// V2263 CacheEvolver - Direction I Iter 28/30
// Schema evolution via cache pattern
// Source: generic-agent
export type CacheEvolutionKind = 'add_field' | 'merge_field' | 'deprecate_field';

export interface CacheEvolutionEvent {
  evoId: string;
  kind: CacheEvolutionKind;
  fromKey: string;
  toKey: string;
  confidence: number;
  ts: number;
}

export interface CachePatternObs {
  patternId: string;
  observations: number;
  supportsAdd: string[];
  supportsMerge: string[];
}

export interface CacheEvolverState {
  events: CacheEvolutionEvent[];
  patterns: Map<string, CachePatternObs>;
}

export function createCacheEvolverState(): CacheEvolverState {
  return { events: [], patterns: new Map() };
}

export function observeCachePattern(state: CacheEvolverState, patternId: string, adds: string[], merges: string[]): CacheEvolverState {
  const patterns = new Map(state.patterns);
  const existing = patterns.get(patternId) || { patternId, observations: 0, supportsAdd: [], supportsMerge: [] };
  patterns.set(patternId, {
    patternId,
    observations: existing.observations + 1,
    supportsAdd: Array.from(new Set([...existing.supportsAdd, ...adds])),
    supportsMerge: Array.from(new Set([...existing.supportsMerge, ...merges])),
  });
  return { ...state, patterns };
}

export function detectCacheEvolution(state: CacheEvolverState, threshold = 5): CacheEvolverState {
  const events: CacheEvolutionEvent[] = [...state.events];
  for (const [pid, p] of state.patterns) {
    if (p.observations < threshold) continue;
    if (p.supportsAdd.length > 0) {
      events.push({ evoId: `cevo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, kind: 'add_field', fromKey: pid, toKey: `${pid}+${p.supportsAdd.join(',')}`, confidence: Math.min(1, p.observations / 10), ts: Date.now() });
    }
    if (p.supportsMerge.length > 0) {
      events.push({ evoId: `cevo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, kind: 'merge_field', fromKey: pid, toKey: `${pid}=${p.supportsMerge.join(',')}`, confidence: Math.min(1, p.observations / 10), ts: Date.now() });
    }
  }
  return { ...state, events };
}

export function cacheEvolutionEventsByKind(state: CacheEvolverState, kind: CacheEvolutionKind): CacheEvolutionEvent[] {
  return state.events.filter((e) => e.kind === kind);
}

export function cacheEvolutionEventCount(state: CacheEvolverState): number {
  return state.events.length;
}

export function cacheEvolverHealth(state: CacheEvolverState): { events: number; patterns: number; health: number } {
  return { events: state.events.length, patterns: state.patterns.size, health: state.events.length > 0 ? 1 : 0.5 };
}
