/**
 * V1200 NarrativeTimeWhirlEngine — Direction G Iter 8/20 (Round 5)
 * Time whirl engine: whirl in time
 * Sources: nanobot whirl + thunderbolt + ruflo
 */

export type TimeWhirlType = 'spinning' | 'twisting' | 'revolving' | 'spiraling' | 'gyrating' | 'rotating';
export type TimeWhirlSpeed = 'glacial' | 'slow' | 'moderate' | 'fast' | 'furious';
export type TimeWhirlDirection = 'forward' | 'backward' | 'sideways' | 'multidirectional' | 'paradoxical';

export interface TimeWhirl {
  whirlId: string;
  type: TimeWhirlType;
  speed: TimeWhirlSpeed;
  direction: TimeWhirlDirection;
  description: string;
  momentum: number;
  disorientation: number;
  chapter: number;
}

export interface TimeWhirlDance {
  danceId: string,
  whirlIds: string[],
  cumulativeMomentum: number,
  depth: number,
}

export interface NarrativeTimeWhirlEngineState {
  whirls: Map<string, TimeWhirl>;
  dances: Map<string, TimeWhirlDance>;
  totalWhirls: number;
  totalDances: number;
  averageMomentum: number;
  averageDisorientation: number;
  danceDepth: number;
  timeWhirlMastery: number;
}

// Factory
export function createNarrativeTimeWhirlEngineState(): NarrativeTimeWhirlEngineState {
  return {
    whirls: new Map(),
    dances: new Map(),
    totalWhirls: 0,
    totalDances: 0,
    averageMomentum: 0.5,
    averageDisorientation: 0.5,
    danceDepth: 0.5,
    timeWhirlMastery: 0.5,
  };
}

// Add whirl
export function addTimeWhirl(
  state: NarrativeTimeWhirlEngineState,
  whirlId: string,
  type: TimeWhirlType,
  speed: TimeWhirlSpeed,
  direction: TimeWhirlDirection,
  description: string,
  momentum: number,
  disorientation: number,
  chapter: number
): NarrativeTimeWhirlEngineState {
  const whirl: TimeWhirl = { whirlId, type, speed, direction, description, momentum, disorientation, chapter };
  const whirls = new Map(state.whirls).set(whirlId, whirl);
  return recomputeTimeWhirl({ ...state, whirls, totalWhirls: whirls.size });
}

// Add dance
export function addTimeWhirlDance(
  state: NarrativeTimeWhirlEngineState,
  danceId: string,
  whirlIds: string[]
): NarrativeTimeWhirlEngineState {
  const whirls = whirlIds.map(id => state.whirls.get(id)).filter((w): w is TimeWhirl => w !== undefined);
  const cumulativeMomentum = whirls.length === 0 ? 0
    : whirls.reduce((s, w) => s + w.momentum, 0) / whirls.length;
  const typeSet = new Set(whirls.map(w => w.type));
  const depth = Math.min(1, typeSet.size / 6);
  const dance: TimeWhirlDance = { danceId, whirlIds, cumulativeMomentum, depth };
  const dances = new Map(state.dances).set(danceId, dance);
  return recomputeTimeWhirl({ ...state, dances, totalDances: dances.size });
}

// Get whirls by type
export function getTimeWhirlsByType(state: NarrativeTimeWhirlEngineState, type: TimeWhirlType): TimeWhirl[] {
  return Array.from(state.whirls.values()).filter(w => w.type === type);
}

// Get time whirl report
export function getTimeWhirlReport(state: NarrativeTimeWhirlEngineState): {
  totalWhirls: number;
  totalDances: number;
  averageMomentum: number;
  averageDisorientation: number;
  timeWhirlMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalWhirls === 0) recommendations.push('No whirls — add time whirls');
  if (state.averageMomentum < 0.5) recommendations.push('Low momentum — strengthen');
  if (state.timeWhirlMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalWhirls: state.totalWhirls,
    totalDances: state.totalDances,
    averageMomentum: Math.round(state.averageMomentum * 100) / 100,
    averageDisorientation: Math.round(state.averageDisorientation * 100) / 100,
    timeWhirlMastery: Math.round(state.timeWhirlMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeTimeWhirl(state: NarrativeTimeWhirlEngineState): NarrativeTimeWhirlEngineState {
  const whirls = Array.from(state.whirls.values());
  const averageMomentum = whirls.length === 0 ? 0.5
    : whirls.reduce((s, w) => s + w.momentum, 0) / whirls.length;
  const averageDisorientation = whirls.length === 0 ? 0.5
    : whirls.reduce((s, w) => s + w.disorientation, 0) / whirls.length;

  const dances = Array.from(state.dances.values());
  const danceDepth = dances.length === 0 ? 0.5
    : dances.reduce((s, d) => s + d.depth, 0) / dances.length;

  const timeWhirlMastery = (averageMomentum * 0.4 + averageDisorientation * 0.3 + danceDepth * 0.3);

  return { ...state, averageMomentum, averageDisorientation, danceDepth, timeWhirlMastery };
}

// Reset
export function resetNarrativeTimeWhirlEngineState(): NarrativeTimeWhirlEngineState {
  return createNarrativeTimeWhirlEngineState();
}