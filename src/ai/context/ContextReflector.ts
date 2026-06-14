// V2292 ContextReflector - Direction J Iter 27/30
// Self-reflection on context relevance
// Source: generic-agent
export interface ContextReflection {
  refId: string;
  period: string;
  relevance: number;
  insights: string[];
  ts: number;
}

export interface ContextReflectorState {
  reflections: Map<string, ContextReflection>;
  periods: Set<string>;
}

export function createContextReflectorState(): ContextReflectorState {
  return { reflections: new Map(), periods: new Set() };
}

export function reflectOnContext(state: ContextReflectorState, period: string, relevance: number, insights: string[]): ContextReflectorState {
  const refId = `cxref-${period}-${Math.random().toString(36).slice(2, 6)}`;
  const reflection: ContextReflection = { refId, period, relevance, insights, ts: Date.now() };
  const reflections = new Map(state.reflections);
  reflections.set(refId, reflection);
  const periods = new Set(state.periods);
  periods.add(period);
  return { ...state, reflections, periods };
}

export function contextReflectionsForPeriod(state: ContextReflectorState, period: string): ContextReflection[] {
  return Array.from(state.reflections.values()).filter((r) => r.period === period);
}

export function avgContextRelevance(state: ContextReflectorState, period: string): number {
  const rs = contextReflectionsForPeriod(state, period);
  if (rs.length === 0) return 0;
  return rs.reduce((s, r) => s + r.relevance, 0) / rs.length;
}

export function lowContextRelevancePeriods(state: ContextReflectorState, threshold = 0.3): string[] {
  return Array.from(state.periods).filter((p) => avgContextRelevance(state, p) < threshold);
}

export function contextReflectorHealth(state: ContextReflectorState): { reflections: number; periods: number; health: number } {
  return { reflections: state.reflections.size, periods: state.periods.size, health: state.reflections.size > 0 ? 1 : 0.5 };
}
