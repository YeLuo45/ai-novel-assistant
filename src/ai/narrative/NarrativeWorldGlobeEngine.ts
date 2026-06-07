/**
 * V1310 NarrativeWorldGlobeEngine — Direction J Iter 3/30 (Round 5)
 * World globe engine: spherical view of narrative world
 * Sources: ruflo globe + nanobot + thunderbolt
 */

export type WorldGlobeProjection = 'equirectangular' | 'mercator' | 'robinson' | 'mollweide' | 'globe_3d' | 'holographic' | 'transcendent';
export type WorldGlobeRotation = 'fixed' | 'slow' | 'fast' | 'seasons' | 'cosmic' | 'time_dilating';
export type WorldGlobeIllumination = 'dim' | 'normal' | 'bright' | 'dramatic' | 'luminous' | 'blinding' | 'transcendent';

export interface WorldGlobeEntry {
  entryId: string;
  projection: WorldGlobeProjection;
  rotation: WorldGlobeRotation;
  illumination: WorldGlobeIllumination;
  description: string;
  spherical: number;
  perspective: number;
  chapter: number;
}

export interface WorldGlobeLayer {
  layerId: string,
  entryIds: string[],
  cumulativeSpherical: number,
  holism: number,
}

export interface NarrativeWorldGlobeEngineState {
  entries: Map<string, WorldGlobeEntry>;
  layers: Map<string, WorldGlobeLayer>;
  totalEntries: number;
  totalLayers: number;
  averageSpherical: number;
  averagePerspective: number;
  layerHolism: number;
  worldGlobeMastery: number;
}

// Factory
export function createNarrativeWorldGlobeEngineState(): NarrativeWorldGlobeEngineState {
  return {
    entries: new Map(),
    layers: new Map(),
    totalEntries: 0,
    totalLayers: 0,
    averageSpherical: 0.5,
    averagePerspective: 0.5,
    layerHolism: 0.5,
    worldGlobeMastery: 0.5,
  };
}

// Add entry
export function addWorldGlobeEntry(
  state: NarrativeWorldGlobeEngineState,
  entryId: string,
  projection: WorldGlobeProjection,
  rotation: WorldGlobeRotation,
  illumination: WorldGlobeIllumination,
  description: string,
  spherical: number,
  perspective: number,
  chapter: number
): NarrativeWorldGlobeEngineState {
  const entry: WorldGlobeEntry = { entryId, projection, rotation, illumination, description, spherical, perspective, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeWorldGlobe({ ...state, entries, totalEntries: entries.size });
}

// Add layer
export function addWorldGlobeLayer(
  state: NarrativeWorldGlobeEngineState,
  layerId: string,
  entryIds: string[]
): NarrativeWorldGlobeEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is WorldGlobeEntry => e !== undefined);
  const cumulativeSpherical = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.spherical, 0) / entries.length;
  const projectionSet = new Set(entries.map(e => e.projection));
  const holism = Math.min(1, projectionSet.size / 7);
  const layer: WorldGlobeLayer = { layerId, entryIds, cumulativeSpherical, holism };
  const layers = new Map(state.layers).set(layerId, layer);
  return recomputeWorldGlobe({ ...state, layers, totalLayers: layers.size });
}

// Get entries by projection
export function getWorldGlobeEntriesByProjection(state: NarrativeWorldGlobeEngineState, projection: WorldGlobeProjection): WorldGlobeEntry[] {
  return Array.from(state.entries.values()).filter(e => e.projection === projection);
}

// Get world globe report
export function getWorldGlobeReport(state: NarrativeWorldGlobeEngineState): {
  totalEntries: number;
  totalLayers: number;
  averageSpherical: number;
  averagePerspective: number;
  worldGlobeMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add world globe entries');
  if (state.averageSpherical < 0.5) recommendations.push('Low spherical — strengthen');
  if (state.worldGlobeMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalLayers: state.totalLayers,
    averageSpherical: Math.round(state.averageSpherical * 100) / 100,
    averagePerspective: Math.round(state.averagePerspective * 100) / 100,
    worldGlobeMastery: Math.round(state.worldGlobeMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeWorldGlobe(state: NarrativeWorldGlobeEngineState): NarrativeWorldGlobeEngineState {
  const entries = Array.from(state.entries.values());
  const averageSpherical = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.spherical, 0) / entries.length;
  const averagePerspective = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.perspective, 0) / entries.length;

  const layers = Array.from(state.layers.values());
  const layerHolism = layers.length === 0 ? 0.5
    : layers.reduce((s, l) => s + l.holism, 0) / layers.length;

  const worldGlobeMastery = (averageSpherical * 0.4 + averagePerspective * 0.3 + layerHolism * 0.3);

  return { ...state, averageSpherical, averagePerspective, layerHolism, worldGlobeMastery };
}

// Reset
export function resetNarrativeWorldGlobeEngineState(): NarrativeWorldGlobeEngineState {
  return createNarrativeWorldGlobeEngineState();
}