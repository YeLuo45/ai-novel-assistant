// V2322 SkillReflector - Direction K Iter 27/30
// Self-reflection on skill effectiveness
// Source: generic-agent
export interface SkillReflection {
  refId: string;
  period: string;
  effectiveness: number;
  insights: string[];
  ts: number;
}

export interface SkillReflectorState {
  reflections: Map<string, SkillReflection>;
  periods: Set<string>;
}

export function createSkillReflectorState(): SkillReflectorState {
  return { reflections: new Map(), periods: new Set() };
}

export function reflectOnSkill(state: SkillReflectorState, period: string, effectiveness: number, insights: string[]): SkillReflectorState {
  const refId = `skref-${period}-${Math.random().toString(36).slice(2, 6)}`;
  const reflection: SkillReflection = { refId, period, effectiveness, insights, ts: Date.now() };
  const reflections = new Map(state.reflections);
  reflections.set(refId, reflection);
  const periods = new Set(state.periods);
  periods.add(period);
  return { ...state, reflections, periods };
}

export function skillReflectionsForPeriod(state: SkillReflectorState, period: string): SkillReflection[] {
  return Array.from(state.reflections.values()).filter((r) => r.period === period);
}

export function avgSkillEffectiveness(state: SkillReflectorState, period: string): number {
  const rs = skillReflectionsForPeriod(state, period);
  if (rs.length === 0) return 0;
  return rs.reduce((s, r) => s + r.effectiveness, 0) / rs.length;
}

export function lowEffectivenessPeriods(state: SkillReflectorState, threshold = 0.3): string[] {
  return Array.from(state.periods).filter((p) => avgSkillEffectiveness(state, p) < threshold);
}

export function skillReflectorHealth(state: SkillReflectorState): { reflections: number; periods: number; health: number } {
  return { reflections: state.reflections.size, periods: state.periods.size, health: state.reflections.size > 0 ? 1 : 0.5 };
}
