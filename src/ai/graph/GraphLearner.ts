// V2201 GraphLearner - Direction G Iter 26/30
// Adaptive edge weight learning
// Source: generic-agent
export interface GraphLearningRule {
  ruleId: string;
  edgeId: string;
  weight: number;
  hits: number;
  misses: number;
  lastUpdate: number;
}

export interface GraphLearnerState {
  rules: Map<string, GraphLearningRule>;
  learningRate: number;
}

export function createGraphLearnerState(learningRate = 0.1): GraphLearnerState {
  return { rules: new Map(), learningRate };
}

export function createGraphRule(state: GraphLearnerState, edgeId: string, initialWeight = 0.5): GraphLearnerState {
  const ruleId = `gr-${edgeId}`;
  const rules = new Map(state.rules);
  if (!rules.has(ruleId)) rules.set(ruleId, { ruleId, edgeId, weight: initialWeight, hits: 0, misses: 0, lastUpdate: Date.now() });
  return { ...state, rules };
}

export function recordGraphHit(state: GraphLearnerState, edgeId: string): GraphLearnerState {
  const ruleId = `gr-${edgeId}`;
  const r = state.rules.get(ruleId);
  if (!r) return state;
  const newWeight = Math.min(1, r.weight + state.learningRate);
  const rules = new Map(state.rules);
  rules.set(ruleId, { ...r, weight: newWeight, hits: r.hits + 1, lastUpdate: Date.now() });
  return { ...state, rules };
}

export function recordGraphMiss(state: GraphLearnerState, edgeId: string): GraphLearnerState {
  const ruleId = `gr-${edgeId}`;
  const r = state.rules.get(ruleId);
  if (!r) return state;
  const newWeight = Math.max(0, r.weight - state.learningRate);
  const rules = new Map(state.rules);
  rules.set(ruleId, { ...r, weight: newWeight, misses: r.misses + 1, lastUpdate: Date.now() });
  return { ...state, rules };
}

export function getGraphWeight(state: GraphLearnerState, edgeId: string): number {
  return state.rules.get(`gr-${edgeId}`)?.weight ?? 0.5;
}

export function topGraphEdges(state: GraphLearnerState, topK = 5): GraphLearningRule[] {
  return Array.from(state.rules.values()).sort((a, b) => b.weight - a.weight).slice(0, topK);
}

export function setGraphLearningRate(state: GraphLearnerState, rate: number): GraphLearnerState {
  return { ...state, learningRate: Math.max(0, Math.min(1, rate)) };
}

export function graphLearnerHealth(state: GraphLearnerState): { rules: number; avgWeight: number; health: number } {
  const list = Array.from(state.rules.values());
  const avg = list.length > 0 ? list.reduce((s, r) => s + r.weight, 0) / list.length : 0;
  return { rules: list.length, avgWeight: avg, health: list.length > 0 ? 1 : 0.5 };
}
