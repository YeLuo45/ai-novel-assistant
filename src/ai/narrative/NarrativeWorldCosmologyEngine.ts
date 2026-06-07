/**
 * V1334 NarrativeWorldCosmologyEngine — Direction J Iter 15/30 (Round 5)
 * World cosmology engine: cosmology of narrative world
 * Sources: ruflo cosmology + nanobot + thunderbolt
 */

export type WorldCosmologyOrigin = 'creation' | 'emergence' | 'eternal' | 'cyclical' | 'quantum' | 'dream' | 'transcendent';
export type WorldCosmologyStructure = 'flat' | 'spherical' | 'toroidal' | 'fractal' | 'infinite' | 'meta' | 'transcendent';
export type WorldCosmologyDestiny = 'entropy' | 'collapse' | 'renewal' | 'transformation' | 'eternal_return' | 'transcendence' | 'transcendent';

export interface WorldCosmologyEntry {
  entryId: string;
  origin: WorldCosmologyOrigin;
  structure: WorldCosmologyStructure;
  destiny: WorldCosmologyDestiny;
  description: string;
  scale: number;
  mystery: number;
  chapter: number;
}

export interface WorldCosmologyModel {
  modelId: string,
  entryIds: string[],
  cumulativeScale: number,
  coherence: number,
}

export interface NarrativeWorldCosmologyEngineState {
  entries: Map<string, WorldCosmologyEntry>;
  models: Map<string, WorldCosmologyModel>;
  totalEntries: number;
  totalModels: number;
  averageScale: number;
  averageMystery: number;
  modelCoherence: number;
  worldCosmologyMastery: number;
}

// Factory
export function createNarrativeWorldCosmologyEngineState(): NarrativeWorldCosmologyEngineState {
  return {
    entries: new Map(),
    models: new Map(),
    totalEntries: 0,
    totalModels: 0,
    averageScale: 0.5,
    averageMystery: 0.5,
    modelCoherence: 0.5,
    worldCosmologyMastery: 0.5,
  };
}

// Add entry
export function addWorldCosmologyEntry(
  state: NarrativeWorldCosmologyEngineState,
  entryId: string,
  origin: WorldCosmologyOrigin,
  structure: WorldCosmologyStructure,
  destiny: WorldCosmologyDestiny,
  description: string,
  scale: number,
  mystery: number,
  chapter: number
): NarrativeWorldCosmologyEngineState {
  const entry: WorldCosmologyEntry = { entryId, origin, structure, destiny, description, scale, mystery, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeWorldCosmology({ ...state, entries, totalEntries: entries.size });
}

// Add model
export function addWorldCosmologyModel(
  state: NarrativeWorldCosmologyEngineState,
  modelId: string,
  entryIds: string[]
): NarrativeWorldCosmologyEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is WorldCosmologyEntry => e !== undefined);
  const cumulativeScale = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.scale, 0) / entries.length;
  const originSet = new Set(entries.map(e => e.origin));
  const coherence = Math.min(1, originSet.size / 7);
  const model: WorldCosmologyModel = { modelId, entryIds, cumulativeScale, coherence };
  const models = new Map(state.models).set(modelId, model);
  return recomputeWorldCosmology({ ...state, models, totalModels: models.size });
}

// Get entries by origin
export function getWorldCosmologyEntriesByOrigin(state: NarrativeWorldCosmologyEngineState, origin: WorldCosmologyOrigin): WorldCosmologyEntry[] {
  return Array.from(state.entries.values()).filter(e => e.origin === origin);
}

// Get world cosmology report
export function getWorldCosmologyReport(state: NarrativeWorldCosmologyEngineState): {
  totalEntries: number;
  totalModels: number;
  averageScale: number;
  averageMystery: number;
  worldCosmologyMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add world cosmology entries');
  if (state.averageScale < 0.5) recommendations.push('Low scale — strengthen');
  if (state.worldCosmologyMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalModels: state.totalModels,
    averageScale: Math.round(state.averageScale * 100) / 100,
    averageMystery: Math.round(state.averageMystery * 100) / 100,
    worldCosmologyMastery: Math.round(state.worldCosmologyMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeWorldCosmology(state: NarrativeWorldCosmologyEngineState): NarrativeWorldCosmologyEngineState {
  const entries = Array.from(state.entries.values());
  const averageScale = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.scale, 0) / entries.length;
  const averageMystery = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.mystery, 0) / entries.length;

  const models = Array.from(state.models.values());
  const modelCoherence = models.length === 0 ? 0.5
    : models.reduce((s, m) => s + m.coherence, 0) / models.length;

  const worldCosmologyMastery = (averageScale * 0.4 + averageMystery * 0.3 + modelCoherence * 0.3);

  return { ...state, averageScale, averageMystery, modelCoherence, worldCosmologyMastery };
}

// Reset
export function resetNarrativeWorldCosmologyEngineState(): NarrativeWorldCosmologyEngineState {
  return createNarrativeWorldCosmologyEngineState();
}