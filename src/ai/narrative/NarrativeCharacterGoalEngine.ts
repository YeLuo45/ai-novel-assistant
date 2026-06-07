/**
 * V1384 NarrativeCharacterGoalEngine — Direction K Iter 10/30 (Round 5)
 * Character goal engine: goals that drive character
 * Sources: nanobot goal + thunderbolt + ruflo
 */

export type CharacterGoalScope = 'immediate' | 'short_term' | 'long_term' | 'lifetime' | 'generational' | 'eternal' | 'transcendent';
export type CharacterGoalClarity = 'vague' | 'shifting' | 'defined' | 'precise' | 'crystalline' | 'absolute' | 'transcendent';
export type CharacterGoalAttainability = 'impossible' | 'unlikely' | 'possible' | 'probable' | 'inevitable' | 'guaranteed' | 'transcendent';

export interface CharacterGoalEntry {
  entryId: string;
  scope: CharacterGoalScope;
  clarity: CharacterGoalClarity;
  attainability: CharacterGoalAttainability;
  description: string;
  urgency: number;
  motivation: number;
  chapter: number;
}

export interface CharacterGoalHierarchy {
  hierarchyId: string,
  entryIds: string[],
  cumulativeUrgency: number,
  coherence: number,
}

export interface NarrativeCharacterGoalEngineState {
  entries: Map<string, CharacterGoalEntry>;
  hierarchies: Map<string, CharacterGoalHierarchy>;
  totalEntries: number;
  totalHierarchies: number;
  averageUrgency: number;
  averageMotivation: number;
  hierarchyCoherence: number;
  characterGoalMastery: number;
}

// Factory
export function createNarrativeCharacterGoalEngineState(): NarrativeCharacterGoalEngineState {
  return {
    entries: new Map(),
    hierarchies: new Map(),
    totalEntries: 0,
    totalHierarchies: 0,
    averageUrgency: 0.5,
    averageMotivation: 0.5,
    hierarchyCoherence: 0.5,
    characterGoalMastery: 0.5,
  };
}

// Add entry
export function addCharacterGoalEntry(
  state: NarrativeCharacterGoalEngineState,
  entryId: string,
  scope: CharacterGoalScope,
  clarity: CharacterGoalClarity,
  attainability: CharacterGoalAttainability,
  description: string,
  urgency: number,
  motivation: number,
  chapter: number
): NarrativeCharacterGoalEngineState {
  const entry: CharacterGoalEntry = { entryId, scope, clarity, attainability, description, urgency, motivation, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeCharacterGoal({ ...state, entries, totalEntries: entries.size });
}

// Add hierarchy
export function addCharacterGoalHierarchy(
  state: NarrativeCharacterGoalEngineState,
  hierarchyId: string,
  entryIds: string[]
): NarrativeCharacterGoalEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is CharacterGoalEntry => e !== undefined);
  const cumulativeUrgency = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.urgency, 0) / entries.length;
  const scopeSet = new Set(entries.map(e => e.scope));
  const coherence = Math.min(1, scopeSet.size / 7);
  const hierarchy: CharacterGoalHierarchy = { hierarchyId, entryIds, cumulativeUrgency, coherence };
  const hierarchies = new Map(state.hierarchies).set(hierarchyId, hierarchy);
  return recomputeCharacterGoal({ ...state, hierarchies, totalHierarchies: hierarchies.size });
}

// Get entries by scope
export function getCharacterGoalEntriesByScope(state: NarrativeCharacterGoalEngineState, scope: CharacterGoalScope): CharacterGoalEntry[] {
  return Array.from(state.entries.values()).filter(e => e.scope === scope);
}

// Get character goal report
export function getCharacterGoalReport(state: NarrativeCharacterGoalEngineState): {
  totalEntries: number;
  totalHierarchies: number;
  averageUrgency: number;
  averageMotivation: number;
  characterGoalMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add character goal entries');
  if (state.averageUrgency < 0.5) recommendations.push('Low urgency — strengthen');
  if (state.characterGoalMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalHierarchies: state.totalHierarchies,
    averageUrgency: Math.round(state.averageUrgency * 100) / 100,
    averageMotivation: Math.round(state.averageMotivation * 100) / 100,
    characterGoalMastery: Math.round(state.characterGoalMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeCharacterGoal(state: NarrativeCharacterGoalEngineState): NarrativeCharacterGoalEngineState {
  const entries = Array.from(state.entries.values());
  const averageUrgency = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.urgency, 0) / entries.length;
  const averageMotivation = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.motivation, 0) / entries.length;

  const hierarchies = Array.from(state.hierarchies.values());
  const hierarchyCoherence = hierarchies.length === 0 ? 0.5
    : hierarchies.reduce((s, h) => s + h.coherence, 0) / hierarchies.length;

  const characterGoalMastery = (averageUrgency * 0.4 + averageMotivation * 0.3 + hierarchyCoherence * 0.3);

  return { ...state, averageUrgency, averageMotivation, hierarchyCoherence, characterGoalMastery };
}

// Reset
export function resetNarrativeCharacterGoalEngineState(): NarrativeCharacterGoalEngineState {
  return createNarrativeCharacterGoalEngineState();
}