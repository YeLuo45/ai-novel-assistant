/**
 * V1350 NarrativeWorldEconomyEngine — Direction J Iter 23/30 (Round 5)
 * World economy engine: economy of narrative world
 * Sources: thunderbolt economy + nanobot + ruflo
 */

export type WorldEconomySystem = 'barter' | 'gift' | 'commodity' | 'mercantile' | 'industrial' | 'information' | 'transcendent';
export type WorldEconomyScale = 'household' | 'local' | 'regional' | 'national' | 'global' | 'cosmic' | 'transcendent';
export type WorldEconomyDistribution = 'unequal' | 'moderate' | 'fair' | 'equitable' | 'abundant' | 'post_scarcity' | 'transcendent';

export interface WorldEconomyEntry {
  entryId: string;
  system: WorldEconomySystem;
  scale: WorldEconomyScale;
  distribution: WorldEconomyDistribution;
  description: string;
  productivity: number;
  resilience: number;
  chapter: number;
}

export interface WorldEconomySector {
  sectorId: string,
  entryIds: string[],
  cumulativeProductivity: number,
  range: number,
}

export interface NarrativeWorldEconomyEngineState {
  entries: Map<string, WorldEconomyEntry>;
  sectors: Map<string, WorldEconomySector>;
  totalEntries: number;
  totalSectors: number;
  averageProductivity: number;
  averageResilience: number;
  sectorRange: number;
  worldEconomyMastery: number;
}

// Factory
export function createNarrativeWorldEconomyEngineState(): NarrativeWorldEconomyEngineState {
  return {
    entries: new Map(),
    sectors: new Map(),
    totalEntries: 0,
    totalSectors: 0,
    averageProductivity: 0.5,
    averageResilience: 0.5,
    sectorRange: 0.5,
    worldEconomyMastery: 0.5,
  };
}

// Add entry
export function addWorldEconomyEntry(
  state: NarrativeWorldEconomyEngineState,
  entryId: string,
  system: WorldEconomySystem,
  scale: WorldEconomyScale,
  distribution: WorldEconomyDistribution,
  description: string,
  productivity: number,
  resilience: number,
  chapter: number
): NarrativeWorldEconomyEngineState {
  const entry: WorldEconomyEntry = { entryId, system, scale, distribution, description, productivity, resilience, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeWorldEconomy({ ...state, entries, totalEntries: entries.size });
}

// Add sector
export function addWorldEconomySector(
  state: NarrativeWorldEconomyEngineState,
  sectorId: string,
  entryIds: string[]
): NarrativeWorldEconomyEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is WorldEconomyEntry => e !== undefined);
  const cumulativeProductivity = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.productivity, 0) / entries.length;
  const systemSet = new Set(entries.map(e => e.system));
  const range = Math.min(1, systemSet.size / 7);
  const sector: WorldEconomySector = { sectorId, entryIds, cumulativeProductivity, range };
  const sectors = new Map(state.sectors).set(sectorId, sector);
  return recomputeWorldEconomy({ ...state, sectors, totalSectors: sectors.size });
}

// Get entries by system
export function getWorldEconomyEntriesBySystem(state: NarrativeWorldEconomyEngineState, system: WorldEconomySystem): WorldEconomyEntry[] {
  return Array.from(state.entries.values()).filter(e => e.system === system);
}

// Get world economy report
export function getWorldEconomyReport(state: NarrativeWorldEconomyEngineState): {
  totalEntries: number;
  totalSectors: number;
  averageProductivity: number;
  averageResilience: number;
  worldEconomyMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add world economy entries');
  if (state.averageProductivity < 0.5) recommendations.push('Low productivity — strengthen');
  if (state.worldEconomyMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalSectors: state.totalSectors,
    averageProductivity: Math.round(state.averageProductivity * 100) / 100,
    averageResilience: Math.round(state.averageResilience * 100) / 100,
    worldEconomyMastery: Math.round(state.worldEconomyMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeWorldEconomy(state: NarrativeWorldEconomyEngineState): NarrativeWorldEconomyEngineState {
  const entries = Array.from(state.entries.values());
  const averageProductivity = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.productivity, 0) / entries.length;
  const averageResilience = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.resilience, 0) / entries.length;

  const sectors = Array.from(state.sectors.values());
  const sectorRange = sectors.length === 0 ? 0.5
    : sectors.reduce((s, sec) => s + sec.range, 0) / sectors.length;

  const worldEconomyMastery = (averageProductivity * 0.4 + averageResilience * 0.3 + sectorRange * 0.3);

  return { ...state, averageProductivity, averageResilience, sectorRange, worldEconomyMastery };
}

// Reset
export function resetNarrativeWorldEconomyEngineState(): NarrativeWorldEconomyEngineState {
  return createNarrativeWorldEconomyEngineState();
}