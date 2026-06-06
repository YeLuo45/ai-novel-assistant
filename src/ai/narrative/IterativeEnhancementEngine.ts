/**
 * V916 IterativeEnhancementEngine — Direction D Iter 6/15 (Round 4)
 * Iterative enhancement engine: enhancement iterations
 * Sources: thunderbolt iterative + generic-agent + nanobot
 */

export type EnhancementType = 'incremental' | 'substantial' | 'transformative' | 'revolutionary' | 'polishing';
export type EnhancementArea = 'prose' | 'structure' | 'character' | 'theme' | 'pacing' | 'dialogue';
export type IterationHealth = 'stagnant' | 'slow' | 'steady' | 'rapid' | 'breakthrough';

export interface EnhancementIteration {
  iterationId: string;
  type: EnhancementType;
  area: EnhancementArea;
  before: number;
  after: number;
  gain: number;
  description: string;
  chapter: number;
}

export interface EnhancementGoal {
  goalId: string,
  target: number,
  current: number,
  iterations: string[],
  achieved: boolean,
}

export interface IterativeEnhancementEngineState {
  iterations: Map<string, EnhancementIteration>;
  goals: Map<string, EnhancementGoal>;
  totalIterations: number;
  totalGoals: number;
  achievedGoals: number;
  totalGain: number;
  averageGain: number;
  iterationHealth: IterationHealth;
  enhancementMastery: number;
}

// Factory
export function createIterativeEnhancementEngineState(): IterativeEnhancementEngineState {
  return {
    iterations: new Map(),
    goals: new Map(),
    totalIterations: 0,
    totalGoals: 0,
    achievedGoals: 0,
    totalGain: 0,
    averageGain: 0,
    iterationHealth: 'steady',
    enhancementMastery: 0.5,
  };
}

// Add iteration
export function addEnhancementIteration(
  state: IterativeEnhancementEngineState,
  iterationId: string,
  type: EnhancementType,
  area: EnhancementArea,
  before: number,
  after: number,
  description: string,
  chapter: number
): IterativeEnhancementEngineState {
  const gain = Math.max(0, after - before);
  const iteration: EnhancementIteration = { iterationId, type, area, before, after, gain, description, chapter };
  const iterations = new Map(state.iterations).set(iterationId, iteration);
  const totalGain = state.totalGain + gain;
  return recomputeIterEnhance({ ...state, iterations, totalGain, totalIterations: iterations.size });
}

// Add goal
export function addEnhancementGoal(
  state: IterativeEnhancementEngineState,
  goalId: string,
  target: number,
  current: number = 0
): IterativeEnhancementEngineState {
  const goal: EnhancementGoal = { goalId, target, current, iterations: [], achieved: current >= target };
  const goals = new Map(state.goals).set(goalId, goal);
  return recomputeIterEnhance({ ...state, goals, totalGoals: goals.size });
}

// Achieve goal
export function achieveEnhancementGoal(state: IterativeEnhancementEngineState, goalId: string): IterativeEnhancementEngineState {
  const goal = state.goals.get(goalId);
  if (!goal) return state;

  const updated: EnhancementGoal = { ...goal, achieved: true };
  const goals = new Map(state.goals).set(goalId, updated);
  const achievedGoals = state.achievedGoals + 1;
  return recomputeIterEnhance({ ...state, goals, achievedGoals });
}

// Get iterations by area
export function getIterationsByArea(state: IterativeEnhancementEngineState, area: EnhancementArea): EnhancementIteration[] {
  return Array.from(state.iterations.values()).filter(i => i.area === area);
}

// Get enhancement report
export function getEnhancementReport(state: IterativeEnhancementEngineState): {
  totalIterations: number;
  totalGoals: number;
  achievedGoals: number;
  totalGain: number;
  averageGain: number;
  enhancementMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalIterations === 0) recommendations.push('No iterations — add iterations');
  if (state.averageGain < 0.1) recommendations.push('Low gain — improve');
  if (state.achievedGoals < state.totalGoals / 2) recommendations.push('Few achieved — complete more');

  return {
    totalIterations: state.totalIterations,
    totalGoals: state.totalGoals,
    achievedGoals: state.achievedGoals,
    totalGain: Math.round(state.totalGain * 100) / 100,
    averageGain: Math.round(state.averageGain * 100) / 100,
    enhancementMastery: Math.round(state.enhancementMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeIterEnhance(state: IterativeEnhancementEngineState): IterativeEnhancementEngineState {
  const iterations = Array.from(state.iterations.values());
  const averageGain = iterations.length === 0 ? 0
    : iterations.reduce((s, i) => s + i.gain, 0) / iterations.length;

  const goals = Array.from(state.goals.values());
  const achievementRate = goals.length === 0 ? 0
    : state.achievedGoals / goals.length;

  // Health: average gain velocity
  const health: IterationHealth = averageGain < 0.05 ? 'stagnant'
    : averageGain < 0.1 ? 'slow'
    : averageGain < 0.2 ? 'steady'
    : averageGain < 0.3 ? 'rapid'
    : 'breakthrough';

  const enhancementMastery = (averageGain * 0.4 + achievementRate * 0.3 + Math.min(0.3, state.totalIterations / 10));

  return { ...state, averageGain, iterationHealth: health, enhancementMastery };
}

// Reset enhancement state
export function resetIterativeEnhancementEngineState(): IterativeEnhancementEngineState {
  return createIterativeEnhancementEngineState();
}