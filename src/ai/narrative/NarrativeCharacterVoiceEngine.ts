/**
 * V1366 NarrativeCharacterVoiceEngine — Direction K Iter 1/30 (Round 5)
 * Character voice engine: unique voice of each character
 * Sources: nanobot voice + thunderbolt + ruflo
 */

export type CharacterVoiceTone = 'whisper' | 'soft' | 'neutral' | 'firm' | 'commanding' | 'ethereal' | 'transcendent';
export type CharacterVoiceDiction = 'plain' | 'simple' | 'precise' | 'elaborate' | 'poetic' | 'sublime' | 'transcendent';
export type CharacterVoicePace = 'slow' | 'measured' | 'normal' | 'quick' | 'rapid' | 'infinite' | 'transcendent';

export interface CharacterVoiceEntry {
  entryId: string;
  tone: CharacterVoiceTone;
  diction: CharacterVoiceDiction;
  pace: CharacterVoicePace;
  description: string;
  distinctiveness: number;
  authenticity: number;
  chapter: number;
}

export interface CharacterVoiceProfile {
  profileId: string,
  entryIds: string[],
  cumulativeDistinctiveness: number,
  uniqueness: number,
}

export interface NarrativeCharacterVoiceEngineState {
  entries: Map<string, CharacterVoiceEntry>;
  profiles: Map<string, CharacterVoiceProfile>;
  totalEntries: number;
  totalProfiles: number;
  averageDistinctiveness: number;
  averageAuthenticity: number;
  profileUniqueness: number;
  characterVoiceMastery: number;
}

// Factory
export function createNarrativeCharacterVoiceEngineState(): NarrativeCharacterVoiceEngineState {
  return {
    entries: new Map(),
    profiles: new Map(),
    totalEntries: 0,
    totalProfiles: 0,
    averageDistinctiveness: 0.5,
    averageAuthenticity: 0.5,
    profileUniqueness: 0.5,
    characterVoiceMastery: 0.5,
  };
}

// Add entry
export function addCharacterVoiceEntry(
  state: NarrativeCharacterVoiceEngineState,
  entryId: string,
  tone: CharacterVoiceTone,
  diction: CharacterVoiceDiction,
  pace: CharacterVoicePace,
  description: string,
  distinctiveness: number,
  authenticity: number,
  chapter: number
): NarrativeCharacterVoiceEngineState {
  const entry: CharacterVoiceEntry = { entryId, tone, diction, pace, description, distinctiveness, authenticity, chapter };
  const entries = new Map(state.entries).set(entryId, entry);
  return recomputeCharacterVoice({ ...state, entries, totalEntries: entries.size });
}

// Add profile
export function addCharacterVoiceProfile(
  state: NarrativeCharacterVoiceEngineState,
  profileId: string,
  entryIds: string[]
): NarrativeCharacterVoiceEngineState {
  const entries = entryIds.map(id => state.entries.get(id)).filter((e): e is CharacterVoiceEntry => e !== undefined);
  const cumulativeDistinctiveness = entries.length === 0 ? 0
    : entries.reduce((s, e) => s + e.distinctiveness, 0) / entries.length;
  const toneSet = new Set(entries.map(e => e.tone));
  const uniqueness = Math.min(1, toneSet.size / 7);
  const profile: CharacterVoiceProfile = { profileId, entryIds, cumulativeDistinctiveness, uniqueness };
  const profiles = new Map(state.profiles).set(profileId, profile);
  return recomputeCharacterVoice({ ...state, profiles, totalProfiles: profiles.size });
}

// Get entries by tone
export function getCharacterVoiceEntriesByTone(state: NarrativeCharacterVoiceEngineState, tone: CharacterVoiceTone): CharacterVoiceEntry[] {
  return Array.from(state.entries.values()).filter(e => e.tone === tone);
}

// Get character voice report
export function getCharacterVoiceReport(state: NarrativeCharacterVoiceEngineState): {
  totalEntries: number;
  totalProfiles: number;
  averageDistinctiveness: number;
  averageAuthenticity: number;
  characterVoiceMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEntries === 0) recommendations.push('No entries — add character voice entries');
  if (state.averageDistinctiveness < 0.5) recommendations.push('Low distinctiveness — strengthen');
  if (state.characterVoiceMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEntries: state.totalEntries,
    totalProfiles: state.totalProfiles,
    averageDistinctiveness: Math.round(state.averageDistinctiveness * 100) / 100,
    averageAuthenticity: Math.round(state.averageAuthenticity * 100) / 100,
    characterVoiceMastery: Math.round(state.characterVoiceMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeCharacterVoice(state: NarrativeCharacterVoiceEngineState): NarrativeCharacterVoiceEngineState {
  const entries = Array.from(state.entries.values());
  const averageDistinctiveness = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.distinctiveness, 0) / entries.length;
  const averageAuthenticity = entries.length === 0 ? 0.5
    : entries.reduce((s, e) => s + e.authenticity, 0) / entries.length;

  const profiles = Array.from(state.profiles.values());
  const profileUniqueness = profiles.length === 0 ? 0.5
    : profiles.reduce((s, p) => s + p.uniqueness, 0) / profiles.length;

  const characterVoiceMastery = (averageDistinctiveness * 0.4 + averageAuthenticity * 0.3 + profileUniqueness * 0.3);

  return { ...state, averageDistinctiveness, averageAuthenticity, profileUniqueness, characterVoiceMastery };
}

// Reset
export function resetNarrativeCharacterVoiceEngineState(): NarrativeCharacterVoiceEngineState {
  return createNarrativeCharacterVoiceEngineState();
}