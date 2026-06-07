/**
 * V1312 NarrativeWorldTerrainEngine — Direction J Iter 4/30 (Round 5)
 * World terrain engine: terrain of narrative world
 * Sources: nanobot terrain + thunderbolt + ruflo
 */

export type WorldTerrainType = 'plains' | 'forest' | 'mountain' | 'desert' | 'tundra' | 'swamp' | 'transcendent';
export type WorldTerrainDifficulty = 'easy' | 'moderate' | 'challenging' | 'harsh' | 'extreme' | 'legendary' | 'transcendent';
export type WorldTerrainBeauty = 'bleak' | 'plain' | 'pleasant' | 'beautiful' | 'breathtaking' | 'sublime' | 'transcendent';

export interface WorldTerrainEntry {
  entryId: string;
  type: WorldTerrainType;
  difficulty: WorldTerrainDifficulty;
  beauty: WorldTerrainBeauty;
  description: string;
  traversability: number;
  atmosphere: number;
  chapter: number;
}

export interface WorldTerrainZone {
  zoneId: string,
  entryIds: string[],
  cumulativeTraversability: number,
  variety: number,
}

export interface NarrativeWorldTerrainEngineState {
  entries: Map<string, WorldTerrainEntry>;
  zones: Map<string, WorldTerrainZone>;
  totalEntries: number;
  totalZones: number;
  averageTraversability: number;
  averageAtmosphere: number;
  zoneVariety: number;
  worldTerrainMastery: number;
}

// Factory
export function createNarrativeWorldTerrainEngineState(): NarrativeWorldTerrainEngineState {
  return {
    entries: new Map(),
    zones: new Map(),
    totalEntries: 0,
    totalZones: 0,
    averageTraversability: 0.5,
    averageAtmosphere: 0.5,
    zoneVariety: 0.5,
    worldTerrainMastery: 0.5,
  };
}

// Add entry
export function addWorldTerrainEntry(
  state: NarrativeWorldTerrainEngineState,
  entryId: string,
  type: WorldTerrainType,
  difficulty: WorldTerrainDifficulty,
  beauty: WorldTerrainBeauty,
  description: string,
  traversability: number,
  atmosphere: number,
  chapter: number
): NarrativeWorldTerrainEngineState {
  const entry: WorldTerrainEntry = { entryId, type, difficulty, beauty, description, traversability, atmosphere, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeWorldTerrain({ ...state, entries, totalEntries: entries.size });
}

// Add zone
export function addWorldTerrainZone(
  state: NarrativeWorldTerrainEngineState,
  zoneId: string,
  entryIds: string[]
): NarrativeWorldTerrainEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is WorldTerrainEntry => e !== undefined);
  const cumulativeTraversability = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.traversability, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const variety = Math.min(1, typeSet.size / 7);
  const zone: WorldTerrainZone = { zoneId, entryIds, cumulativeTraversability, variety };
  const zones = new Map(state.zones).set(zoneId, zone);
  return recomputeWorldTerrain({ ...state, zones, totalZones: zones.size });
}

// Get entries by type
export function getWorldTerrainEntriesByType(state: NarrativeWorldTerrainEngineState, type: WorldTerrainType): WorldTerrainEntry[] {
  return Array.from(state.entries.values()).filter(e => e.type === type);
}

// Get world terrain report
export function getWorldTerrainReport(state: NarrativeWorldTerrainEngineState): {
  totalEntries: number;
  totalZones: number;
  averageTraversability: number;
  averageAtmosphere: number;
  worldTerrainMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add world terrain entries');
  if (state.averageTraversability < 0.5) recommendations.push('Low traversability — strengthen');
  if (state.worldTerrainMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalZones: state.totalZones,
    averageTraversability: Math.round(state.averageTraversability * 100) / 100,
    averageAtmosphere: Math.round(state.averageAtmosphere * 100) / 100,
    worldTerrainMastery: Math.round(state.worldTerrainMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeWorldTerrain(state: NarrativeWorldTerrainEngineState): NarrativeWorldTerrainEngineState {
  const entries = Array.from(state.entries.values());
  const averageTraversability = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.traversability, 0) / entries.length;
  const averageAtmosphere = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.atmosphere, 0) / entries.length;

  const zones = Array.from(state.zones.values());
  const zoneVariety = zones.length === 0 ? 0.5
    : zones.reduce((s, z) => s + z.variety, 0) / zones.length;

  const worldTerrainMastery = (averageTraversability * 0.4 + averageAtmosphere * 0.3 + zoneVariety * 0.3);

  return { ...state, averageTraversability, averageAtmosphere, zoneVariety, worldTerrainMastery };
}

// Reset
export function resetNarrativeWorldTerrainEngineState(): NarrativeWorldTerrainEngineState {
  return createNarrativeWorldTerrainEngineState();
}