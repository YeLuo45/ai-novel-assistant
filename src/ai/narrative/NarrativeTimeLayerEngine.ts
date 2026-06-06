/**
 * V1192 NarrativeTimeLayerEngine — Direction G Iter 4/20 (Round 5)
 * Time layer engine: layers of time
 * Sources: nanobot layer + thunderbolt + ruflo
 */

export type TimeLayerType = 'past' | 'present' | 'future' | 'eternal' | 'cyclical' | 'liminal';
export type TimeLayerDepth = 'surface' | 'shallow' | 'moderate' | 'deep' | 'abyssal';
export type TimeLayerInteraction = 'parallel' | 'interlocking' | 'embedded' | 'mirrored' | 'nested';

export interface TimeLayer {
  layerId: string;
  type: TimeLayerType;
  depth: TimeLayerDepth;
  interaction: TimeLayerInteraction;
  description: string;
  visibility: number;
  reach: number;
  chapter: number;
}

export interface TimeLayerStratum {
  stratumId: string,
  layerIds: string[],
  cumulativeVisibility: number,
  complexity: number,
}

export interface NarrativeTimeLayerEngineState {
  layers: Map<string, TimeLayer>;
  strata: Map<string, TimeLayerStratum>;
  totalLayers: number;
  totalStrata: number;
  averageVisibility: number;
  averageReach: number;
  stratumComplexity: number;
  timeLayerMastery: number;
}

// Factory
export function createNarrativeTimeLayerEngineState(): NarrativeTimeLayerEngineState {
  return {
    layers: new Map(),
    strata: new Map(),
    totalLayers: 0,
    totalStrata: 0,
    averageVisibility: 0.5,
    averageReach: 0.5,
    stratumComplexity: 0.5,
    timeLayerMastery: 0.5,
  };
}

// Add layer
export function addTimeLayer(
  state: NarrativeTimeLayerEngineState,
  layerId: string,
  type: TimeLayerType,
  depth: TimeLayerDepth,
  interaction: TimeLayerInteraction,
  description: string,
  visibility: number,
  reach: number,
  chapter: number
): NarrativeTimeLayerEngineState {
  const layer: TimeLayer = { layerId, type, depth, interaction, description, visibility, reach, chapter };
  const layers = new Map(state.layers).set(layerId, layer);
  return recomputeTimeLayer({ ...state, layers, totalLayers: layers.size });
}

// Add stratum
export function addTimeLayerStratum(
  state: NarrativeTimeLayerEngineState,
  stratumId: string,
  layerIds: string[]
): NarrativeTimeLayerEngineState {
  const layers = layerIds.map(id => state.layers.get(id)).filter((l): l is TimeLayer => l !== undefined);
  const cumulativeVisibility = layers.length === 0 ? 0
    : layers.reduce((s, l) => s + l.visibility, 0) / layers.length;
  const typeSet = new Set(layers.map(l => l.type));
  const complexity = Math.min(1, typeSet.size / 6);
  const stratum: TimeLayerStratum = { stratumId, layerIds, cumulativeVisibility, complexity };
  const strata = new Map(state.strata).set(stratumId, stratum);
  return recomputeTimeLayer({ ...state, strata, totalStrata: strata.size });
}

// Get layers by type
export function getTimeLayersByType(state: NarrativeTimeLayerEngineState, type: TimeLayerType): TimeLayer[] {
  return Array.from(state.layers.values()).filter(l => l.type === type);
}

// Get time layer report
export function getTimeLayerReport(state: NarrativeTimeLayerEngineState): {
  totalLayers: number;
  totalStrata: number;
  averageVisibility: number;
  averageReach: number;
  timeLayerMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalLayers === 0) recommendations.push('No layers — add time layers');
  if (state.averageVisibility < 0.5) recommendations.push('Low visibility — strengthen');
  if (state.timeLayerMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalLayers: state.totalLayers,
    totalStrata: state.totalStrata,
    averageVisibility: Math.round(state.averageVisibility * 100) / 100,
    averageReach: Math.round(state.averageReach * 100) / 100,
    timeLayerMastery: Math.round(state.timeLayerMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeTimeLayer(state: NarrativeTimeLayerEngineState): NarrativeTimeLayerEngineState {
  const layers = Array.from(state.layers.values());
  const averageVisibility = layers.length === 0 ? 0.5
    : layers.reduce((s, l) => s + l.visibility, 0) / layers.length;
  const averageReach = layers.length === 0 ? 0.5
    : layers.reduce((s, l) => s + l.reach, 0) / layers.length;

  const strata = Array.from(state.strata.values());
  const stratumComplexity = strata.length === 0 ? 0.5
    : strata.reduce((s, st) => s + st.complexity, 0) / strata.length;

  const timeLayerMastery = (averageVisibility * 0.4 + averageReach * 0.3 + stratumComplexity * 0.3);

  return { ...state, averageVisibility, averageReach, stratumComplexity, timeLayerMastery };
}

// Reset
export function resetNarrativeTimeLayerEngineState(): NarrativeTimeLayerEngineState {
  return createNarrativeTimeLayerEngineState();
}