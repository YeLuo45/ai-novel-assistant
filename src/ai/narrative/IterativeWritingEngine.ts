/**
 * V794 IterativeWritingEngine — Direction D Iter 2/9 (Round 3)
 * Iterative writing engine: iterative improvement + writing cycles
 * Sources: thunderbolt feedback + generic-agent + nanobot
 */

export type IterationStage = 'draft' | 'review' | 'revise' | 'polish' | 'finalize' | 'complete';
export type IterationMetric = 'clarity' | 'engagement' | 'pacing' | 'voice' | 'style' | 'impact';
export type IterationImprovement = 'minor' | 'moderate' | 'major' | 'transformative';

export interface WritingIteration {
  iterationId: string;
  stage: IterationStage;
  startTime: number;
  endTime: number | null;
  metrics: Map<IterationMetric, number>;
  improvements: number;
  feedback: string[];
  version: number;
}

export interface IterationGoal {
  goalId: string;
  iterationId: string;
  metric: IterationMetric;
  currentValue: number;
  targetValue: number;
  achieved: boolean;
}

export interface IterativeWritingEngineState {
  iterations: Map<string, WritingIteration>;
  goals: Map<string, IterationGoal>;
  totalIterations: number;
  completedIterations: number;
  totalGoals: number;
  achievedGoals: number;
  averageImprovement: number;
  iterationVelocity: number;
  averageQuality: number;
  bestVersion: number;
}

// Factory
export function createIterativeWritingEngineState(): IterativeWritingEngineState {
  return {
    iterations: new Map(),
    goals: new Map(),
    totalIterations: 0,
    completedIterations: 0,
    totalGoals: 0,
    achievedGoals: 0,
    averageImprovement: 0,
    iterationVelocity: 0,
    averageQuality: 0.5,
    bestVersion: 0,
  };
}

// Start iteration
export function startIteration(
  state: IterativeWritingEngineState,
  iterationId: string,
  metrics: Partial<Record<IterationMetric, number>> = {}
): IterativeWritingEngineState {
  const fullMetrics = new Map<IterationMetric, number>();
  const allMetrics: IterationMetric[] = ['clarity', 'engagement', 'pacing', 'voice', 'style', 'impact'];
  allMetrics.forEach(m => fullMetrics.set(m, metrics[m] ?? 0.5));

  const version = state.totalIterations + 1;
  const iteration: WritingIteration = {
    iterationId,
    stage: 'draft',
    startTime: Date.now(),
    endTime: null,
    metrics: fullMetrics,
    improvements: 0,
    feedback: [],
    version,
  };
  const iterations = new Map(state.iterations).set(iterationId, iteration);
  return recomputeIterative({ ...state, iterations, totalIterations: iterations.size });
}

// Add feedback
export function addIterationFeedback(state: IterativeWritingEngineState, iterationId: string, feedback: string): IterativeWritingEngineState {
  const iteration = state.iterations.get(iterationId);
  if (!iteration) return state;

  const updated: WritingIteration = { ...iteration, feedback: [...iteration.feedback, feedback] };
  const iterations = new Map(state.iterations).set(iterationId, updated);
  return recomputeIterative({ ...state, iterations });
}

// Complete iteration
export function completeIteration(
  state: IterativeWritingEngineState,
  iterationId: string,
  improvements: number = 1,
  improvement: IterationImprovement = 'moderate'
): IterativeWritingEngineState {
  const iteration = state.iterations.get(iterationId);
  if (!iteration) return state;

  const improvementFactor = { minor: 0.1, moderate: 0.2, major: 0.3, transformative: 0.5 }[improvement];
  const updated: WritingIteration = {
    ...iteration,
    stage: 'complete',
    endTime: Date.now(),
    improvements: iteration.improvements + improvements,
  };
  const iterations = new Map(state.iterations).set(iterationId, updated);

  // Update metrics with improvement
  const newMetrics = new Map(updated.metrics);
  newMetrics.forEach((v, k) => newMetrics.set(k, Math.min(1, v + improvementFactor * improvements / newMetrics.size)));
  const finalIteration: WritingIteration = { ...updated, metrics: newMetrics };
  const finalIterations = new Map(state.iterations).set(iterationId, finalIteration);

  return recomputeIterative({ ...state, iterations: finalIterations, completedIterations: state.completedIterations + 1 });
}

