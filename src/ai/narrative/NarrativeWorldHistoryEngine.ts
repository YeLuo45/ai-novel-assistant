/**
 * V1352 NarrativeWorldHistoryEngine — Direction J Iter 24/30 (Round 5)
 * World history engine: history of narrative world
 * Sources: nanobot history + thunderbolt + ruflo
 */

export type WorldHistoryEra = 'creation' | 'ancient' | 'classical' | 'medieval' | 'modern' | 'future' | 'transcendent';
export type WorldHistoryEvent = 'founding' | 'war' | 'discovery' | 'revolution' | 'transformation' | 'apocalypse' | 'transcendent';
export type WorldHistoryLegacy = 'forgotten' | 'remembered' | 'celebrated' | 'revered' | 'mythologized' | 'transcendent' | 'absolute';

export interface WorldHistoryEntry {
  entryId: string;
  era: WorldHistoryEra;
  event: WorldHistoryEvent;
  legacy: WorldHistoryLegacy;
  description: string;
  significance: number;
  reach: number;
  chapter: number;
}

export interface WorldHistoryLayer {
  layerId: string,
  entryIds: string[],
  cumulativeSignificance: number,
  depth: number,
}

export interface NarrativeWorldHistoryEngineState {
  entries: Map<string, WorldHistoryEntry>;
  layers: Map<string, WorldHistoryLayer>;
  totalEntries: number;
  totalLayers: number;
  averageSignificance: number;
  averageReach: number;
  layerDepth: number;
  worldHistoryMastery: number;
}

// Factory
export function createNarrativeWorldHistoryEngineState(): NarrativeWorldHistoryEngineState {
  return {
    entries: new Map(),
    layers: new Map(),
    totalEntries: 0,
    totalLayers: 0,
    averageSignificance: 0.5,
    averageReach: 0.5,
    layerDepth: 0.5,
    worldHistoryMastery: 0.5,
  };
}

// Add entry
export function addWorldHistoryEntry(
  state: NarrativeWorldHistoryEngineState,
  entryId: string,
  era: WorldHistoryEra,
  event: WorldHistoryEvent,
  legacy: WorldHistoryLegacy,
  description: string,
  significance: number,
  reach: number,
  chapter: number
): NarrativeWorldHistoryEngineState {
  const entry: WorldHistoryEntry = { entryId, era, event, legacy, description, significance, reach, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeWorldHistory({ ...state, entries, totalEntries: entries.size });
}

// Add layer
export function addWorldHistoryLayer(
  state: NarrativeWorldHistoryEngineState,
  layerId: string,
  entryIds: string[]
): NarrativeWorldHistoryEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is WorldHistoryEntry => e !== undefined);
  const cumulativeSignificance = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.significance, 0) / entries.length;
  const eraSet = new Set(entries.map(e => e.era));
  const depth = Math.min(1, eraSet.size / 7);
  const layer: WorldHistoryLayer = { layerId, entryIds, cumulativeSignificance, depth };
  const layers = new Map(state.layers).set(layerId, layer);
  return recomputeWorldHistory({ ...state, layers, totalLayers: layers.size });
}

// Get entries by era
export function getWorldHistoryEntriesByEra(state: NarrativeWorldHistoryEngineState, era: WorldHistoryEra): WorldHistoryEntry[] {
  return Array.from(state.entries.values()).filter(e => e.era === era);
}

// Get world history report
export function getWorldHistoryReport(state: NarrativeWorldHistoryEngineState): {
  totalEntries: number;
  totalLayers: number;
  averageSignificance: number;
  averageReach: number;
  worldHistoryMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add world history entries');
  if (state.averageSignificance < 0.5) recommendations.push('Low significance — strengthen');
  if (state.worldHistoryMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalLayers: state.totalLayers,
    averageSignificance: Math.round(state.averageSignificance * 100) / 100,
    averageReach: Math.round(state.averageReach * 100) / 100,
    worldHistoryMastery: Math.round(state.worldHistoryMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeWorldHistory(state: NarrativeWorldHistoryEngineState): NarrativeWorldHistoryEngineState {
  const entries = Array.from(state.entries.values());
  const averageSignificance = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.significance, 0) / entries.length;
  const averageReach = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.reach, 0) / entries.length;

  const layers = Array.from(state.layers.values());
  const layerDepth = layers.length === 0 ? 0.5
    : layers.reduce((s, l) => s + l.depth, 0) / layers.length;

  const worldHistoryMastery = (averageSignificance * 0.4 + averageReach * 0.3 + layerDepth * 0.3);

  return { ...state, averageSignificance, averageReach, layerDepth, worldHistoryMastery };
}

// Reset
export function resetNarrativeWorldHistoryEngineState(): NarrativeWorldHistoryEngineState {
  return createNarrativeWorldHistoryEngineState();
}