// V2202 GraphReflector - Direction G Iter 27/30
// Self-reflection on graph effectiveness
// Source: generic-agent
export interface GraphReflection {
  refId: string;
  period: string;
  graphId: string;
  effectiveness: number;
  insights: string[];
  ts: number;
}

export interface GraphReflectorState {
  reflections: Map<string, GraphReflection>;
  periods: Set<string>;
}

export function createGraphReflectorState(): GraphReflectorState {
  return { reflections: new Map(), periods: new Set() };
}

export function reflectOnGraph(state: GraphReflectorState, graphId: string, period: string, effectiveness: number, insights: string[]): GraphReflectorState {
  const refId = `gref-${graphId}-${period}-${Math.random().toString(36).slice(2, 6)}`;
  const reflection: GraphReflection = { refId, period, graphId, effectiveness, insights, ts: Date.now() };
  const reflections = new Map(state.reflections);
  reflections.set(refId, reflection);
  const periods = new Set(state.periods);
  periods.add(period);
  return { ...state, reflections, periods };
}

export function graphReflectionsForGraph(state: GraphReflectorState, graphId: string): GraphReflection[] {
  return Array.from(state.reflections.values()).filter((r) => r.graphId === graphId);
}

export function graphReflectionsForPeriod(state: GraphReflectorState, period: string): GraphReflection[] {
  return Array.from(state.reflections.values()).filter((r) => r.period === period);
}

export function avgGraphEffectiveness(state: GraphReflectorState, graphId: string): number {
  const rs = graphReflectionsForGraph(state, graphId);
  if (rs.length === 0) return 0;
  return rs.reduce((s, r) => s + r.effectiveness, 0) / rs.length;
}

export function lowPerformingGraphs(state: GraphReflectorState, threshold = 0.3): string[] {
  const graphIds = new Set(Array.from(state.reflections.values()).map((r) => r.graphId));
  return Array.from(graphIds).filter((id) => avgGraphEffectiveness(state, id) < threshold);
}

export function graphReflectorHealth(state: GraphReflectorState): { reflections: number; periods: number; health: number } {
  return { reflections: state.reflections.size, periods: state.periods.size, health: state.reflections.size > 0 ? 1 : 0.5 };
}
