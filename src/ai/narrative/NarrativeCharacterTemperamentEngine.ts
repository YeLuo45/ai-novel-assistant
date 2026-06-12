/**
 * V1414 NarrativeCharacterTemperamentEngine — Direction K Iter 25/30 (Round 5)
 * Character temperament engine: temperament of character
 * Sources: nanobot temperament + thunderbolt + ruflo
 */

export type CharacterTemperament = 'sanguine' | 'choleric' | 'melancholic' | 'phlegmatic' | 'transcendent' | 'absolute' | 'infinite';
export type CharacterTemperamentStability = 'volatile' | 'variable' | 'mostly_stable' | 'stable' | 'rock_solid' | 'absolute' | 'transcendent';
export type CharacterTemperamentExpression = 'restrained' | 'measured' | 'expressive' | 'intense' | 'overwhelming' | 'absolute' | 'transcendent';

export interface CharacterTemperamentEntry {
  entryId: string;
  temperament: CharacterTemperament;
  stability: CharacterTemperamentStability;
  expression: CharacterTemperamentExpression;
  description: string;
  presence: number;
  impact: number;
  chapter: number;
}

export interface CharacterTemperamentProfile {
  profileId: string,
  entryIds: string[],
  cumulativePresence: number,
  complexity: number,
}

export interface NarrativeCharacterTemperamentEngineState {
  entries: Map<string, CharacterTemperamentEntry>;
  profiles: Map<string, CharacterTemperamentProfile>;
  totalEntries: number;
  totalProfiles: number;
  averagePresence: number;
  averageImpact: number;
  profileComplexity: number;
  characterTemperamentMastery: number;
}

export function createNarrativeCharacterTemperamentEngineState(): NarrativeCharacterTemperamentEngineState {
  return { entries: new Map(), profiles: new Map(), totalEntries: 0, totalProfiles: 0, averagePresence: 0.5, averageImpact: 0.5, profileComplexity: 0.5, characterTemperamentMastery: 0.5 };
}

export function addCharacterTemperamentEntry(state: NarrativeCharacterTemperamentEngineState, entryId: string, temperament: CharacterTemperament, stability: CharacterTemperamentStability, expression: CharacterTemperamentExpression, description: string, presence: number, impact: number, chapter: number): NarrativeCharacterTemperamentEngineState {
  const entry: CharacterTemperamentEntry = { entryId, temperament, stability, expression, description, presence, impact, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}

export function addCharacterTemperamentProfile(state: NarrativeCharacterTemperamentEngineState, profileId: string, entryIds: string[]): NarrativeCharacterTemperamentEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is CharacterTemperamentEntry => e !== undefined);
  const cumulativePresence = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.presence, 0) / entries.length;
  const temperamentSet = new Set(entries.map(e => e.temperament));
  const complexity = Math.min(1, temperamentSet.size / 7);
  const profile: CharacterTemperamentProfile = { profileId, entryIds, cumulativePresence, complexity };
  return recompute({ ...state, profiles: new Map(state.profiles).set(profileId, profile), totalProfiles: state.profiles.size + 1 });
}

export function getCharacterTemperamentEntriesByTemperament(state: NarrativeCharacterTemperamentEngineState, temperament: CharacterTemperament): CharacterTemperamentEntry[] {
  return Array.from(state.entries.values()).filter(e => e.temperament === temperament);
}

export function getCharacterTemperamentReport(state: NarrativeCharacterTemperamentEngineState): { totalEntries: number; totalProfiles: number; averagePresence: number; averageImpact: number; characterTemperamentMastery: number; recommendations: string[] } {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add character temperament entries');
  if (state.averagePresence < 0.5) recommendations.push('Low presence — strengthen');
  if (state.characterTemperamentMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalProfiles: state.totalProfiles, averagePresence: Math.round(state.averagePresence * 100) / 100, averageImpact: Math.round(state.averageImpact * 100) / 100, characterTemperamentMastery: Math.round(state.characterTemperamentMastery * 100) / 100, recommendations };
}

function recompute(state: NarrativeCharacterTemperamentEngineState): NarrativeCharacterTemperamentEngineState {
  const entries = Array.from(state.entries.values());
  const averagePresence = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.presence, 0) / entries.length;
  const averageImpact = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.impact, 0) / entries.length;
  const profiles = Array.from(state.profiles.values());
  const profileComplexity = profiles.length === 0 ? 0.5 : profiles.reduce((s, p) => s + p.complexity, 0) / profiles.length;
  const characterTemperamentMastery = (averagePresence * 0.4 + averageImpact * 0.3 + profileComplexity * 0.3);
  return { ...state, averagePresence, averageImpact, profileComplexity, characterTemperamentMastery };
}

export function resetNarrativeCharacterTemperamentEngineState(): NarrativeCharacterTemperamentEngineState {
  return createNarrativeCharacterTemperamentEngineState();
}