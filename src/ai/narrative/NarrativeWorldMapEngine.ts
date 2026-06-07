/**
 * V1308 NarrativeWorldMapEngine — Direction J Iter 2/30 (Round 5)
 * World map engine: maps of narrative world
 * Sources: thunderbolt map + nanobot + ruflo
 */

export type WorldMapType = 'political' | 'physical' | 'thematic' | 'historical' | 'cultural' | 'mystical' | 'transcendent';
export type WorldMapScale = 'room' | 'building' | 'city' | 'region' | 'continent' | 'world' | 'cosmic';
export type WorldMapAccuracy = 'approximate' | 'good' | 'precise' | 'exact' | 'perfect';

export interface WorldMapEntry {
  entryId: string;
  type: WorldMapType;
  scale: WorldMapScale;
  accuracy: WorldMapAccuracy;
  description: string;
  precision: number;
  usefulness: number;
  chapter: number;
}

export interface WorldMapLayer {
  layerId: string,
  entryIds: string[],
  cumulativePrecision: number,
  coverage: number,
}

export interface NarrativeWorldMapEngineState {
  entries: Map<string, WorldMapEntry>;
  layers: Map<string, WorldMapLayer>;
  totalEntries: number;
  totalLayers: number;
  averagePrecision: number;
  averageUsefulness: number;
  layerCoverage: number;
  worldMapMastery: number;
}

// Factory
export function createNarrativeWorldMapEngineState(): NarrativeWorldMapEngineState {
  return {
    entries: new Map(),
    layers: new Map(),
    totalEntries: 0,
    totalLayers: 0,
    averagePrecision: 0.5,
    averageUsefulness: 0.5,
    layerCoverage: 0.5,
    worldMapMastery: 0.5,
  };
}

// Add entry
export function addWorldMapEntry(
  state: NarrativeWorldMapEngineState,
  entryId: string,
  type: WorldMapType,
  scale: WorldMapScale,
  accuracy: WorldMapAccuracy,
  description: string,
  precision: number,
  usefulness: number,
  chapter: number
): NarrativeWorldMapEngineState {
  const entry: WorldMapEntry = { entryId, type, scale, accuracy, description, precision, usefulness, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeWorldMap({ ...state, entries, totalEntries: entries.size });
}

// Add layer
export function addWorldMapLayer(
  state: NarrativeWorldMapEngineState,
  layerId: string,
  entryIds: string[]
): NarrativeWorldMapEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is WorldMapEntry => e !== undefined);
  const cumulativePrecision = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.precision, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const coverage = Math.min(1, typeSet.size / 7);
  const layer: WorldMapLayer = { layerId, entryIds, cumulativePrecision, coverage };
  const layers = new Map(state.layers).set(layerId, layer);
  return recomputeWorldMap({ ...state, layers, totalLayers: layers.size });
}

// Get entries by type
export function getWorldMapEntriesByType(state: NarrativeWorldMapEngineState, type: WorldMapType): WorldMapEntry[] {
  return Array.from(state.entries.values()).filter(e => e.type === type);
}

// Get world map report
export function getWorldMapReport(state: NarrativeWorldMapEngineState): {
  totalEntries: number;
  totalLayers: number;
  averagePrecision: number;
  averageUsefulness: number;
  worldMapMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add world map entries');
  if (state.averagePrecision < 0.5) recommendations.push('Low precision — strengthen');
  if (state.worldMapMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalLayers: state.totalLayers,
    averagePrecision: Math.round(state.averagePrecision * 100) / 100,
    averageUsefulness: Math.round(state.averageUsefulness * 100) / 100,
    worldMapMastery: Math.round(state.worldMapMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeWorldMap(state: NarrativeWorldMapEngineState): NarrativeWorldMapEngineState {
  const entries = Array.from(state.entries.values());
  const averagePrecision = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.precision, 0) / entries.length;
  const averageUsefulness = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.usefulness, 0) / entries.length;

  const layers = Array.from(state.layers.values());
  const layerCoverage = layers.length === 0 ? 0.5
    : layers.reduce((s, l) => s + l.coverage, 0) / layers.length;

  const worldMapMastery = (averagePrecision * 0.4 + averageUsefulness * 0.3 + layerCoverage * 0.3);

  return { ...state, averagePrecision, averageUsefulness, layerCoverage, worldMapMastery };
}

// Reset
export function resetNarrativeWorldMapEngineState(): NarrativeWorldMapEngineState {
  return createNarrativeWorldMapEngineState();
}