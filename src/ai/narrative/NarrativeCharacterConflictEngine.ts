/**
 * V1386 NarrativeCharacterConflictEngine — Direction K Iter 11/30 (Round 5)
 * Character conflict engine: internal/external conflicts
 * Sources: thunderbolt conflict + nanobot + ruflo
 */

export type CharacterConflictType = 'internal' | 'interpersonal' | 'social' | 'situational' | 'cosmic' | 'existential' | 'transcendent';
export type CharacterConflictIntensity = 'mild' | 'moderate' | 'intense' | 'severe' | 'extreme' | 'absolute' | 'transcendent';
export type CharacterConflictResolution = 'avoided' | 'delayed' | 'partial' | 'complete' | 'transformative' | 'transcendent' | 'infinite';

export interface CharacterConflictEntry {
  entryId: string;
  type: CharacterConflictType;
  intensity: CharacterConflictIntensity;
  resolution: CharacterConflictResolution;
  description: string;
  tension: number;
  stakes: number;
  chapter: number;
}

export interface CharacterConflictWeb {
  webId: string,
  entryIds: string[],
  cumulativeTension: number,
  complexity: number,
}

export interface NarrativeCharacterConflictEngineState {
  entries: Map<string, CharacterConflictEntry>;
  webs: Map<string, CharacterConflictWeb>;
  totalEntries: number;
  totalWebs: number;
  averageTension: number;
  averageStakes: number;
  webComplexity: number;
  characterConflictMastery: number;
}

export function createNarrativeCharacterConflictEngineState(): NarrativeCharacterConflictEngineState {
  return { entries: new Map(), webs: new Map(), totalEntries: 0, totalWebs: 0, averageTension: 0.5, averageStakes: 0.5, webComplexity: 0.5, characterConflictMastery: 0.5 };
}

export function addCharacterConflictEntry(state: NarrativeCharacterConflictEngineState, entryId: string, type: CharacterConflictType, intensity: CharacterConflictIntensity, resolution: CharacterConflictResolution, description: string, tension: number, stakes: number, chapter: number): NarrativeCharacterConflictEngineState {
  const entry: CharacterConflictEntry = { entryId, type, intensity, resolution, description, tension, stakes, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}

export function addCharacterConflictWeb(state: NarrativeCharacterConflictEngineState, webId: string, entryIds: string[]): NarrativeCharacterConflictEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is CharacterConflictEntry => e !== undefined);
  const cumulativeTension = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.tension, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const complexity = Math.min(1, typeSet.size / 7);
  const web: CharacterConflictWeb = { webId, entryIds, cumulativeTension, complexity };
  return recompute({ ...state, webs: new Map(state.webs).set(webId, web), totalWebs: state.webs.size + 1 });
}

export function getCharacterConflictEntriesByType(state: NarrativeCharacterConflictEngineState, type: CharacterConflictType): CharacterConflictEntry[] {
  return Array.from(state.entries.values()).filter(e => e.type === type);
}

export function getCharacterConflictReport(state: NarrativeCharacterConflictEngineState): { totalEntries: number; totalWebs: number; averageTension: number; averageStakes: number; characterConflictMastery: number; recommendations: string[] } {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add character conflict entries');
  if (state.averageTension < 0.5) recommendations.push('Low tension — strengthen');
  if (state.characterConflictMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalWebs: state.totalWebs, averageTension: Math.round(state.averageTension * 100) / 100, averageStakes: Math.round(state.averageStakes * 100) / 100, characterConflictMastery: Math.round(state.characterConflictMastery * 100) / 100, recommendations };
}

function recompute(state: NarrativeCharacterConflictEngineState): NarrativeCharacterConflictEngineState {
  const entries = Array.from(state.entries.values());
  const averageTension = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.tension, 0) / entries.length;
  const averageStakes = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.stakes, 0) / entries.length;
  const webs = Array.from(state.webs.values());
  const webComplexity = webs.length === 0 ? 0.5 : webs.reduce((s, w) => s + w.complexity, 0) / webs.length;
  const characterConflictMastery = (averageTension * 0.4 + averageStakes * 0.3 + webComplexity * 0.3);
  return { ...state, averageTension, averageStakes, webComplexity, characterConflictMastery };
}

export function resetNarrativeCharacterConflictEngineState(): NarrativeCharacterConflictEngineState {
  return createNarrativeCharacterConflictEngineState();
}