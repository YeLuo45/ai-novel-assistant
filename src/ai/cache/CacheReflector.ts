// V2262 CacheReflector - Direction I Iter 27/30
// Self-reflection on cache hit rate
// Source: generic-agent
export interface CacheReflection {
  refId: string;
  period: string;
  hitRate: number;
  insights: string[];
  ts: number;
}

export interface CacheReflectorState {
  reflections: Map<string, CacheReflection>;
  periods: Set<string>;
}

export function createCacheReflectorState(): CacheReflectorState {
  return { reflections: new Map(), periods: new Set() };
}

export function reflectOnCache(state: CacheReflectorState, period: string, hitRate: number, insights: string[]): CacheReflectorState {
  const refId = `cref-${period}-${Math.random().toString(36).slice(2, 6)}`;
  const reflection: CacheReflection = { refId, period, hitRate, insights, ts: Date.now() };
  const reflections = new Map(state.reflections);
  reflections.set(refId, reflection);
  const periods = new Set(state.periods);
  periods.add(period);
  return { ...state, reflections, periods };
}

export function cacheReflectionsForPeriod(state: CacheReflectorState, period: string): CacheReflection[] {
  return Array.from(state.reflections.values()).filter((r) => r.period === period);
}

export function avgHitRate(state: CacheReflectorState, period: string): number {
  const rs = cacheReflectionsForPeriod(state, period);
  if (rs.length === 0) return 0;
  return rs.reduce((s, r) => s + r.hitRate, 0) / rs.length;
}

export function lowHitRatePeriods(state: CacheReflectorState, threshold = 0.5): string[] {
  return Array.from(state.periods).filter((p) => avgHitRate(state, p) < threshold);
}

export function cacheReflectorHealth(state: CacheReflectorState): { reflections: number; periods: number; health: number } {
  return { reflections: state.reflections.size, periods: state.periods.size, health: state.reflections.size > 0 ? 1 : 0.5 };
}
