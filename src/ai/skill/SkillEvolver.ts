// V2323 SkillEvolver - Direction K Iter 28/30
// Schema evolution via skill pattern
// Source: generic-agent
export type SkillEvolutionKind = 'add_skill' | 'merge_skill' | 'deprecate_skill';

export interface SkillEvolutionEvent {
  evoId: string;
  kind: SkillEvolutionKind;
  fromKey: string;
  toKey: string;
  confidence: number;
  ts: number;
}

export interface SkillPatternObs {
  patternId: string;
  observations: number;
  supportsAdd: string[];
  supportsMerge: string[];
}

export interface SkillEvolverState {
  events: SkillEvolutionEvent[];
  patterns: Map<string, SkillPatternObs>;
}

export function createSkillEvolverState(): SkillEvolverState {
  return { events: [], patterns: new Map() };
}

export function observeSkillPattern(state: SkillEvolverState, patternId: string, adds: string[], merges: string[]): SkillEvolverState {
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

export function detectSkillEvolution(state: SkillEvolverState, threshold = 5): SkillEvolverState {
  const events: SkillEvolutionEvent[] = [...state.events];
  for (const [pid, p] of state.patterns) {
    if (p.observations < threshold) continue;
    if (p.supportsAdd.length > 0) {
      events.push({ evoId: `skevo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, kind: 'add_skill', fromKey: pid, toKey: `${pid}+${p.supportsAdd.join(',')}`, confidence: Math.min(1, p.observations / 10), ts: Date.now() });
    }
    if (p.supportsMerge.length > 0) {
      events.push({ evoId: `skevo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, kind: 'merge_skill', fromKey: pid, toKey: `${pid}=${p.supportsMerge.join(',')}`, confidence: Math.min(1, p.observations / 10), ts: Date.now() });
    }
  }
  return { ...state, events };
}

export function skillEvolutionEventsByKind(state: SkillEvolverState, kind: SkillEvolutionKind): SkillEvolutionEvent[] {
  return state.events.filter((e) => e.kind === kind);
}

export function skillEvolutionEventCount(state: SkillEvolverState): number {
  return state.events.length;
}

export function skillEvolverHealth(state: SkillEvolverState): { events: number; patterns: number; health: number } {
  return { events: state.events.length, patterns: state.patterns.size, health: state.events.length > 0 ? 1 : 0.5 };
}
