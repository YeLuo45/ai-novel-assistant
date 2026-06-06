/**
 * V1216 NarrativeTimeInertiaEngine — Direction G Iter 16/20 (Round 5)
 * Time inertia engine: inertia in time
 * Sources: ruflo inertia + nanobot + thunderbolt
 */

export type TimeInertiaType = 'static' | 'kinetic' | 'rotational' | 'angular' | 'translational' | 'combined';
export type TimeInertiaMass = 'light' | 'moderate' | 'heavy' | 'massive' | 'immovable';
export type TimeInertiaResistance = 'minimal' | 'moderate' | 'significant' | 'extreme' | 'absolute';

export interface TimeInertia {
  inertiaId: string;
  type: TimeInertiaType;
  mass: TimeInertiaMass;
  resistance: TimeInertiaResistance;
  description: string;
  momentum: number;
  stability: number;
  chapter: number;
}

export interface TimeInertiaPool {
  poolId: string,
  inertiaIds: string[],
  cumulativeMomentum: number,
  depth: number,
}

export interface NarrativeTimeInertiaEngineState {
  inertias: Map<string, TimeInertia>;
  pools: Map<string, TimeInertiaPool>;
  totalInertias: number;
  totalPools: number;
  averageMomentum: number;
  averageStability: number;
  poolDepth: number;
  timeInertiaMastery: number;
}

// Factory
export function createNarrativeTimeInertiaEngineState(): NarrativeTimeInertiaEngineState {
  return {
    inertias: new Map(),
    pools: new Map(),
    totalInertias: 0,
    totalPools: 0,
    averageMomentum: 0.5,
    averageStability: 0.5,
    poolDepth: 0.5,
    timeInertiaMastery: 0.5,
  };
}

// Add inertia
export function addTimeInertia(
  state: NarrativeTimeInertiaEngineState,
  inertiaId: string,
  type: TimeInertiaType,
  mass: TimeInertiaMass,
  resistance: TimeInertiaResistance,
  description: string,
  momentum: number,
  stability: number,
  chapter: number
): NarrativeTimeInertiaEngineState {
  const inertia: TimeInertia = { inertiaId, type, mass, resistance, description, momentum, stability, chapter };
  const inertias = new Map(state.inertias).set(inertiaId, inertia);
  return recomputeTimeInertia({ ...state, inertias, totalInertias: inertias.size });
}

// Add pool
export function addTimeInertiaPool(
  state: NarrativeTimeInertiaEngineState,
  poolId: string,
  inertiaIds: string[]
): NarrativeTimeInertiaEngineState {
  const inertias = inertiaIds.map(id => state.inertias.get(id)).filter((i): i is TimeInertia => i !== undefined);
  const cumulativeMomentum = inertias.length === 0 ? 0
    : inertias.reduce((s, i) => s + i.momentum, 0) / inertias.length;
  const typeSet = new Set(inertias.map(i => i.type));
  const depth = Math.min(1, typeSet.size / 6);
  const pool: TimeInertiaPool = { poolId, inertiaIds, cumulativeMomentum, depth };
  const pools = new Map(state.pools).set(poolId, pool);
  return recomputeTimeInertia({ ...state, pools, totalPools: pools.size });
}

// Get inertias by type
export function getTimeInertiasByType(state: NarrativeTimeInertiaEngineState, type: TimeInertiaType): TimeInertia[] {
  return Array.from(state.inertias.values()).filter(i => i.type === type);
}

// Get time inertia report
export function getTimeInertiaReport(state: NarrativeTimeInertiaEngineState): {
  totalInertias: number;
  totalPools: number;
  averageMomentum: number;
  averageStability: number;
  timeInertiaMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalInertias === 0) recommendations.push('No inertias — add time inertias');
  if (state.averageMomentum < 0.5) recommendations.push('Low momentum — strengthen');
  if (state.timeInertiaMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalInertias: state.totalInertias,
    totalPools: state.totalPools,
    averageMomentum: Math.round(state.averageMomentum * 100) / 100,
    averageStability: Math.round(state.averageStability * 100) / 100,
    timeInertiaMastery: Math.round(state.timeInertiaMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeTimeInertia(state: NarrativeTimeInertiaEngineState): NarrativeTimeInertiaEngineState {
  const inertias = Array.from(state.inertias.values());
  const averageMomentum = inertias.length === 0 ? 0.5
    : inertias.reduce((s, i) => s + i.momentum, 0) / inertias.length;
  const averageStability = inertias.length === 0 ? 0.5
    : inertias.reduce((s, i) => s + i.stability, 0) / inertias.length;

  const pools = Array.from(state.pools.values());
  const poolDepth = pools.length === 0 ? 0.5
    : pools.reduce((s, p) => s + p.depth, 0) / pools.length;

  const timeInertiaMastery = (averageMomentum * 0.4 + averageStability * 0.3 + poolDepth * 0.3);

  return { ...state, averageMomentum, averageStability, poolDepth, timeInertiaMastery };
}

// Reset
export function resetNarrativeTimeInertiaEngineState(): NarrativeTimeInertiaEngineState {
  return createNarrativeTimeInertiaEngineState();
}