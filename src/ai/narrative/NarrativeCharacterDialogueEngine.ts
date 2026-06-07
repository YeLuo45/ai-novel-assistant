/**
 * V1380 NarrativeCharacterDialogueEngine — Direction K Iter 8/30 (Round 5)
 * Character dialogue engine: dialogue patterns of character
 * Sources: thunderbolt dialogue + nanobot + ruflo
 */

export type CharacterDialogueFunction = 'reveal' | 'conceal' | 'connect' | 'conflict' | 'express' | 'manipulate' | 'transcendent';
export type CharacterDialogueStyle = 'terse' | 'measured' | 'verbose' | 'poetic' | 'colloquial' | 'sublime' | 'transcendent';
export type CharacterDialogueSubtext = 'absent' | 'subtle' | 'moderate' | 'deep' | 'profound' | 'infinite' | 'transcendent';

export interface CharacterDialogueEntry {
  entryId: string;
  function: CharacterDialogueFunction;
  style: CharacterDialogueStyle;
  subtext: CharacterDialogueSubtext;
  description: string;
  naturalness: number;
  impact: number;
  chapter: number;
}

export interface CharacterDialogueExchange {
  exchangeId: string,
  entryIds: string[],
  cumulativeNaturalness: number,
  range: number,
}

export interface NarrativeCharacterDialogueEngineState {
  entries: Map<string, CharacterDialogueEntry>;
  exchanges: Map<string, CharacterDialogueExchange>;
  totalEntries: number;
  totalExchanges: number;
  averageNaturalness: number;
  averageImpact: number;
  exchangeRange: number;
  characterDialogueMastery: number;
}

// Factory
export function createNarrativeCharacterDialogueEngineState(): NarrativeCharacterDialogueEngineState {
  return {
    entries: new Map(),
    exchanges: new Map(),
    totalEntries: 0,
    totalExchanges: 0,
    averageNaturalness: 0.5,
    averageImpact: 0.5,
    exchangeRange: 0.5,
    characterDialogueMastery: 0.5,
  };
}

// Add entry
export function addCharacterDialogueEntry(
  state: NarrativeCharacterDialogueEngineState,
  entryId: string,
  function_: CharacterDialogueFunction,
  style: CharacterDialogueStyle,
  subtext: CharacterDialogueSubtext,
  description: string,
  naturalness: number,
  impact: number,
  chapter: number
): NarrativeCharacterDialogueEngineState {
  const entry: CharacterDialogueEntry = { entryId, function: function_, style, subtext, description, naturalness, impact, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeCharacterDialogue({ ...state, entries, totalEntries: entries.size });
}

// Add exchange
export function addCharacterDialogueExchange(
  state: NarrativeCharacterDialogueEngineState,
  exchangeId: string,
  entryIds: string[]
): NarrativeCharacterDialogueEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is CharacterDialogueEntry => e !== undefined);
  const cumulativeNaturalness = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.naturalness, 0) / entries.length;
  const functionSet = new Set(entries.map(e => e.function));
  const range = Math.min(1, functionSet.size / 7);
  const exchange: CharacterDialogueExchange = { exchangeId, entryIds, cumulativeNaturalness, range };
  const exchanges = new Map(state.exchanges).set(exchangeId, exchange);
  return recomputeCharacterDialogue({ ...state, exchanges, totalExchanges: exchanges.size });
}

// Get entries by function
export function getCharacterDialogueEntriesByFunction(state: NarrativeCharacterDialogueEngineState, function_: CharacterDialogueFunction): CharacterDialogueEntry[] {
  return Array.from(state.entries.values()).filter(e => e.function === function_);
}

// Get character dialogue report
export function getCharacterDialogueReport(state: NarrativeCharacterDialogueEngineState): {
  totalEntries: number;
  totalExchanges: number;
  averageNaturalness: number;
  averageImpact: number;
  characterDialogueMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add character dialogue entries');
  if (state.averageNaturalness < 0.5) recommendations.push('Low naturalness — strengthen');
  if (state.characterDialogueMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalExchanges: state.totalExchanges,
    averageNaturalness: Math.round(state.averageNaturalness * 100) / 100,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    characterDialogueMastery: Math.round(state.characterDialogueMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeCharacterDialogue(state: NarrativeCharacterDialogueEngineState): NarrativeCharacterDialogueEngineState {
  const entries = Array.from(state.entries.values());
  const averageNaturalness = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.naturalness, 0) / entries.length;
  const averageImpact = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.impact, 0) / entries.length;

  const exchanges = Array.from(state.exchanges.values());
  const exchangeRange = exchanges.length === 0 ? 0.5
    : exchanges.reduce((s, ex) => s + ex.range, 0) / exchanges.length;

  const characterDialogueMastery = (averageNaturalness * 0.4 + averageImpact * 0.3 + exchangeRange * 0.3);

  return { ...state, averageNaturalness, averageImpact, exchangeRange, characterDialogueMastery };
}

// Reset
export function resetNarrativeCharacterDialogueEngineState(): NarrativeCharacterDialogueEngineState {
  return createNarrativeCharacterDialogueEngineState();
}