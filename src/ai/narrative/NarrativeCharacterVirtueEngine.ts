/**
 * V1374 NarrativeCharacterVirtueEngine — Direction K Iter 5/30 (Round 5)
 * Character virtue engine: virtues that define character
 * Sources: thunderbolt virtue + nanobot + ruflo
 */

export type CharacterVirtueType = 'courage' | 'wisdom' | 'compassion' | 'justice' | 'temperance' | 'integrity' | 'transcendent';
export type CharacterVirtueDepth = 'surface' | 'developing' | 'rooted' | 'core' | 'defining' | 'transcendent' | 'absolute';
export type CharacterVirtueExpression = 'shown' | 'spoken' | 'implied' | 'embodied' | 'radiant' | 'transcendent' | 'infinite';

export interface CharacterVirtueEntry {
  entryId: string;
  type: CharacterVirtueType;
  depth: CharacterVirtueDepth;
  expression: CharacterVirtueExpression;
  description: string;
  resonance: number;
  inspiration: number;
  chapter: number;
}

export interface CharacterVirtueProfile {
  profileId: string,
  entryIds: string[],
  cumulativeResonance: number,
  breadth: number,
}

export interface NarrativeCharacterVirtueEngineState {
  entries: Map<string, CharacterVirtueEntry>;
  profiles: Map<string, CharacterVirtueProfile>;
  totalEntries: number;
  totalProfiles: number;
  averageResonance: number;
  averageInspiration: number;
  profileBreadth: number;
  characterVirtueMastery: number;
}

// Factory
export function createNarrativeCharacterVirtueEngineState(): NarrativeCharacterVirtueEngineState {
  return {
    entries: new Map(),
    profiles: new Map(),
    totalEntries: 0,
    totalProfiles: 0,
    averageResonance: 0.5,
    averageInspiration: 0.5,
    profileBreadth: 0.5,
    characterVirtueMastery: 0.5,
  };
}

// Add entry
export function addCharacterVirtueEntry(
  state: NarrativeCharacterVirtueEngineState,
  entryId: string,
  type: CharacterVirtueType,
  depth: CharacterVirtueDepth,
  expression: CharacterVirtueExpression,
  description: string,
  resonance: number,
  inspiration: number,
  chapter: number
): NarrativeCharacterVirtueEngineState {
  const entry: CharacterVirtueEntry = { entryId, type, depth, expression, description, resonance, inspiration, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeCharacterVirtue({ ...state, entries, totalEntries: entries.size });
}

// Add profile
export function addCharacterVirtueProfile(
  state: NarrativeCharacterVirtueEngineState,
  profileId: string,
  entryIds: string[]
): NarrativeCharacterVirtueEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is CharacterVirtueEntry => e !== undefined);
  const cumulativeResonance = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const typeSet = new Set(entries.map(e => e.type));
  const breadth = Math.min(1, typeSet.size / 7);
  const profile: CharacterVirtueProfile = { profileId, entryIds, cumulativeResonance, breadth };
  const profiles = new Map(state.profiles).set(profileId, profile);
  return recomputeCharacterVirtue({ ...state, profiles, totalProfiles: profiles.size });
}

// Get entries by type
export function getCharacterVirtueEntriesByType(state: NarrativeCharacterVirtueEngineState, type: CharacterVirtueType): CharacterVirtueEntry[] {
  return Array.from(state.entries.values()).filter(e => e.type === type);
}

// Get character virtue report
export function getCharacterVirtueReport(state: NarrativeCharacterVirtueEngineState): {
  totalEntries: number;
  totalProfiles: number;
  averageResonance: number;
  averageInspiration: number;
  characterVirtueMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add character virtue entries');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.characterVirtueMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalProfiles: state.totalProfiles,
    averageResonance: Math.round(state.averageResonance * 100) / 100,
    averageInspiration: Math.round(state.averageInspiration * 100) / 100,
    characterVirtueMastery: Math.round(state.characterVirtueMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeCharacterVirtue(state: NarrativeCharacterVirtueEngineState): NarrativeCharacterVirtueEngineState {
  const entries = Array.from(state.entries.values());
  const averageResonance = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.resonance, 0) / entries.length;
  const averageInspiration = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.inspiration, 0) / entries.length;

  const profiles = Array.from(state.profiles.values());
  const profileBreadth = profiles.length === 0 ? 0.5
    : profiles.reduce((s, p) => s + p.breadth, 0) / profiles.length;

  const characterVirtueMastery = (averageResonance * 0.4 + averageInspiration * 0.3 + profileBreadth * 0.3);

  return { ...state, averageResonance, averageInspiration, profileBreadth, characterVirtueMastery };
}

// Reset
export function resetNarrativeCharacterVirtueEngineState(): NarrativeCharacterVirtueEngineState {
  return createNarrativeCharacterVirtueEngineState();
}