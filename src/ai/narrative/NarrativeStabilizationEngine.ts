/**
 * V1100 NarrativeStabilizationEngine — Direction D Iter 18/20 (Round 6)
 * Narrative stabilization engine: stabilize narrative
 * Sources: ruflo stabilization + nanobot + thunderbolt
 */

export type StabilizationType = 'structural' | 'tonal' | 'thematic' | 'narrative' | 'voice' | 'temporal';
export type StabilizationStrength = 'fragile' | 'stable' | 'firm' | 'solid' | 'rock_solid';
export type StabilizationScope = 'local' | 'sectional' | 'arc' | 'narrative' | 'meta';

export interface Stabilization {
  stabilizationId: string;
  type: StabilizationType;
  strength: StabilizationStrength;
  scope: StabilizationScope;
  description: string;
  stability: number;
  resilience: number;
  chapter: number;
}

export interface StabilizationLayer {
  layerId: string,
  stabilizationIds: string[],
  cumulativeStability: number,
  depth: number,
}

export interface NarrativeStabilizationEngineState {
  stabilizations: Map<string, Stabilization>;
  layers: Map<string, StabilizationLayer>;
  totalStabilizations: number;
  totalLayers: number;
  averageStability: number;
  averageResilience: number;
  layerDepth: number;
  stabilizationMastery: number;
}

// Factory
export function createNarrativeStabilizationEngineState(): NarrativeStabilizationEngineState {
  return {
    stabilizations: new Map(),
    layers: new Map(),
    totalStabilizations: 0,
    totalLayers: 0,
    averageStability: 0.5,
    averageResilience: 0.5,
    layerDepth: 0.5,
    stabilizationMastery: 0.5,
  };
}

// Add stabilization
export function addStabilization(
  state: NarrativeStabilizationEngineState,
  stabilizationId: string,
  type: StabilizationType,
  strength: StabilizationStrength,
  scope: StabilizationScope,
  description: string,
  stability: number,
  resilience: number,
  chapter: number
): NarrativeStabilizationEngineState {
  const stabilization: Stabilization = { stabilizationId, type, strength, scope, description, stability, resilience, chapter };
  const stabilizations = new Map(state.stabilizations).set(stabilizationId, stabilization);
  return recomputeStabilization({ ...state, stabilizations, totalStabilizations: stabilizations.size });
}

// Add layer
export function addStabilizationLayer(
  state: NarrativeStabilizationEngineState,
  layerId: string,
  stabilizationIds: string[]
): NarrativeStabilizationEngineState {
  const stabilizations = stabilizationIds.map(id => state.stabilizations.get(id)).filter((s): s is Stabilization => s !== undefined);
  const cumulativeStability = stabilizations.length === 0 ? 0
    : stabilizations.reduce((s, st) => s + st.stability, 0) / stabilizations.length;
  const typeSet = new Set(stabilizations.map(s => s.type));
  const depth = Math.min(1, typeSet.size / 6);
  const layer: StabilizationLayer = { layerId, stabilizationIds, cumulativeStability, depth };
  const layers = new Map(state.layers).set(layerId, layer);
  return recomputeStabilization({ ...state, layers, totalLayers: layers.size });
}

// Get stabilizations by type
export function getStabilizationsByType(state: NarrativeStabilizationEngineState, type: StabilizationType): Stabilization[] {
  return Array.from(state.stabilizations.values()).filter(s => s.type === type);
}

// Get stabilization report
export function getStabilizationReport(state: NarrativeStabilizationEngineState): {
  totalStabilizations: number;
  totalLayers: number;
  averageStability: number;
  averageResilience: number;
  stabilizationMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalStabilizations === 0) recommendations.push('No stabilizations — add stabilizations');
  if (state.averageStability < 0.5) recommendations.push('Low stability — improve');
  if (state.stabilizationMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalStabilizations: state.totalStabilizations,
    totalLayers: state.totalLayers,
    averageStability: Math.round(state.averageStability * 100) / 100,
    averageResilience: Math.round(state.averageResilience * 100) / 100,
    stabilizationMastery: Math.round(state.stabilizationMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeStabilization(state: NarrativeStabilizationEngineState): NarrativeStabilizationEngineState {
  const stabilizations = Array.from(state.stabilizations.values());
  const averageStability = stabilizations.length === 0 ? 0.5
    : stabilizations.reduce((s, st) => s + st.stability, 0) / stabilizations.length;
  const averageResilience = stabilizations.length === 0 ? 0.5
    : stabilizations.reduce((s, st) => s + st.resilience, 0) / stabilizations.length;

  const layers = Array.from(state.layers.values());
  const layerDepth = layers.length === 0 ? 0.5
    : layers.reduce((s, l) => s + l.depth, 0) / layers.length;

  const stabilizationMastery = (averageStability * 0.4 + averageResilience * 0.3 + layerDepth * 0.3);

  return { ...state, averageStability, averageResilience, layerDepth, stabilizationMastery };
}

// Reset
export function resetNarrativeStabilizationEngineState(): NarrativeStabilizationEngineState {
  return createNarrativeStabilizationEngineState();
}