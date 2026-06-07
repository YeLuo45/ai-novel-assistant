/**
 * V1318 NarrativeWorldGeographyEngine — Direction J Iter 7/30 (Round 5)
 * World geography engine: geography of narrative world
 * Sources: nanobot geography + thunderbolt + ruflo
 */

export type WorldGeographyFeature = 'mountain' | 'river' | 'lake' | 'ocean' | 'valley' | 'plateau' | 'transcendent';
export type WorldGeographyProminence = 'minor' | 'notable' | 'major' | 'famous' | 'legendary' | 'mythical' | 'transcendent';
export type WorldGeographyInfluence = 'local' | 'regional' | 'national' | 'continental' | 'global' | 'universal' | 'transcendent';

export interface WorldGeographyEntry {
  entryId: string;
  feature: WorldGeographyFeature;
  prominence: WorldGeographyProminence;
  influence: WorldGeographyInfluence;
  description: string;
  scale: number;
  importance: number;
  chapter: number;
}

export interface WorldGeographyRegion {
  regionId: string,
  entryIds: string[],
  cumulativeScale: number,
  diversity: number,
}

export interface NarrativeWorldGeographyEngineState {
  entries: Map<string, WorldGeographyEntry>;
  regions: Map<string, WorldGeographyRegion>;
  totalEntries: number;
  totalRegions: number;
  averageScale: number;
  averageImportance: number;
  regionDiversity: number;
  worldGeographyMastery: number;
}

// Factory
export function createNarrativeWorldGeographyEngineState(): NarrativeWorldGeographyEngineState {
  return {
    entries: new Map(),
    regions: new Map(),
    totalEntries: 0,
    totalRegions: 0,
    averageScale: 0.5,
    averageImportance: 0.5,
    regionDiversity: 0.5,
    worldGeographyMastery: 0.5,
  };
}

// Add entry
export function addWorldGeographyEntry(
  state: NarrativeWorldGeographyEngineState,
  entryId: string,
  feature: WorldGeographyFeature,
  prominence: WorldGeographyProminence,
  influence: WorldGeographyInfluence,
  description: string,
  scale: number,
  importance: number,
  chapter: number
): NarrativeWorldGeographyEngineState {
  const entry: WorldGeographyEntry = { entryId, feature, prominence, influence, description, scale, importance, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeWorldGeography({ ...state, entries, totalEntries: entries.size });
}

// Add region
export function addWorldGeographyRegion(
  state: NarrativeWorldGeographyEngineState,
  regionId: string,
  entryIds: string[]
): NarrativeWorldGeographyEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is WorldGeographyEntry => e !== undefined);
  const cumulativeScale = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.scale, 0) / entries.length;
  const featureSet = new Set(entries.map(e => e.feature));
  const diversity = Math.min(1, featureSet.size / 7);
  const region: WorldGeographyRegion = { regionId, entryIds, cumulativeScale, diversity };
  const regions = new Map(state.regions).set(regionId, region);
  return recomputeWorldGeography({ ...state, regions, totalRegions: regions.size });
}

// Get entries by feature
export function getWorldGeographyEntriesByFeature(state: NarrativeWorldGeographyEngineState, feature: WorldGeographyFeature): WorldGeographyEntry[] {
  return Array.from(state.entries.values()).filter(e => e.feature === feature);
}

// Get world geography report
export function getWorldGeographyReport(state: NarrativeWorldGeographyEngineState): {
  totalEntries: number;
  totalRegions: number;
  averageScale: number;
  averageImportance: number;
  worldGeographyMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add world geography entries');
  if (state.averageScale < 0.5) recommendations.push('Low scale — strengthen');
  if (state.worldGeographyMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalRegions: state.totalRegions,
    averageScale: Math.round(state.averageScale * 100) / 100,
    averageImportance: Math.round(state.averageImportance * 100) / 100,
    worldGeographyMastery: Math.round(state.worldGeographyMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeWorldGeography(state: NarrativeWorldGeographyEngineState): NarrativeWorldGeographyEngineState {
  const entries = Array.from(state.entries.values());
  const averageScale = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.scale, 0) / entries.length;
  const averageImportance = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.importance, 0) / entries.length;

  const regions = Array.from(state.regions.values());
  const regionDiversity = regions.length === 0 ? 0.5
    : regions.reduce((s, r) => s + r.diversity, 0) / regions.length;

  const worldGeographyMastery = (averageScale * 0.4 + averageImportance * 0.3 + regionDiversity * 0.3);

  return { ...state, averageScale, averageImportance, regionDiversity, worldGeographyMastery };
}

// Reset
export function resetNarrativeWorldGeographyEngineState(): NarrativeWorldGeographyEngineState {
  return createNarrativeWorldGeographyEngineState();
}