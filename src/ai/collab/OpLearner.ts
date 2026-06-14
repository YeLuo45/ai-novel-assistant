// V2231 OpLearner - Direction H Iter 26/30
// Adaptive operation priority learning
// Source: generic-agent
export interface OpLearningRule {
  ruleId: string;
  opKind: string;
  weight: number;
  hits: number;
  misses: number;
}

export interface OpLearnerState {
  rules: Map<string, OpLearningRule>;
  learningRate: number;
}

export function createOpLearnerState(learningRate = 0.1): OpLearnerState {
  return { rules: new Map(), learningRate };
}

export function createOpRule(state: OpLearnerState, opKind: string, initialWeight = 0.5): OpLearnerState {
  const ruleId = `or-${opKind}`;
  const rules = new Map(state.rules);
  if (!rules.has(ruleId)) rules.set(ruleId, { ruleId, opKind, weight: initialWeight, hits: 0, misses: 0 });
  return { ...state, rules };
}

export function recordOpHit(state: OpLearnerState, opKind: string): OpLearnerState {
  const ruleId = `or-${opKind}`;
  const r = state.rules.get(ruleId);
  if (!r) return state;
  const newWeight = Math.min(1, r.weight + state.learningRate);
  const rules = new Map(state.rules);
  rules.set(ruleId, { ...r, weight: newWeight, hits: r.hits + 1 });
  return { ...state, rules };
}

export function recordOpMiss(state: OpLearnerState, opKind: string): OpLearnerState {
  const ruleId = `or-${opKind}`;
  const r = state.rules.get(ruleId);
  if (!r) return state;
  const newWeight = Math.max(0, r.weight - state.learningRate);
  const rules = new Map(state.rules);
  rules.set(ruleId, { ...r, weight: newWeight, misses: r.misses + 1 });
  return { ...state, rules };
}

export function getOpPriority(state: OpLearnerState, opKind: string): number {
  return state.rules.get(`or-${opKind}`)?.weight ?? 0.5;
}

export function topOpKinds(state: OpLearnerState, topK = 5): OpLearningRule[] {
  return Array.from(state.rules.values()).sort((a, b) => b.weight - a.weight).slice(0, topK);
}

export function setOpLearningRate(state: OpLearnerState, rate: number): OpLearnerState {
  return { ...state, learningRate: Math.max(0, Math.min(1, rate)) };
}

export function opLearnerHealth(state: OpLearnerState): { rules: number; avgWeight: number; health: number } {
  const list = Array.from(state.rules.values());
  const avg = list.length > 0 ? list.reduce((s, r) => s + r.weight, 0) / list.length : 0;
  return { rules: list.length, avgWeight: avg, health: list.length > 0 ? 1 : 0.5 };
}
