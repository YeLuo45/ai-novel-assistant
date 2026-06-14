// V2232 OpReflector - Direction H Iter 27/30
// Self-reflection on op throughput
// Source: generic-agent
export interface OpReflection {
  refId: string;
  period: string;
  throughput: number;
  insights: string[];
  ts: number;
}

export interface OpReflectorState {
  reflections: Map<string, OpReflection>;
  periods: Set<string>;
}

export function createOpReflectorState(): OpReflectorState {
  return { reflections: new Map(), periods: new Set() };
}

export function reflectOnOp(state: OpReflectorState, period: string, throughput: number, insights: string[]): OpReflectorState {
  const refId = `oref-${period}-${Math.random().toString(36).slice(2, 6)}`;
  const reflection: OpReflection = { refId, period, throughput, insights, ts: Date.now() };
  const reflections = new Map(state.reflections);
  reflections.set(refId, reflection);
  const periods = new Set(state.periods);
  periods.add(period);
  return { ...state, reflections, periods };
}

export function opReflectionsForPeriod(state: OpReflectorState, period: string): OpReflection[] {
  return Array.from(state.reflections.values()).filter((r) => r.period === period);
}

export function avgThroughput(state: OpReflectorState, period: string): number {
  const rs = opReflectionsForPeriod(state, period);
  if (rs.length === 0) return 0;
  return rs.reduce((s, r) => s + r.throughput, 0) / rs.length;
}

export function lowThroughputPeriods(state: OpReflectorState, threshold = 100): string[] {
  return Array.from(state.periods).filter((p) => avgThroughput(state, p) < threshold);
}

export function opReflectorHealth(state: OpReflectorState): { reflections: number; periods: number; health: number } {
  return { reflections: state.reflections.size, periods: state.periods.size, health: state.reflections.size > 0 ? 1 : 0.5 };
}
