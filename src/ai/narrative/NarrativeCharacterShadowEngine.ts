/**
 * V1404 NarrativeCharacterShadowEngine — Direction K Iter 20/30 (Round 5)
 * Character shadow engine: shadow self of character
 * Sources: thunderbolt shadow + nanobot + ruflo
 */

export type CharacterShadowAspect = 'repressed' | 'denied' | 'feared' | 'desired' | 'integrated' | 'transcendent' | 'absolute';
export type CharacterShadowStrength = 'faint' | 'present' | 'strong' | 'dominant' | 'overwhelming' | 'absolute' | 'transcendent';
export type CharacterShadowIntegration = 'none' | 'partial' | 'mostly' | 'full' | 'unified' | 'transcendent' | 'infinite';

export interface CharacterShadowEntry {
  entryId: string;
  aspect: CharacterShadowAspect;
  strength: CharacterShadowStrength;
  integration: CharacterShadowIntegration;
  description: string;
  darkness: number;
  gift: number;
  chapter: number;
}

export interface CharacterShadowProfile {
  profileId: string,
  entryIds: string[],
  cumulativeDarkness: number,
  depth: number,
}

export interface NarrativeCharacterShadowEngineState {
  entries: Map<string, CharacterShadowEntry>;
  profiles: Map<string, CharacterShadowProfile>;
  totalEntries: number;
  totalProfiles: number;
  averageDarkness: number;
  averageGift: number;
  profileDepth: number;
  characterShadowMastery: number;
}

export function createNarrativeCharacterShadowEngineState(): NarrativeCharacterShadowEngineState {
  return { entries: new Map(), profiles: new Map(), totalEntries: 0, totalProfiles: 0, averageDarkness: 0.5, averageGift: 0.5, profileDepth: 0.5, characterShadowMastery: 0.5 };
}

export function addCharacterShadowEntry(state: NarrativeCharacterShadowEngineState, entryId: string, aspect: CharacterShadowAspect, strength: CharacterShadowStrength, integration: CharacterShadowIntegration, description: string, darkness: number, gift: number, chapter: number): NarrativeCharacterShadowEngineState {
  const entry: CharacterShadowEntry = { entryId, aspect, strength, integration, description, darkness, gift, chapter };
  return recompute({ ...state, entries: new Map(state.entries).set(entryId, entry), totalEntries: state.entries.size + 1 });
}

export function addCharacterShadowProfile(state: NarrativeCharacterShadowEngineState, profileId: string, entryIds: string[]): NarrativeCharacterShadowEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is CharacterShadowEntry => e !== undefined);
  const cumulativeDarkness = entries.length === 0 ? 0 : entries.reduce((s, e) => s + e.darkness, 0) / entries.length;
  const aspectSet = new Set(entries.map(e => e.aspect));
  const depth = Math.min(1, aspectSet.size / 7);
  const profile: CharacterShadowProfile = { profileId, entryIds, cumulativeDarkness, depth };
  return recompute({ ...state, profiles: new Map(state.profiles).set(profileId, profile), totalProfiles: state.profiles.size + 1 });
}

export function getCharacterShadowEntriesByAspect(state: NarrativeCharacterShadowEngineState, aspect: CharacterShadowAspect): CharacterShadowEntry[] {
  return Array.from(state.entries.values()).filter(e => e.aspect === aspect);
}

export function getCharacterShadowReport(state: NarrativeCharacterShadowEngineState): { totalEntries: number; totalProfiles: number; averageDarkness: number; averageGift: number; characterShadowMastery: number; recommendations: string[] } {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add character shadow entries');
  if (state.averageDarkness < 0.5) recommendations.push('Low darkness — strengthen');
  if (state.characterShadowMastery < 0.5) recommendations.push('Low mastery — develop');
  return { totalEntries: state.totalEntries, totalProfiles: state.totalProfiles, averageDarkness: Math.round(state.averageDarkness * 100) / 100, averageGift: Math.round(state.averageGift * 100) / 100, characterShadowMastery: Math.round(state.characterShadowMastery * 100) / 100, recommendations };
}

function recompute(state: NarrativeCharacterShadowEngineState): NarrativeCharacterShadowEngineState {
  const entries = Array.from(state.entries.values());
  const averageDarkness = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.darkness, 0) / entries.length;
  const averageGift = entries.length === 0 ? 0.5 : entries.reduce((s, e) => s + e.gift, 0) / entries.length;
  const profiles = Array.from(state.profiles.values());
  const profileDepth = profiles.length === 0 ? 0.5 : profiles.reduce((s, p) => s + p.depth, 0) / profiles.length;
  const characterShadowMastery = (averageDarkness * 0.4 + averageGift * 0.3 + profileDepth * 0.3);
  return { ...state, averageDarkness, averageGift, profileDepth, characterShadowMastery };
}

export function resetNarrativeCharacterShadowEngineState(): NarrativeCharacterShadowEngineState {
  return createNarrativeCharacterShadowEngineState();
}