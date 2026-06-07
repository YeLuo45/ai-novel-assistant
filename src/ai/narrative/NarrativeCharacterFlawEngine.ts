/**
 * V1372 NarrativeCharacterFlawEngine — Direction K Iter 4/30 (Round 5)
 * Character flaw engine: flaws that drive character
 * Sources: nanobot flaw + thunderbolt + ruflo
 */

export type CharacterFlawType = 'pride' | 'envy' | 'wrath' | 'sloth' | 'greed' | 'gluttony' | 'lust' | 'fear' | 'shame' | 'doubt' | 'naivete' | 'stubbornness' | 'impulsiveness' | 'dishonesty' | 'cowardice' | 'arrogance' | 'self_doubt' | 'prejudice';
export type CharacterFlawSeverity = 'minor' | 'moderate' | 'major' | 'critical' | 'defining' | 'tragic' | 'transcendent';
export type CharacterFlawAwareness = 'unconscious' | 'denied' | 'hidden' | 'partial' | 'acknowledged' | 'embraced' | 'transcendent';

export interface CharacterFlawEntry {
  entryId: string;
  type: CharacterFlawType;
  severity: CharacterFlawSeverity;
  awareness: CharacterFlawAwareness;
  description: string;
  impact: number;
  authenticity: number;
  chapter: number;
}

export interface CharacterFlawSet {
  setId: string,
  entryIds: string[],
  cumulativeImpact: number,
  richness: number,
}

export interface NarrativeCharacterFlawEngineState {
  entries: Map<string, CharacterFlawEntry>;
  sets: Map<string, CharacterFlawSet>;
  totalEntries: number;
  totalSets: number;
  averageImpact: number;
  averageAuthenticity: number;
  setRichness: number;
  characterFlawMastery: number;
}

// Factory
export function createNarrativeCharacterFlawEngineState(): NarrativeCharacterFlawEngineState {
  return {
    entries: new Map(),
    sets: new Map(),
    totalEntries: 0,
    totalSets: 0,
    averageImpact: 0.5,
    averageAuthenticity: 0.5,
    setRichness: 0.5,
    characterFlawMastery: 0.5,
  };
}

// Add entry
export function addCharacterFlawEntry(
  state: NarrativeCharacterFlawEngineState,
  entryId: string,
  type: CharacterFlawType,
  severity: CharacterFlawSeverity,
  awareness: CharacterFlawAwareness,
  description: string,
  impact: number,
  authenticity: number,
  chapter: number
): NarrativeCharacterFlawEngineState {
  const entry: CharacterFlawEntry = { entryId, type, severity, awareness, description, impact, authenticity, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeCharacterFlaw({ ...state, entries, totalEntries: entries.size });
}

// Add set
export function addCharacterFlawSet(
  state: NarrativeCharacterFlawEngineState,
  setId: string,
  entryIds: string[]
): NarrativeCharacterFlawEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is CharacterFlawEntry => e !== undefined);
  const cumulativeImpact = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.impact, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const richness = Math.min(1, typeSet.size / 7);
  const set: CharacterFlawSet = { setId, entryIds, cumulativeImpact, richness };
  const sets = new Map(state.sets).set(setId, set);
  return recomputeCharacterFlaw({ ...state, sets, totalSets: sets.size });
}

// Get entries by type
export function getCharacterFlawEntriesByType(state: NarrativeCharacterFlawEngineState, type: CharacterFlawType): CharacterFlawEntry[] {
  return Array.from(state.entries.values()).filter(e => e.type === type);
}

// Get character flaw report
export function getCharacterFlawReport(state: NarrativeCharacterFlawEngineState): {
  totalEntries: number;
  totalSets: number;
  averageImpact: number;
  averageAuthenticity: number;
  characterFlawMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add character flaw entries');
  if (state.averageImpact < 0.5) recommendations.push('Low impact — strengthen');
  if (state.characterFlawMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalSets: state.totalSets,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    averageAuthenticity: Math.round(state.averageAuthenticity * 100) / 100,
    characterFlawMastery: Math.round(state.characterFlawMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeCharacterFlaw(state: NarrativeCharacterFlawEngineState): NarrativeCharacterFlawEngineState {
  const entries = Array.from(state.entries.values());
  const averageImpact = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.impact, 0) / entries.length;
  const averageAuthenticity = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.authenticity, 0) / entries.length;

  const sets = Array.from(state.sets.values());
  const setRichness = sets.length === 0 ? 0.5
    : sets.reduce((s, st) => s + st.richness, 0) / sets.length;

  const characterFlawMastery = (averageImpact * 0.4 + averageAuthenticity * 0.3 + setRichness * 0.3);

  return { ...state, averageImpact, averageAuthenticity, setRichness, characterFlawMastery };
}

// Reset
export function resetNarrativeCharacterFlawEngineState(): NarrativeCharacterFlawEngineState {
  return createNarrativeCharacterFlawEngineState();
}