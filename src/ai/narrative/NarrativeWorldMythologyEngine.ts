/**
 * V1354 NarrativeWorldMythologyEngine — Direction J Iter 25/30 (Round 5)
 * World mythology engine: mythology of narrative world
 * Sources: ruflo mythology + nanobot + thunderbolt
 */

export type WorldMythologyTheme = 'creation' | 'destruction' | 'rebirth' | 'hero_journey' | 'divine_conflict' | 'cosmic_order' | 'transcendent';
export type WorldMythologyArchetype = 'hero' | 'mentor' | 'shadow' | 'trickster' | 'sage' | 'creator' | 'transcendent';
export type WorldMythologyPower = 'minor' | 'moderate' | 'major' | 'cosmic' | 'universal' | 'transcendent' | 'absolute';

export interface WorldMythologyEntry {
  entryId: string;
  theme: WorldMythologyTheme;
  archetype: WorldMythologyArchetype;
  power: WorldMythologyPower;
  description: string;
  resonance: number;
  truth: number;
  chapter: number;
}

export interface WorldMythologyCycle {
  cycleId: string,
  entryIds: string[],
  cumulativeResonance: number,
  complexity: number,
}

export interface NarrativeWorldMythologyEngineState {
  entries: Map<string, WorldMythologyEntry>;
  cycles: Map<string, WorldMythologyCycle>;
  totalEntries: number;
  totalCycles: number;
  averageResonance: number;
  averageTruth: number;
  cycleComplexity: number;
  worldMythologyMastery: number;
}

// Factory
export function createNarrativeWorldMythologyEngineState(): NarrativeWorldMythologyEngineState {
  return {
    entries: new Map(),
    cycles: new Map(),
    totalEntries: 0,
    totalCycles: 0,
    averageResonance: 0.5,
    averageTruth: 0.5,
    cycleComplexity: 0.5,
    worldMythologyMastery: 0.5,
  };
}

// Add entry
export function addWorldMythologyEntry(
  state: NarrativeWorldMythologyEngineState,
  entryId: string,
  theme: WorldMythologyTheme,
  archetype: WorldMythologyArchetype,
  power: WorldMythologyPower,
  description: string,
  resonance: number,
  truth: number,
  chapter: number
): NarrativeWorldMythologyEngineState {
  const entry: WorldMythologyEntry = { entryId, theme, archetype, power, description, resonance, truth, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeWorldMythology({ ...state, entries, totalEntries: entries.size });
}

// Add cycle
export function addWorldMythologyCycle(
  state: NarrativeWorldMythologyEngineState,
  cycleId: string,
  entryIds: string[]
): NarrativeWorldMythologyEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is WorldMythologyEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const themeSet = new Set(entries.map(e => e.theme));
  const complexity = Math.min(1, themeSet.size / 7);
  const cycle: WorldMythologyCycle = { cycleId, entryIds, cumulativeResonance, complexity };
  const cycles = new Map(state.cycles).set(cycleId, cycle);
  return recomputeWorldMythology({ ...state, cycles, totalCycles: cycles.size });
}

// Get entries by theme
export function getWorldMythologyEntriesByTheme(state: NarrativeWorldMythologyEngineState, theme: WorldMythologyTheme): WorldMythologyEntry[] {
  return Array.from(state.entries.values()).filter(e => e.theme === theme);
}

// Get world mythology report
export function getWorldMythologyReport(state: NarrativeWorldMythologyEngineState): {
  totalEntries: number;
  totalCycles: number;
  averageResonance: number;
  averageTruth: number;
  worldMythologyMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add world mythology entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.worldMythologyMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalCycles: state.totalCycles,
    averageResonance: Math.round(state.averageResonance * 100) / 100,
    averageTruth: Math.round(state.averageTruth * 100) / 100,
    worldMythologyMastery: Math.round(state.worldMythologyMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeWorldMythology(state: NarrativeWorldMythologyEngineState): NarrativeWorldMythologyEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const averageTruth = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.truth, 0) / entries.length;

  const cycles = Array.from(state.cycles.values());
  const cycleComplexity = cycles.length === 0 ? 0.5
    : cycles.reduce((s, c) => s + c.complexity, 0) / cycles.length;

  const worldMythologyMastery = (averageResonance * 0.4 + averageTruth * 0.3 + cycleComplexity * 0.3);

  return { ...state, averageResonance, averageTruth, cycleComplexity, worldMythologyMastery };
}

// Reset
export function resetNarrativeWorldMythologyEngineState(): NarrativeWorldMythologyEngineState {
  return createNarrativeWorldMythologyEngineState();
}