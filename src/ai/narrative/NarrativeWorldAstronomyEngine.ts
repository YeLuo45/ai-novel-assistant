/**
 * V1332 NarrativeWorldAstronomyEngine — Direction J Iter 14/30 (Round 5)
 * World astronomy engine: celestial bodies of narrative world
 * Sources: thunderbolt astronomy + nanobot + ruflo
 */

export type WorldAstronomyBody = 'star' | 'planet' | 'moon' | 'comet' | 'nebula' | 'galaxy' | 'transcendent';
export type WorldAstronomyCycle = 'daily' | 'monthly' | 'yearly' | 'centennial' | 'millennial' | 'eon' | 'transcendent';
export type WorldAstronomyInfluence = 'minor' | 'noticeable' | 'significant' | 'major' | 'dominant' | 'absolute' | 'transcendent';

export interface WorldAstronomyEntry {
  entryId: string;
  body: WorldAstronomyBody;
  cycle: WorldAstronomyCycle;
  influence: WorldAstronomyInfluence;
  description: string;
  visibility: number;
  mystery: number;
  chapter: number;
}

export interface WorldAstronomySystem {
  systemId: string,
  entryIds: string[],
  cumulativeVisibility: number,
  complexity: number,
}

export interface NarrativeWorldAstronomyEngineState {
  entries: Map<string, WorldAstronomyEntry>;
  systems: Map<string, WorldAstronomySystem>;
  totalEntries: number;
  totalSystems: number;
  averageVisibility: number;
  averageMystery: number;
  systemComplexity: number;
  worldAstronomyMastery: number;
}

// Factory
export function createNarrativeWorldAstronomyEngineState(): NarrativeWorldAstronomyEngineState {
  return {
    entries: new Map(),
    systems: new Map(),
    totalEntries: 0,
    totalSystems: 0,
    averageVisibility: 0.5,
    averageMystery: 0.5,
    systemComplexity: 0.5,
    worldAstronomyMastery: 0.5,
  };
}

// Add entry
export function addWorldAstronomyEntry(
  state: NarrativeWorldAstronomyEngineState,
  entryId: string,
  body: WorldAstronomyBody,
  cycle: WorldAstronomyCycle,
  influence: WorldAstronomyInfluence,
  description: string,
  visibility: number,
  mystery: number,
  chapter: number
): NarrativeWorldAstronomyEngineState {
  const entry: WorldAstronomyEntry = { entryId, body, cycle, influence, description, visibility, mystery, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeWorldAstronomy({ ...state, entries, totalEntries: entries.size });
}

// Add system
export function addWorldAstronomySystem(
  state: NarrativeWorldAstronomyEngineState,
  systemId: string,
  entryIds: string[]
): NarrativeWorldAstronomyEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is WorldAstronomyEntry => e !== undefined);
  const cumulativeVisibility = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.visibility, 0) / entries.length;
  const bodySet = new Set(entries.map(e => e.body));
  const complexity = Math.min(1, bodySet.size / 7);
  const system: WorldAstronomySystem = { systemId, entryIds, cumulativeVisibility, complexity };
  const systems = new Map(state.systems).set(systemId, system);
  return recomputeWorldAstronomy({ ...state, systems, totalSystems: systems.size });
}

// Get entries by body
export function getWorldAstronomyEntriesByBody(state: NarrativeWorldAstronomyEngineState, body: WorldAstronomyBody): WorldAstronomyEntry[] {
  return Array.from(state.entries.values()).filter(e => e.body === body);
}

// Get world astronomy report
export function getWorldAstronomyReport(state: NarrativeWorldAstronomyEngineState): {
  totalEntries: number;
  totalSystems: number;
  averageVisibility: number;
  averageMystery: number;
  worldAstronomyMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add world astronomy entries');
  if (state.averageVisibility < 0.5) recommendations.push('Low visibility — strengthen');
  if (state.worldAstronomyMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalSystems: state.totalSystems,
    averageVisibility: Math.round(state.averageVisibility * 100) / 100,
    averageMystery: Math.round(state.averageMystery * 100) / 100,
    worldAstronomyMastery: Math.round(state.worldAstronomyMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeWorldAstronomy(state: NarrativeWorldAstronomyEngineState): NarrativeWorldAstronomyEngineState {
  const entries = Array.from(state.entries.values());
  const averageVisibility = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.visibility, 0) / entries.length;
  const averageMystery = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.mystery, 0) / entries.length;

  const systems = Array.from(state.systems.values());
  const systemComplexity = systems.length === 0 ? 0.5
    : systems.reduce((s, sy) => s + sy.complexity, 0) / systems.length;

  const worldAstronomyMastery = (averageVisibility * 0.4 + averageMystery * 0.3 + systemComplexity * 0.3);

  return { ...state, averageVisibility, averageMystery, systemComplexity, worldAstronomyMastery };
}

// Reset
export function resetNarrativeWorldAstronomyEngineState(): NarrativeWorldAstronomyEngineState {
  return createNarrativeWorldAstronomyEngineState();
}