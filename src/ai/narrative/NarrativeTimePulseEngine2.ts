/**
 * V1208 NarrativeTimePulseEngine2 — Direction G Iter 12/20 (Round 5)
 * Time pulse engine v2: time pulses
 * Sources: thunderbolt pulse + nanobot + ruflo
 */

export type TimePulseType = 'heartbeat' | 'breath' | 'tick' | 'flash' | 'wave' | 'moment';
export type TimePulseStrength = 'faint' | 'subtle' | 'clear' | 'strong' | 'mighty';
export type TimePulseDuration = 'instant' | 'brief' | 'moderate' | 'extended' | 'eternal';

export interface TimePulse {
  pulseId: string;
  type: TimePulseType;
  strength: TimePulseStrength;
  duration: TimePulseDuration;
  description: string;
  resonance: number;
  impact: number;
  chapter: number;
}

export interface TimePulseBeat {
  beatId: string,
  pulseIds: string[],
  cumulativeResonance: number,
  rhythm: number,
}

export interface NarrativeTimePulseEngineState {
  pulses: Map<string, TimePulse>;
  beats: Map<string, TimePulseBeat>;
  totalPulses: number;
  totalBeats: number;
  averageResonance: number;
  averageImpact: number;
  beatRhythm: number;
  timePulseMastery: number;
}

// Factory
export function createNarrativeTimePulseEngineState(): NarrativeTimePulseEngineState {
  return {
    pulses: new Map(),
    beats: new Map(),
    totalPulses: 0,
    totalBeats: 0,
    averageResonance: 0.5,
    averageImpact: 0.5,
    beatRhythm: 0.5,
    timePulseMastery: 0.5,
  };
}

// Add pulse
export function addTimePulse(
  state: NarrativeTimePulseEngineState,
  pulseId: string,
  type: TimePulseType,
  strength: TimePulseStrength,
  duration: TimePulseDuration,
  description: string,
  resonance: number,
  impact: number,
  chapter: number
): NarrativeTimePulseEngineState {
  const pulse: TimePulse = { pulseId, type, strength, duration, description, resonance, impact, chapter };
  const pulses = new Map(state.pulses).set(pulseId, pulse);
  return recomputeTimePulse({ ...state, pulses, totalPulses: pulses.size });
}

// Add beat
export function addTimePulseBeat(
  state: NarrativeTimePulseEngineState,
  beatId: string,
  pulseIds: string[]
): NarrativeTimePulseEngineState {
  const pulses = pulseIds.map(id => state.pulses.get(id)).filter((p): p is TimePulse => p !== undefined);
  const cumulativeResonance = pulses.length === 0 ? 0
    : pulses.reduce((s, p) => s + p.resonance, 0) / pulses.length;
  const typeSet = new Set(pulses.map(p => p.type));
  const rhythm = Math.min(1, typeSet.size / 6);
  const beat: TimePulseBeat = { beatId, pulseIds, cumulativeResonance, rhythm };
  const beats = new Map(state.beats).set(beatId, beat);
  return recomputeTimePulse({ ...state, beats, totalBeats: beats.size });
}

// Get pulses by type
export function getTimePulsesByType(state: NarrativeTimePulseEngineState, type: TimePulseType): TimePulse[] {
  return Array.from(state.pulses.values()).filter(p => p.type === type);
}

// Get time pulse report
export function getTimePulseReport(state: NarrativeTimePulseEngineState): {
  totalPulses: number;
  totalBeats: number;
  averageResonance: number;
  averageImpact: number;
  timePulseMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalPulses === 0) recommendations.push('No pulses — add time pulses');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.timePulseMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalPulses: state.totalPulses,
    totalBeats: state.totalBeats,
    averageResonance: Math.round(state.averageResonance * 100) / 100,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    timePulseMastery: Math.round(state.timePulseMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeTimePulse(state: NarrativeTimePulseEngineState): NarrativeTimePulseEngineState {
  const pulses = Array.from(state.pulses.values());
  const averageResonance = pulses.length === 0 ? 0.5
    : pulses.reduce((s, p) => s + p.resonance, 0) / pulses.length;
  const averageImpact = pulses.length === 0 ? 0.5
    : pulses.reduce((s, p) => s + p.impact, 0) / pulses.length;

  const beats = Array.from(state.beats.values());
  const beatRhythm = beats.length === 0 ? 0.5
    : beats.reduce((s, b) => s + b.rhythm, 0) / beats.length;

  const timePulseMastery = (averageResonance * 0.4 + averageImpact * 0.3 + beatRhythm * 0.3);

  return { ...state, averageResonance, averageImpact, beatRhythm, timePulseMastery };
}

// Reset
export function resetNarrativeTimePulseEngineState(): NarrativeTimePulseEngineState {
  return createNarrativeTimePulseEngineState();
}