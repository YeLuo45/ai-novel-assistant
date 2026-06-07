/**
 * V1342 NarrativeWorldEcologyEngine — Direction J Iter 19/30 (Round 5)
 * World ecology engine: ecology of narrative world
 * Sources: nanobot ecology + thunderbolt + ruflo
 */

export type WorldEcologyNiche = 'producer' | 'consumer' | 'decomposer' | 'symbiont' | 'parasite' | 'keystone' | 'transcendent';
export type WorldEcologyFlow = 'linear' | 'cyclical' | 'web' | 'cascading' | 'spiral' | 'infinite' | 'transcendent';
export type WorldEcologyResilience = 'fragile' | 'vulnerable' | 'moderate' | 'resilient' | 'antifragile' | 'infinite' | 'transcendent';

export interface WorldEcologyEntry {
  entryId: string;
  niche: WorldEcologyNiche;
  flow: WorldEcologyFlow;
  resilience: WorldEcologyResilience;
  description: string;
  balance: number;
  interdependency: number;
  chapter: number;
}

export interface WorldEcologyCycle {
  cycleId: string,
  entryIds: string[],
  cumulativeBalance: number,
  loop: number,
}

export interface NarrativeWorldEcologyEngineState {
  entries: Map<string, WorldEcologyEntry>;
  cycles: Map<string, WorldEcologyCycle>;
  totalEntries: number;
  totalCycles: number;
  averageBalance: number;
  averageInterdependency: number;
  cycleLoop: number;
  worldEcologyMastery: number;
}

// Factory
export function createNarrativeWorldEcologyEngineState(): NarrativeWorldEcologyEngineState {
  return {
    entries: new Map(),
    cycles: new Map(),
    totalEntries: 0,
    totalCycles: 0,
    averageBalance: 0.5,
    averageInterdependency: 0.5,
    cycleLoop: 0.5,
    worldEcologyMastery: 0.5,
  };
}

// Add entry
export function addWorldEcologyEntry(
  state: NarrativeWorldEcologyEngineState,
  entryId: string,
  niche: WorldEcologyNiche,
  flow: WorldEcologyFlow,
  resilience: WorldEcologyResilience,
  description: string,
  balance: number,
  interdependency: number,
  chapter: number
): NarrativeWorldEcologyEngineState {
  const entry: WorldEcologyEntry = { entryId, niche, flow, resilience, description, balance, interdependency, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeWorldEcology({ ...state, entries, totalEntries: entries.size });
}

// Add cycle
export function addWorldEcologyCycle(
  state: NarrativeWorldEcologyEngineState,
  cycleId: string,
  entryIds: string[]
): NarrativeWorldEcologyEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is WorldEcologyEntry => e !== undefined);
  const cumulativeBalance = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.balance, 0) / entries.length;
  const nicheSet = new Set(entries.map(e => e.niche));
  const loop = Math.min(1, nicheSet.size / 7);
  const cycle: WorldEcologyCycle = { cycleId, entryIds, cumulativeBalance, loop };
  const cycles = new Map(state.cycles).set(cycleId, cycle);
  return recomputeWorldEcology({ ...state, cycles, totalCycles: cycles.size });
}

// Get entries by niche
export function getWorldEcologyEntriesByNiche(state: NarrativeWorldEcologyEngineState, niche: WorldEcologyNiche): WorldEcologyEntry[] {
  return Array.from(state.entries.values()).filter(e => e.niche === niche);
}

// Get world ecology report
export function getWorldEcologyReport(state: NarrativeWorldEcologyEngineState): {
  totalEntries: number;
  totalCycles: number;
  averageBalance: number;
  averageInterdependency: number;
  worldEcologyMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add world ecology entries');
  if (state.averageBalance < 0.5) recommendations.push('Low balance — strengthen');
  if (state.worldEcologyMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalCycles: state.totalCycles,
    averageBalance: Math.round(state.averageBalance * 100) / 100,
    averageInterdependency: Math.round(state.averageInterdependency * 100) / 100,
    worldEcologyMastery: Math.round(state.worldEcologyMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeWorldEcology(state: NarrativeWorldEcologyEngineState): NarrativeWorldEcologyEngineState {
  const entries = Array.from(state.entries.values());
  const averageBalance = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.balance, 0) / entries.length;
  const averageInterdependency = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.interdependency, 0) / entries.length;

  const cycles = Array.from(state.cycles.values());
  const cycleLoop = cycles.length === 0 ? 0.5
    : cycles.reduce((s, c) => s + c.loop, 0) / cycles.length;

  const worldEcologyMastery = (averageBalance * 0.4 + averageInterdependency * 0.3 + cycleLoop * 0.3);

  return { ...state, averageBalance, averageInterdependency, cycleLoop, worldEcologyMastery };
}

// Reset
export function resetNarrativeWorldEcologyEngineState(): NarrativeWorldEcologyEngineState {
  return createNarrativeWorldEcologyEngineState();
}