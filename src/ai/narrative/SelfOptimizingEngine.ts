/**
 * V920 SelfOptimizingEngine — Direction D Iter 8/15 (Round 4)
 * Self-optimizing engine: writing process self-optimization
 * Sources: generic-agent self-optimize + thunderbolt + nanobot
 */

export type OptimizationTarget = 'speed' | 'quality' | 'consistency' | 'efficiency' | 'creativity' | 'precision';
export type OptimizationMethod = 'gradient' | 'evolutionary' | 'bayesian' | 'reinforcement' | 'heuristic' | 'adaptive';
export type OptimizationStatus = 'baseline' | 'improving' | 'optimized' | 'plateaued' | 'regressed';

export interface OptimizationRun {
  runId: string;
  target: OptimizationTarget;
  method: OptimizationMethod;
  beforeMetric: number;
  afterMetric: number;
  improvement: number;
  status: OptimizationStatus;
  iterations: number;
  chapter: number;
}

export interface OptimizationParameter {
  paramId: string;
  name: string;
  value: number;
  range: [number, number];
  sensitivity: number;
}

export interface SelfOptimizingEngineState {
  runs: Map<string, OptimizationRun>;
  parameters: Map<string, OptimizationParameter>;
  totalRuns: number;
  totalParameters: number;
  totalImprovement: number;
  averageImprovement: number;
  optimizationEfficiency: number;
  selfOptimizationMastery: number;
}

// Factory
export function createSelfOptimizingEngineState(): SelfOptimizingEngineState {
  return {
    runs: new Map(),
    parameters: new Map(),
    totalRuns: 0,
    totalParameters: 0,
    totalImprovement: 0,
    averageImprovement: 0,
    optimizationEfficiency: 0.5,
    selfOptimizationMastery: 0.5,
  };
}

// Add optimization run
export function addOptimizationRun(
  state: SelfOptimizingEngineState,
  runId: string,
  target: OptimizationTarget,
  method: OptimizationMethod,
  beforeMetric: number,
  afterMetric: number,
  iterations: number,
  chapter: number
): SelfOptimizingEngineState {
  const improvement = afterMetric - beforeMetric;
  const status: OptimizationStatus = improvement > 0.1 ? 'optimized'
    : improvement > 0.05 ? 'improving'
    : improvement > -0.05 ? 'plateaued'
    : 'regressed';
  const run: OptimizationRun = { runId, target, method, beforeMetric, afterMetric, improvement, status, iterations, chapter };
  const runs = new Map(state.runs).set(runId, run);
  const totalImprovement = state.totalImprovement + improvement;
  return recomputeSelfOpt({ ...state, runs, totalImprovement, totalRuns: runs.size });
}

// Add parameter
export function addOptimizationParameter(
  state: SelfOptimizingEngineState,
  paramId: string,
  name: string,
  value: number,
  range: [number, number],
  sensitivity: number = 0.5
): SelfOptimizingEngineState {
  const param: OptimizationParameter = { paramId, name, value, range, sensitivity };
  const parameters = new Map(state.parameters).set(paramId, param);
  return recomputeSelfOpt({ ...state, parameters, totalParameters: parameters.size });
}

// Update parameter
export function updateParameterValue(state: SelfOptimizingEngineState, paramId: string, value: number): SelfOptimizingEngineState {
  const param = state.parameters.get(paramId);
  if (!param) return state;

  const clamped = Math.min(param.range[1], Math.max(param.range[0], value));
  const updated: OptimizationParameter = { ...param, value: clamped };
  const parameters = new Map(state.parameters).set(paramId, updated);
  return recomputeSelfOpt({ ...state, parameters });
}

// Get runs by target
export function getRunsByTarget(state: SelfOptimizingEngineState, target: OptimizationTarget): OptimizationRun[] {
  return Array.from(state.runs.values()).filter(r => r.target === target);
}

// Get optimization report
export function getOptimizationReport(state: SelfOptimizingEngineState): {
  totalRuns: number;
  totalParameters: number;
  totalImprovement: number;
  averageImprovement: number;
  optimizationEfficiency: number;
  selfOptimizationMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalRuns === 0) recommendations.push('No runs — add optimization runs');
  if (state.averageImprovement < 0.05) recommendations.push('Low improvement — improve methods');
  if (state.optimizationEfficiency < 0.4) recommendations.push('Low efficiency — improve');

  return {
    totalRuns: state.totalRuns,
    totalParameters: state.totalParameters,
    totalImprovement: Math.round(state.totalImprovement * 100) / 100,
    averageImprovement: Math.round(state.averageImprovement * 100) / 100,
    optimizationEfficiency: Math.round(state.optimizationEfficiency * 100) / 100,
    selfOptimizationMastery: Math.round(state.selfOptimizationMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeSelfOpt(state: SelfOptimizingEngineState): SelfOptimizingEngineState {
  const runs = Array.from(state.runs.values());
  const averageImprovement = runs.length === 0 ? 0
    : runs.reduce((s, r) => s + r.improvement, 0) / runs.length;

  const avgIterations = runs.length === 0 ? 0
    : runs.reduce((s, r) => s + r.iterations, 0) / runs.length;
  const optimizationEfficiency = avgIterations > 0
    ? Math.min(1, averageImprovement / Math.log2(avgIterations + 1))
    : 0.5;

  const parameters = Array.from(state.parameters.values());
  const avgSensitivity = parameters.length === 0 ? 0.5
    : parameters.reduce((s, p) => s + p.sensitivity, 0) / parameters.length;

  const selfOptimizationMastery = (averageImprovement * 0.4 + optimizationEfficiency * 0.3 + avgSensitivity * 0.3);

  return { ...state, averageImprovement, optimizationEfficiency, selfOptimizationMastery };
}

// Reset optimization state
export function resetSelfOptimizingEngineState(): SelfOptimizingEngineState {
  return createSelfOptimizingEngineState();
}