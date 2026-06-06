/**
 * V1128 NarrativeTransportationEngine — Direction E Iter 12/20 (Round 5)
 * Transportation engine: reader's transportation into narrative world
 * Sources: nanobot transportation + thunderbolt + ruflo
 */

export type TransportationMode = 'spatial' | 'temporal' | 'emotional' | 'cognitive' | 'social' | 'imaginal';
export type TransportationDistance = 'near' | 'moderate' | 'far' | 'very_far' | 'infinite';
export type TransportationFidelity = 'rough' | 'approximate' | 'accurate' | 'vivid' | 'seamless';

export interface Transportation {
  transportationId: string;
  mode: TransportationMode;
  distance: TransportationDistance;
  fidelity: TransportationFidelity;
  description: string;
  journey: number;
  presence: number;
  chapter: number;
}

export interface TransportationLayer {
  layerId: string,
  transportationIds: string[],
  cumulativeJourney: number,
  depth: number,
}

export interface NarrativeTransportationEngineState {
  transportations: Map<string, Transportation>;
  layers: Map<string, TransportationLayer>;
  totalTransportations: number;
  totalLayers: number;
  averageJourney: number;
  averagePresence: number;
  layerDepth: number;
  transportationMastery: number;
}

// Factory
export function createNarrativeTransportationEngineState(): NarrativeTransportationEngineState {
  return {
    transportations: new Map(),
    layers: new Map(),
    totalTransportations: 0,
    totalLayers: 0,
    averageJourney: 0.5,
    averagePresence: 0.5,
    layerDepth: 0.5,
    transportationMastery: 0.5,
  };
}

// Add transportation
export function addTransportation(
  state: NarrativeTransportationEngineState,
  transportationId: string,
  mode: TransportationMode,
  distance: TransportationDistance,
  fidelity: TransportationFidelity,
  description: string,
  journey: number,
  presence: number,
  chapter: number
): NarrativeTransportationEngineState {
  const transportation: Transportation = { transportationId, mode, distance, fidelity, description, journey, presence, chapter };
  const transportations = new Map(state.transportations).set(transportationId, transportation);
  return recomputeTransportation({ ...state, transportations, totalTransportations: transportations.size });
}

// Add layer
export function addTransportationLayer(
  state: NarrativeTransportationEngineState,
  layerId: string,
  transportationIds: string[]
): NarrativeTransportationEngineState {
  const transportations = transportationIds.map(id => state.transportations.get(id)).filter((t): t is Transportation => t !== undefined);
  const cumulativeJourney = transportations.length === 0 ? 0
    : transportations.reduce((s, t) => s + t.journey, 0) / transportations.length;
  const modeSet = new Set(transportations.map(t => t.mode));
  const depth = Math.min(1, modeSet.size / 6);
  const layer: TransportationLayer = { layerId, transportationIds, cumulativeJourney, depth };
  const layers = new Map(state.layers).set(layerId, layer);
  return recomputeTransportation({ ...state, layers, totalLayers: layers.size });
}

// Get transportations by mode
export function getTransportationsByMode(state: NarrativeTransportationEngineState, mode: TransportationMode): Transportation[] {
  return Array.from(state.transportations.values()).filter(t => t.mode === mode);
}

// Get transportation report
export function getTransportationReport(state: NarrativeTransportationEngineState): {
  totalTransportations: number;
  totalLayers: number;
  averageJourney: number;
  averagePresence: number;
  transportationMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalTransportations === 0) recommendations.push('No transportations — add transportations');
  if (state.averageJourney < 0.5) recommendations.push('Low journey — strengthen');
  if (state.transportationMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalTransportations: state.totalTransportations,
    totalLayers: state.totalLayers,
    averageJourney: Math.round(state.averageJourney * 100) / 100,
    averagePresence: Math.round(state.averagePresence * 100) / 100,
    transportationMastery: Math.round(state.transportationMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeTransportation(state: NarrativeTransportationEngineState): NarrativeTransportationEngineState {
  const transportations = Array.from(state.transportations.values());
  const averageJourney = transportations.length === 0 ? 0.5
    : transportations.reduce((s, t) => s + t.journey, 0) / transportations.length;
  const averagePresence = transportations.length === 0 ? 0.5
    : transportations.reduce((s, t) => s + t.presence, 0) / transportations.length;

  const layers = Array.from(state.layers.values());
  const layerDepth = layers.length === 0 ? 0.5
    : layers.reduce((s, l) => s + l.depth, 0) / layers.length;

  const transportationMastery = (averageJourney * 0.4 + averagePresence * 0.3 + layerDepth * 0.3);

  return { ...state, averageJourney, averagePresence, layerDepth, transportationMastery };
}

// Reset
export function resetNarrativeTransportationEngineState(): NarrativeTransportationEngineState {
  return createNarrativeTransportationEngineState();
}