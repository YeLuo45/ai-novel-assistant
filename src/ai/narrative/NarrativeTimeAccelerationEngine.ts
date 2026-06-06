/**
 * V1218 NarrativeTimeAccelerationEngine — Direction G Iter 17/20 (Round 5)
 * Time acceleration engine: acceleration in time
 * Sources: thunderbolt acceleration + nanobot + ruflo
 */

export type TimeAccelerationType = 'linear' | 'exponential' | 'logarithmic' | 'stepped' | 's_curve' | 'spike';
export type TimeAccelerationRate = 'gentle' | 'moderate' | 'rapid' | 'breakneck' | 'infinite';
export type TimeAccelerationEffect = 'subtle' | 'noticeable' | 'dramatic' | 'seismic' | 'paradigm_shift';

export interface TimeAcceleration {
  accelerationId: string;
  type: TimeAccelerationType;
  rate: TimeAccelerationRate;
  effect: TimeAccelerationEffect;
  description: string;
  velocity_gain: number;
  impact: number;
  chapter: number;
}

export interface TimeAccelerationBurst {
  burstId: string,
  accelerationIds: string[],
  cumulativeVelocityGain: number,
  intensity: number,
}

export interface NarrativeTimeAccelerationEngineState {
  accelerations: Map<string, TimeAcceleration>;
  bursts: Map<string, TimeAccelerationBurst>;
  totalAccelerations: number;
  totalBursts: number;
  averageVelocityGain: number;
  averageImpact: number;
  burstIntensity: number;
  timeAccelerationMastery: number;
}

// Factory
export function createNarrativeTimeAccelerationEngineState(): NarrativeTimeAccelerationEngineState {
  return {
    accelerations: new Map(),
    bursts: new Map(),
    totalAccelerations: 0,
    totalBursts: 0,
    averageVelocityGain: 0.5,
    averageImpact: 0.5,
    burstIntensity: 0.5,
    timeAccelerationMastery: 0.5,
  };
}

// Add acceleration
export function addTimeAcceleration(
  state: NarrativeTimeAccelerationEngineState,
  accelerationId: string,
  type: TimeAccelerationType,
  rate: TimeAccelerationRate,
  effect: TimeAccelerationEffect,
  description: string,
  velocity_gain: number,
  impact: number,
  chapter: number
): NarrativeTimeAccelerationEngineState {
  const acceleration: TimeAcceleration = { accelerationId, type, rate, effect, description, velocity_gain, impact, chapter };
  const accelerations = new Map(state.accelerations).set(accelerationId, acceleration);
  return recomputeTimeAcceleration({ ...state, accelerations, totalAccelerations: accelerations.size });
}

// Add burst
export function addTimeAccelerationBurst(
  state: NarrativeTimeAccelerationEngineState,
  burstId: string,
  accelerationIds: string[]
): NarrativeTimeAccelerationEngineState {
  const accelerations = accelerationIds.map(id => state.accelerations.get(id)).filter((a): a is TimeAcceleration => a !== undefined);
  const cumulativeVelocityGain = accelerations.length === 0 ? 0
    : accelerations.reduce((s, a) => s + a.velocity_gain, 0) / accelerations.length;
  const typeSet = new Set(accelerations.map(a => a.type));
  const intensity = Math.min(1, typeSet.size / 6);
  const burst: TimeAccelerationBurst = { burstId, accelerationIds, cumulativeVelocityGain, intensity };
  const bursts = new Map(state.bursts).set(burstId, burst);
  return recomputeTimeAcceleration({ ...state, bursts, totalBursts: bursts.size });
}

// Get accelerations by type
export function getTimeAccelerationsByType(state: NarrativeTimeAccelerationEngineState, type: TimeAccelerationType): TimeAcceleration[] {
  return Array.from(state.accelerations.values()).filter(a => a.type === type);
}

// Get time acceleration report
export function getTimeAccelerationReport(state: NarrativeTimeAccelerationEngineState): {
  totalAccelerations: number;
  totalBursts: number;
  averageVelocityGain: number;
  averageImpact: number;
  timeAccelerationMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalAccelerations === 0) recommendations.push('No accelerations — add time accelerations');
  if (state.averageVelocityGain < 0.5) recommendations.push('Low velocity gain — strengthen');
  if (state.timeAccelerationMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalAccelerations: state.totalAccelerations,
    totalBursts: state.totalBursts,
    averageVelocityGain: Math.round(state.averageVelocityGain * 100) / 100,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    timeAccelerationMastery: Math.round(state.timeAccelerationMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeTimeAcceleration(state: NarrativeTimeAccelerationEngineState): NarrativeTimeAccelerationEngineState {
  const accelerations = Array.from(state.accelerations.values());
  const averageVelocityGain = accelerations.length === 0 ? 0.5
    : accelerations.reduce((s, a) => s + a.velocity_gain, 0) / accelerations.length;
  const averageImpact = accelerations.length === 0 ? 0.5
    : accelerations.reduce((s, a) => s + a.impact, 0) / accelerations.length;

  const bursts = Array.from(state.bursts.values());
  const burstIntensity = bursts.length === 0 ? 0.5
    : bursts.reduce((s, b) => s + b.intensity, 0) / bursts.length;

  const timeAccelerationMastery = (averageVelocityGain * 0.4 + averageImpact * 0.3 + burstIntensity * 0.3);

  return { ...state, averageVelocityGain, averageImpact, burstIntensity, timeAccelerationMastery };
}

// Reset
export function resetNarrativeTimeAccelerationEngineState(): NarrativeTimeAccelerationEngineState {
  return createNarrativeTimeAccelerationEngineState();
}