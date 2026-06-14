// V2291 ContextLearner - Direction J Iter 26/30
// Adaptive context priority learning
// Source: generic-agent
export interface ContextLearningRule {
  ruleId: string;
  key: string;
  weight: number;
  hits: number;
  misses: number;
}

export interface ContextLearnerState {
  rules: Map<string, ContextLearningRule>;
  learningRate: number;
}

export function createContextLearnerState(learningRate = 0.1): ContextLearnerState {
  return { rules: new Map(), learningRate };
}

export function createContextRule(state: ContextLearnerState, key: string, initialWeight = 0.5): ContextLearnerState {
  const ruleId = `cxl-${key}`;
  const rules = new Map(state.rules);
  if (!rules.has(ruleId)) rules.set(ruleId, { ruleId, key, weight: initialWeight, hits: 0, misses: 0 });
  return { ...state, rules };
}

export function recordContextHit(state: ContextLearnerState, key: string): ContextLearnerState {
  const ruleId = `cxl-${key}`;
  const r = state.rules.get(ruleId);
  if (!r) return state;
  const newWeight = Math.min(1, r.weight + state.learningRate);
  const rules = new Map(state.rules);
  rules.set(ruleId, { ...r, weight: newWeight, hits: r.hits + 1 });
  return { ...state, rules };
}

export function recordContextMiss(state: ContextLearnerState, key: string): ContextLearnerState {
  const ruleId = `cxl-${key}`;
  const r = state.rules.get(ruleId);
  if (!r) return state;
  const newWeight = Math.max(0, r.weight - state.learningRate);
  const rules = new Map(state.rules);
  rules.set(ruleId, { ...r, weight: newWeight, misses: r.misses + 1 });
  return { ...state, rules };
}

export function getContextPriority(state: ContextLearnerState, key: string): number {
  return state.rules.get(`cxl-${key}`)?.weight ?? 0.5;
}

export function topContextKeys(state: ContextLearnerState, topK = 5): ContextLearningRule[] {
  return Array.from(state.rules.values()).sort((a, b) => b.weight - a.weight).slice(0, topK);
}

export function setContextLearningRate(state: ContextLearnerState, rate: number): ContextLearnerState {
  return { ...state, learningRate: Math.max(0, Math.min(1, rate)) };
}

export function contextLearnerHealth(state: ContextLearnerState): { rules: number; avgWeight: number; health: number } {
  const list = Array.from(state.rules.values());
  const avg = list.length > 0 ? list.reduce((s, r) => s + r.weight, 0) / list.length : 0;
  return { rules: list.length, avgWeight: avg, health: list.length > 0 ? 1 : 0.5 };
}
