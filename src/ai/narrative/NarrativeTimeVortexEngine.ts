/**
 * V1194 NarrativeTimeVortexEngine — Direction G Iter 5/20 (Round 5)
 * Time vortex engine: vortex in time
 * Sources: thunderbolt vortex + nanobot + ruflo
 */

export type TimeVortexType = 'convergence' | 'divergence' | 'spiral' | 'cyclone' | 'whirlpool' | 'maelstrom';
export type TimeVortexIntensity = 'gentle' | 'moderate' | 'strong' | 'violent' | 'overwhelming';
export type TimeVortexEffect = 'pulling' | 'twisting' | 'compressing' | 'stretching' | 'dissolving';

export interface TimeVortex {
  vortexId: string;
  type: TimeVortexType;
  intensity: TimeVortexIntensity;
  effect: TimeVortexEffect;
  description: string;
  power: number;
  reach: number;
  chapter: number;
}

export interface TimeVortexWhirl {
  whirlId: string,
  vortexIds: string[],
  cumulativePower: number,
  intensity: number,
}

export interface NarrativeTimeVortexEngineState {
  vortexes: Map<string, TimeVortex>;
  whirls: Map<string, TimeVortexWhirl>;
  totalVortexes: number;
  totalWhirls: number;
  averagePower: number;
  averageReach: number;
  whirlIntensity: number;
  timeVortexMastery: number;
}

// Factory
export function createNarrativeTimeVortexEngineState(): NarrativeTimeVortexEngineState {
  return {
    vortexes: new Map(),
    whirls: new Map(),
    totalVortexes: 0,
    totalWhirls: 0,
    averagePower: 0.5,
    averageReach: 0.5,
    whirlIntensity: 0.5,
    timeVortexMastery: 0.5,
  };
}

// Add vortex
export function addTimeVortex(
  state: NarrativeTimeVortexEngineState,
  vortexId: string,
  type: TimeVortexType,
  intensity: TimeVortexIntensity,
  effect: TimeVortexEffect,
  description: string,
  power: number,
  reach: number,
  chapter: number
): NarrativeTimeVortexEngineState {
  const vortex: TimeVortex = { vortexId, type, intensity, effect, description, power, reach, chapter };
  const vortexes = new Map(state.vortexes).set(vortexId, vortex);
  return recomputeTimeVortex({ ...state, vortexes, totalVortexes: vortexes.size });
}

// Add whirl
export function addTimeVortexWhirl(
  state: NarrativeTimeVortexEngineState,
  whirlId: string,
  vortexIds: string[]
): NarrativeTimeVortexEngineState {
  const vortexes = vortexIds.map(id => state.vortexes.get(id)).filter((v): v is TimeVortex => v !== undefined);
  const cumulativePower = vortexes.length === 0 ? 0
    : vortexes.reduce((s, v) => s + v.power, 0) / vortexes.length;
  const intensity = vortexes.length === 0 ? 0.5
    : vortexes.reduce((s, v) => s + (v.intensity === 'overwhelming' ? 1 : v.intensity === 'violent' ? 0.85 : v.intensity === 'strong' ? 0.7 : v.intensity === 'moderate' ? 0.5 : 0.3), 0) / vortexes.length;
  const whirl: TimeVortexWhirl = { whirlId, vortexIds, cumulativePower, intensity };
  const whirls = new Map(state.whirls).set(whirlId, whirl);
  return recomputeTimeVortex({ ...state, whirls, totalWhirls: whirls.size });
}

// Get vortexes by type
export function getTimeVortexesByType(state: NarrativeTimeVortexEngineState, type: TimeVortexType): TimeVortex[] {
  return Array.from(state.vortexes.values()).filter(v => v.type === type);
}

// Get time vortex report
export function getTimeVortexReport(state: NarrativeTimeVortexEngineState): {
  totalVortexes: number;
  totalWhirls: number;
  averagePower: number;
  averageReach: number;
  timeVortexMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalVortexes === 0) recommendations.push('No vortexes — add time vortexes');
  if (state.averagePower < 0.5) recommendations.push('Low power — strengthen');
  if (state.timeVortexMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalVortexes: state.totalVortexes,
    totalWhirls: state.totalWhirls,
    averagePower: Math.round(state.averagePower * 100) / 100,
    averageReach: Math.round(state.averageReach * 100) / 100,
    timeVortexMastery: Math.round(state.timeVortexMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeTimeVortex(state: NarrativeTimeVortexEngineState): NarrativeTimeVortexEngineState {
  const vortexes = Array.from(state.vortexes.values());
  const averagePower = vortexes.length === 0 ? 0.5
    : vortexes.reduce((s, v) => s + v.power, 0) / vortexes.length;
  const averageReach = vortexes.length === 0 ? 0.5
    : vortexes.reduce((s, v) => s + v.reach, 0) / vortexes.length;

  const whirls = Array.from(state.whirls.values());
  const whirlIntensity = whirls.length === 0 ? 0.5
    : whirls.reduce((s, w) => s + w.intensity, 0) / whirls.length;

  const timeVortexMastery = (averagePower * 0.4 + averageReach * 0.3 + whirlIntensity * 0.3);

  return { ...state, averagePower, averageReach, whirlIntensity, timeVortexMastery };
}

// Reset
export function resetNarrativeTimeVortexEngineState(): NarrativeTimeVortexEngineState {
  return createNarrativeTimeVortexEngineState();
}