/**
 * V1316 NarrativeWorldEcosystemEngine — Direction J Iter 6/30 (Round 5)
 * World ecosystem engine: ecosystem of narrative world
 * Sources: ruflo ecosystem + nanobot + thunderbolt
 */

export type WorldEcosystemType = 'forest' | 'grassland' | 'desert' | 'tundra' | 'freshwater' | 'marine' | 'transcendent';
export type WorldEcosystemBalance = 'disturbed' | 'imbalanced' | 'unstable' | 'stable' | 'thriving' | 'perfect' | 'transcendent';
export type WorldEcosystemBiodiversity = 'monoculture' | 'low' | 'moderate' | 'high' | 'extreme' | 'infinite' | 'transcendent';

export interface WorldEcosystemEntry {
  entryId: string;
  type: WorldEcosystemType;
  balance: WorldEcosystemBalance;
  biodiversity: WorldEcosystemBiodiversity;
  description: string;
  health: number;
  resilience: number;
  chapter: number;
}

export interface WorldEcosystemWeb {
  webId: string,
  entryIds: string[],
  cumulativeHealth: number,
  complexity: number,
}

export interface NarrativeWorldEcosystemEngineState {
  entries: Map<string, WorldEcosystemEntry>;
  webs: Map<string, WorldEcosystemWeb>;
  totalEntries: number;
  totalWebs: number;
  averageHealth: number;
  averageResilience: number;
  webComplexity: number;
  worldEcosystemMastery: number;
}

// Factory
export function createNarrativeWorldEcosystemEngineState(): NarrativeWorldEcosystemEngineState {
  return {
    entries: new Map(),
    webs: new Map(),
    totalEntries: 0,
    totalWebs: 0,
    averageHealth: 0.5,
    averageResilience: 0.5,
    webComplexity: 0.5,
    worldEcosystemMastery: 0.5,
  };
}

// Add entry
export function addWorldEcosystemEntry(
  state: NarrativeWorldEcosystemEngineState,
  entryId: string,
  type: WorldEcosystemType,
  balance: WorldEcosystemBalance,
  biodiversity: WorldEcosystemBiodiversity,
  description: string,
  health: number,
  resilience: number,
  chapter: number
): NarrativeWorldEcosystemEngineState {
  const entry: WorldEcosystemEntry = { entryId, type, balance, biodiversity, description, health, resilience, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeWorldEcosystem({ ...state, entries, totalEntries: entries.size });
}

// Add web
export function addWorldEcosystemWeb(
  state: NarrativeWorldEcosystemEngineState,
  webId: string,
  entryIds: string[]
): NarrativeWorldEcosystemEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is WorldEcosystemEntry => e !== undefined);
  const cumulativeHealth = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.health, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const complexity = Math.min(1, typeSet.size / 7);
  const web: WorldEcosystemWeb = { webId, entryIds, cumulativeHealth, complexity };
  const webs = new Map(state.webs).set(webId, web);
  return recomputeWorldEcosystem({ ...state, webs, totalWebs: webs.size });
}

// Get entries by type
export function getWorldEcosystemEntriesByType(state: NarrativeWorldEcosystemEngineState, type: WorldEcosystemType): WorldEcosystemEntry[] {
  return Array.from(state.entries.values()).filter(e => e.type === type);
}

// Get world ecosystem report
export function getWorldEcosystemReport(state: NarrativeWorldEcosystemEngineState): {
  totalEntries: number;
  totalWebs: number;
  averageHealth: number;
  averageResilience: number;
  worldEcosystemMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add world ecosystem entries');
  if (state.averageHealth < 0.5) recommendations.push('Low health — strengthen');
  if (state.worldEcosystemMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalWebs: state.totalWebs,
    averageHealth: Math.round(state.averageHealth * 100) / 100,
    averageResilience: Math.round(state.averageResilience * 100) / 100,
    worldEcosystemMastery: Math.round(state.worldEcosystemMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeWorldEcosystem(state: NarrativeWorldEcosystemEngineState): NarrativeWorldEcosystemEngineState {
  const entries = Array.from(state.entries.values());
  const averageHealth = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.health, 0) / entries.length;
  const averageResilience = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.resilience, 0) / entries.length;

  const webs = Array.from(state.webs.values());
  const webComplexity = webs.length === 0 ? 0.5
    : webs.reduce((s, w) => s + w.complexity, 0) / webs.length;

  const worldEcosystemMastery = (averageHealth * 0.4 + averageResilience * 0.3 + webComplexity * 0.3);

  return { ...state, averageHealth, averageResilience, webComplexity, worldEcosystemMastery };
}

// Reset
export function resetNarrativeWorldEcosystemEngineState(): NarrativeWorldEcosystemEngineState {
  return createNarrativeWorldEcosystemEngineState();
}