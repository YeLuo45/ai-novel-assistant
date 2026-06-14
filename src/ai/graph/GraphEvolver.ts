// V2203 GraphEvolver - Direction G Iter 28/30
// Schema evolution via graph pattern detection
// Source: generic-agent
export type GraphEvolutionKind = 'add_node' | 'add_edge' | 'merge' | 'split';

export interface GraphEvolutionEvent {
  evoId: string;
  kind: GraphEvolutionKind;
  fromPattern: string;
  toPattern: string;
  confidence: number;
  ts: number;
}

export interface GraphPatternObs {
  patternId: string;
  observations: number;
  supportsAddNode: string[];
  supportsAddEdge: string[];
}

export interface GraphEvolverState {
  events: GraphEvolutionEvent[];
  patterns: Map<string, GraphPatternObs>;
}

export function createGraphEvolverState(): GraphEvolverState {
  return { events: [], patterns: new Map() };
}

export function observeGraphPattern(state: GraphEvolverState, patternId: string, addNodes: string[], addEdges: string[]): GraphEvolverState {
  const patterns = new Map(state.patterns);
  const existing = patterns.get(patternId) || { patternId, observations: 0, supportsAddNode: [], supportsAddEdge: [] };
  patterns.set(patternId, {
    patternId,
    observations: existing.observations + 1,
    supportsAddNode: Array.from(new Set([...existing.supportsAddNode, ...addNodes])),
    supportsAddEdge: Array.from(new Set([...existing.supportsAddEdge, ...addEdges])),
  });
  return { ...state, patterns };
}

export function detectGraphEvolution(state: GraphEvolverState, threshold = 5): GraphEvolverState {
  const events: GraphEvolutionEvent[] = [...state.events];
  for (const [pid, p] of state.patterns) {
    if (p.observations < threshold) continue;
    if (p.supportsAddNode.length > 0) {
      events.push({ evoId: `gevo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, kind: 'add_node', fromPattern: pid, toPattern: `${pid}+${p.supportsAddNode.join(',')}`, confidence: Math.min(1, p.observations / 10), ts: Date.now() });
    }
    if (p.supportsAddEdge.length > 0) {
      events.push({ evoId: `gevo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, kind: 'add_edge', fromPattern: pid, toPattern: `${pid}+${p.supportsAddEdge.join(',')}`, confidence: Math.min(1, p.observations / 10), ts: Date.now() });
    }
  }
  return { ...state, events };
}

export function graphEvolutionEventsByKind(state: GraphEvolverState, kind: GraphEvolutionKind): GraphEvolutionEvent[] {
  return state.events.filter((e) => e.kind === kind);
}

export function graphEvolutionEventCount(state: GraphEvolverState): number {
  return state.events.length;
}

export function graphEvolverHealth(state: GraphEvolverState): { events: number; patterns: number; health: number } {
  return { events: state.events.length, patterns: state.patterns.size, health: state.events.length > 0 ? 1 : 0.5 };
}
