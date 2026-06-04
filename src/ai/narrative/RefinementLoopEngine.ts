/**
 * V716 RefinementLoopEngine — Direction D Iter 8/9 (Round 2)
 * Refinement loop engine: continuous improvement loops
 * Sources: thunderbolt feedback + generic-agent loop + ruflo
 */

export type LoopPhase = 'input' | 'process' | 'output' | 'feedback' | 'refine';
export type LoopStatus = 'active' | 'paused' | 'converged' | 'diverged' | 'completed';
export type LoopConvergence = 'fast' | 'normal' | 'slow' | 'oscillating' | 'diverging';

export interface LoopIteration {
  iterationId: string;
  loopId: string;
  phase: LoopPhase;
  input: string;
  output: string;
  qualityDelta: number;
  timestamp: number;
}

export interface RefinementLoop {
  loopId: string;
  name: string;
  currentIteration: number;
  maxIterations: number;
  status: LoopStatus;
  convergence: LoopConvergence;
  qualityHistory: number[];
  iterations: LoopIteration[];
  startTime: number;
  endTime: number | null;
}

export interface RefinementLoopEngineState {
  loops: Map<string, RefinementLoop>;
  totalLoops: number;
  activeLoops: number;
  convergedLoops: number;
  totalIterations: number;
  averageQualityGain: number;
  convergenceRate: number;
}

// Factory
export function createRefinementLoopEngineState(): RefinementLoopEngineState {
  return {
    loops: new Map(),
    totalLoops: 0,
    activeLoops: 0,
    convergedLoops: 0,
    totalIterations: 0,
    averageQualityGain: 0,
    convergenceRate: 0.5,
  };
}

// Create loop
export function createLoop(
  state: RefinementLoopEngineState,
  loopId: string,
  name: string,
  maxIterations: number = 10
): RefinementLoopEngineState {
  const loop: RefinementLoop = {
    loopId,
    name,
    currentIteration: 0,
    maxIterations,
    status: 'active',
    convergence: 'normal',
    qualityHistory: [],
    iterations: [],
    startTime: Date.now(),
    endTime: null,
  };
  const loops = new Map(state.loops).set(loopId, loop);
  return recomputeLoop({ ...state, loops, totalLoops: loops.size, activeLoops: state.activeLoops + 1 });
}

// Run iteration
export function runLoopIteration(
  state: RefinementLoopEngineState,
  loopId: string,
  iterationId: string,
  phase: LoopPhase,
  input: string,
  output: string,
  qualityDelta: number
): RefinementLoopEngineState {
  const loop = state.loops.get(loopId);
  if (!loop) return state;

  const iteration: LoopIteration = { iterationId, loopId, phase, input, output, qualityDelta, timestamp: Date.now() };
  const updated: RefinementLoop = {
    ...loop,
    currentIteration: loop.currentIteration + 1,
    qualityHistory: [...loop.qualityHistory, qualityDelta],
    iterations: [...loop.iterations, iteration],
    status: loop.currentIteration + 1 >= loop.maxIterations ? 'converged' : loop.status,
    convergence: detectConvergence([...loop.qualityHistory, qualityDelta]),
    endTime: loop.currentIteration + 1 >= loop.maxIterations ? Date.now() : loop.endTime,
  };
  const loops = new Map(state.loops).set(loopId, updated);

  return recomputeLoop({ ...state, loops, totalIterations: state.totalIterations + 1 });
}

// Detect convergence
function detectConvergence(qualityHistory: number[]): LoopConvergence {
  if (qualityHistory.length < 2) return 'normal';
  const recent = qualityHistory.slice(-3);
  const allPositive = recent.every(d => d > 0);
  const allNearZero = recent.every(d => Math.abs(d) < 0.05);
  const oscillating = recent.length === 3 && Math.sign(recent[0]!) !== Math.sign(recent[2]!);
  const allNegative = recent.every(d => d < 0);

  if (allNegative) return 'diverging';
  if (oscillating) return 'oscillating';
  if (allNearZero) return 'fast';
  if (allPositive) return 'normal';
  return 'slow';
}

// Pause/resume loop
export function pauseLoop(state: RefinementLoopEngineState, loopId: string): RefinementLoopEngineState {
  const loop = state.loops.get(loopId);
  if (!loop) return state;
  const updated: RefinementLoop = { ...loop, status: 'paused' };
  const loops = new Map(state.loops).set(loopId, updated);
  return recomputeLoop({ ...state, loops });
}

export function resumeLoop(state: RefinementLoopEngineState, loopId: string): RefinementLoopEngineState {
  const loop = state.loops.get(loopId);
  if (!loop) return state;
  const updated: RefinementLoop = { ...loop, status: 'active' };
  const loops = new Map(state.loops).set(loopId, updated);
  return recomputeLoop({ ...state, loops });
}

// Get loops by status
export function getLoopsByStatus(state: RefinementLoopEngineState, status: LoopStatus): RefinementLoop[] {
  return Array.from(state.loops.values()).filter(l => l.status === status);
}

// Get loop iterations
export function getLoopIterations(state: RefinementLoopEngineState, loopId: string): LoopIteration[] {
  return state.loops.get(loopId)?.iterations || [];
}

// Get refinement report
export function getRefinementLoopReport(state: RefinementLoopEngineState): {
  totalLoops: number;
  activeLoops: number;
  convergedLoops: number;
  totalIterations: number;
  averageQualityGain: number;
  convergenceRate: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalLoops === 0) recommendations.push('No loops — start refinement');
  if (state.convergenceRate < 0.3) recommendations.push('Low convergence — adjust approach');
  if (state.averageQualityGain < 0) recommendations.push('Quality decreasing — recheck approach');

  return {
    totalLoops: state.totalLoops,
    activeLoops: state.activeLoops,
    convergedLoops: state.convergedLoops,
    totalIterations: state.totalIterations,
    averageQualityGain: Math.round(state.averageQualityGain * 100) / 100,
    convergenceRate: Math.round(state.convergenceRate * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeLoop(state: RefinementLoopEngineState): RefinementLoopEngineState {
  const loops = Array.from(state.loops.values());
  const activeLoops = loops.filter(l => l.status === 'active' || l.status === 'paused').length;
  const convergedLoops = loops.filter(l => l.status === 'converged' || l.status === 'completed').length;

  const allDeltas: number[] = [];
  loops.forEach(l => l.qualityHistory.forEach(d => allDeltas.push(d)));
  const averageQualityGain = allDeltas.length > 0
    ? allDeltas.reduce((s, d) => s + d, 0) / allDeltas.length
    : 0;

  const convergenceRate = state.totalLoops === 0 ? 0.5 : convergedLoops / state.totalLoops;

  return { ...state, activeLoops, convergedLoops, averageQualityGain, convergenceRate };
}

// Reset loop state
export function resetRefinementLoopEngineState(): RefinementLoopEngineState {
  return createRefinementLoopEngineState();
}