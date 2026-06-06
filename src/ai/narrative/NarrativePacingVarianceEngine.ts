/**
 * V1008 NarrativePacingVarianceEngine — Direction B Iter 7/15 (Round 5)
 * Pacing variance engine: variance + rhythm in narrative pacing
 * Sources: thunderbolt pacing + ruflo + nanobot
 */

export type PacingMode = 'fast' | 'medium' | 'slow' | 'variable' | 'syncopated';
export type PacingIntent = 'exposition' | 'action' | 'reflection' | 'dialogue' | 'description' | 'transition';
export type PacingVariance = 'uniform' | 'gradual_change' | 'sudden_shift' | 'rhythmic' | 'chaotic';

export interface PacingSegment {
  segmentId: string;
  mode: PacingMode;
  intent: PacingIntent;
  variance: PacingVariance;
  startChapter: number;
  endChapter: number;
  rhythm: number;
  intensity: number;
}

export interface PacingPattern {
  patternId: string,
  name: string,
  segmentIds: string[],
  flowScore: number,
  engagement: number,
}

export interface NarrativePacingVarianceEngineState {
  segments: Map<string, PacingSegment>;
  patterns: Map<string, PacingPattern>;
  totalSegments: number;
  totalPatterns: number;
  averageRhythm: number;
  varianceDiversity: number;
  flowQuality: number;
  pacingVarianceMastery: number;
}

// Factory
export function createNarrativePacingVarianceEngineState(): NarrativePacingVarianceEngineState {
  return {
    segments: new Map(),
    patterns: new Map(),
    totalSegments: 0,
    totalPatterns: 0,
    averageRhythm: 0.5,
    varianceDiversity: 0.5,
    flowQuality: 0.5,
    pacingVarianceMastery: 0.5,
  };
}

// Add segment
export function addPacingSegment(
  state: NarrativePacingVarianceEngineState,
  segmentId: string,
  mode: PacingMode,
  intent: PacingIntent,
  variance: PacingVariance,
  startChapter: number,
  endChapter: number,
  rhythm: number,
  intensity: number
): NarrativePacingVarianceEngineState {
  const segment: PacingSegment = { segmentId, mode, intent, variance, startChapter, endChapter, rhythm, intensity };
  const segments = new Map(state.segments).set(segmentId, segment);
  return recomputePacingVar({ ...state, segments, totalSegments: segments.size });
}

// Create pattern
export function createPacingPattern(
  state: NarrativePacingVarianceEngineState,
  patternId: string,
  name: string,
  segmentIds: string[]
): NarrativePacingVarianceEngineState {
  const segments = segmentIds.map(id => state.segments.get(id)).filter((s): s is PacingSegment => s !== undefined);
  // Flow: smooth transition between adjacent segments
  const flowScore = segments.length < 2 ? 0.5
    : 1 - Math.abs(segments[0].rhythm - segments[segments.length - 1].rhythm) / 2;
  const engagement = segments.length === 0 ? 0.5
    : segments.reduce((s, seg) => s + seg.intensity, 0) / segments.length;
  const pattern: PacingPattern = { patternId, name, segmentIds, flowScore, engagement };
  const patterns = new Map(state.patterns).set(patternId, pattern);
  return recomputePacingVar({ ...state, patterns, totalPatterns: patterns.size });
}

// Get segments by mode
export function getPacingSegmentsByMode(state: NarrativePacingVarianceEngineState, mode: PacingMode): PacingSegment[] {
  return Array.from(state.segments.values()).filter(s => s.mode === mode);
}

// Get pacing report
export function getPacingVarianceReport(state: NarrativePacingVarianceEngineState): {
  totalSegments: number;
  totalPatterns: number;
  averageRhythm: number;
  varianceDiversity: number;
  pacingVarianceMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalSegments === 0) recommendations.push('No segments — add pacing segments');
  if (state.varianceDiversity < 0.3) recommendations.push('Low diversity — vary pacing');
  if (state.pacingVarianceMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalSegments: state.totalSegments,
    totalPatterns: state.totalPatterns,
    averageRhythm: Math.round(state.averageRhythm * 100) / 100,
    varianceDiversity: Math.round(state.varianceDiversity * 100) / 100,
    pacingVarianceMastery: Math.round(state.pacingVarianceMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputePacingVar(state: NarrativePacingVarianceEngineState): NarrativePacingVarianceEngineState {
  const segments = Array.from(state.segments.values());
  const averageRhythm = segments.length === 0 ? 0.5
    : segments.reduce((s, seg) => s + seg.rhythm, 0) / segments.length;

  const modeSet = new Set(segments.map(s => s.mode));
  const varianceDiversity = Math.min(1, modeSet.size / 5);

  const patterns = Array.from(state.patterns.values());
  const avgFlow = patterns.length === 0 ? 0.5
    : patterns.reduce((s, p) => s + p.flowScore, 0) / patterns.length;
  const flowQuality = avgFlow;

  const pacingVarianceMastery = (averageRhythm * 0.3 + varianceDiversity * 0.4 + flowQuality * 0.3);

  return { ...state, averageRhythm, varianceDiversity, flowQuality, pacingVarianceMastery };
}

// Reset
export function resetNarrativePacingVarianceEngineState(): NarrativePacingVarianceEngineState {
  return createNarrativePacingVarianceEngineState();
}