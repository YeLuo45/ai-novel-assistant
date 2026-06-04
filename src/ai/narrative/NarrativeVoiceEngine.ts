/**
 * V678 NarrativeVoiceEngine — Direction C Iter 7/9 (Round 2)
 * Narrative voice engine: POV, tone, style, narrative distance
 * Sources: chatdev voice + thunderbolt style + nanobot
 */

export type POVType = 'first' | 'second' | 'third_limited' | 'third_omniscient' | 'stream_of_consciousness';
export type ToneType = 'formal' | 'casual' | 'lyrical' | 'dark' | 'humorous' | 'somber' | 'tense';
export type StyleMark = 'concise' | 'elaborate' | 'poetic' | 'sparse' | 'descriptive' | 'dialogic';

export interface VoiceProfile {
  profileId: string;
  name: string;
  pov: POVType;
  tone: ToneType;
  style: StyleMark;
  lexicalDiversity: number;
  sentenceComplexity: number;
  narrativeDistance: number;
}

export interface VoiceUsage {
  sceneId: string;
  profileId: string;
  consistency: number;
  deviations: string[];
}

export interface NarrativeVoiceState {
  profiles: Map<string, VoiceProfile>;
  usages: Map<string, VoiceUsage>;
  activeProfile: string | null;
  totalProfiles: number;
  averageConsistency: number;
  voiceDiversity: number;
  dominantTone: ToneType | null;
}

// Factory
export function createNarrativeVoiceState(): NarrativeVoiceState {
  return {
    profiles: new Map(),
    usages: new Map(),
    activeProfile: null,
    totalProfiles: 0,
    averageConsistency: 0.8,
    voiceDiversity: 0.5,
    dominantTone: null,
  };
}

// Create voice profile
export function createVoiceProfile(
  state: NarrativeVoiceState,
  profileId: string,
  name: string,
  pov: POVType,
  tone: ToneType,
  style: StyleMark = 'descriptive',
  lexicalDiversity: number = 0.5,
  sentenceComplexity: number = 0.5,
  narrativeDistance: number = 0.5
): NarrativeVoiceState {
  const profile: VoiceProfile = {
    profileId,
    name,
    pov,
    tone,
    style,
    lexicalDiversity,
    sentenceComplexity,
    narrativeDistance,
  };

  const profiles = new Map(state.profiles).set(profileId, profile);
  return recomputeVoiceMetrics({ ...state, profiles, totalProfiles: profiles.size });
}

// Track voice usage
export function trackVoiceUsage(
  state: NarrativeVoiceState,
  sceneId: string,
  profileId: string,
  consistency: number = 0.9,
  deviations: string[] = []
): NarrativeVoiceState {
  const usage: VoiceUsage = { sceneId, profileId, consistency, deviations };
  const usages = new Map(state.usages).set(sceneId, usage);
  return recomputeVoiceMetrics({ ...state, usages });
}

// Set active profile
export function setActiveProfile(state: NarrativeVoiceState, profileId: string): NarrativeVoiceState {
  return { ...state, activeProfile: profileId };
}

// Get profile by ID
export function getProfileById(state: NarrativeVoiceState, profileId: string): VoiceProfile | null {
  return state.profiles.get(profileId) || null;
}

// Get profiles by tone
export function getProfilesByTone(state: NarrativeVoiceState, tone: ToneType): VoiceProfile[] {
  return Array.from(state.profiles.values()).filter(p => p.tone === tone);
}

// Get scene usage
export function getSceneUsage(state: NarrativeVoiceState, sceneId: string): VoiceUsage | null {
  return state.usages.get(sceneId) || null;
}

// Compute voice consistency
export function computeVoiceConsistency(state: NarrativeVoiceState): number {
  const usages = Array.from(state.usages.values());
  if (usages.length === 0) return 0.8;
  return usages.reduce((s, u) => s + u.consistency, 0) / usages.length;
}

// Get voice report
export function getVoiceReport(state: NarrativeVoiceState): {
  totalProfiles: number;
  averageConsistency: number;
  voiceDiversity: number;
  dominantTone: ToneType | null;
  activeProfile: string | null;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalProfiles < 2) recommendations.push('Few profiles — consider multiple voices');
  if (state.averageConsistency < 0.7) recommendations.push('Low consistency — reinforce voice');
  if (state.voiceDiversity < 0.3) recommendations.push('Low diversity — vary voice profiles');

  return {
    totalProfiles: state.totalProfiles,
    averageConsistency: Math.round(state.averageConsistency * 100) / 100,
    voiceDiversity: Math.round(state.voiceDiversity * 100) / 100,
    dominantTone: state.dominantTone,
    activeProfile: state.activeProfile,
    recommendations,
  };
}

// Recompute metrics
function recomputeVoiceMetrics(state: NarrativeVoiceState): NarrativeVoiceState {
  const profiles = Array.from(state.profiles.values());
  const tones = new Map<string, number>();
  profiles.forEach(p => {
    tones.set(p.tone, (tones.get(p.tone) || 0) + 1);
  });

  let dominantTone: ToneType | null = null;
  let maxCount = -1;
  tones.forEach((count, tone) => {
    if (count > maxCount) {
      maxCount = count;
      dominantTone = tone as ToneType;
    }
  });

  const uniqueTones = tones.size;
  const voiceDiversity = profiles.length > 0 ? Math.min(1, uniqueTones / 5) : 0.5;
  const averageConsistency = computeVoiceConsistency(state);

  return { ...state, dominantTone, voiceDiversity, averageConsistency };
}

// Reset voice state
export function resetNarrativeVoiceState(): NarrativeVoiceState {
  return createNarrativeVoiceState();
}