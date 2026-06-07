/**
 * V1338 NarrativeWorldChemistryEngine — Direction J Iter 17/30 (Round 5)
 * World chemistry engine: chemistry of narrative world
 * Sources: thunderbolt chemistry + nanobot + ruflo
 */

export type WorldChemistryElement = 'fire' | 'water' | 'earth' | 'air' | 'aether' | 'void' | 'transcendent';
export type WorldChemistryReaction = 'simple' | 'moderate' | 'complex' | 'cascade' | 'transmutative' | 'creation' | 'transcendent';
export type WorldChemistryStability = 'unstable' | 'reactive' | 'moderate' | 'stable' | 'inert' | 'perfect' | 'transcendent';

export interface WorldChemistryEntry {
  entryId: string;
  element: WorldChemistryElement;
  reaction: WorldChemistryReaction;
  stability: WorldChemistryStability;
  description: string;
  reactivity: number;
  potential: number;
  chapter: number;
}

export interface WorldChemistryCompound {
  compoundId: string,
  entryIds: string[],
  cumulativeReactivity: number,
  complexity: number,
}

export interface NarrativeWorldChemistryEngineState {
  entries: Map<string, WorldChemistryEntry>;
  compounds: Map<string, WorldChemistryCompound>;
  totalEntries: number;
  totalCompounds: number;
  averageReactivity: number;
  averagePotential: number;
  compoundComplexity: number;
  worldChemistryMastery: number;
}

// Factory
export function createNarrativeWorldChemistryEngineState(): NarrativeWorldChemistryEngineState {
  return {
    entries: new Map(),
    compounds: new Map(),
    totalEntries: 0,
    totalCompounds: 0,
    averageReactivity: 0.5,
    averagePotential: 0.5,
    compoundComplexity: 0.5,
    worldChemistryMastery: 0.5,
  };
}

// Add entry
export function addWorldChemistryEntry(
  state: NarrativeWorldChemistryEngineState,
  entryId: string,
  element: WorldChemistryElement,
  reaction: WorldChemistryReaction,
  stability: WorldChemistryStability,
  description: string,
  reactivity: number,
  potential: number,
  chapter: number
): NarrativeWorldChemistryEngineState {
  const entry: WorldChemistryEntry = { entryId, element, reaction, stability, description, reactivity, potential, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeWorldChemistry({ ...state, entries, totalEntries: entries.size });
}

// Add compound
export function addWorldChemistryCompound(
  state: NarrativeWorldChemistryEngineState,
  compoundId: string,
  entryIds: string[]
): NarrativeWorldChemistryEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is WorldChemistryEntry => e !== undefined);
  const cumulativeReactivity = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.reactivity, 0) / entries.length;
  const elementSet = new Set(entries.map(e => e.element));
  const complexity = Math.min(1, elementSet.size / 7);
  const compound: WorldChemistryCompound = { compoundId, entryIds, cumulativeReactivity, complexity };
  const compounds = new Map(state.compounds).set(compoundId, compound);
  return recomputeWorldChemistry({ ...state, compounds, totalCompounds: compounds.size });
}

// Get entries by element
export function getWorldChemistryEntriesByElement(state: NarrativeWorldChemistryEngineState, element: WorldChemistryElement): WorldChemistryEntry[] {
  return Array.from(state.entries.values()).filter(e => e.element === element);
}

// Get world chemistry report
export function getWorldChemistryReport(state: NarrativeWorldChemistryEngineState): {
  totalEntries: number;
  totalCompounds: number;
  averageReactivity: number;
  averagePotential: number;
  worldChemistryMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add world chemistry entries');
  if (state.averageReactivity < 0.5) recommendations.push('Low reactivity — strengthen');
  if (state.worldChemistryMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalCompounds: state.totalCompounds,
    averageReactivity: Math.round(state.averageReactivity * 100) / 100,
    averagePotential: Math.round(state.averagePotential * 100) / 100,
    worldChemistryMastery: Math.round(state.worldChemistryMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeWorldChemistry(state: NarrativeWorldChemistryEngineState): NarrativeWorldChemistryEngineState {
  const entries = Array.from(state.entries.values());
  const averageReactivity = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.reactivity, 0) / entries.length;
  const averagePotential = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.potential, 0) / entries.length;

  const compounds = Array.from(state.compounds.values());
  const compoundComplexity = compounds.length === 0 ? 0.5
    : compounds.reduce((s, c) => s + c.complexity, 0) / compounds.length;

  const worldChemistryMastery = (averageReactivity * 0.4 + averagePotential * 0.3 + compoundComplexity * 0.3);

  return { ...state, averageReactivity, averagePotential, compoundComplexity, worldChemistryMastery };
}

// Reset
export function resetNarrativeWorldChemistryEngineState(): NarrativeWorldChemistryEngineState {
  return createNarrativeWorldChemistryEngineState();
}