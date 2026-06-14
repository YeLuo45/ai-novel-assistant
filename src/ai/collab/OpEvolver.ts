// V2233 OpEvolver - Direction H Iter 28/30
// Schema evolution via op pattern
// Source: generic-agent
export type OpEvolutionKind = 'add_kind' | 'merge_kind' | 'deprecate_kind';

export interface OpEvolutionEvent {
  evoId: string;
  kind: OpEvolutionKind;
  fromKind: string;
  toKind: string;
  confidence: number;
  ts: number;
}

export interface OpPatternObs {
  patternId: string;
  observations: number;
  supportsAdd: string[];
  supportsMerge: string[];
}

export interface OpEvolverState {
  events: OpEvolutionEvent[];
  patterns: Map<string, OpPatternObs>;
}

export function createOpEvolverState(): OpEvolverState {
  return { events: [], patterns: new Map() };
}

export function observeOpPattern(state: OpEvolverState, patternId: string, adds: string[], merges: string[]): OpEvolverState {
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

export function detectOpEvolution(state: OpEvolverState, threshold = 5): OpEvolverState {
  const events: OpEvolutionEvent[] = [...state.events];
  for (const [pid, p] of state.patterns) {
    if (p.observations < threshold) continue;
    if (p.supportsAdd.length > 0) {
      events.push({ evoId: `oevo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, kind: 'add_kind', fromKind: pid, toKind: `${pid}+${p.supportsAdd.join(',')}`, confidence: Math.min(1, p.observations / 10), ts: Date.now() });
    }
    if (p.supportsMerge.length > 0) {
      events.push({ evoId: `oevo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, kind: 'merge_kind', fromKind: pid, toKind: `${pid}=${p.supportsMerge.join(',')}`, confidence: Math.min(1, p.observations / 10), ts: Date.now() });
    }
  }
  return { ...state, events };
}

export function opEvolutionEventsByKind(state: OpEvolverState, kind: OpEvolutionKind): OpEvolutionEvent[] {
  return state.events.filter((e) => e.kind === kind);
}

export function opEvolutionEventCount(state: OpEvolverState): number {
  return state.events.length;
}

export function opEvolverHealth(state: OpEvolverState): { events: number; patterns: number; health: number } {
  return { events: state.events.length, patterns: state.patterns.size, health: state.events.length > 0 ? 1 : 0.5 };
}
