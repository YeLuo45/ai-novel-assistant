/**
 * V1328 NarrativeWorldAtmosphereEngine — Direction J Iter 12/30 (Round 5)
 * World atmosphere engine: atmosphere of narrative world
 * Sources: ruflo atmosphere + nanobot + thunderbolt
 */

export type WorldAtmosphereLayer = 'troposphere' | 'stratosphere' | 'mesosphere' | 'ionosphere' | 'exosphere' | 'magical' | 'transcendent';
export type WorldAtmosphereDensity = 'thin' | 'sparse' | 'normal' | 'dense' | 'thick' | 'oppressive' | 'transcendent';
export type WorldAtmosphereClarity = 'murky' | 'hazy' | 'clear' | 'crystal' | 'luminous' | 'ethereal' | 'transcendent';

export interface WorldAtmosphereEntry {
  entryId: string;
  layer: WorldAtmosphereLayer;
  density: WorldAtmosphereDensity;
  clarity: WorldAtmosphereClarity;
  description: string;
  presence: number;
  mystery: number;
  chapter: number;
}

export interface WorldAtmosphereStratum {
  stratumId: string,
  entryIds: string[],
  cumulativePresence: number,
  depth: number,
}

export interface NarrativeWorldAtmosphereEngineState {
  entries: Map<string, WorldAtmosphereEntry>;
  strata: Map<string, WorldAtmosphereStratum>;
  totalEntries: number;
  totalStrata: number;
  averagePresence: number;
  averageMystery: number;
  stratumDepth: number;
  worldAtmosphereMastery: number;
}

// Factory
export function createNarrativeWorldAtmosphereEngineState(): NarrativeWorldAtmosphereEngineState {
  return {
    entries: new Map(),
    strata: new Map(),
    totalEntries: 0,
    totalStrata: 0,
    averagePresence: 0.5,
    averageMystery: 0.5,
    stratumDepth: 0.5,
    worldAtmosphereMastery: 0.5,
  };
}

// Add entry
export function addWorldAtmosphereEntry(
  state: NarrativeWorldAtmosphereEngineState,
  entryId: string,
  layer: WorldAtmosphereLayer,
  density: WorldAtmosphereDensity,
  clarity: WorldAtmosphereClarity,
  description: string,
  presence: number,
  mystery: number,
  chapter: number
): NarrativeWorldAtmosphereEngineState {
  const entry: WorldAtmosphereEntry = { entryId, layer, density, clarity, description, presence, mystery, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeWorldAtmosphere({ ...state, entries, totalEntries: entries.size });
}

// Add stratum
export function addWorldAtmosphereStratum(
  state: NarrativeWorldAtmosphereEngineState,
  stratumId: string,
  entryIds: string[]
): NarrativeWorldAtmosphereEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is WorldAtmosphereEntry => e !== undefined);
  const cumulativePresence = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.presence, 0) / entries.length;
  const layerSet = new Set(entries.map(e => e.layer));
  const depth = Math.min(1, layerSet.size / 7);
  const stratum: WorldAtmosphereStratum = { stratumId, entryIds, cumulativePresence, depth };
  const strata = new Map(state.strata).set(stratumId, stratum);
  return recomputeWorldAtmosphere({ ...state, strata, totalStrata: strata.size });
}

// Get entries by layer
export function getWorldAtmosphereEntriesByLayer(state: NarrativeWorldAtmosphereEngineState, layer: WorldAtmosphereLayer): WorldAtmosphereEntry[] {
  return Array.from(state.entries.values()).filter(e => e.layer === layer);
}

// Get world atmosphere report
export function getWorldAtmosphereReport(state: NarrativeWorldAtmosphereEngineState): {
  totalEntries: number;
  totalStrata: number;
  averagePresence: number;
  averageMystery: number;
  worldAtmosphereMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add world atmosphere entries');
  if (state.averagePresence < 0.5) recommendations.push('Low presence — strengthen');
  if (state.worldAtmosphereMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalStrata: state.totalStrata,
    averagePresence: Math.round(state.averagePresence * 100) / 100,
    averageMystery: Math.round(state.averageMystery * 100) / 100,
    worldAtmosphereMastery: Math.round(state.worldAtmosphereMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeWorldAtmosphere(state: NarrativeWorldAtmosphereEngineState): NarrativeWorldAtmosphereEngineState {
  const entries = Array.from(state.entries.values());
  const averagePresence = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.presence, 0) / entries.length;
  const averageMystery = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.mystery, 0) / entries.length;

  const strata = Array.from(state.strata.values());
  const stratumDepth = strata.length === 0 ? 0.5
    : strata.reduce((s, st) => s + st.depth, 0) / strata.length;

  const worldAtmosphereMastery = (averagePresence * 0.4 + averageMystery * 0.3 + stratumDepth * 0.3);

  return { ...state, averagePresence, averageMystery, stratumDepth, worldAtmosphereMastery };
}

// Reset
export function resetNarrativeWorldAtmosphereEngineState(): NarrativeWorldAtmosphereEngineState {
  return createNarrativeWorldAtmosphereEngineState();
}