/**
 * V1206 NarrativeTimeWaveEngine — Direction G Iter 11/20 (Round 5)
 * Time wave engine: wave in time
 * Sources: ruflo wave + nanobot + thunderbolt
 */

export type TimeWaveType = 'sine' | 'square' | 'triangle' | 'sawtooth' | 'spike' | 'damped';
export type TimeWaveAmplitude = 'minimal' | 'modest' | 'significant' | 'dramatic' | 'extreme';
export type TimeWaveFrequency = 'rare' | 'uncommon' | 'regular' | 'frequent' | 'continuous';

export interface TimeWave {
  waveId: string;
  type: TimeWaveType;
  amplitude: TimeWaveAmplitude;
  frequency: TimeWaveFrequency;
  description: string;
  resonance: number;
  effect: number;
  chapter: number;
}

export interface TimeWavePattern {
  patternId: string,
  waveIds: string[],
  cumulativeResonance: number,
  complexity: number,
}

export interface NarrativeTimeWaveEngineState {
  waves: Map<string, TimeWave>;
  patterns: Map<string, TimeWavePattern>;
  totalWaves: number;
  totalPatterns: number;
  averageResonance: number;
  averageEffect: number;
  patternComplexity: number;
  timeWaveMastery: number;
}

// Factory
export function createNarrativeTimeWaveEngineState(): NarrativeTimeWaveEngineState {
  return {
    waves: new Map(),
    patterns: new Map(),
    totalWaves: 0,
    totalPatterns: 0,
    averageResonance: 0.5,
    averageEffect: 0.5,
    patternComplexity: 0.5,
    timeWaveMastery: 0.5,
  };
}

// Add wave
export function addTimeWave(
  state: NarrativeTimeWaveEngineState,
  waveId: string,
  type: TimeWaveType,
  amplitude: TimeWaveAmplitude,
  frequency: TimeWaveFrequency,
  description: string,
  resonance: number,
  effect: number,
  chapter: number
): NarrativeTimeWaveEngineState {
  const wave: TimeWave = { waveId, type, amplitude, frequency, description, resonance, effect, chapter };
  const waves = new Map(state.waves).set(waveId, wave);
  return recomputeTimeWave({ ...state, waves, totalWaves: waves.size });
}

// Add pattern
export function addTimeWavePattern(
  state: NarrativeTimeWaveEngineState,
  patternId: string,
  waveIds: string[]
): NarrativeTimeWaveEngineState {
  const waves = waveIds.map(id => state.waves.get(id)).filter((w): w is TimeWave => w !== undefined);
  const cumulativeResonance = waves.length === 0 ? 0
    : waves.reduce((s, w) => s + w.resonance, 0) / waves.length;
  const typeSet = new Set(waves.map(w => w.type));
  const complexity = Math.min(1, typeSet.size / 6);
  const pattern: TimeWavePattern = { patternId, waveIds, cumulativeResonance, complexity };
  const patterns = new Map(state.patterns).set(patternId, pattern);
  return recomputeTimeWave({ ...state, patterns, totalPatterns: patterns.size });
}

// Get waves by type
export function getTimeWavesByType(state: NarrativeTimeWaveEngineState, type: TimeWaveType): TimeWave[] {
  return Array.from(state.waves.values()).filter(w => w.type === type);
}

// Get time wave report
export function getTimeWaveReport(state: NarrativeTimeWaveEngineState): {
  totalWaves: number;
  totalPatterns: number;
  averageResonance: number;
  averageEffect: number;
  timeWaveMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalWaves === 0) recommendations.push('No waves — add time waves');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.timeWaveMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalWaves: state.totalWaves,
    totalPatterns: state.totalPatterns,
    averageResonance: Math.round(state.averageResonance * 100) / 100,
    averageEffect: Math.round(state.averageEffect * 100) / 100,
    timeWaveMastery: Math.round(state.timeWaveMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeTimeWave(state: NarrativeTimeWaveEngineState): NarrativeTimeWaveEngineState {
  const waves = Array.from(state.waves.values());
  const averageResonance = waves.length === 0 ? 0.5
    : waves.reduce((s, w) => s + w.resonance, 0) / waves.length;
  const averageEffect = waves.length === 0 ? 0.5
    : waves.reduce((s, w) => s + w.effect, 0) / waves.length;

  const patterns = Array.from(state.patterns.values());
  const patternComplexity = patterns.length === 0 ? 0.5
    : patterns.reduce((s, p) => s + p.complexity, 0) / patterns.length;

  const timeWaveMastery = (averageResonance * 0.4 + averageEffect * 0.3 + patternComplexity * 0.3);

  return { ...state, averageResonance, averageEffect, patternComplexity, timeWaveMastery };
}

// Reset
export function resetNarrativeTimeWaveEngineState(): NarrativeTimeWaveEngineState {
  return createNarrativeTimeWaveEngineState();
}