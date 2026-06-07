/**
 * V1394 NarrativeCharacterDesireEngine — Direction K Iter 15/30 (Round 5)
 * Character desire engine: desires of character
 * Sources: ruflo desire + nanobot + thunderbolt
 */

export type CharacterDesireObject = 'physical' | 'emotional' | 'intellectual' | 'social' | 'spiritual' | 'transcendent' | 'absolute';
export type CharacterDesireIntensity = 'latent' | 'faint' | 'present' | 'strong' | 'consuming' | 'absolute' | 'transcendent';
export type CharacterDesireContradiction = 'aligned' | 'compatible' | 'tension' | 'conflicting' | 'paradoxical' | 'transcendent' | 'infinite';

export interface CharacterDesireEntry {
  entryId: string;
  object: CharacterDesireObject;
  intensity: CharacterDesireIntensity;
  contradiction: CharacterDesireContradiction;
  description: string;
  yearning: number;
  pain: number;
  chapter: number;
}

export interface CharacterDesireMap {
  mapId: string,
  entryIds: string[],
  cumulativeYearning: number,
  tension: number,
}

export interface NarrativeCharacterDesireEngineState {
  entries: Map<string, CharacterDesireEntry>;
  maps: Map<string, CharacterDesireMap>;
  totalEntries: number;
  totalMaps: number;
  averageYearning: number;
  averagePain: number;
  mapTension: number;
  characterDesireMastery: number;
}

export function createNarrativeCharacterDesireEngineState(): NarrativeCharacterDesireEngineState {
  return { entries: new Map(), maps: new Map(), totalEntries: 0, totalMaps: 0, averageYearning: 0.5, averagePain: 0.5, mapTension: 0.5, characterDesireMastery: 0.5 };
}

export function addCharacterDesireEntry(state: NarrativeCharacterDesireEngineState, entryId: string, object: CharacterDesireObject, intensity: CharacterDesireIntensity, contradiction: CharacterDesireContradiction, description: string, yearning: number, pain: number, chapter: number): NarrativeCharacterDesireEngineState {
  const entry: CharacterDesireEntry = { entryId, object, intensity, contradiction, description, yearning, pain, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}

export function addCharacterDesireMap(state: NarrativeCharacterDesireEngineState, mapId: string, entryIds: string[]): NarrativeCharacterDesireEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is CharacterDesireEntry => e !== undefined);
  const cumulativeYearning = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.yearning, 0) / entries.length;
  const objectSet = new Set(entries.map(e => e.object));
  const tension = Math.min(1, objectSet.size / 7);
  const map: CharacterDesireMap = { mapId, entryIds, cumulativeYearning, tension };
  return recompute({ ...state, maps: new Map(state.maps).set(mapId, map), totalMaps: state.maps.size + 1 });
}

export function getCharacterDesireEntriesByObject(state: NarrativeCharacterDesireEngineState, object: CharacterDesireObject): CharacterDesireEntry[] {
  return Array.from(state.entries.values()).filter(e => e.object === object);
}

export function getCharacterDesireReport(state: NarrativeCharacterDesireEngineState): { totalEntries: number; totalMaps: number; averageYearning: number; averagePain: number; characterDesireMastery: number; recommendations: string[] } {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add character desire entries');
  if (state.averageYearning < 0.5) recommendations.push('Low yearning — strengthen');
  if (state.characterDesireMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalMaps: state.totalMaps, averageYearning: Math.round(state.averageYearning * 100) / 100, averagePain: Math.round(state.averagePain * 100) / 100, characterDesireMastery: Math.round(state.characterDesireMastery * 100) / 100, recommendations };
}

function recompute(state: NarrativeCharacterDesireEngineState): NarrativeCharacterDesireEngineState {
  const entries = Array.from(state.entries.values());
  const averageYearning = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.yearning, 0) / entries.length;
  const averagePain = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.pain, 0) / entries.length;
  const maps = Array.from(state.maps.values());
  const mapTension = maps.length === 0 ? 0.5 : maps.reduce((s, m) => s + m.tension, 0) / maps.length;
  const characterDesireMastery = (averageYearning * 0.4 + averagePain * 0.3 + mapTension * 0.3);
  return { ...state, averageYearning, averagePain, mapTension, characterDesireMastery };
}

export function resetNarrativeCharacterDesireEngineState(): NarrativeCharacterDesireEngineState {
  return createNarrativeCharacterDesireEngineState();
}