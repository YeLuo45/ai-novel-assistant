// V2261 CacheLearner - Direction I Iter 26/30
// Adaptive cache priority learning
// Source: generic-agent
export interface CacheLearningRule {
  ruleId: string;
  key: string;
  weight: number;
  hits: number;
  misses: number;
}

export interface CacheLearnerState {
  rules: Map<string, CacheLearningRule>;
  learningRate: number;
}

export function createCacheLearnerState(learningRate = 0.1): CacheLearnerState {
  return { rules: new Map(), learningRate };
}

export function createCacheRule(state: CacheLearnerState, key: string, initialWeight = 0.5): CacheLearnerState {
  const ruleId = `cr-${key}`;
  const rules = new Map(state.rules);
  if (!rules.has(ruleId)) rules.set(ruleId, { ruleId, key, weight: initialWeight, hits: 0, misses: 0 });
  return { ...state, rules };
}

export function recordCacheHit(state: CacheLearnerState, key: string): CacheLearnerState {
  const ruleId = `cr-${key}`;
  const r = state.rules.get(ruleId);
  if (!r) return state;
  const newWeight = Math.min(1, r.weight + state.learningRate);
  const rules = new Map(state.rules);
  rules.set(ruleId, { ...r, weight: newWeight, hits: r.hits + 1 });
  return { ...state, rules };
}

export function recordCacheMiss(state: CacheLearnerState, key: string): CacheLearnerState {
  const ruleId = `cr-${key}`;
  const r = state.rules.get(ruleId);
  if (!r) return state;
  const newWeight = Math.max(0, r.weight - state.learningRate);
  const rules = new Map(state.rules);
  rules.set(ruleId, { ...r, weight: newWeight, misses: r.misses + 1 });
  return { ...state, rules };
}

export function getCachePriority(state: CacheLearnerState, key: string): number {
  return state.rules.get(`cr-${key}`)?.weight ?? 0.5;
}

export function topCacheKeys(state: CacheLearnerState, topK = 5): CacheLearningRule[] {
  return Array.from(state.rules.values()).sort((a, b) => b.weight - a.weight).slice(0, topK);
}

export function setCacheLearningRate(state: CacheLearnerState, rate: number): CacheLearnerState {
  return { ...state, learningRate: Math.max(0, Math.min(1, rate)) };
}

export function cacheLearnerHealth(state: CacheLearnerState): { rules: number; avgWeight: number; health: number } {
  const list = Array.from(state.rules.values());
  const avg = list.length > 0 ? list.reduce((s, r) => s + r.weight, 0) / list.length : 0;
  return { rules: list.length, avgWeight: avg, health: list.length > 0 ? 1 : 0.5 };
}
