/**
 * V1330 NarrativeWorldBiosphereEngine — Direction J Iter 13/30 (Round 5)
 * World biosphere engine: living systems of narrative world
 * Sources: nanobot biosphere + thunderbolt + ruflo
 */

export type WorldBiosphereRealm = 'terrestrial' | 'aquatic' | 'aerial' | 'subterranean' | 'ethereal' | 'astral' | 'transcendent';
export type WorldBiosphereAbundance = 'sparse' | 'limited' | 'moderate' | 'rich' | 'verdant' | 'infinite' | 'transcendent';
export type WorldBiosphereInteraction = 'predator_prey' | 'symbiotic' | 'parasitic' | 'commensal' | 'magical' | 'transcendent' | 'perfect';

export interface WorldBiosphereEntry {
  entryId: string;
  realm: WorldBiosphereRealm;
  abundance: WorldBiosphereAbundance;
  interaction: WorldBiosphereInteraction;
  description: string;
  vitality: number;
  uniqueness: number;
  chapter: number;
}

export interface WorldBiosphereZone {
  zoneId: string,
  entryIds: string[],
  cumulativeVitality: number,
  range: number,
}

export interface NarrativeWorldBiosphereEngineState {
  entries: Map<string, WorldBiosphereEntry>;
  zones: Map<string, WorldBiosphereZone>;
  totalEntries: number;
  totalZones: number;
  averageVitality: number;
  averageUniqueness: number;
  zoneRange: number;
  worldBiosphereMastery: number;
}

// Factory
export function createNarrativeWorldBiosphereEngineState(): NarrativeWorldBiosphereEngineState {
  return {
    entries: new Map(),
    zones: new Map(),
    totalEntries: 0,
    totalZones: 0,
    averageVitality: 0.5,
    averageUniqueness: 0.5,
    zoneRange: 0.5,
    worldBiosphereMastery: 0.5,
  };
}

// Add entry
export function addWorldBiosphereEntry(
  state: NarrativeWorldBiosphereEngineState,
  entryId: string,
  realm: WorldBiosphereRealm,
  abundance: WorldBiosphereAbundance,
  interaction: WorldBiosphereInteraction,
  description: string,
  vitality: number,
  uniqueness: number,
  chapter: number
): NarrativeWorldBiosphereEngineState {
  const entry: WorldBiosphereEntry = { entryId, realm, abundance, interaction, description, vitality, uniqueness, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeWorldBiosphere({ ...state, entries, totalEntries: entries.size });
}

// Add zone
export function addWorldBiosphereZone(
  state: NarrativeWorldBiosphereEngineState,
  zoneId: string,
  entryIds: string[]
): NarrativeWorldBiosphereEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is WorldBiosphereEntry => e !== undefined);
  const cumulativeVitality = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.vitality, 0) / entries.length;
  const realmSet = new Set(entries.map(e => e.realm));
  const range = Math.min(1, realmSet.size / 7);
  const zone: WorldBiosphereZone = { zoneId, entryIds, cumulativeVitality, range };
  const zones = new Map(state.zones).set(zoneId, zone);
  return recomputeWorldBiosphere({ ...state, zones, totalZones: zones.size });
}

// Get entries by realm
export function getWorldBiosphereEntriesByRealm(state: NarrativeWorldBiosphereEngineState, realm: WorldBiosphereRealm): WorldBiosphereEntry[] {
  return Array.from(state.entries.values()).filter(e => e.realm === realm);
}

// Get world biosphere report
export function getWorldBiosphereReport(state: NarrativeWorldBiosphereEngineState): {
  totalEntries: number;
  totalZones: number;
  averageVitality: number;
  averageUniqueness: number;
  worldBiosphereMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add world biosphere entries');
  if (state.averageVitality < 0.5) recommendations.push('Low vitality — strengthen');
  if (state.worldBiosphereMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalZones: state.totalZones,
    averageVitality: Math.round(state.averageVitality * 100) / 100,
    averageUniqueness: Math.round(state.averageUniqueness * 100) / 100,
    worldBiosphereMastery: Math.round(state.worldBiosphereMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeWorldBiosphere(state: NarrativeWorldBiosphereEngineState): NarrativeWorldBiosphereEngineState {
  const entries = Array.from(state.entries.values());
  const averageVitality = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.vitality, 0) / entries.length;
  const averageUniqueness = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.uniqueness, 0) / entries.length;

  const zones = Array.from(state.zones.values());
  const zoneRange = zones.length === 0 ? 0.5
    : zones.reduce((s, z) => s + z.range, 0) / zones.length;

  const worldBiosphereMastery = (averageVitality * 0.4 + averageUniqueness * 0.3 + zoneRange * 0.3);

  return { ...state, averageVitality, averageUniqueness, zoneRange, worldBiosphereMastery };
}

// Reset
export function resetNarrativeWorldBiosphereEngineState(): NarrativeWorldBiosphereEngineState {
  return createNarrativeWorldBiosphereEngineState();
}