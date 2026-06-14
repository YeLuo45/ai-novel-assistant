// V2293 ContextEvolver - Direction J Iter 28/30
// Schema evolution via context pattern
// Source: generic-agent
export type ContextEvolutionKind = 'add_field' | 'merge_field' | 'deprecate_field';

export interface ContextEvolutionEvent {
  evoId: string;
  kind: ContextEvolutionKind;
  fromKey: string;
  toKey: string;
  confidence: number;
  ts: number;
}

export interface ContextPatternObs {
  patternId: string;
  observations: number;
  supportsAdd: string[];
  supportsMerge: string[];
}

export interface ContextEvolverState {
  events: ContextEvolutionEvent[];
  patterns: Map<string, ContextPatternObs>;
}

export function createContextEvolverState(): ContextEvolverState {
  return { events: [], patterns: new Map() };
}

export function observeContextPattern(state: ContextEvolverState, patternId: string, adds: string[], merges: string[]): ContextEvolverState {
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

export function detectContextEvolution(state: ContextEvolverState, threshold = 5): ContextEvolverState {
  const events: ContextEvolutionEvent[] = [...state.events];
  for (const [pid, p] of state.patterns) {
    if (p.observations < threshold) continue;
    if (p.supportsAdd.length > 0) {
      events.push({ evoId: `cxevo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, kind: 'add_field', fromKey: pid, toKey: `${pid}+${p.supportsAdd.join(',')}`, confidence: Math.min(1, p.observations / 10), ts: Date.now() });
    }
    if (p.supportsMerge.length > 0) {
      events.push({ evoId: `cxevo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, kind: 'merge_field', fromKey: pid, toKey: `${pid}=${p.supportsMerge.join(',')}`, confidence: Math.min(1, p.observations / 10), ts: Date.now() });
    }
  }
  return { ...state, events };
}

export function contextEvolutionEventsByKind(state: ContextEvolverState, kind: ContextEvolutionKind): ContextEvolutionEvent[] {
  return state.events.filter((e) => e.kind === kind);
}

export function contextEvolutionEventCount(state: ContextEvolverState): number {
  return state.events.length;
}

export function contextEvolverHealth(state: ContextEvolverState): { events: number; patterns: number; health: number } {
  return { events: state.events.length, patterns: state.patterns.size, health: state.events.length > 0 ? 1 : 0.5 };
}
