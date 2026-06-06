/**
 * V1214 NarrativeTimeMomentumEngine — Direction G Iter 15/20 (Round 5)
 * Time momentum engine: momentum in time
 * Sources: thunderbolt momentum + nanobot + ruflo
 */

export type TimeMomentumType = 'forward' | 'backward' | 'lateral' | 'cumulative' | 'breakaway' | 'parabolic';
export type TimeMomentumForce = 'weak' | 'moderate' | 'strong' | 'overwhelming' | 'unstoppable';
export type TimeMomentumTrajectory = 'linear' | 'curved' | 'spiral' | 'parabolic' | 'chaotic';

export interface TimeMomentum {
  momentumId: string;
  type: TimeMomentumType;
  force: TimeMomentumForce;
  trajectory: TimeMomentumTrajectory;
  description: string;
  velocity: number;
  acceleration: number;
  chapter: number;
}

export interface TimeMomentumFlow {
  flowId: string,
  momentumIds: string[],
  cumulativeVelocity: number,
  intensity: number,
}

export interface NarrativeTimeMomentumEngineState {
  momentums: Map<string, TimeMomentum>;
  flows: Map<string, TimeMomentumFlow>;
  totalMomentums: number;
  totalFlows: number;
  averageVelocity: number;
  averageAcceleration: number;
  flowIntensity: number;
  timeMomentumMastery: number;
}

// Factory
export function createNarrativeTimeMomentumEngineState(): NarrativeTimeMomentumEngineState {
  return {
    momentums: new Map(),
    flows: new Map(),
    totalMomentums: 0,
    totalFlows: 0,
    averageVelocity: 0.5,
    averageAcceleration: 0.5,
    flowIntensity: 0.5,
    timeMomentumMastery: 0.5,
  };
}

// Add momentum
export function addTimeMomentum(
  state: NarrativeTimeMomentumEngineState,
  momentumId: string,
  type: TimeMomentumType,
  force: TimeMomentumForce,
  trajectory: TimeMomentumTrajectory,
  description: string,
  velocity: number,
  acceleration: number,
  chapter: number
): NarrativeTimeMomentumEngineState {
  const momentum: TimeMomentum = { momentumId, type, force, trajectory, description, velocity, acceleration, chapter };
  const momentums = new Map(state.momentums).set(momentumId, momentum);
  return recomputeTimeMomentum({ ...state, momentums, totalMomentums: momentums.size });
}

// Add flow
export function addTimeMomentumFlow(
  state: NarrativeTimeMomentumEngineState,
  flowId: string,
  momentumIds: string[]
): NarrativeTimeMomentumEngineState {
  const momentums = momentumIds.map(id => state.momentums.get(id)).filter((m): m is TimeMomentum => m !== undefined);
  const cumulativeVelocity = momentums.length === 0 ? 0
    : momentums.reduce((s, m) => s + m.velocity, 0) / momentums.length;
  const typeSet = new Set(momentums.map(m => m.type));
  const intensity = Math.min(1, typeSet.size / 6);
  const flow: TimeMomentumFlow = { flowId, momentumIds, cumulativeVelocity, intensity };
  const flows = new Map(state.flows).set(flowId, flow);
  return recomputeTimeMomentum({ ...state, flows, totalFlows: flows.size });
}

// Get momentums by type
export function getTimeMomentumsByType(state: NarrativeTimeMomentumEngineState, type: TimeMomentumType): TimeMomentum[] {
  return Array.from(state.momentums.values()).filter(m => m.type === type);
}

// Get time momentum report
export function getTimeMomentumReport(state: NarrativeTimeMomentumEngineState): {
  totalMomentums: number;
  totalFlows: number;
  averageVelocity: number;
  averageAcceleration: number;
  timeMomentumMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalMomentums === 0) recommendations.push('No momentums — add time momentums');
  if (state.averageVelocity < 0.5) recommendations.push('Low velocity — strengthen');
  if (state.timeMomentumMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalMomentums: state.totalMomentums,
    totalFlows: state.totalFlows,
    averageVelocity: Math.round(state.averageVelocity * 100) / 100,
    averageAcceleration: Math.round(state.averageAcceleration * 100) / 100,
    timeMomentumMastery: Math.round(state.timeMomentumMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeTimeMomentum(state: NarrativeTimeMomentumEngineState): NarrativeTimeMomentumEngineState {
  const momentums = Array.from(state.momentums.values());
  const averageVelocity = momentums.length === 0 ? 0.5
    : momentums.reduce((s, m) => s + m.velocity, 0) / momentums.length;
  const averageAcceleration = momentums.length === 0 ? 0.5
    : momentums.reduce((s, m) => s + m.acceleration, 0) / momentums.length;

  const flows = Array.from(state.flows.values());
  const flowIntensity = flows.length === 0 ? 0.5
    : flows.reduce((s, f) => s + f.intensity, 0) / flows.length;

  const timeMomentumMastery = (averageVelocity * 0.4 + averageAcceleration * 0.3 + flowIntensity * 0.3);

  return { ...state, averageVelocity, averageAcceleration, flowIntensity, timeMomentumMastery };
}

// Reset
export function resetNarrativeTimeMomentumEngineState(): NarrativeTimeMomentumEngineState {
  return createNarrativeTimeMomentumEngineState();
}