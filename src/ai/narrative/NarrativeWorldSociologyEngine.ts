/**
 * V1346 NarrativeWorldSociologyEngine — Direction J Iter 21/30 (Round 5)
 * World sociology engine: sociology of narrative world
 * Sources: nanobot sociology + thunderbolt + ruflo
 */

export type WorldSociologyStructure = 'tribal' | 'feudal' | 'modern' | 'post_modern' | 'magical' | 'cosmic' | 'transcendent';
export type WorldSociologyMobility = 'rigid' | 'limited' | 'moderate' | 'fluid' | 'transformative' | 'infinite' | 'transcendent';
export type WorldSociologyCohesion = 'fragmented' | 'loose' | 'moderate' | 'strong' | 'unbreakable' | 'transcendent' | 'absolute';

export interface WorldSociologyEntry {
  entryId: string;
  structure: WorldSociologyStructure;
  mobility: WorldSociologyMobility;
  cohesion: WorldSociologyCohesion;
  description: string;
  complexity: number;
  equity: number;
  chapter: number;
}

export interface WorldSociologyLayer {
  layerId: string,
  entryIds: string[],
  cumulativeComplexity: number,
  breadth: number,
}

export interface NarrativeWorldSociologyEngineState {
  entries: Map<string, WorldSociologyEntry>;
  layers: Map<string, WorldSociologyLayer>;
  totalEntries: number;
  totalLayers: number;
  averageComplexity: number;
  averageEquity: number;
  layerBreadth: number;
  worldSociologyMastery: number;
}

// Factory
export function createNarrativeWorldSociologyEngineState(): NarrativeWorldSociologyEngineState {
  return {
    entries: new Map(),
    layers: new Map(),
    totalEntries: 0,
    totalLayers: 0,
    averageComplexity: 0.5,
    averageEquity: 0.5,
    layerBreadth: 0.5,
    worldSociologyMastery: 0.5,
  };
}

// Add entry
export function addWorldSociologyEntry(
  state: NarrativeWorldSociologyEngineState,
  entryId: string,
  structure: WorldSociologyStructure,
  mobility: WorldSociologyMobility,
  cohesion: WorldSociologyCohesion,
  description: string,
  complexity: number,
  equity: number,
  chapter: number
): NarrativeWorldSociologyEngineState {
  const entry: WorldSociologyEntry = { entryId, structure, mobility, cohesion, description, complexity, equity, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeWorldSociology({ ...state, entries, totalEntries: entries.size });
}

// Add layer
export function addWorldSociologyLayer(
  state: NarrativeWorldSociologyEngineState,
  layerId: string,
  entryIds: string[]
): NarrativeWorldSociologyEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is WorldSociologyEntry => e !== undefined);
  const cumulativeComplexity = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.complexity, 0) / entries.length;
  const structureSet = new Set(entries.map(e => e.structure));
  const breadth = Math.min(1, structureSet.size / 7);
  const layer: WorldSociologyLayer = { layerId, entryIds, cumulativeComplexity, breadth };
  const layers = new Map(state.layers).set(layerId, layer);
  return recomputeWorldSociology({ ...state, layers, totalLayers: layers.size });
}

// Get entries by structure
export function getWorldSociologyEntriesByStructure(state: NarrativeWorldSociologyEngineState, structure: WorldSociologyStructure): WorldSociologyEntry[] {
  return Array.from(state.entries.values()).filter(e => e.structure === structure);
}

// Get world sociology report
export function getWorldSociologyReport(state: NarrativeWorldSociologyEngineState): {
  totalEntries: number;
  totalLayers: number;
  averageComplexity: number;
  averageEquity: number;
  worldSociologyMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add world sociology entries');
  if (state.averageComplexity < 0.5) recommendations.push('Low complexity — strengthen');
  if (state.worldSociologyMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalLayers: state.totalLayers,
    averageComplexity: Math.round(state.averageComplexity * 100) / 100,
    averageEquity: Math.round(state.averageEquity * 100) / 100,
    worldSociologyMastery: Math.round(state.worldSociologyMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeWorldSociology(state: NarrativeWorldSociologyEngineState): NarrativeWorldSociologyEngineState {
  const entries = Array.from(state.entries.values());
  const averageComplexity = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.complexity, 0) / entries.length;
  const averageEquity = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.equity, 0) / entries.length;

  const layers = Array.from(state.layers.values());
  const layerBreadth = layers.length === 0 ? 0.5
    : layers.reduce((s, l) => s + l.breadth, 0) / layers.length;

  const worldSociologyMastery = (averageComplexity * 0.4 + averageEquity * 0.3 + layerBreadth * 0.3);

  return { ...state, averageComplexity, averageEquity, layerBreadth, worldSociologyMastery };
}

// Reset
export function resetNarrativeWorldSociologyEngineState(): NarrativeWorldSociologyEngineState {
  return createNarrativeWorldSociologyEngineState();
}