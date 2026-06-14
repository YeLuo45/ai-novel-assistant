// V2171 MemoryLearner - Direction F Iter 26/30
// Adaptive memory weight learning
// Source: generic-agent
export interface LearningRule {
  ruleId: string;
  memId: string;
  weight: number;
  hits: number;
  misses: number;
  lastUpdate: number;
}

export interface MemoryLearnerState {
  rules: Map<string, LearningRule>;
  learningRate: number;
}

export function createMemoryLearnerState(learningRate = 0.1): MemoryLearnerState {
  return { rules: new Map(), learningRate };
}

export function createRule(state: MemoryLearnerState, memId: string, initialWeight = 0.5): MemoryLearnerState {
  const ruleId = `r-${memId}`;
  const rules = new Map(state.rules);
  if (!rules.has(ruleId)) rules.set(ruleId, { ruleId, memId, weight: initialWeight, hits: 0, misses: 0, lastUpdate: Date.now() });
  return { ...state, rules };
}

export function recordHit(state: MemoryLearnerState, memId: string): MemoryLearnerState {
  const ruleId = `r-${memId}`;
  const r = state.rules.get(ruleId);
  if (!r) return state;
  const newWeight = Math.min(1, r.weight + state.learningRate);
  const rules = new Map(state.rules);
  rules.set(ruleId, { ...r, weight: newWeight, hits: r.hits + 1, lastUpdate: Date.now() });
  return { ...state, rules };
}

export function recordMiss(state: MemoryLearnerState, memId: string): MemoryLearnerState {
  const ruleId = `r-${memId}`;
  const r = state.rules.get(ruleId);
  if (!r) return state;
  const newWeight = Math.max(0, r.weight - state.learningRate);
  const rules = new Map(state.rules);
  rules.set(ruleId, { ...r, weight: newWeight, misses: r.misses + 1, lastUpdate: Date.now() });
  return { ...state, rules };
}

export function getWeight(state: MemoryLearnerState, memId: string): number {
  return state.rules.get(`r-${memId}`)?.weight ?? 0.5;
}

export function topMemories(state: MemoryLearnerState, topK = 5): LearningRule[] {
  return Array.from(state.rules.values()).sort((a, b) => b.weight - a.weight).slice(0, topK);
}

export function setLearningRate(state: MemoryLearnerState, rate: number): MemoryLearnerState {
  return { ...state, learningRate: Math.max(0, Math.min(1, rate)) };
}

export function memoryLearnerHealth(state: MemoryLearnerState): { rules: number; avgWeight: number; health: number } {
  const list = Array.from(state.rules.values());
  const avg = list.length > 0 ? list.reduce((s, r) => s + r.weight, 0) / list.length : 0;
  return { rules: list.length, avgWeight: avg, health: list.length > 0 ? 1 : 0.5 };
}
