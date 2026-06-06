/**
 * V974 NarrativeIterativeRefinementCore — Direction A Iter 5/15 (Round 5)
 * Iterative refinement core: iterative refinement cycles
 * Sources: generic-agent iterative + thunderbolt + nanobot
 */

export type RefinementPass = 'rough' | 'first' | 'second' | 'third' | 'polish' | 'final';
export type RefinementAspect = 'prose' | 'structure' | 'character' | 'theme' | 'pacing' | 'voice' | 'dialogue';
export type RefinementImpact = 'minor' | 'moderate' | 'major' | 'transformative' | 'revelatory';

export interface RefinementIteration {
  iterationId: string;
  pass: RefinementPass;
  aspect: RefinementAspect;
  impact: RefinementImpact;
  before: number;
  after: number;
  gain: number;
  description: string;
  chapter: number;
}

export interface RefinementPlan {
  planId: string,
  name: string,
  iterationIds: string[],
  totalGain: number,
  efficiency: number,
}

export interface NarrativeIterativeRefinementCoreState {
  iterations: Map<string, RefinementIteration>;
  plans: Map<string, RefinementPlan>;
  totalIterations: number;
  totalPlans: number;
  totalGain: number;
  averageGain: number;
  aspectCoverage: number;
  refinementMastery: number;
}

// Factory
export function createNarrativeIterativeRefinementCoreState(): NarrativeIterativeRefinementCoreState {
  return {
    iterations: new Map(),
    plans: new Map(),
    totalIterations: 0,
    totalPlans: 0,
    totalGain: 0,
    averageGain: 0,
    aspectCoverage: 0,
    refinementMastery: 0.5,
  };
}

// Add iteration
export function addRefinementIteration(
  state: NarrativeIterativeRefinementCoreState,
  iterationId: string,
  pass: RefinementPass,
  aspect: RefinementAspect,
  impact: RefinementImpact,
  before: number,
  after: number,
  description: string,
  chapter: number
): NarrativeIterativeRefinementCoreState {
  const gain = Math.max(0, after - before);
  const iteration: RefinementIteration = { iterationId, pass, aspect, impact, before, after, gain, description, chapter };
  const iterations = new Map(state.iterations).set(iterationId, iteration);
  const totalGain = state.totalGain + gain;
  return recomputeRefineCore({ ...state, iterations, totalGain, totalIterations: iterations.size });
}

// Add plan
export function addRefinementPlan(
  state: NarrativeIterativeRefinementCoreState,
  planId: string,
  name: string,
  iterationIds: string[]
): NarrativeIterativeRefinementCoreState {
  const iterations = iterationIds.map(id => state.iterations.get(id)).filter((i): i is RefinementIteration => i !== undefined);
  const totalGain = iterations.reduce((s, i) => s + i.gain, 0);
  const efficiency = iterations.length === 0 ? 0
    : totalGain / iterations.length;
  const plan: RefinementPlan = { planId, name, iterationIds, totalGain, efficiency };
  const plans = new Map(state.plans).set(planId, plan);
  return recomputeRefineCore({ ...state, plans, totalPlans: plans.size });
}

// Get iterations by pass
export function getIterationsByPass(state: NarrativeIterativeRefinementCoreState, pass: RefinementPass): RefinementIteration[] {
  return Array.from(state.iterations.values()).filter(i => i.pass === pass);
}

// Get refinement report
export function getRefinementCoreReport(state: NarrativeIterativeRefinementCoreState): {
  totalIterations: number;
  totalPlans: number;
  totalGain: number;
  averageGain: number;
  aspectCoverage: number;
  refinementMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalIterations === 0) recommendations.push('No iterations — add refinement iterations');
  if (state.averageGain < 0.05) recommendations.push('Low gain — improve refinement');
  if (state.refinementMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalIterations: state.totalIterations,
    totalPlans: state.totalPlans,
    totalGain: Math.round(state.totalGain * 100) / 100,
    averageGain: Math.round(state.averageGain * 100) / 100,
    aspectCoverage: Math.round(state.aspectCoverage * 100) / 100,
    refinementMastery: Math.round(state.refinementMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeRefineCore(state: NarrativeIterativeRefinementCoreState): NarrativeIterativeRefinementCoreState {
  const iterations = Array.from(state.iterations.values());
  const totalGain = iterations.reduce((s, i) => s + i.gain, 0);
  const averageGain = iterations.length === 0 ? 0
    : totalGain / iterations.length;

  const aspectSet = new Set(iterations.map(i => i.aspect));
  const aspectCoverage = Math.min(1, aspectSet.size / 5);

  const plans = Array.from(state.plans.values());
  const planEfficiency = plans.length === 0 ? 0
    : plans.reduce((s, p) => s + p.efficiency, 0) / plans.length;

  const refinementMastery = (averageGain * 0.4 + aspectCoverage * 0.3 + Math.min(1, planEfficiency * 5) * 0.3);

  return { ...state, totalGain, averageGain, aspectCoverage, refinementMastery };
}

// Reset
export function resetNarrativeIterativeRefinementCoreState(): NarrativeIterativeRefinementCoreState {
  return createNarrativeIterativeRefinementCoreState();
}