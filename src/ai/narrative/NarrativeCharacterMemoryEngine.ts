/**
 * V1392 NarrativeCharacterMemoryEngine — Direction K Iter 14/30 (Round 5)
 * Character memory engine: memory of character
 * Sources: thunderbolt memory + nanobot + ruflo
 */

export type CharacterMemoryType = 'episodic' | 'semantic' | 'procedural' | 'emotional' | 'sensory' | 'spiritual' | 'transcendent';
export type CharacterMemoryClarity = 'foggy' | 'hazy' | 'clear' | 'vivid' | 'crystal' | 'perfect' | 'transcendent';
export type CharacterMemorySignificance = 'trivial' | 'minor' | 'moderate' | 'major' | 'defining' | 'transcendent' | 'absolute';

export interface CharacterMemoryEntry {
  entryId: string;
  type: CharacterMemoryType;
  clarity: CharacterMemoryClarity;
  significance: CharacterMemorySignificance;
  description: string;
  vividness: number;
  emotionalCharge: number;
  chapter: number;
}

export interface CharacterMemoryBank {
  bankId: string,
  entryIds: string[],
  cumulativeVividness: number,
  richness: number,
}

export interface NarrativeCharacterMemoryEngineState {
  entries: Map<string, CharacterMemoryEntry>;
  banks: Map<string, CharacterMemoryBank>;
  totalEntries: number;
  totalBanks: number;
  averageVividness: number;
  averageEmotionalCharge: number;
  bankRichness: number;
  characterMemoryMastery: number;
}

export function createNarrativeCharacterMemoryEngineState(): NarrativeCharacterMemoryEngineState {
  return { entries: new Map(), banks: new Map(), totalEntries: 0, totalBanks: 0, averageVividness: 0.5, averageEmotionalCharge: 0.5, bankRichness: 0.5, characterMemoryMastery: 0.5 };
}

export function addCharacterMemoryEntry(state: NarrativeCharacterMemoryEngineState, entryId: string, type: CharacterMemoryType, clarity: CharacterMemoryClarity, significance: CharacterMemorySignificance, description: string, vividness: number, emotionalCharge: number, chapter: number): NarrativeCharacterMemoryEngineState {
  const entry: CharacterMemoryEntry = { entryId, type, clarity, significance, description, vividness, emotionalCharge, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}

export function addCharacterMemoryBank(state: NarrativeCharacterMemoryEngineState, bankId: string, entryIds: string[]): NarrativeCharacterMemoryEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is CharacterMemoryEntry => e !== undefined);
  const cumulativeVividness = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.vividness, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const richness = Math.min(1, typeSet.size / 7);
  const bank: CharacterMemoryBank = { bankId, entryIds, cumulativeVividness, richness };
  return recompute({ ...state, banks: new Map(state.banks).set(bankId, bank), totalBanks: state.banks.size + 1 });
}

export function getCharacterMemoryEntriesByType(state: NarrativeCharacterMemoryEngineState, type: CharacterMemoryType): CharacterMemoryEntry[] {
  return Array.from(state.entries.values()).filter(e => e.type === type);
}

export function getCharacterMemoryReport(state: NarrativeCharacterMemoryEngineState): { totalEntries: number; totalBanks: number; averageVividness: number; averageEmotionalCharge: number; characterMemoryMastery: number; recommendations: string[] } {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add character memory entries');
  if (state.averageVividness < 0.5) recommendations.push('Low vividness — strengthen');
  if (state.characterMemoryMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalBanks: state.totalBanks, averageVividness: Math.round(state.averageVividness * 100) / 100, averageEmotionalCharge: Math.round(state.averageEmotionalCharge * 100) / 100, characterMemoryMastery: Math.round(state.characterMemoryMastery * 100) / 100, recommendations };
}

function recompute(state: NarrativeCharacterMemoryEngineState): NarrativeCharacterMemoryEngineState {
  const entries = Array.from(state.entries.values());
  const averageVividness = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.vividness, 0) / entries.length;
  const averageEmotionalCharge = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.emotionalCharge, 0) / entries.length;
  const banks = Array.from(state.banks.values());
  const bankRichness = banks.length === 0 ? 0.5 : banks.reduce((s, b) => s + b.richness, 0) / banks.length;
  const characterMemoryMastery = (averageVividness * 0.4 + averageEmotionalCharge * 0.3 + bankRichness * 0.3);
  return { ...state, averageVividness, averageEmotionalCharge, bankRichness, characterMemoryMastery };
}

export function resetNarrativeCharacterMemoryEngineState(): NarrativeCharacterMemoryEngineState {
  return createNarrativeCharacterMemoryEngineState();
}