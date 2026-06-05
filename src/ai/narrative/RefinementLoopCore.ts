/**
 * V834 RefinementLoopCore — Direction A Iter 4/9 (Round 4)
 * Refinement loop core: continuous refinement iterations
 * Sources: generic-agent loop + thunderbolt feedback + nanobot
 */

export type RefinementStage = 'initiate' | 'measure' | 'analyze' | 'adjust' | 'verify' | 'commit';
export type RefinementTrend = 'improving' | 'stable' | 'regressing' | 'oscillating';
export type ConvergenceLevel = 'divergent' | 'slow' | 'moderate' | 'fast' | 'converged';

export interface RefinementCycle {
  cycleId: string;
  iteration: number;
  stage: RefinementStage;
  startValue: number;
  currentValue: number;
  target: number;
  improvement: number;
  trend: RefinementTrend;
  timestamp: number;
}

export interface RefinementMetric {
  metricId: string;
  cycleId: string;
  name: string;
  baseline: number;
  current: number;
  best: number;
  samples: number;
}

export interface RefinementLoopCoreState {
  cycles: Map<string, RefinementCycle>;
  metrics: Map<string, RefinementMetric>;
  totalCycles: number;
  activeCycles: number;
  totalMetrics: number;
  averageImprovement: number;
  convergenceLevel: ConvergenceLevel;
  iterationVelocity: number;
  refinementEfficiency: number;
  loopStability: number;
}

// Factory
export function createRefinementLoopCoreState(): RefinementLoopCoreState {
  return {
    cycles: new Map(),
    metrics: new Map(),
    totalCycles: 0,
    activeCycles: 0,
    totalMetrics: 0,
    averageImprovement: 0,
    convergenceLevel: 'slow',
    iterationVelocity: 0,
    refinementEfficiency: 0.5,
    loopStability: 0.5,
  };
}

// Start cycle
export function startRefinementCycle(
  state: RefinementLoopCoreState,
  cycleId: string,
  startValue: number,
  target: number
): RefinementLoopCoreState {
  const cycle: RefinementCycle = {
    cycleId, iteration: 0, stage: 'initiate',
    startValue, currentValue: startValue, target, improvement: 0,
    trend: 'stable', timestamp: Date.now(),
  };
  const cycles = new Map(state.cycles).set(cycleId, cycle);
  return recomputeRefinement({ ...state, cycles, totalCycles: cycles.size, activeCycles: state.activeCycles + 1 });
}

// Advance cycle
export function advanceRefinementCycle(
  state: RefinementLoopCoreState,
  cycleId: string,
  newValue: number
): RefinementLoopCoreState {
  const cycle = state.cycles.get(cycleId);
  if (!cycle) return state;

  const improvement = Math.abs(newValue - cycle.startValue);
  const trend: RefinementTrend = Math.abs(newValue - cycle.currentValue) < 0.01 ? 'stable'
    : newValue < cycle.currentValue ? 'improving'
    : 'regressing';

  const updated: RefinementCycle = {
    ...cycle,
    iteration: cycle.iteration + 1,
    stage: 'adjust',
    currentValue: newValue,
    improvement, trend, timestamp: Date.now(),
  };
  const cycles = new Map(state.cycles).set(cycleId, updated);
  return recomputeRefinement({ ...state, cycles });
}

// Complete cycle
export function completeRefinementCycle(state: RefinementLoopCoreState, cycleId: string): RefinementLoopCoreState {
  const cycle = state.cycles.get(cycleId);
  if (!cycle) return state;

  const updated: RefinementCycle = { ...cycle, stage: 'commit' };
  const cycles = new Map(state.cycles).set(cycleId, updated);
  return recomputeRefinement({ ...state, cycles, activeCycles: Math.max(0, state.activeCycles - 1) });
}

// Add metric
export function addRefinementMetric(
  state: RefinementLoopCoreState,
  metricId: string,
  cycleId: string,
  name: string,
  baseline: number
): RefinementLoopCoreState {
  const metric: RefinementMetric = { metricId, cycleId, name, baseline, current: baseline, best: baseline, samples: 0 };
  const metrics = new Map(state.metrics).set(metricId, metric);
  return recomputeRefinement({ ...state, metrics, totalMetrics: metrics.size });
}

// Get cycles by trend
export function getCyclesByTrend(state: RefinementLoopCoreState, trend: RefinementTrend): RefinementCycle[] {
  return Array.from(state.cycles.values()).filter(c => c.trend === trend);
}

// Get refinement report
export function getRefinementReport(state: RefinementLoopCoreState): {
  totalCycles: number;
  activeCycles: number;
  averageImprovement: number;
  convergenceLevel: ConvergenceLevel;
  iterationVelocity: number;
  refinementEfficiency: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalCycles === 0) recommendations.push('No cycles — start refining');
  if (state.refinementEfficiency < 0.5) recommendations.push('Low efficiency — improve');
  if (state.loopStability < 0.4) recommendations.push('Unstable — stabilize loops');

  return {
    totalCycles: state.totalCycles,
    activeCycles: state.activeCycles,
    averageImprovement: Math.round(state.averageImprovement * 100) / 100,
    convergenceLevel: state.convergenceLevel,
    iterationVelocity: Math.round(state.iterationVelocity * 100) / 100,
    refinementEfficiency: Math.round(state.refinementEfficiency * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeRefinement(state: RefinementLoopCoreState): RefinementLoopCoreState {
  const cycles = Array.from(state.cycles.values());
  const completed = cycles.filter(c => c.stage === 'commit');
  const averageImprovement = completed.length === 0 ? 0
    : completed.reduce((s, c) => s + c.improvement, 0) / completed.length;

  // Convergence: how close are we to target
  const converging = cycles.filter(c => Math.abs(c.currentValue - c.target) < 0.1).length;
  const convergenceLevel: ConvergenceLevel = cycles.length === 0 ? 'slow'
    : converging === cycles.length ? 'converged'
    : converging > cycles.length / 2 ? 'fast'
    : converging > 0 ? 'moderate'
    : 'divergent';

  const totalIterations = cycles.reduce((s, c) => s + c.iteration, 0);
  const iterationVelocity = cycles.length === 0 ? 0 : totalIterations / cycles.length;

  // Efficiency = improvements / iterations
  const refinementEfficiency = totalIterations === 0 ? 0.5
    : Math.min(1, averageImprovement / Math.max(1, totalIterations));

  // Stability = 1 - oscillating ratio
  const oscillating = cycles.filter(c => c.trend === 'oscillating').length;
  const loopStability = cycles.length === 0 ? 0.5 : 1 - oscillating / cycles.length;

  return { ...state, averageImprovement, convergenceLevel, iterationVelocity, refinementEfficiency, loopStability };
}

// Reset refinement state
export function resetRefinementLoopCoreState(): RefinementLoopCoreState {
  return createRefinementLoopCoreState();
}