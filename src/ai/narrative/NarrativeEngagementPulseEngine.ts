/**
 * V1106 NarrativeEngagementPulseEngine — Direction E Iter 1/20 (Round 5)
 * Engagement pulse engine: pulse of reader engagement
 * Sources: thunderbolt pulse + generic-agent + nanobot
 */

export type EngagementPulseType = 'initial' | 'rising' | 'peak' | 'sustained' | 'declining' | 'resurgent';
export type EngagementPulseStrength = 'weak' | 'moderate' | 'strong' | 'overwhelming' | 'compulsory';
export type EngagementPulseScope = 'sentence' | 'paragraph' | 'scene' | 'chapter' | 'arc';

export interface EngagementPulse {
  pulseId: string;
  type: EngagementPulseType;
  strength: EngagementPulseStrength;
  scope: EngagementPulseScope;
  description: string;
  intensity: number;
  momentum: number;
  chapter: number;
}

export interface EngagementWave {
  waveId: string,
  pulseIds: string[],
  cumulativeIntensity: number,
  flow: number,
}

export interface NarrativeEngagementPulseEngineState {
  pulses: Map<string, EngagementPulse>;
  waves: Map<string, EngagementWave>;
  totalPulses: number;
  totalWaves: number;
  averageIntensity: number;
  averageMomentum: number;
  waveFlow: number;
  engagementMastery: number;
}

// Factory
export function createNarrativeEngagementPulseEngineState(): NarrativeEngagementPulseEngineState {
  return {
    pulses: new Map(),
    waves: new Map(),
    totalPulses: 0,
    totalWaves: 0,
    averageIntensity: 0.5,
    averageMomentum: 0.5,
    waveFlow: 0.5,
    engagementMastery: 0.5,
  };
}

// Add pulse
export function addEngagementPulse(
  state: NarrativeEngagementPulseEngineState,
  pulseId: string,
  type: EngagementPulseType,
  strength: EngagementPulseStrength,
  scope: EngagementPulseScope,
  description: string,
  intensity: number,
  momentum: number,
  chapter: number
): NarrativeEngagementPulseEngineState {
  const pulse: EngagementPulse = { pulseId, type, strength, scope, description, intensity, momentum, chapter };
  const pulses = new Map(state.pulses).set(pulseId, pulse);
  return recomputeEngagement({ ...state, pulses, totalPulses: pulses.size });
}

// Add wave
export function addEngagementWave(
  state: NarrativeEngagementPulseEngineState,
  waveId: string,
  pulseIds: string[]
): NarrativeEngagementPulseEngineState {
  const pulses = pulseIds.map(id => state.pulses.get(id)).filter((p): p is EngagementPulse => p !== undefined);
  const cumulativeIntensity = pulses.length === 0 ? 0
    : pulses.reduce((s, p) => s + p.intensity, 0) / pulses.length;
  const flow = pulses.length < 2 ? 0.5
    : 1 - Math.abs(pulses[0].momentum - pulses[pulses.length - 1].momentum);
  const wave: EngagementWave = { waveId, pulseIds, cumulativeIntensity, flow };
  const waves = new Map(state.waves).set(waveId, wave);
  return recomputeEngagement({ ...state, waves, totalWaves: waves.size });
}

// Get pulses by type
export function getEngagementPulsesByType(state: NarrativeEngagementPulseEngineState, type: EngagementPulseType): EngagementPulse[] {
  return Array.from(state.pulses.values()).filter(p => p.type === type);
}

// Get engagement report
export function getEngagementPulseReport(state: NarrativeEngagementPulseEngineState): {
  totalPulses: number;
  totalWaves: number;
  averageIntensity: number;
  waveFlow: number;
  engagementMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalPulses === 0) recommendations.push('No pulses — add engagement pulses');
  if (state.averageIntensity < 0.5) recommendations.push('Low intensity — strengthen');
  if (state.engagementMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalPulses: state.totalPulses,
    totalWaves: state.totalWaves,
    averageIntensity: Math.round(state.averageIntensity * 100) / 100,
    waveFlow: Math.round(state.waveFlow * 100) / 100,
    engagementMastery: Math.round(state.engagementMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeEngagement(state: NarrativeEngagementPulseEngineState): NarrativeEngagementPulseEngineState {
  const pulses = Array.from(state.pulses.values());
  const averageIntensity = pulses.length === 0 ? 0.5
    : pulses.reduce((s, p) => s + p.intensity, 0) / pulses.length;
  const averageMomentum = pulses.length === 0 ? 0.5
    : pulses.reduce((s, p) => s + p.momentum, 0) / pulses.length;

  const waves = Array.from(state.waves.values());
  const waveFlow = waves.length === 0 ? 0.5
    : waves.reduce((s, w) => s + w.flow, 0) / waves.length;

  const engagementMastery = (averageIntensity * 0.4 + averageMomentum * 0.3 + waveFlow * 0.3);

  return { ...state, averageIntensity, averageMomentum, waveFlow, engagementMastery };
}

// Reset
export function resetNarrativeEngagementPulseEngineState(): NarrativeEngagementPulseEngineState {
  return createNarrativeEngagementPulseEngineState();
}