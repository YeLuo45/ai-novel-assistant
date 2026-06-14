// V2321 SkillLearner - Direction K Iter 26/30
// Adaptive skill priority learning
// Source: generic-agent
export interface SkillLearningRule {
  ruleId: string;
  key: string;
  weight: number;
  hits: number;
  misses: number;
}

export interface SkillLearnerState {
  rules: Map<string, SkillLearningRule>;
  learningRate: number;
}

export function createSkillLearnerState(learningRate = 0.1): SkillLearnerState {
  return { rules: new Map(), learningRate };
}

export function createSkillRule(state: SkillLearnerState, key: string, initialWeight = 0.5): SkillLearnerState {
  const ruleId = `skl-${key}`;
  const rules = new Map(state.rules);
  if (!rules.has(ruleId)) rules.set(ruleId, { ruleId, key, weight: initialWeight, hits: 0, misses: 0 });
  return { ...state, rules };
}

export function recordSkillHit(state: SkillLearnerState, key: string): SkillLearnerState {
  const ruleId = `skl-${key}`;
  const r = state.rules.get(ruleId);
  if (!r) return state;
  const newWeight = Math.min(1, r.weight + state.learningRate);
  const rules = new Map(state.rules);
  rules.set(ruleId, { ...r, weight: newWeight, hits: r.hits + 1 });
  return { ...state, rules };
}

export function recordSkillMiss(state: SkillLearnerState, key: string): SkillLearnerState {
  const ruleId = `skl-${key}`;
  const r = state.rules.get(ruleId);
  if (!r) return state;
  const newWeight = Math.max(0, r.weight - state.learningRate);
  const rules = new Map(state.rules);
  rules.set(ruleId, { ...r, weight: newWeight, misses: r.misses + 1 });
  return { ...state, rules };
}

export function getSkillPriority(state: SkillLearnerState, key: string): number {
  return state.rules.get(`skl-${key}`)?.weight ?? 0.5;
}

export function topSkillKeys(state: SkillLearnerState, topK = 5): SkillLearningRule[] {
  return Array.from(state.rules.values()).sort((a, b) => b.weight - a.weight).slice(0, topK);
}

export function setSkillLearningRate(state: SkillLearnerState, rate: number): SkillLearnerState {
  return { ...state, learningRate: Math.max(0, Math.min(1, rate)) };
}

export function skillLearnerHealth(state: SkillLearnerState): { rules: number; avgWeight: number; health: number } {
  const list = Array.from(state.rules.values());
  const avg = list.length > 0 ? list.reduce((s, r) => s + r.weight, 0) / list.length : 0;
  return { rules: list.length, avgWeight: avg, health: list.length > 0 ? 1 : 0.5 };
}
