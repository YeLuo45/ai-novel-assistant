// V2172 MemoryReflector - Direction F Iter 27/30
// Self-reflection on memory effectiveness
// Source: generic-agent
export interface Reflection {
  refId: string;
  period: string;
  memId: string;
  effectiveness: number; // 0-1
  insights: string[];
  ts: number;
}

export interface MemoryReflectorState {
  reflections: Map<string, Reflection>;
  periods: Set<string>;
}

export function createMemoryReflectorState(): MemoryReflectorState {
  return { reflections: new Map(), periods: new Set() };
}

export function reflect(state: MemoryReflectorState, memId: string, period: string, effectiveness: number, insights: string[]): MemoryReflectorState {
  const refId = `rfl-${memId}-${period}-${Math.random().toString(36).slice(2, 6)}`;
  const reflection: Reflection = { refId, period, memId, effectiveness, insights, ts: Date.now() };
  const reflections = new Map(state.reflections);
  reflections.set(refId, reflection);
  const periods = new Set(state.periods);
  periods.add(period);
  return { ...state, reflections, periods };
}

export function reflectionsForMemory(state: MemoryReflectorState, memId: string): Reflection[] {
  return Array.from(state.reflections.values()).filter((r) => r.memId === memId);
}

export function reflectionsForPeriod(state: MemoryReflectorState, period: string): Reflection[] {
  return Array.from(state.reflections.values()).filter((r) => r.period === period);
}

export function avgEffectiveness(state: MemoryReflectorState, memId: string): number {
  const rs = reflectionsForMemory(state, memId);
  if (rs.length === 0) return 0;
  return rs.reduce((s, r) => s + r.effectiveness, 0) / rs.length;
}

export function lowPerformingMems(state: MemoryReflectorState, threshold = 0.3): string[] {
  const memIds = new Set(Array.from(state.reflections.values()).map((r) => r.memId));
  return Array.from(memIds).filter((id) => avgEffectiveness(state, id) < threshold);
}

export function memoryReflectorHealth(state: MemoryReflectorState): { reflections: number; periods: number; health: number } {
  return { reflections: state.reflections.size, periods: state.periods.size, health: state.reflections.size > 0 ? 1 : 0.5 };
}
