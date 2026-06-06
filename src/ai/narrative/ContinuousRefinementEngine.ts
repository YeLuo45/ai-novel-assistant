/**
 * V908 ContinuousRefinementEngine — Direction D Iter 2/15 (Round 4)
 * Continuous refinement engine: ongoing refinement cycles
 * Sources: thunderbolt feedback + generic-agent + nanobot
 */

export type RefinementStage = 'draft' | 'review' | 'revise' | 'polish' | 'final' | 'maintain';
export type RefinementFocus = 'clarity' | 'flow' | 'style' | 'structure' | 'impact' | 'consistency';
export type RefinementQuality = 'poor' | 'fair' | 'good' | 'excellent' | 'flawless';

export interface RefinementCycle {
  cycleId: string;
  stage: RefinementStage;
  focus: RefinementFocus;
  quality: RefinementQuality;
  improvement: number;
  startTime: number;
  endTime: number;
}

export interface RefinementTarget {
  targetId: string;
  name: string;
  currentStage: RefinementStage;
  cycles: string[];
  currentQuality: RefinementQuality;
  target: RefinementQuality;
}

export interface ContinuousRefinementEngineState {
  cycles: Map<string, RefinementCycle>;
  targets: Map<string, RefinementTarget>;
  totalCycles: number;
  totalTargets: number;
  completedTargets: number;
  averageImprovement: number;
  refinementVelocity: number;
  refinementMastery: number;
  continuousFlow: number;
}

// Factory
export function createContinuousRefinementEngineState(): ContinuousRefinementEngineState {
  return {
    cycles: new Map(),
    targets: new Map(),
    totalCycles: 0,
    totalTargets: 0,
    completedTargets: 0,
    averageImprovement: 0,
    refinementVelocity: 0.5,
    refinementMastery: 0.5,
    continuousFlow: 0.5,
  };
}

// Add cycle
export function addRefinementCycle(
  state: ContinuousRefinementEngineState,
  cycleId: string,
  stage: RefinementStage,
  focus: RefinementFocus,
  startTime: number,
  endTime: number,
  improvement: number = 0.1,
  quality: RefinementQuality = 'fair'
): ContinuousRefinementEngineState {
  const cycle: RefinementCycle = { cycleId, stage, focus, quality, improvement, startTime, endTime };
  const cycles = new Map(state.cycles).set(cycleId, cycle);
  return recomputeContinuousRef({ ...state, cycles, totalCycles: cycles.size });
}

// Add target
export function addRefinementTarget(
  state: ContinuousRefinementEngineState,
  targetId: string,
  name: string,
  currentStage: RefinementStage = 'draft',
  target: RefinementQuality = 'excellent',
  currentQuality: RefinementQuality = 'fair'
): ContinuousRefinementEngineState {
  const target_obj: RefinementTarget = { targetId, name, currentStage, cycles: [], currentQuality, target };
  const targets = new Map(state.targets).set(targetId, target_obj);
  return recomputeContinuousRef({ ...state, targets, totalTargets: targets.size });
}

// Complete target
export function completeRefinementTarget(state: ContinuousRefinementEngineState, targetId: string): ContinuousRefinementEngineState {
  const target = state.targets.get(targetId);
  if (!target) return state;

  const updated: RefinementTarget = { ...target, currentStage: 'maintain', currentQuality: target.target };
  const targets = new Map(state.targets).set(targetId, updated);
  const completedTargets = state.completedTargets + 1;
  return recomputeContinuousRef({ ...state, targets, completedTargets });
}

// Get cycles by stage
export function getCyclesByStage(state: ContinuousRefinementEngineState, stage: RefinementStage): RefinementCycle[] {
  return Array.from(state.cycles.values()).filter(c => c.stage === stage);
}

// Get refinement report
export function getRefinementReport(state: ContinuousRefinementEngineState): {
  totalCycles: number;
  totalTargets: number;
  completedTargets: number;
  averageImprovement: number;
  refinementVelocity: number;
  refinementMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalCycles === 0) recommendations.push('No cycles — add cycles');
  if (state.averageImprovement < 0.1) recommendations.push('Low improvement — improve');
  if (state.completedTargets < state.totalTargets / 2) recommendations.push('Few completions — complete more');

  return {
    totalCycles: state.totalCycles,
    totalTargets: state.totalTargets,
    completedTargets: state.completedTargets,
    averageImprovement: Math.round(state.averageImprovement * 100) / 100,
    refinementVelocity: Math.round(state.refinementVelocity * 100) / 100,
    refinementMastery: Math.round(state.refinementMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeContinuousRef(state: ContinuousRefinementEngineState): ContinuousRefinementEngineState {
  const cycles = Array.from(state.cycles.values());
  const totalImprovement = cycles.reduce((s, c) => s + c.improvement, 0);
  const averageImprovement = cycles.length === 0 ? 0 : totalImprovement / cycles.length;

  // Velocity: cycles per target
  const refinementVelocity = state.totalTargets === 0 ? 0.5
    : Math.min(1, cycles.length / Math.max(1, state.totalTargets * 3));

  const completionRate = state.totalTargets === 0 ? 0
    : state.completedTargets / state.totalTargets;

  const refinementMastery = (averageImprovement * 0.4 + refinementVelocity * 0.3 + completionRate * 0.3);

  // Continuous flow: high if there's ongoing work
  const inProgress = state.totalTargets - state.completedTargets;
  const continuousFlow = state.totalTargets === 0 ? 0.5
    : inProgress / state.totalTargets;

  return { ...state, averageImprovement, refinementVelocity, refinementMastery, continuousFlow };
}

// Reset refinement state
export function resetContinuousRefinementEngineState(): ContinuousRefinementEngineState {
  return createContinuousRefinementEngineState();
}