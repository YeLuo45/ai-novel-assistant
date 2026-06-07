/**
 * V1370 NarrativeCharacterMotivationEngine — Direction K Iter 3/30 (Round 5)
 * Character motivation engine: motivation of character
 * Sources: ruflo motivation + nanobot + thunderbolt
 */

export type CharacterMotivationSource = 'survival' | 'safety' | 'belonging' | 'esteem' | 'actualization' | 'transcendence' | 'transcendent';
export type CharacterMotivationIntensity = 'weak' | 'mild' | 'moderate' | 'strong' | 'obsessive' | 'absolute' | 'transcendent';
export type CharacterMotivationDirection = 'inward' | 'outward' | 'upward' | 'downward' | 'cyclical' | 'spiral' | 'transcendent';

export interface CharacterMotivationEntry {
  entryId: string;
  source: CharacterMotivationSource;
  intensity: CharacterMotivationIntensity;
  direction: CharacterMotivationDirection;
  description: string;
  drive: number;
  clarity: number;
  chapter: number;
}

export interface CharacterMotivationProfile {
  profileId: string,
  entryIds: string[],
  cumulativeDrive: number,
  depth: number,
}

export interface NarrativeCharacterMotivationEngineState {
  entries: Map<string, CharacterMotivationEntry>;
  profiles: Map<string, CharacterMotivationProfile>;
  totalEntries: number;
  totalProfiles: number;
  averageDrive: number;
  averageClarity: number;
  profileDepth: number;
  characterMotivationMastery: number;
}

// Factory
export function createNarrativeCharacterMotivationEngineState(): NarrativeCharacterMotivationEngineState {
  return {
    entries: new Map(),
    profiles: new Map(),
    totalEntries: 0,
    totalProfiles: 0,
    averageDrive: 0.5,
    averageClarity: 0.5,
    profileDepth: 0.5,
    characterMotivationMastery: 0.5,
  };
}

// Add entry
export function addCharacterMotivationEntry(
  state: NarrativeCharacterMotivationEngineState,
  entryId: string,
  source: CharacterMotivationSource,
  intensity: CharacterMotivationIntensity,
  direction: CharacterMotivationDirection,
  description: string,
  drive: number,
  clarity: number,
  chapter: number
): NarrativeCharacterMotivationEngineState {
  const entry: CharacterMotivationEntry = { entryId, source, intensity, direction, description, drive, clarity, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeCharacterMotivation({ ...state, entries, totalEntries: entries.size });
}

// Add profile
export function addCharacterMotivationProfile(
  state: NarrativeCharacterMotivationEngineState,
  profileId: string,
  entryIds: string[]
): NarrativeCharacterMotivationEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is CharacterMotivationEntry => e !== undefined);
  const cumulativeDrive = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.drive, 0) / entries.length;
  const sourceSet = new Set(entries.map(e => e.source));
  const depth = Math.min(1, sourceSet.size / 7);
  const profile: CharacterMotivationProfile = { profileId, entryIds, cumulativeDrive, depth };
  const profiles = new Map(state.profiles).set(profileId, profile);
  return recomputeCharacterMotivation({ ...state, profiles, totalProfiles: profiles.size });
}

// Get entries by source
export function getCharacterMotivationEntriesBySource(state: NarrativeCharacterMotivationEngineState, source: CharacterMotivationSource): CharacterMotivationEntry[] {
  return Array.from(state.entries.values()).filter(e => e.source === source);
}

// Get character motivation report
export function getCharacterMotivationReport(state: NarrativeCharacterMotivationEngineState): {
  totalEntries: number;
  totalProfiles: number;
  averageDrive: number;
  averageClarity: number;
  characterMotivationMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add character motivation entries');
  if (state.averageDrive < 0.5) recommendations.push('Low drive — strengthen');
  if (state.characterMotivationMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalProfiles: state.totalProfiles,
    averageDrive: Math.round(state.averageDrive * 100) / 100,
    averageClarity: Math.round(state.averageClarity * 100) / 100,
    characterMotivationMastery: Math.round(state.characterMotivationMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeCharacterMotivation(state: NarrativeCharacterMotivationEngineState): NarrativeCharacterMotivationEngineState {
  const entries = Array.from(state.entries.values());
  const averageDrive = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.drive, 0) / entries.length;
  const averageClarity = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.clarity, 0) / entries.length;

  const profiles = Array.from(state.profiles.values());
  const profileDepth = profiles.length === 0 ? 0.5
    : profiles.reduce((s, p) => s + p.depth, 0) / profiles.length;

  const characterMotivationMastery = (averageDrive * 0.4 + averageClarity * 0.3 + profileDepth * 0.3);

  return { ...state, averageDrive, averageClarity, profileDepth, characterMotivationMastery };
}

// Reset
export function resetNarrativeCharacterMotivationEngineState(): NarrativeCharacterMotivationEngineState {
  return createNarrativeCharacterMotivationEngineState();
}