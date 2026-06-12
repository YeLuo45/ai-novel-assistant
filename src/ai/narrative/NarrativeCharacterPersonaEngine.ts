/**
 * V1412 NarrativeCharacterPersonaEngine — Direction K Iter 24/30 (Round 5)
 * Character persona engine: social persona of character
 * Sources: ruflo persona + nanobot + thunderbolt
 */

export type CharacterPersonaRole = 'parent' | 'child' | 'leader' | 'follower' | 'lover' | 'stranger' | 'transcendent';
export type CharacterPersonaConsistency = 'chaotic' | 'variable' | 'mostly' | 'consistent' | 'reliable' | 'absolute' | 'transcendent';
export type CharacterPersonaAuthenticity = 'fake' | 'performed' | 'mostly_real' | 'authentic' | 'transparent' | 'infinite' | 'transcendent';

export interface CharacterPersonaEntry {
  entryId: string;
  role: CharacterPersonaRole;
  consistency: CharacterPersonaConsistency;
  authenticity: CharacterPersonaAuthenticity;
  description: string;
  socialFit: number;
  authenticity_score: number;
  chapter: number;
}

export interface CharacterPersonaSet {
  setId: string,
  entryIds: string[],
  cumulativeSocialFit: number,
  range: number,
}

export interface NarrativeCharacterPersonaEngineState {
  entries: Map<string, CharacterPersonaEntry>;
  sets: Map<string, CharacterPersonaSet>;
  totalEntries: number;
  totalSets: number;
  averageSocialFit: number;
  averageAuthenticity: number;
  setRange: number;
  characterPersonaMastery: number;
}

export function createNarrativeCharacterPersonaEngineState(): NarrativeCharacterPersonaEngineState {
  return { entries: new Map(), sets: new Map(), totalEntries: 0, totalSets: 0, averageSocialFit: 0.5, averageAuthenticity: 0.5, setRange: 0.5, characterPersonaMastery: 0.5 };
}

export function addCharacterPersonaEntry(state: NarrativeCharacterPersonaEngineState, entryId: string, role: CharacterPersonaRole, consistency: CharacterPersonaConsistency, authenticity: CharacterPersonaAuthenticity, description: string, socialFit: number, authenticityScore: number, chapter: number): NarrativeCharacterPersonaEngineState {
  const entry: CharacterPersonaEntry = { entryId, role, consistency, authenticity, description, socialFit, authenticity_score: authenticityScore, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}

export function addCharacterPersonaSet(state: NarrativeCharacterPersonaEngineState, setId: string, entryIds: string[]): NarrativeCharacterPersonaEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is CharacterPersonaEntry => e !== undefined);
  const cumulativeSocialFit = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.socialFit, 0) / entries.length;
  const roleSet = new Set(entries.map(e => e.role));
  const range = Math.min(1, roleSet.size / 7);
  const set: CharacterPersonaSet = { setId, entryIds, cumulativeSocialFit, range };
  return recompute({ ...state, sets: new Map(state.sets).set(setId, set), totalSets: state.sets.size + 1 });
}

export function getCharacterPersonaEntriesByRole(state: NarrativeCharacterPersonaEngineState, role: CharacterPersonaRole): CharacterPersonaEntry[] {
  return Array.from(state.entries.values()).filter(e => e.role === role);
}

export function getCharacterPersonaReport(state: NarrativeCharacterPersonaEngineState): { totalEntries: number; totalSets: number; averageSocialFit: number; averageAuthenticity: number; characterPersonaMastery: number; recommendations: string[] } {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add character persona entries');
  if (state.averageSocialFit < 0.5) recommendations.push('Low social fit — strengthen');
  if (state.characterPersonaMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalSets: state.totalSets, averageSocialFit: Math.round(state.averageSocialFit * 100) / 100, averageAuthenticity: Math.round(state.averageAuthenticity * 100) / 100, characterPersonaMastery: Math.round(state.characterPersonaMastery * 100) / 100, recommendations };
}

function recompute(state: NarrativeCharacterPersonaEngineState): NarrativeCharacterPersonaEngineState {
  const entries = Array.from(state.entries.values());
  const averageSocialFit = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.socialFit, 0) / entries.length;
  const averageAuthenticity = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.authenticity_score, 0) / entries.length;
  const sets = Array.from(state.sets.values());
  const setRange = sets.length === 0 ? 0.5 : sets.reduce((s, st) => s + st.range, 0) / sets.length;
  const characterPersonaMastery = (averageSocialFit * 0.4 + averageAuthenticity * 0.3 + setRange * 0.3);
  return { ...state, averageSocialFit, averageAuthenticity, setRange, characterPersonaMastery };
}

export function resetNarrativeCharacterPersonaEngineState(): NarrativeCharacterPersonaEngineState {
  return createNarrativeCharacterPersonaEngineState();
}