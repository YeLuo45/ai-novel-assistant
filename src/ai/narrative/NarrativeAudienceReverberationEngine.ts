/**
 * V1248 NarrativeAudienceReverberationEngine — Direction H Iter 12/20 (Round 5)
 * Audience reverberation engine: reverberation in audience
 * Sources: nanobot reverberation + thunderbolt + ruflo
 */

export type AudienceReverberationType = 'immediate' | 'short_term' | 'long_term' | 'generational' | 'cultural' | 'eternal';
export type AudienceReverberationStrength = 'faint' | 'weak' | 'moderate' | 'strong' | 'overwhelming';
export type AudienceReverberationSpread = 'personal' | 'intimate' | 'social' | 'cultural' | 'universal';

export interface AudienceReverberation {
  reverberationId: string;
  type: AudienceReverberationType;
  strength: AudienceReverberationStrength;
  spread: AudienceReverberationSpread;
  description: string;
  intensity: number;
  reach: number;
  chapter: number;
}

export interface AudienceReverberationWave {
  waveId: string,
  reverberationIds: string[],
  cumulativeIntensity: number,
  breadth: number,
}

export interface NarrativeAudienceReverberationEngineState {
  reverberations: Map<string, AudienceReverberation>;
  waves: Map<string, AudienceReverberationWave>;
  totalReverberations: number;
  totalWaves: number;
  averageIntensity: number;
  averageReach: number;
  waveBreadth: number;
  audienceReverberationMastery: number;
}

// Factory
export function createNarrativeAudienceReverberationEngineState(): NarrativeAudienceReverberationEngineState {
  return {
    reverberations: new Map(),
    waves: new Map(),
    totalReverberations: 0,
    totalWaves: 0,
    averageIntensity: 0.5,
    averageReach: 0.5,
    waveBreadth: 0.5,
    audienceReverberationMastery: 0.5,
  };
}

// Add reverberation
export function addAudienceReverberation(
  state: NarrativeAudienceReverberationEngineState,
  reverberationId: string,
  type: AudienceReverberationType,
  strength: AudienceReverberationStrength,
  spread: AudienceReverberationSpread,
  description: string,
  intensity: number,
  reach: number,
  chapter: number
): NarrativeAudienceReverberationEngineState {
  const reverberation: AudienceReverberation = { reverberationId, type, strength, spread, description, intensity, reach, chapter };
  const reverberations = new Map(state.reverberations).set(reverberationId, reverberation);
  return recomputeAudienceReverberation({ ...state, reverberations, totalReverberations: reverberations.size });
}

// Add wave
export function addAudienceReverberationWave(
  state: NarrativeAudienceReverberationEngineState,
  waveId: string,
  reverberationIds: string[]
): NarrativeAudienceReverberationEngineState {
  const reverberations = reverberationIds.map(id => state.reverberations.get(id)).filter((r): r is AudienceReverberation => r !== undefined);
  const cumulativeIntensity = reverberations.length === 0 ? 0
    : reverberations.reduce((s, r) => s + r.intensity, 0) / reverberations.length;
  const typeSet = new Set(reverberations.map(r => r.type));
  const breadth = Math.min(1, typeSet.size / 6);
  const wave: AudienceReverberationWave = { waveId, reverberationIds, cumulativeIntensity, breadth };
  const waves = new Map(state.waves).set(waveId, wave);
  return recomputeAudienceReverberation({ ...state, waves, totalWaves: waves.size });
}

// Get reverberations by type
export function getAudienceReverberationsByType(state: NarrativeAudienceReverberationEngineState, type: AudienceReverberationType): AudienceReverberation[] {
  return Array.from(state.reverberations.values()).filter(r => r.type === type);
}

// Get audience reverberation report
export function getAudienceReverberationReport(state: NarrativeAudienceReverberationEngineState): {
  totalReverberations: number;
  totalWaves: number;
  averageIntensity: number;
  averageReach: number;
  audienceReverberationMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalReverberations === 0) recommendations.push('No reverberations — add audience reverberations');
  if (state.averageIntensity < 0.5) recommendations.push('Low intensity — strengthen');
  if (state.audienceReverberationMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalReverberations: state.totalReverberations,
    totalWaves: state.totalWaves,
    averageIntensity: Math.round(state.averageIntensity * 100) / 100,
    averageReach: Math.round(state.averageReach * 100) / 100,
    audienceReverberationMastery: Math.round(state.audienceReverberationMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAudienceReverberation(state: NarrativeAudienceReverberationEngineState): NarrativeAudienceReverberationEngineState {
  const reverberations = Array.from(state.reverberations.values());
  const averageIntensity = reverberations.length === 0 ? 0.5
    : reverberations.reduce((s, r) => s + r.intensity, 0) / reverberations.length;
  const averageReach = reverberations.length === 0 ? 0.5
    : reverberations.reduce((s, r) => s + r.reach, 0) / reverberations.length;

  const waves = Array.from(state.waves.values());
  const waveBreadth = waves.length === 0 ? 0.5
    : waves.reduce((s, w) => s + w.breadth, 0) / waves.length;

  const audienceReverberationMastery = (averageIntensity * 0.4 + averageReach * 0.3 + waveBreadth * 0.3);

  return { ...state, averageIntensity, averageReach, waveBreadth, audienceReverberationMastery };
}

// Reset
export function resetNarrativeAudienceReverberationEngineState(): NarrativeAudienceReverberationEngineState {
  return createNarrativeAudienceReverberationEngineState();
}