// Add goal
export function addIterationGoal(
  state: IterativeWritingEngineState,
  goalId: string,
  iterationId: string,
  metric: IterationMetric,
  currentValue: number,
  targetValue: number
): IterativeWritingEngineState {
  const goal: IterationGoal = { goalId, iterationId, metric, currentValue, targetValue, achieved: false };
  const goals = new Map(state.goals).set(goalId, goal);
  return recomputeIterative({ ...state, goals, totalGoals: goals.size });
}

// Update goal progress
export function updateGoalProgress(state: IterativeWritingEngineState, goalId: string, currentValue: number): IterativeWritingEngineState {
  const goal = state.goals.get(goalId);
  if (!goal) return state;

  const achieved = goal.targetValue <= 0 ? true : currentValue >= goal.targetValue;
  const updated: IterationGoal = { ...goal, currentValue, achieved };
  const goals = new Map(state.goals).set(goalId, updated);
  const achievedGoals = achieved && !goal.achieved ? state.achievedGoals + 1 : state.achievedGoals;
  return recomputeIterative({ ...state, goals, achievedGoals });
}

// Get iterations by stage
export function getIterationsByStage(state: IterativeWritingEngineState, stage: IterationStage): WritingIteration[] {
  return Array.from(state.iterations.values()).filter(i => i.stage === stage);
}

// Get iterative report
export function getIterativeReport(state: IterativeWritingEngineState): {
  totalIterations: number;
  completedIterations: number;
  achievedGoals: number;
  averageImprovement: number;
  iterationVelocity: number;
  averageQuality: number;
  bestVersion: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalIterations === 0) recommendations.push('No iterations — start iterating');
  if (state.iterationVelocity < 0.3) recommendations.push('Low velocity — accelerate iterations');
  if (state.achievedGoals < state.totalGoals / 2) recommendations.push('Few goals achieved — focus on goals');

  return {
    totalIterations: state.totalIterations,
    completedIterations: state.completedIterations,
    achievedGoals: state.achievedGoals,
    averageImprovement: Math.round(state.averageImprovement * 100) / 100,
    iterationVelocity: Math.round(state.iterationVelocity * 100) / 100,
    averageQuality: Math.round(state.averageQuality * 100) / 100,
    bestVersion: state.bestVersion,
    recommendations,
  };
}

// Recompute metrics
function recomputeIterative(state: IterativeWritingEngineState): IterativeWritingEngineState {
  const iterations = Array.from(state.iterations.values());
  const completed = iterations.filter(i => i.stage === 'complete');
  const averageImprovement = completed.length === 0 ? 0
    : completed.reduce((s, i) => s + i.improvements, 0) / completed.length;

  const allMetricValues: number[] = [];
  completed.forEach(i => i.metrics.forEach(v => allMetricValues.push(v)));
  const averageQuality = allMetricValues.length === 0 ? 0.5
    : allMetricValues.reduce((s, v) => s + v, 0) / allMetricValues.length;

  const iterationVelocity = state.totalIterations === 0 ? 0
    : state.completedIterations / state.totalIterations;
  const bestVersion = iterations.length === 0 ? 0 : Math.max(...iterations.map(i => i.version));

  return { ...state, averageImprovement, averageQuality, iterationVelocity, bestVersion };
}

// Reset iterative state
export function resetIterativeWritingEngineState(): IterativeWritingEngineState {
  return createIterativeWritingEngineState();
}