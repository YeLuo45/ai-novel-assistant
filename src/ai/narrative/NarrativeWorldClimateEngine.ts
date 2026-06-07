/**
 * V1314 NarrativeWorldClimateEngine — Direction J Iter 5/30 (Round 5)
 * World climate engine: climate of narrative world
 * Sources: thunderbolt climate + nanobot + ruflo
 */

export type WorldClimateType = 'tropical' | 'temperate' | 'arctic' | 'desert' | 'mediterranean' | 'monsoon' | 'transcendent';
export type WorldClimateSeverity = 'mild' | 'moderate' | 'harsh' | 'severe' | 'extreme' | 'legendary' | 'transcendent';
export type WorldClimateConsistency = 'erratic' | 'variable' | 'seasonal' | 'stable' | 'constant' | 'perfect' | 'transcendent';

export interface WorldClimateEntry {
  entryId: string;
  type: WorldClimateType;
  severity: WorldClimateSeverity;
  consistency: WorldClimateConsistency;
  description: string;
  predictability: number;
  impact: number;
  chapter: number;
}

export interface WorldClimateRegion {
  regionId: string,
  entryIds: string[],
  cumulativePredictability: number,
  range: number,
}

export interface NarrativeWorldClimateEngineState {
  entries: Map<string, WorldClimateEntry>;
  regions: Map<string, WorldClimateRegion>;
  totalEntries: number;
  totalRegions: number;
  averagePredictability: number;
  averageImpact: number;
  regionRange: number;
  worldClimateMastery: number;
}

// Factory
export function createNarrativeWorldClimateEngineState(): NarrativeWorldClimateEngineState {
  return {
    entries: new Map(),
    regions: new Map(),
    totalEntries: 0,
    totalRegions: 0,
    averagePredictability: 0.5,
    averageImpact: 0.5,
    regionRange: 0.5,
    worldClimateMastery: 0.5,
  };
}

// Add entry
export function addWorldClimateEntry(
  state: NarrativeWorldClimateEngineState,
  entryId: string,
  type: WorldClimateType,
  severity: WorldClimateSeverity,
  consistency: WorldClimateConsistency,
  description: string,
  predictability: number,
  impact: number,
  chapter: number
): NarrativeWorldClimateEngineState {
  const entry: WorldClimateEntry = { entryId, type, severity, consistency, description, predictability, impact, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeWorldClimate({ ...state, entries, totalEntries: entries.size });
}

// Add region
export function addWorldClimateRegion(
  state: NarrativeWorldClimateEngineState,
  regionId: string,
  entryIds: string[]
): NarrativeWorldClimateEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is WorldClimateEntry => e !== undefined);
  const cumulativePredictability = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.predictability, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const range = Math.min(1, typeSet.size / 7);
  const region: WorldClimateRegion = { regionId, entryIds, cumulativePredictability, range };
  const regions = new Map(state.regions).set(regionId, region);
  return recomputeWorldClimate({ ...state, regions, totalRegions: regions.size });
}

// Get entries by type
export function getWorldClimateEntriesByType(state: NarrativeWorldClimateEngineState, type: WorldClimateType): WorldClimateEntry[] {
  return Array.from(state.entries.values()).filter(e => e.type === type);
}

// Get world climate report
export function getWorldClimateReport(state: NarrativeWorldClimateEngineState): {
  totalEntries: number;
  totalRegions: number;
  averagePredictability: number;
  averageImpact: number;
  worldClimateMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add world climate entries');
  if (state.averagePredictability < 0.5) recommendations.push('Low predictability — strengthen');
  if (state.worldClimateMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalRegions: state.totalRegions,
    averagePredictability: Math.round(state.averagePredictability * 100) / 100,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    worldClimateMastery: Math.round(state.worldClimateMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeWorldClimate(state: NarrativeWorldClimateEngineState): NarrativeWorldClimateEngineState {
  const entries = Array.from(state.entries.values());
  const averagePredictability = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.predictability, 0) / entries.length;
  const averageImpact = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.impact, 0) / entries.length;

  const regions = Array.from(state.regions.values());
  const regionRange = regions.length === 0 ? 0.5
    : regions.reduce((s, r) => s + r.range, 0) / regions.length;

  const worldClimateMastery = (averagePredictability * 0.4 + averageImpact * 0.3 + regionRange * 0.3);

  return { ...state, averagePredictability, averageImpact, regionRange, worldClimateMastery };
}

// Reset
export function resetNarrativeWorldClimateEngineState(): NarrativeWorldClimateEngineState {
  return createNarrativeWorldClimateEngineState();
}