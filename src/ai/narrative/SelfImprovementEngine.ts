/**
 * V744 SelfImprovementEngine — Direction A Iter 4/9 (Round 3)
 * Self-improvement engine: continuous self-enhancement + meta-learning
 * Sources: generic-agent self-improve + thunderbolt feedback + nanobot
 */

export type ImprovementArea = 'performance' | 'quality' | 'speed' | 'accuracy' | 'creativity' | 'reliability';
export type ImprovementStrategy = 'incremental' | 'leapfrog' | 'replacement' | 'hybrid' | 'experimental';
export type ImprovementStatus = 'identified' | 'planning' | 'executing' | 'validating' | 'completed' | 'rolled_back';

export interface Improvement {
  improvementId: string;
  area: ImprovementArea;
  strategy: ImprovementStrategy;
  description: string;
  baseline: number;
  target: number;
  achieved: number;
  status: ImprovementStatus;
  createdAt: number;
  completedAt: number | null;
}

export interface ImprovementCycle {
  cycleId: string;
  improvements: string[];
  startTime: number;
  endTime: number | null;
  status: 'active' | 'completed' | 'failed';
  gain: number;
}

export interface SelfImprovementEngineState {
  improvements: Map<string, Improvement>;
  cycles: Map<string, ImprovementCycle>;
  totalImprovements: number;
  completedImprovements: number;
  totalCycles: number;
  totalGain: number;
  averageGain: number;
  improvementVelocity: number;
  dominantArea: ImprovementArea | null;
}

// Factory
export function createSelfImprovementEngineState(): SelfImprovementEngineState {
  return {
    improvements: new Map(),
    cycles: new Map(),
    totalImprovements: 0,
    completedImprovements: 0,
    totalCycles: 0,
    totalGain: 0,
    averageGain: 0,
    improvementVelocity: 0,
    dominantArea: null,
  };
}

// Identify improvement
export function identifyImprovement(
  state: SelfImprovementEngineState,
  improvementId: string,
  area: ImprovementArea,
  strategy: ImprovementStrategy,
  description: string,
  baseline: number,
  target: number
): SelfImprovementEngineState {
  const improvement: Improvement = {
    improvementId,
    area,
    strategy,
    description,
    baseline,
    target,
    achieved: baseline,
    status: 'identified',
    createdAt: Date.now(),
    completedAt: null,
  };
  const improvements = new Map(state.improvements).set(improvementId, improvement);
  return recomputeSelfImprovement({ ...state, improvements, totalImprovements: improvements.size });
}

// Start cycle
export function startImprovementCycle(state: SelfImprovementEngineState, cycleId: string): SelfImprovementEngineState {
  const cycle: ImprovementCycle = { cycleId, improvements: [], startTime: Date.now(), endTime: null, status: 'active', gain: 0 };
  const cycles = new Map(state.cycles).set(cycleId, cycle);
  return recomputeSelfImprovement({ ...state, cycles, totalCycles: cycles.size });
}

// Execute improvement
export function executeImprovement(state: SelfImprovementEngineState, improvementId: string): SelfImprovementEngineState {
  const improvement = state.improvements.get(improvementId);
  if (!improvement) return state;

  const updated: Improvement = { ...improvement, status: 'executing' };
  const improvements = new Map(state.improvements).set(improvementId, updated);
  return recomputeSelfImprovement({ ...state, improvements });
}

// Complete improvement
export function completeImprovement(state: SelfImprovementEngineState, improvementId: string, achieved: number): SelfImprovementEngineState {
  const improvement = state.improvements.get(improvementId);
  if (!improvement) return state;

  const updated: Improvement = {
    ...improvement,
    achieved,
    status: 'completed',
    completedAt: Date.now(),
  };
  const improvements = new Map(state.improvements).set(improvementId, updated);
  return recomputeSelfImprovement({ ...state, improvements, completedImprovements: state.completedImprovements + 1 });
}

// Roll back improvement
export function rollbackImprovement(state: SelfImprovementEngineState, improvementId: string): SelfImprovementEngineState {
  const improvement = state.improvements.get(improvementId);
  if (!improvement) return state;

  const updated: Improvement = { ...improvement, status: 'rolled_back' };
  const improvements = new Map(state.improvements).set(improvementId, updated);
  return recomputeSelfImprovement({ ...state, improvements });
}

// Get improvements by area
export function getImprovementsByArea(state: SelfImprovementEngineState, area: ImprovementArea): Improvement[] {
  return Array.from(state.improvements.values()).filter(i => i.area === area);
}

// Get self-improvement report
export function getSelfImprovementReport(state: SelfImprovementEngineState): {
  totalImprovements: number;
  completedImprovements: number;
  totalCycles: number;
  averageGain: number;
  improvementVelocity: number;
  dominantArea: ImprovementArea | null;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalImprovements === 0) recommendations.push('No improvements — identify areas');
  if (state.averageGain < 0) recommendations.push('Negative gain — review recent changes');
  if (state.improvementVelocity < 0.1) recommendations.push('Low velocity — accelerate improvements');

  return {
    totalImprovements: state.totalImprovements,
    completedImprovements: state.completedImprovements,
    totalCycles: state.totalCycles,
    averageGain: Math.round(state.averageGain * 100) / 100,
    improvementVelocity: Math.round(state.improvementVelocity * 100) / 100,
    dominantArea: state.dominantArea,
    recommendations,
  };
}

// Recompute metrics
function recomputeSelfImprovement(state: SelfImprovementEngineState): SelfImprovementEngineState {
  const improvements = Array.from(state.improvements.values());
  const completed = improvements.filter(i => i.status === 'completed');
  const totalGain = completed.reduce((s, i) => s + (i.achieved - i.baseline), 0);
  const averageGain = completed.length > 0 ? totalGain / completed.length : 0;

  const improvementVelocity = state.totalImprovements === 0 ? 0 :
    state.completedImprovements / state.totalImprovements;

  const areaCounts = new Map<ImprovementArea, number>();
  improvements.forEach(i => areaCounts.set(i.area, (areaCounts.get(i.area) || 0) + 1));
  let dominantArea: ImprovementArea | null = null;
  let maxCount = -1;
  areaCounts.forEach((count, area) => {
    if (count > maxCount) { maxCount = count; dominantArea = area; }
  });

  return { ...state, totalGain, averageGain, improvementVelocity, dominantArea };
}

// Reset self-improvement state
export function resetSelfImprovementEngineState(): SelfImprovementEngineState {
  return createSelfImprovementEngineState();
}