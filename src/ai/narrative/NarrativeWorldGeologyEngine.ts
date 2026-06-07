/**
 * V1324 NarrativeWorldGeologyEngine — Direction J Iter 10/30 (Round 5)
 * World geology engine: geology of narrative world
 * Sources: nanobot geology + thunderbolt + ruflo
 */

export type WorldGeologyRock = 'igneous' | 'sedimentary' | 'metamorphic' | 'crystal' | 'magical' | 'living' | 'transcendent';
export type WorldGeologyAge = 'recent' | 'young' | 'mature' | 'ancient' | 'primordial' | 'pre_creation' | 'transcendent';
export type WorldGeologyActivity = 'dormant' | 'quiet' | 'moderate' | 'active' | 'volcanic' | 'transformative' | 'transcendent';

export interface WorldGeologyEntry {
  entryId: string;
  rock: WorldGeologyRock;
  age: WorldGeologyAge;
  activity: WorldGeologyActivity;
  description: string;
  solidity: number;
  mystery: number;
  chapter: number;
}

export interface WorldGeologyStratum {
  stratumId: string,
  entryIds: string[],
  cumulativeSolidity: number,
  depth: number,
}

export interface NarrativeWorldGeologyEngineState {
  entries: Map<string, WorldGeologyEntry>;
  strata: Map<string, WorldGeologyStratum>;
  totalEntries: number;
  totalStrata: number;
  averageSolidity: number;
  averageMystery: number;
  stratumDepth: number;
  worldGeologyMastery: number;
}

// Factory
export function createNarrativeWorldGeologyEngineState(): NarrativeWorldGeologyEngineState {
  return {
    entries: new Map(),
    strata: new Map(),
    totalEntries: 0,
    totalStrata: 0,
    averageSolidity: 0.5,
    averageMystery: 0.5,
    stratumDepth: 0.5,
    worldGeologyMastery: 0.5,
  };
}

// Add entry
export function addWorldGeologyEntry(
  state: NarrativeWorldGeologyEngineState,
  entryId: string,
  rock: WorldGeologyRock,
  age: WorldGeologyAge,
  activity: WorldGeologyActivity,
  description: string,
  solidity: number,
  mystery: number,
  chapter: number
): NarrativeWorldGeologyEngineState {
  const entry: WorldGeologyEntry = { entryId, rock, age, activity, description, solidity, mystery, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeWorldGeology({ ...state, entries, totalEntries: entries.size });
}

// Add stratum
export function addWorldGeologyStratum(
  state: NarrativeWorldGeologyEngineState,
  stratumId: string,
  entryIds: string[]
): NarrativeWorldGeologyEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is WorldGeologyEntry => e !== undefined);
  const cumulativeSolidity = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.solidity, 0) / entries.length;
  const rockSet = new Set(entries.map(e => e.rock));
  const depth = Math.min(1, rockSet.size / 7);
  const stratum: WorldGeologyStratum = { stratumId, entryIds, cumulativeSolidity, depth };
  const strata = new Map(state.strata).set(stratumId, stratum);
  return recomputeWorldGeology({ ...state, strata, totalStrata: strata.size });
}

// Get entries by rock
export function getWorldGeologyEntriesByRock(state: NarrativeWorldGeologyEngineState, rock: WorldGeologyRock): WorldGeologyEntry[] {
  return Array.from(state.entries.values()).filter(e => e.rock === rock);
}

// Get world geology report
export function getWorldGeologyReport(state: NarrativeWorldGeologyEngineState): {
  totalEntries: number;
  totalStrata: number;
  averageSolidity: number;
  averageMystery: number;
  worldGeologyMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add world geology entries');
  if (state.averageSolidity < 0.5) recommendations.push('Low solidity — strengthen');
  if (state.worldGeologyMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalStrata: state.totalStrata,
    averageSolidity: Math.round(state.averageSolidity * 100) / 100,
    averageMystery: Math.round(state.averageMystery * 100) / 100,
    worldGeologyMastery: Math.round(state.worldGeologyMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeWorldGeology(state: NarrativeWorldGeologyEngineState): NarrativeWorldGeologyEngineState {
  const entries = Array.from(state.entries.values());
  const averageSolidity = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.solidity, 0) / entries.length;
  const averageMystery = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.mystery, 0) / entries.length;

  const strata = Array.from(state.strata.values());
  const stratumDepth = strata.length === 0 ? 0.5
    : strata.reduce((s, st) => s + st.depth, 0) / strata.length;

  const worldGeologyMastery = (averageSolidity * 0.4 + averageMystery * 0.3 + stratumDepth * 0.3);

  return { ...state, averageSolidity, averageMystery, stratumDepth, worldGeologyMastery };
}

// Reset
export function resetNarrativeWorldGeologyEngineState(): NarrativeWorldGeologyEngineState {
  return createNarrativeWorldGeologyEngineState();
}