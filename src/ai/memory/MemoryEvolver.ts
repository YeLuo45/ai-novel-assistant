// V2173 MemoryEvolver - Direction F Iter 28/30
// Schema evolution via memory pattern detection
// Source: generic-agent
export type EvolutionKind = 'add_field' | 'remove_field' | 'merge' | 'split';

export interface EvolutionEvent {
  evoId: string;
  kind: EvolutionKind;
  fromSchema: string;
  toSchema: string;
  confidence: number;
  ts: number;
}

export interface PatternObservation {
  patternId: string;
  observations: number;
  supportsAddField: string[];
  supportsRemoveField: string[];
}

export interface MemoryEvolverState {
  events: EvolutionEvent[];
  patterns: Map<string, PatternObservation>;
}

export function createMemoryEvolverState(): MemoryEvolverState {
  return { events: [], patterns: new Map() };
}

export function observePattern(state: MemoryEvolverState, patternId: string, adds: string[], removes: string[]): MemoryEvolverState {
  const patterns = new Map(state.patterns);
  const existing = patterns.get(patternId) || { patternId, observations: 0, supportsAddField: [], supportsRemoveField: [] };
  patterns.set(patternId, {
    patternId,
    observations: existing.observations + 1,
    supportsAddField: Array.from(new Set([...existing.supportsAddField, ...adds])),
    supportsRemoveField: Array.from(new Set([...existing.supportsRemoveField, ...removes])),
  });
  return { ...state, patterns };
}

export function detectEvolution(state: MemoryEvolverState, threshold = 5): MemoryEvolverState {
  const events: EvolutionEvent[] = [...state.events];
  for (const [pid, p] of state.patterns) {
    if (p.observations < threshold) continue;
    if (p.supportsAddField.length > 0) {
      events.push({ evoId: `evo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, kind: 'add_field', fromSchema: pid, toSchema: `${pid}+${p.supportsAddField.join(',')}`, confidence: Math.min(1, p.observations / 10), ts: Date.now() });
    }
    if (p.supportsRemoveField.length > 0) {
      events.push({ evoId: `evo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, kind: 'remove_field', fromSchema: pid, toSchema: `${pid}-${p.supportsRemoveField.join(',')}`, confidence: Math.min(1, p.observations / 10), ts: Date.now() });
    }
  }
  return { ...state, events };
}

export function eventsByKind(state: MemoryEvolverState, kind: EvolutionKind): EvolutionEvent[] {
  return state.events.filter((e) => e.kind === kind);
}

export function eventCount(state: MemoryEvolverState): number {
  return state.events.length;
}

export function memoryEvolverHealth(state: MemoryEvolverState): { events: number; patterns: number; health: number } {
  return { events: state.events.length, patterns: state.patterns.size, health: state.events.length > 0 ? 1 : 0.5 };
}
