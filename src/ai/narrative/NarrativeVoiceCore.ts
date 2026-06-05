/**
 * V856 NarrativeVoiceCore — Direction B Iter 6/15 (Round 4)
 * Narrative voice core: distinctive voice + tone management
 * Sources: chatdev voice + thunderbolt + nanobot
 */

export type VoiceAspect = 'diction' | 'syntax' | 'rhythm' | 'imagery' | 'perspective' | 'attitude';
export type VoiceStrength = 'weak' | 'developing' | 'defined' | 'strong' | 'iconic';
export type VoiceConsistency = 'inconsistent' | 'variable' | 'consistent' | 'uniform' | 'perfect';

export interface VoiceProfile {
  profileId: string;
  characterId: string;
  aspect: VoiceAspect;
  strength: VoiceStrength;
  consistency: VoiceConsistency;
  markers: string[];
  examples: string[];
}

export interface VoiceSample {
  sampleId: string;
  characterId: string;
  text: string;
  aspectScores: Map<VoiceAspect, number>;
  overallScore: number;
  timestamp: number;
}

export interface NarrativeVoiceCoreState {
  profiles: Map<string, VoiceProfile>;
  samples: Map<string, VoiceSample>;
  totalProfiles: number;
  totalSamples: number;
  averageStrength: number;
  averageConsistency: number;
  voiceDistinctiveness: number;
  voiceMastery: number;
  aspectCoverage: number;
}

// Factory
export function createNarrativeVoiceCoreState(): NarrativeVoiceCoreState {
  return {
    profiles: new Map(),
    samples: new Map(),
    totalProfiles: 0,
    totalSamples: 0,
    averageStrength: 0.5,
    averageConsistency: 0.5,
    voiceDistinctiveness: 0.5,
    voiceMastery: 0.5,
    aspectCoverage: 0,
  };
}

// Create voice profile
export function createVoiceProfile(
  state: NarrativeVoiceCoreState,
  profileId: string,
  characterId: string,
  aspect: VoiceAspect,
  strength: VoiceStrength = 'defined',
  consistency: VoiceConsistency = 'consistent'
): NarrativeVoiceCoreState {
  const profile: VoiceProfile = { profileId, characterId, aspect, strength, consistency, markers: [], examples: [] };
  const profiles = new Map(state.profiles).set(profileId, profile);
  return recomputeVoice({ ...state, profiles, totalProfiles: profiles.size });
}

// Add voice sample
export function addVoiceSample(
  state: NarrativeVoiceCoreState,
  sampleId: string,
  characterId: string,
  text: string,
  aspectScores: Map<VoiceAspect, number>
): NarrativeVoiceCoreState {
  const allScores = Array.from(aspectScores.values());
  const overallScore = allScores.length === 0 ? 0.5
    : allScores.reduce((s, v) => s + v, 0) / allScores.length;
  const sample: VoiceSample = { sampleId, characterId, text, aspectScores, overallScore, timestamp: Date.now() };
  const samples = new Map(state.samples).set(sampleId, sample);
  return recomputeVoice({ ...state, samples, totalSamples: samples.size });
}

// Add marker
export function addVoiceMarker(state: NarrativeVoiceCoreState, profileId: string, marker: string, example: string = ''): NarrativeVoiceCoreState {
  const profile = state.profiles.get(profileId);
  if (!profile) return state;

  const updated: VoiceProfile = {
    ...profile,
    markers: [...profile.markers, marker],
    examples: example ? [...profile.examples, example] : profile.examples,
  };
  const profiles = new Map(state.profiles).set(profileId, updated);
  return recomputeVoice({ ...state, profiles });
}

// Get profiles by character
export function getVoiceProfilesByCharacter(state: NarrativeVoiceCoreState, characterId: string): VoiceProfile[] {
  return Array.from(state.profiles.values()).filter(p => p.characterId === characterId);
}

// Get voice report
export function getVoiceCoreReport(state: NarrativeVoiceCoreState): {
  totalProfiles: number;
  totalSamples: number;
  averageStrength: number;
  averageConsistency: number;
  voiceDistinctiveness: number;
  voiceMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalProfiles === 0) recommendations.push('No profiles — create voice profiles');
  if (state.averageStrength < 0.5) recommendations.push('Low strength — develop voice');
  if (state.voiceMastery < 0.5) recommendations.push('Low mastery — refine voice');

  return {
    totalProfiles: state.totalProfiles,
    totalSamples: state.totalSamples,
    averageStrength: Math.round(state.averageStrength * 100) / 100,
    averageConsistency: Math.round(state.averageConsistency * 100) / 100,
    voiceDistinctiveness: Math.round(state.voiceDistinctiveness * 100) / 100,
    voiceMastery: Math.round(state.voiceMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeVoice(state: NarrativeVoiceCoreState): NarrativeVoiceCoreState {
  const profiles = Array.from(state.profiles.values());
  const strengthMap: Record<VoiceStrength, number> = { weak: 0.2, developing: 0.4, defined: 0.6, strong: 0.8, iconic: 1.0 };
  const averageStrength = profiles.length === 0 ? 0.5
    : profiles.reduce((s, p) => s + strengthMap[p.strength], 0) / profiles.length;
  const consistencyMap: Record<VoiceConsistency, number> = { inconsistent: 0.2, variable: 0.4, consistent: 0.6, uniform: 0.8, perfect: 1.0 };
  const averageConsistency = profiles.length === 0 ? 0.5
    : profiles.reduce((s, p) => s + consistencyMap[p.consistency], 0) / profiles.length;

  const aspectSet = new Set(profiles.map(p => p.aspect));
  const aspectCoverage = Math.min(1, aspectSet.size / 6);

  // Distinctiveness: how unique profiles are (number of distinct character-aspect pairs)
  const voiceDistinctiveness = profiles.length === 0 ? 0
    : Math.min(1, profiles.length / Math.max(1, aspectSet.size));

  const voiceMastery = (averageStrength * 0.4 + averageConsistency * 0.4 + aspectCoverage * 0.2);

  return { ...state, averageStrength, averageConsistency, aspectCoverage, voiceDistinctiveness, voiceMastery };
}

// Reset voice state
export function resetNarrativeVoiceCoreState(): NarrativeVoiceCoreState {
  return createNarrativeVoiceCoreState();
}