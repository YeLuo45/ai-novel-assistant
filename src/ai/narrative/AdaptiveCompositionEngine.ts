/**
 * V922 AdaptiveCompositionEngine — Direction D Iter 9/15 (Round 4)
 * Adaptive composition engine: composition that adapts
 * Sources: nanobot composition + thunderbolt + generic-agent
 */

export type CompositionMode = 'expository' | 'descriptive' | 'narrative' | 'argumentative' | 'reflective' | 'dialogic';
export type AdaptationTrigger = 'reader_response' | 'pacing_need' | 'theme_shift' | 'character_growth' | 'plot_development';
export type CompositionQuality = 'rough' | 'adequate' | 'polished' | 'refined' | 'masterful';

export interface CompositionSegment {
  segmentId: string;
  mode: CompositionMode;
  quality: CompositionQuality;
  length: number;
  effectiveness: number;
  chapter: number;
}

export interface CompositionShift {
  shiftId: string;
  segmentId: string;
  fromMode: CompositionMode;
  toMode: CompositionMode;
  trigger: AdaptationTrigger;
  chapter: number;
}

export interface AdaptiveCompositionEngineState {
  segments: Map<string, CompositionSegment>;
  shifts: Map<string, CompositionShift>;
  totalSegments: number;
  totalShifts: number;
  averageQuality: number;
  averageEffectiveness: number;
  modeVersatility: number;
  compositionMastery: number;
}

// Factory
export function createAdaptiveCompositionEngineState(): AdaptiveCompositionEngineState {
  return {
    segments: new Map(),
    shifts: new Map(),
    totalSegments: 0,
    totalShifts: 0,
    averageQuality: 0.5,
    averageEffectiveness: 0.5,
    modeVersatility: 0,
    compositionMastery: 0.5,
  };
}

// Add segment
export function addCompositionSegment(
  state: AdaptiveCompositionEngineState,
  segmentId: string,
  mode: CompositionMode,
  quality: CompositionQuality,
  length: number,
  effectiveness: number,
  chapter: number
): AdaptiveCompositionEngineState {
  const segment: CompositionSegment = { segmentId, mode, quality, length, effectiveness, chapter };
  const segments = new Map(state.segments).set(segmentId, segment);
  return recomputeAdaptComp({ ...state, segments, totalSegments: segments.size });
}

// Add shift
export function addCompositionShift(
  state: AdaptiveCompositionEngineState,
  shiftId: string,
  segmentId: string,
  fromMode: CompositionMode,
  toMode: CompositionMode,
  trigger: AdaptationTrigger,
  chapter: number
): AdaptiveCompositionEngineState {
  const shift: CompositionShift = { shiftId, segmentId, fromMode, toMode, trigger, chapter };
  const shifts = new Map(state.shifts).set(shiftId, shift);
  return recomputeAdaptComp({ ...state, shifts, totalShifts: shifts.size });
}

// Get segments by mode
export function getSegmentsByMode(state: AdaptiveCompositionEngineState, mode: CompositionMode): CompositionSegment[] {
  return Array.from(state.segments.values()).filter(s => s.mode === mode);
}

// Get composition report
export function getCompositionReport(state: AdaptiveCompositionEngineState): {
  totalSegments: number;
  totalShifts: number;
  averageQuality: number;
  averageEffectiveness: number;
  modeVersatility: number;
  compositionMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalSegments === 0) recommendations.push('No segments — add segments');
  if (state.modeVersatility < 0.3) recommendations.push('Low versatility — diversify');
  if (state.compositionMastery < 0.5) recommendations.push('Low mastery — improve');

  return {
    totalSegments: state.totalSegments,
    totalShifts: state.totalShifts,
    averageQuality: Math.round(state.averageQuality * 100) / 100,
    averageEffectiveness: Math.round(state.averageEffectiveness * 100) / 100,
    modeVersatility: Math.round(state.modeVersatility * 100) / 100,
    compositionMastery: Math.round(state.compositionMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAdaptComp(state: AdaptiveCompositionEngineState): AdaptiveCompositionEngineState {
  const segments = Array.from(state.segments.values());
  const qualityMap: Record<CompositionQuality, number> = { rough: 0.2, adequate: 0.4, polished: 0.6, refined: 0.8, masterful: 1.0 };
  const averageQuality = segments.length === 0 ? 0.5
    : segments.reduce((s, seg) => s + qualityMap[seg.quality], 0) / segments.length;
  const averageEffectiveness = segments.length === 0 ? 0.5
    : segments.reduce((s, seg) => s + seg.effectiveness, 0) / segments.length;

  const modeSet = new Set(segments.map(s => s.mode));
  const modeVersatility = Math.min(1, modeSet.size / 5);

  const compositionMastery = (averageQuality * 0.4 + averageEffectiveness * 0.3 + modeVersatility * 0.3);

  return { ...state, averageQuality, averageEffectiveness, modeVersatility, compositionMastery };
}

// Reset composition state
export function resetAdaptiveCompositionEngineState(): AdaptiveCompositionEngineState {
  return createAdaptiveCompositionEngineState();
}