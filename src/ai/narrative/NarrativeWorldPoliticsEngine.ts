/**
 * V1348 NarrativeWorldPoliticsEngine — Direction J Iter 22/30 (Round 5)
 * World politics engine: politics of narrative world
 * Sources: ruflo politics + nanobot + thunderbolt
 */

export type WorldPoliticsRegime = 'anarchy' | 'monarchy' | 'aristocracy' | 'democracy' | 'republic' | 'theocracy' | 'transcendent';
export type WorldPoliticsStability = 'chaotic' | 'unstable' | 'moderate' | 'stable' | 'entrenched' | 'eternal' | 'transcendent';
export type WorldPoliticsPower = 'personal' | 'institutional' | 'distributed' | 'networked' | 'universal' | 'infinite' | 'transcendent';

export interface WorldPoliticsEntry {
  entryId: string;
  regime: WorldPoliticsRegime;
  stability: WorldPoliticsStability;
  power: WorldPoliticsPower;
  description: string;
  legitimacy: number;
  reach: number;
  chapter: number;
}

export interface WorldPoliticsSphere {
  sphereId: string,
  entryIds: string[],
  cumulativeLegitimacy: number,
  breadth: number,
}

export interface NarrativeWorldPoliticsEngineState {
  entries: Map<string, WorldPoliticsEntry>;
  spheres: Map<string, WorldPoliticsSphere>;
  totalEntries: number;
  totalSpheres: number;
  averageLegitimacy: number;
  averageReach: number;
  sphereBreadth: number;
  worldPoliticsMastery: number;
}

// Factory
export function createNarrativeWorldPoliticsEngineState(): NarrativeWorldPoliticsEngineState {
  return {
    entries: new Map(),
    spheres: new Map(),
    totalEntries: 0,
    totalSpheres: 0,
    averageLegitimacy: 0.5,
    averageReach: 0.5,
    sphereBreadth: 0.5,
    worldPoliticsMastery: 0.5,
  };
}

// Add entry
export function addWorldPoliticsEntry(
  state: NarrativeWorldPoliticsEngineState,
  entryId: string,
  regime: WorldPoliticsRegime,
  stability: WorldPoliticsStability,
  power: WorldPoliticsPower,
  description: string,
  legitimacy: number,
  reach: number,
  chapter: number
): NarrativeWorldPoliticsEngineState {
  const entry: WorldPoliticsEntry = { entryId, regime, stability, power, description, legitimacy, reach, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeWorldPolitics({ ...state, entries, totalEntries: entries.size });
}

// Add sphere
export function addWorldPoliticsSphere(
  state: NarrativeWorldPoliticsEngineState,
  sphereId: string,
  entryIds: string[]
): NarrativeWorldPoliticsEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is WorldPoliticsEntry => e !== undefined);
  const cumulativeLegitimacy = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.legitimacy, 0) / entries.length;
  const regimeSet = new Set(entries.map(e => e.regime));
  const breadth = Math.min(1, regimeSet.size / 7);
  const sphere: WorldPoliticsSphere = { sphereId, entryIds, cumulativeLegitimacy, breadth };
  const spheres = new Map(state.spheres).set(sphereId, sphere);
  return recomputeWorldPolitics({ ...state, spheres, totalSpheres: spheres.size });
}

// Get entries by regime
export function getWorldPoliticsEntriesByRegime(state: NarrativeWorldPoliticsEngineState, regime: WorldPoliticsRegime): WorldPoliticsEntry[] {
  return Array.from(state.entries.values()).filter(e => e.regime === regime);
}

// Get world politics report
export function getWorldPoliticsReport(state: NarrativeWorldPoliticsEngineState): {
  totalEntries: number;
  totalSpheres: number;
  averageLegitimacy: number;
  averageReach: number;
  worldPoliticsMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add world politics entries');
  if (state.averageLegitimacy < 0.5) recommendations.push('Low legitimacy — strengthen');
  if (state.worldPoliticsMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalSpheres: state.totalSpheres,
    averageLegitimacy: Math.round(state.averageLegitimacy * 100) / 100,
    averageReach: Math.round(state.averageReach * 100) / 100,
    worldPoliticsMastery: Math.round(state.worldPoliticsMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeWorldPolitics(state: NarrativeWorldPoliticsEngineState): NarrativeWorldPoliticsEngineState {
  const entries = Array.from(state.entries.values());
  const averageLegitimacy = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.legitimacy, 0) / entries.length;
  const averageReach = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.reach, 0) / entries.length;

  const spheres = Array.from(state.spheres.values());
  const sphereBreadth = spheres.length === 0 ? 0.5
    : spheres.reduce((s, sph) => s + sph.breadth, 0) / spheres.length;

  const worldPoliticsMastery = (averageLegitimacy * 0.4 + averageReach * 0.3 + sphereBreadth * 0.3);

  return { ...state, averageLegitimacy, averageReach, sphereBreadth, worldPoliticsMastery };
}

// Reset
export function resetNarrativeWorldPoliticsEngineState(): NarrativeWorldPoliticsEngineState {
  return createNarrativeWorldPoliticsEngineState();
}