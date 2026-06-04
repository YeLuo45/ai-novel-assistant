/**
 * V666 NarrativePacingEngine — Direction C Iter 1/9 (Round 2)
 * Narrative pacing engine: rhythm + tempo + flow control
 * Sources: thunderbolt pipeline + nanobot + generic-agent adaptive
 */

export type PacingType = 'steady' | 'accelerating' | 'decelerating' | 'staccato' | 'flowing';
export type TempoMark = 'largo' | 'adagio' | 'moderato' | 'allegro' | 'presto';

export interface PacingBeat {
  beatId: string;
  description: string;
  duration: number;
  intensity: number;
  tempo: TempoMark;
  pacingType: PacingType;
  position: number;
}

export interface NarrativePacingState {
  beats: Map<string, PacingBeat>;
  currentTempo: TempoMark;
  averageIntensity: number;
  rhythmVariation: number;
  totalBeats: number;
  pacingScore: number;
}

// Factory
export function createNarrativePacingState(): NarrativePacingState {
  return {
    beats: new Map(),
    currentTempo: 'moderato',
    averageIntensity: 0.5,
    rhythmVariation: 0,
    totalBeats: 0,
    pacingScore: 0.7,
  };
}

// Add beat
export function addBeat(
  state: NarrativePacingState,
  beatId: string,
  description: string,
  duration: number,
  intensity: number = 0.5,
  tempo: TempoMark = 'moderato',
  pacingType: PacingType = 'steady'
): NarrativePacingState {
  const beat: PacingBeat = {
    beatId,
    description,
    duration,
    intensity,
    tempo,
    pacingType,
    position: state.totalBeats,
  };

  const beats = new Map(state.beats).set(beatId, beat);
  return recomputePacing({ ...state, beats, totalBeats: state.totalBeats + 1 });
}

// Set tempo
export function setTempo(state: NarrativePacingState, tempo: TempoMark): NarrativePacingState {
  return { ...state, currentTempo: tempo };
}

// Get pacing flow
export function getPacingFlow(state: NarrativePacingState): PacingBeat[] {
  return Array.from(state.beats.values()).sort((a, b) => a.position - b.position);
}

// Get pacing recommendations
export function getPacingRecommendations(state: NarrativePacingState): string[] {
  const recommendations: string[] = [];
  if (state.averageIntensity > 0.8) recommendations.push('High intensity — consider adding calm beats for contrast');
  if (state.averageIntensity < 0.3) recommendations.push('Low intensity — add tension for engagement');
  if (state.rhythmVariation < 0.2) recommendations.push('Rhythm too uniform — vary beat durations');
  if (state.totalBeats > 20) recommendations.push('Many beats — consider grouping into chapters');
  if (state.pacingScore < 0.5) recommendations.push('Low pacing score — rebalance tempo and intensity');
  return recommendations;
}

// Get pacing report
export function getPacingReport(state: NarrativePacingState): {
  totalBeats: number;
  averageIntensity: number;
  rhythmVariation: number;
  currentTempo: TempoMark;
  pacingScore: number;
  recommendations: string[];
} {
  return {
    totalBeats: state.totalBeats,
    averageIntensity: Math.round(state.averageIntensity * 100) / 100,
    rhythmVariation: Math.round(state.rhythmVariation * 100) / 100,
    currentTempo: state.currentTempo,
    pacingScore: Math.round(state.pacingScore * 100) / 100,
    recommendations: getPacingRecommendations(state),
  };
}

// Recompute pacing metrics
function recomputePacing(state: NarrativePacingState): NarrativePacingState {
  const beats = Array.from(state.beats.values());
  if (beats.length === 0) return state;

  const averageIntensity = beats.reduce((s, b) => s + b.intensity, 0) / beats.length;
  const durations = beats.map(b => b.duration);
  const mean = durations.reduce((s, d) => s + d, 0) / durations.length;
  const variance = durations.reduce((s, d) => s + Math.pow(d - mean, 2), 0) / durations.length;
  const rhythmVariation = mean > 0 ? Math.sqrt(variance) / mean : 0;

  const pacingScore = 1 - Math.abs(0.6 - averageIntensity) - rhythmVariation * 0.3;

  return {
    ...state,
    averageIntensity,
    rhythmVariation,
    pacingScore: Math.max(0, Math.min(1, pacingScore)),
  };
}

// Reset pacing state
export function resetNarrativePacingState(): NarrativePacingState {
  return createNarrativePacingState();
}