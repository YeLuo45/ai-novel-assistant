/**
 * V1180 NarrativeVoiceProfileEngine — Direction F Iter 18/20 (Round 5)
 * Voice profile engine: profile of narrative voice
 * Sources: ruflo voice + nanobot + thunderbolt
 */

export type VoiceProfileAxis = 'formal_informal' | 'lyric_prosaic' | 'hot_cold' | 'loose_tight' | 'plain_ornate';
export type VoiceProfileStrength = 'weak' | 'moderate' | 'strong' | 'compelling' | 'unmistakable';
export type VoiceProfileConsistency = 'shifting' | 'variable' | 'mostly' | 'consistent' | 'unwavering';

export interface VoiceProfile {
  profileId: string;
  axis: VoiceProfileAxis;
  strength: VoiceProfileStrength;
  consistency: VoiceProfileConsistency;
  description: string;
  position: number;
  identity: number;
  chapter: number;
}

export interface VoiceProfileLayer {
  layerId: string,
  profileIds: string[],
  cumulativeIdentity: number,
  cohesion: number,
}

export interface NarrativeVoiceProfileEngineState {
  profiles: Map<string, VoiceProfile>;
  layers: Map<string, VoiceProfileLayer>;
  totalProfiles: number;
  totalLayers: number;
  averageIdentity: number;
  averagePosition: number;
  layerCohesion: number;
  voiceProfileMastery: number;
}

// Factory
export function createNarrativeVoiceProfileEngineState(): NarrativeVoiceProfileEngineState {
  return {
    profiles: new Map(),
    layers: new Map(),
    totalProfiles: 0,
    totalLayers: 0,
    averageIdentity: 0.5,
    averagePosition: 0.5,
    layerCohesion: 0.5,
    voiceProfileMastery: 0.5,
  };
}

// Add profile
export function addVoiceProfile(
  state: NarrativeVoiceProfileEngineState,
  profileId: string,
  axis: VoiceProfileAxis,
  strength: VoiceProfileStrength,
  consistency: VoiceProfileConsistency,
  description: string,
  position: number,
  identity: number,
  chapter: number
): NarrativeVoiceProfileEngineState {
  const profile: VoiceProfile = { profileId, axis, strength, consistency, description, position, identity, chapter };
  const profiles = new Map(state.profiles).set(profileId, profile);
  return recomputeVoiceProfile({ ...state, profiles, totalProfiles: profiles.size });
}

// Add layer
export function addVoiceProfileLayer(
  state: NarrativeVoiceProfileEngineState,
  layerId: string,
  profileIds: string[]
): NarrativeVoiceProfileEngineState {
  const profiles = profileIds.map(id => state.profiles.get(id)).filter((p): p is VoiceProfile => p !== undefined);
  const cumulativeIdentity = profiles.length === 0 ? 0
    : profiles.reduce((s, p) => s + p.identity, 0) / profiles.length;
  const axisSet = new Set(profiles.map(p => p.axis));
  const cohesion = Math.min(1, axisSet.size / 5);
  const layer: VoiceProfileLayer = { layerId, profileIds, cumulativeIdentity, cohesion };
  const layers = new Map(state.layers).set(layerId, layer);
  return recomputeVoiceProfile({ ...state, layers, totalLayers: layers.size });
}

// Get profiles by axis
export function getVoiceProfilesByAxis(state: NarrativeVoiceProfileEngineState, axis: VoiceProfileAxis): VoiceProfile[] {
  return Array.from(state.profiles.values()).filter(p => p.axis === axis);
}

// Get voice profile report
export function getVoiceProfileReport(state: NarrativeVoiceProfileEngineState): {
  totalProfiles: number;
  totalLayers: number;
  averageIdentity: number;
  averagePosition: number;
  voiceProfileMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalProfiles === 0) recommendations.push('No profiles — add voice profiles');
  if (state.averageIdentity < 0.5) recommendations.push('Low identity — strengthen');
  if (state.voiceProfileMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalProfiles: state.totalProfiles,
    totalLayers: state.totalLayers,
    averageIdentity: Math.round(state.averageIdentity * 100) / 100,
    averagePosition: Math.round(state.averagePosition * 100) / 100,
    voiceProfileMastery: Math.round(state.voiceProfileMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeVoiceProfile(state: NarrativeVoiceProfileEngineState): NarrativeVoiceProfileEngineState {
  const profiles = Array.from(state.profiles.values());
  const averageIdentity = profiles.length === 0 ? 0.5
    : profiles.reduce((s, p) => s + p.identity, 0) / profiles.length;
  const averagePosition = profiles.length === 0 ? 0.5
    : profiles.reduce((s, p) => s + p.position, 0) / profiles.length;

  const layers = Array.from(state.layers.values());
  const layerCohesion = layers.length === 0 ? 0.5
    : layers.reduce((s, l) => s + l.cohesion, 0) / layers.length;

  const voiceProfileMastery = (averageIdentity * 0.4 + averagePosition * 0.3 + layerCohesion * 0.3);

  return { ...state, averageIdentity, averagePosition, layerCohesion, voiceProfileMastery };
}

// Reset
export function resetNarrativeVoiceProfileEngineState(): NarrativeVoiceProfileEngineState {
  return createNarrativeVoiceProfileEngineState();
}