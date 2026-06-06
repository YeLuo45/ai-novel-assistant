/**
 * V1204 NarrativeTimeTideEngine — Direction G Iter 10/20 (Round 5)
 * Time tide engine: tide in time
 * Sources: nanobot tide + thunderbolt + ruflo
 */

export type TimeTideType = 'rising' | 'falling' | 'high' | 'low' | 'neap' | 'spring';
export type TimeTidePower = 'subtle' | 'moderate' | 'strong' | 'mighty' | 'overwhelming';
export type TimeTideRhythm = 'irregular' | 'subtle' | 'regular' | 'predictable' | 'absolute';

export interface TimeTide {
  tideId: string;
  type: TimeTideType;
  power: TimeTidePower;
  rhythm: TimeTideRhythm;
  description: string;
  force: number;
  reach: number;
  chapter: number;
}

export interface TimeTideWash {
  washId: string,
  tideIds: string[],
  cumulativeForce: number,
  diversity: number,
}

export interface NarrativeTimeTideEngineState {
  tides: Map<string, TimeTide>;
  washes: Map<string, TimeTideWash>;
  totalTides: number;
  totalWashes: number;
  averageForce: number;
  averageReach: number;
  washDiversity: number;
  timeTideMastery: number;
}

// Factory
export function createNarrativeTimeTideEngineState(): NarrativeTimeTideEngineState {
  return {
    tides: new Map(),
    washes: new Map(),
    totalTides: 0,
    totalWashes: 0,
    averageForce: 0.5,
    averageReach: 0.5,
    washDiversity: 0.5,
    timeTideMastery: 0.5,
  };
}

// Add tide
export function addTimeTide(
  state: NarrativeTimeTideEngineState,
  tideId: string,
  type: TimeTideType,
  power: TimeTidePower,
  rhythm: TimeTideRhythm,
  description: string,
  force: number,
  reach: number,
  chapter: number
): NarrativeTimeTideEngineState {
  const tide: TimeTide = { tideId, type, power, rhythm, description, force, reach, chapter };
  const tides = new Map(state.tides).set(tideId, tide);
  return recomputeTimeTide({ ...state, tides, totalTides: tides.size });
}

// Add wash
export function addTimeTideWash(
  state: NarrativeTimeTideEngineState,
  washId: string,
  tideIds: string[]
): NarrativeTimeTideEngineState {
  const tides = tideIds.map(id => state.tides.get(id)).filter((t): t is TimeTide => t !== undefined);
  const cumulativeForce = tides.length === 0 ? 0
    : tides.reduce((s, t) => s + t.force, 0) / tides.length;
  const typeSet = new Set(tides.map(t => t.type));
  const diversity = Math.min(1, typeSet.size / 6);
  const wash: TimeTideWash = { washId, tideIds, cumulativeForce, diversity };
  const washes = new Map(state.washes).set(washId, wash);
  return recomputeTimeTide({ ...state, washes, totalWashes: washes.size });
}

// Get tides by type
export function getTimeTidesByType(state: NarrativeTimeTideEngineState, type: TimeTideType): TimeTide[] {
  return Array.from(state.tides.values()).filter(t => t.type === type);
}

// Get time tide report
export function getTimeTideReport(state: NarrativeTimeTideEngineState): {
  totalTides: number;
  totalWashes: number;
  averageForce: number;
  averageReach: number;
  timeTideMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalTides === 0) recommendations.push('No tides — add time tides');
  if (state.averageForce < 0.5) recommendations.push('Low force — strengthen');
  if (state.timeTideMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalTides: state.totalTides,
    totalWashes: state.totalWashes,
    averageForce: Math.round(state.averageForce * 100) / 100,
    averageReach: Math.round(state.averageReach * 100) / 100,
    timeTideMastery: Math.round(state.timeTideMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeTimeTide(state: NarrativeTimeTideEngineState): NarrativeTimeTideEngineState {
  const tides = Array.from(state.tides.values());
  const averageForce = tides.length === 0 ? 0.5
    : tides.reduce((s, t) => s + t.force, 0) / tides.length;
  const averageReach = tides.length === 0 ? 0.5
    : tides.reduce((s, t) => s + t.reach, 0) / tides.length;

  const washes = Array.from(state.washes.values());
  const washDiversity = washes.length === 0 ? 0.5
    : washes.reduce((s, w) => s + w.diversity, 0) / washes.length;

  const timeTideMastery = (averageForce * 0.4 + averageReach * 0.3 + washDiversity * 0.3);

  return { ...state, averageForce, averageReach, washDiversity, timeTideMastery };
}

// Reset
export function resetNarrativeTimeTideEngineState(): NarrativeTimeTideEngineState {
  return createNarrativeTimeTideEngineState();
}