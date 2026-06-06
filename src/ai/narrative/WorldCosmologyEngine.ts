/**
 * V1034 WorldCosmologyEngine — Direction C Iter 5/20 (Round 5)
 * World cosmology engine: cosmological framework of the world
 * Sources: ruflo cosmology + nanobot + thunderbolt
 */

export type CosmologyModel = 'geocentric' | 'heliocentric' | 'multiverse' | 'cyclic' | 'flat' | 'mystical';
export type CosmologyPrinciple = 'order' | 'chaos' | 'balance' | 'duality' | 'unity' | 'transcendence';
export type CosmologyScope = 'planetary' | 'solar' | 'galactic' | 'universal' | 'multiversal' | 'metaphysical';

export interface CosmologyElement {
  elementId: string;
  model: CosmologyModel;
  principle: CosmologyPrinciple;
  scope: CosmologyScope;
  description: string;
  consistency: number;
  grandeur: number;
  era: number;
}

export interface CosmologyLayer {
  layerId: string,
  elementIds: string[],
  coherence: number,
  depth: number,
}

export interface WorldCosmologyEngineState {
  elements: Map<string, CosmologyElement>;
  layers: Map<string, CosmologyLayer>;
  totalElements: number;
  totalLayers: number;
  averageConsistency: number;
  averageGrandeur: number;
  layerCoherence: number;
  cosmologyMastery: number;
}

// Factory
export function createWorldCosmologyEngineState(): WorldCosmologyEngineState {
  return {
    elements: new Map(),
    layers: new Map(),
    totalElements: 0,
    totalLayers: 0,
    averageConsistency: 0.5,
    averageGrandeur: 0.5,
    layerCoherence: 0.5,
    cosmologyMastery: 0.5,
  };
}

// Add element
export function addCosmologyElement(
  state: WorldCosmologyEngineState,
  elementId: string,
  model: CosmologyModel,
  principle: CosmologyPrinciple,
  scope: CosmologyScope,
  description: string,
  consistency: number,
  grandeur: number,
  era: number
): WorldCosmologyEngineState {
  const element: CosmologyElement = { elementId, model, principle, scope, description, consistency, grandeur, era };
  const elements = new Map(state.elements).set(elementId, element);
  return recomputeCosmology({ ...state, elements, totalElements: elements.size });
}

// Add layer
export function addCosmologyLayer(
  state: WorldCosmologyEngineState,
  layerId: string,
  elementIds: string[]
): WorldCosmologyEngineState {
  const elements = elementIds.map(id => state.elements.get(id)).filter((e): e is CosmologyElement => e !== undefined);
  const depth = elements.length === 0 ? 0
    : elements.reduce((s, e) => s + e.grandeur, 0) / elements.length;
  const coherence = elements.length < 2 ? 0.5
    : 1 - Math.abs(elements[0].consistency - elements[elements.length - 1].consistency);
  const layer: CosmologyLayer = { layerId, elementIds, coherence, depth };
  const layers = new Map(state.layers).set(layerId, layer);
  return recomputeCosmology({ ...state, layers, totalLayers: layers.size });
}

// Get elements by model
export function getElementsByModel(state: WorldCosmologyEngineState, model: CosmologyModel): CosmologyElement[] {
  return Array.from(state.elements.values()).filter(e => e.model === model);
}

// Get cosmology report
export function getCosmologyReport(state: WorldCosmologyEngineState): {
  totalElements: number;
  totalLayers: number;
  averageConsistency: number;
  averageGrandeur: number;
  cosmologyMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalElements === 0) recommendations.push('No elements — add cosmology elements');
  if (state.averageConsistency < 0.5) recommendations.push('Low consistency — strengthen');
  if (state.cosmologyMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalElements: state.totalElements,
    totalLayers: state.totalLayers,
    averageConsistency: Math.round(state.averageConsistency * 100) / 100,
    averageGrandeur: Math.round(state.averageGrandeur * 100) / 100,
    cosmologyMastery: Math.round(state.cosmologyMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeCosmology(state: WorldCosmologyEngineState): WorldCosmologyEngineState {
  const elements = Array.from(state.elements.values());
  const averageConsistency = elements.length === 0 ? 0.5
    : elements.reduce((s, e) => s + e.consistency, 0) / elements.length;
  const averageGrandeur = elements.length === 0 ? 0.5
    : elements.reduce((s, e) => s + e.grandeur, 0) / elements.length;

  const layers = Array.from(state.layers.values());
  const layerCoherence = layers.length === 0 ? 0.5
    : layers.reduce((s, l) => s + l.coherence, 0) / layers.length;

  const cosmologyMastery = (averageConsistency * 0.4 + averageGrandeur * 0.3 + layerCoherence * 0.3);

  return { ...state, averageConsistency, averageGrandeur, layerCoherence, cosmologyMastery };
}

// Reset
export function resetWorldCosmologyEngineState(): WorldCosmologyEngineState {
  return createWorldCosmologyEngineState();
}