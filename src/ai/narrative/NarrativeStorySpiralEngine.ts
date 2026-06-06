/**
 * V1284 NarrativeStorySpiralEngine — Direction I Iter 10/20 (Round 5)
 * Story spiral engine: spiral structure of story
 * Sources: nanobot spiral + thunderbolt + ruflo
 */

export type StorySpiralDirection = 'ascending' | 'descending' | 'oscillating' | 'tornado' | 'galactic';
export type StorySpiralTightness = 'loose' | 'moderate' | 'tight' | 'tightest' | 'infinitesimal';
export type StorySpiralMotion = 'centripetal' | 'centrifugal' | 'orbital' | 'parabolic' | 'hyperbolic';

export interface StorySpiralNode {
  spiralId: string;
  direction: StorySpiralDirection;
  tightness: StorySpiralTightness;
  motion: StorySpiralMotion;
  description: string;
  rotation: number;
  rise: number;
  chapter: number;
}

export interface StorySpiralLoop {
  loopId: string,
  spiralIds: string[],
  cumulativeRotation: number,
  revolution: number,
}

export interface NarrativeStorySpiralEngineState {
  spirals: Map<string, StorySpiralNode>;
  loops: Map<string, StorySpiralLoop>;
  totalSpirals: number;
  totalLoops: number;
  averageRotation: number;
  averageRise: number;
  loopRevolution: number;
  storySpiralMastery: number;
}

// Factory
export function createNarrativeStorySpiralEngineState(): NarrativeStorySpiralEngineState {
  return {
    spirals: new Map(),
    loops: new Map(),
    totalSpirals: 0,
    totalLoops: 0,
    averageRotation: 0.5,
    averageRise: 0.5,
    loopRevolution: 0.5,
    storySpiralMastery: 0.5,
  };
}

// Add spiral
export function addStorySpiralNode(
  state: NarrativeStorySpiralEngineState,
  spiralId: string,
  direction: StorySpiralDirection,
  tightness: StorySpiralTightness,
  motion: StorySpiralMotion,
  description: string,
  rotation: number,
  rise: number,
  chapter: number
): NarrativeStorySpiralEngineState {
  const spiral: StorySpiralNode = { spiralId, direction, tightness, motion, description, rotation, rise, chapter };
  const spirals = new Map(state.spirals).set(spiralId, spiral);
  return recomputeStorySpiral({ ...state, spirals, totalSpirals: spirals.size });
}

// Add loop
export function addStorySpiralLoop(
  state: NarrativeStorySpiralEngineState,
  loopId: string,
  spiralIds: string[]
): NarrativeStorySpiralEngineState {
  const spirals = spiralIds.map(id => state.spirals.get(id)).filter((s): s is StorySpiralNode => s !== undefined);
  const cumulativeRotation = spirals.length === 0 ? 0
    : spirals.reduce((s, sp) => s + sp.rotation, 0) / spirals.length;
  const dirSet = new Set(spirals.map(s => s.direction));
  const revolution = Math.min(1, dirSet.size / 6);
  const loop: StorySpiralLoop = { loopId, spiralIds, cumulativeRotation, revolution };
  const loops = new Map(state.loops).set(loopId, loop);
  return recomputeStorySpiral({ ...state, loops, totalLoops: loops.size });
}

// Get spirals by direction
export function getStorySpiralNodesByDirection(state: NarrativeStorySpiralEngineState, direction: StorySpiralDirection): StorySpiralNode[] {
  return Array.from(state.spirals.values()).filter(s => s.direction === direction);
}

// Get story spiral report
export function getStorySpiralReport(state: NarrativeStorySpiralEngineState): {
  totalSpirals: number;
  totalLoops: number;
  averageRotation: number;
  averageRise: number;
  storySpiralMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalSpirals === 0) recommendations.push('No spirals — add story spiral nodes');
  if (state.averageRotation < 0.5) recommendations.push('Low rotation — strengthen');
  if (state.storySpiralMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalSpirals: state.totalSpirals,
    totalLoops: state.totalLoops,
    averageRotation: Math.round(state.averageRotation * 100) / 100,
    averageRise: Math.round(state.averageRise * 100) / 100,
    storySpiralMastery: Math.round(state.storySpiralMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeStorySpiral(state: NarrativeStorySpiralEngineState): NarrativeStorySpiralEngineState {
  const spirals = Array.from(state.spirals.values());
  const averageRotation = spirals.length === 0 ? 0.5
    : spirals.reduce((s, sp) => s + sp.rotation, 0) / spirals.length;
  const averageRise = spirals.length === 0 ? 0.5
    : spirals.reduce((s, sp) => s + sp.rise, 0) / spirals.length;

  const loops = Array.from(state.loops.values());
  const loopRevolution = loops.length === 0 ? 0.5
    : loops.reduce((s, l) => s + l.revolution, 0) / loops.length;

  const storySpiralMastery = (averageRotation * 0.4 + averageRise * 0.3 + loopRevolution * 0.3);

  return { ...state, averageRotation, averageRise, loopRevolution, storySpiralMastery };
}

// Reset
export function resetNarrativeStorySpiralEngineState(): NarrativeStorySpiralEngineState {
  return createNarrativeStorySpiralEngineState();
}