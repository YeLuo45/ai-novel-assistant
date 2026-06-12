/**
 * V1406 NarrativeCharacterEgoEngine — Direction K Iter 21/30 (Round 5)
 * Character ego engine: conscious self of character
 * Sources: ruflo ego + nanobot + thunderbolt
 */

export type CharacterEgoFunction = 'reality_testing' | 'mediation' | 'defense' | 'synthesis' | 'mastery' | 'transcendent' | 'absolute';
export type CharacterEgoStrength = 'weak' | 'fragile' | 'moderate' | 'strong' | 'robust' | 'unbreakable' | 'transcendent';
export type CharacterEgoFlexibility = 'rigid' | 'limited' | 'moderate' | 'flexible' | 'adaptive' | 'infinite' | 'transcendent';

export interface CharacterEgoEntry {
  entryId: string;
  function: CharacterEgoFunction;
  strength: CharacterEgoStrength;
  flexibility: CharacterEgoFlexibility;
  description: string;
  coherence: number;
  balance: number;
  chapter: number;
}

export interface CharacterEgoMap {
  mapId: string,
  entryIds: string[],
  cumulativeCoherence: number,
  breadth: number,
}

export interface NarrativeCharacterEgoEngineState {
  entries: Map<string, CharacterEgoEntry>;
  maps: Map<string, CharacterEgoMap>;
  totalEntries: number;
  totalMaps: number;
  averageCoherence: number;
  averageBalance: number;
  mapBreadth: number;
  characterEgoMastery: number;
}

export function createNarrativeCharacterEgoEngineState(): NarrativeCharacterEgoEngineState {
  return { entries: new Map(), maps: new Map(), totalEntries: 0, totalMaps: 0, averageCoherence: 0.5, averageBalance: 0.5, mapBreadth: 0.5, characterEgoMastery: 0.5 };
}

export function addCharacterEgoEntry(state: NarrativeCharacterEgoEngineState, entryId: string, function_: CharacterEgoFunction, strength: CharacterEgoStrength, flexibility: CharacterEgoFlexibility, description: string, coherence: number, balance: number, chapter: number): NarrativeCharacterEgoEngineState {
  const entry: CharacterEgoEntry = { entryId, function: function_, strength, flexibility, description, coherence, balance, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}

export function addCharacterEgoMap(state: NarrativeCharacterEgoEngineState, mapId: string, entryIds: string[]): NarrativeCharacterEgoEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is CharacterEgoEntry => e !== undefined);
  const cumulativeCoherence = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.coherence, 0) / entries.length;
  const functionSet = new Set(entries.map(e => e.function));
  const breadth = Math.min(1, functionSet.size / 7);
  const map: CharacterEgoMap = { mapId, entryIds, cumulativeCoherence, breadth };
  return recompute({ ...state, maps: new Map(state.maps).set(mapId, map), totalMaps: state.maps.size + 1 });
}

export function getCharacterEgoEntriesByFunction(state: NarrativeCharacterEgoEngineState, function_: CharacterEgoFunction): CharacterEgoEntry[] {
  return Array.from(state.entries.values()).filter(e => e.function === function_);
}

export function getCharacterEgoReport(state: NarrativeCharacterEgoEngineState): { totalEntries: number; totalMaps: number; averageCoherence: number; averageBalance: number; characterEgoMastery: number; recommendations: string[] } {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add character ego entries');
  if (state.averageCoherence < 0.5) recommendations.push('Low coherence — strengthen');
  if (state.characterEgoMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalMaps: state.totalMaps, averageCoherence: Math.round(state.averageCoherence * 100) / 100, averageBalance: Math.round(state.averageBalance * 100) / 100, characterEgoMastery: Math.round(state.characterEgoMastery * 100) / 100, recommendations };
}

function recompute(state: NarrativeCharacterEgoEngineState): NarrativeCharacterEgoEngineState {
  const entries = Array.from(state.entries.values());
  const averageCoherence = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.coherence, 0) / entries.length;
  const averageBalance = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.balance, 0) / entries.length;
  const maps = Array.from(state.maps.values());
  const mapBreadth = maps.length === 0 ? 0.5 : maps.reduce((s, m) => s + m.breadth, 0) / maps.length;
  const characterEgoMastery = (averageCoherence * 0.4 + averageBalance * 0.3 + mapBreadth * 0.3);
  return { ...state, averageCoherence, averageBalance, mapBreadth, characterEgoMastery };
}

export function resetNarrativeCharacterEgoEngineState(): NarrativeCharacterEgoEngineState {
  return createNarrativeCharacterEgoEngineState();
}