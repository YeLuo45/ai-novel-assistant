/**
 * V1382 NarrativeCharacterBackstoryEngine — Direction K Iter 9/30 (Round 5)
 * Character backstory engine: history of character
 * Sources: ruflo backstory + nanobot + thunderbolt
 */

export type CharacterBackstoryLayer = 'childhood' | 'youth' | 'formative' | 'trauma' | 'triumph' | 'revelation' | 'transcendent';
export type CharacterBackstoryVisibility = 'hidden' | 'implied' | 'partial' | 'revealed' | 'complete' | 'omniscient' | 'transcendent';
export type CharacterBackstoryImpact = 'negligible' | 'minor' | 'moderate' | 'major' | 'defining' | 'absolute' | 'transcendent';

export interface CharacterBackstoryEntry {
  entryId: string;
  layer: CharacterBackstoryLayer;
  visibility: CharacterBackstoryVisibility;
  impact: CharacterBackstoryImpact;
  description: string;
  resonance: number;
  mystery: number;
  chapter: number;
}

export interface CharacterBackstoryChronicle {
  chronicleId: string,
  entryIds: string[],
  cumulativeResonance: number,
  depth: number,
}

export interface NarrativeCharacterBackstoryEngineState {
  entries: Map<string, CharacterBackstoryEntry>;
  chronicles: Map<string, CharacterBackstoryChronicle>;
  totalEntries: number;
  totalChronicles: number;
  averageResonance: number;
  averageMystery: number;
  chronicleDepth: number;
  characterBackstoryMastery: number;
}

// Factory
export function createNarrativeCharacterBackstoryEngineState(): NarrativeCharacterBackstoryEngineState {
  return {
    entries: new Map(),
    chronicles: new Map(),
    totalEntries: 0,
    totalChronicles: 0,
    averageResonance: 0.5,
    averageMystery: 0.5,
    chronicleDepth: 0.5,
    characterBackstoryMastery: 0.5,
  };
}

// Add entry
export function addCharacterBackstoryEntry(
  state: NarrativeCharacterBackstoryEngineState,
  entryId: string,
  layer: CharacterBackstoryLayer,
  visibility: CharacterBackstoryVisibility,
  impact: CharacterBackstoryImpact,
  description: string,
  resonance: number,
  mystery: number,
  chapter: number
): NarrativeCharacterBackstoryEngineState {
  const entry: CharacterBackstoryEntry = { entryId, layer, visibility, impact, description, resonance, mystery, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeCharacterBackstory({ ...state, entries, totalEntries: entries.size });
}

// Add chronicle
export function addCharacterBackstoryChronicle(
  state: NarrativeCharacterBackstoryEngineState,
  chronicleId: string,
  entryIds: string[]
): NarrativeCharacterBackstoryEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is CharacterBackstoryEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const layerSet = new Set(entries.map(e => e.layer));
  const depth = Math.min(1, layerSet.size / 7);
  const chronicle: CharacterBackstoryChronicle = { chronicleId, entryIds, cumulativeResonance, depth };
  const chronicles = new Map(state.chronicles).set(chronicleId, chronicle);
  return recomputeCharacterBackstory({ ...state, chronicles, totalChronicles: chronicles.size });
}

// Get entries by layer
export function getCharacterBackstoryEntriesByLayer(state: NarrativeCharacterBackstoryEngineState, layer: CharacterBackstoryLayer): CharacterBackstoryEntry[] {
  return Array.from(state.entries.values()).filter(e => e.layer === layer);
}

// Get character backstory report
export function getCharacterBackstoryReport(state: NarrativeCharacterBackstoryEngineState): {
  totalEntries: number;
  totalChronicles: number;
  averageResonance: number;
  averageMystery: number;
  characterBackstoryMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add character backstory entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.characterBackstoryMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalChronicles: state.totalChronicles,
    averageResonance: Math.round(state.averageResonance * 100) / 100,
    averageMystery: Math.round(state.averageMystery * 100) / 100,
    characterBackstoryMastery: Math.round(state.characterBackstoryMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeCharacterBackstory(state: NarrativeCharacterBackstoryEngineState): NarrativeCharacterBackstoryEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const averageMystery = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.mystery, 0) / entries.length;

  const chronicles = Array.from(state.chronicles.values());
  const chronicleDepth = chronicles.length === 0 ? 0.5
    : chronicles.reduce((s, c) => s + c.depth, 0) / chronicles.length;

  const characterBackstoryMastery = (averageResonance * 0.4 + averageMystery * 0.3 + chronicleDepth * 0.3);

  return { ...state, averageResonance, averageMystery, chronicleDepth, characterBackstoryMastery };
}

// Reset
export function resetNarrativeCharacterBackstoryEngineState(): NarrativeCharacterBackstoryEngineState {
  return createNarrativeCharacterBackstoryEngineState();
}