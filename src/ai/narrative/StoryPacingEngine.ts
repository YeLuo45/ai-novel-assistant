/**
 * V848 StoryPacingEngine — Direction B Iter 2/15 (Round 4)
 * Story pacing engine: pacing control + rhythm management
 * Sources: thunderbolt pacing + nanobot + chatdev
 */

export type PacingMode = 'fast' | 'moderate' | 'slow' | 'variable' | 'dynamic';
export type PacingEvent = 'action' | 'dialogue' | 'description' | 'introspection' | 'transition';
export type PacingPhase = 'setup' | 'rising' | 'climax' | 'falling' | 'resolution';

export interface PacingSegment {
  segmentId: string;
  mode: PacingMode;
  event: PacingEvent;
  phase: PacingPhase;
  startTime: number;
  endTime: number;
  intensity: number;
  duration: number;
}

export interface PacingCurve {
  curveId: string;
  name: string;
  segments: string[];
  peakIntensity: number;
  averageIntensity: number;
  variability: number;
}

export interface StoryPacingEngineState {
  segments: Map<string, PacingSegment>;
  curves: Map<string, PacingCurve>;
  totalSegments: number;
  totalCurves: number;
  averageIntensity: number;
  pacingVariability: number;
  rhythmScore: number;
  pacingEffectiveness: number;
  phaseBalance: number;
}

// Factory
export function createStoryPacingEngineState(): StoryPacingEngineState {
  return {
    segments: new Map(),
    curves: new Map(),
    totalSegments: 0,
    totalCurves: 0,
    averageIntensity: 0.5,
    pacingVariability: 0,
    rhythmScore: 0.5,
    pacingEffectiveness: 0.5,
    phaseBalance: 0.5,
  };
}

// Add segment
export function addPacingSegment(
  state: StoryPacingEngineState,
  segmentId: string,
  mode: PacingMode,
  event: PacingEvent,
  phase: PacingPhase,
  startTime: number,
  endTime: number,
  intensity: number = 0.5
): StoryPacingEngineState {
  const segment: PacingSegment = {
    segmentId, mode, event, phase, startTime, endTime,
    intensity: Math.min(1, Math.max(0, intensity)),
    duration: Math.max(0, endTime - startTime),
  };
  const segments = new Map(state.segments).set(segmentId, segment);
  return recomputePacing({ ...state, segments, totalSegments: segments.size });
}

// Create curve
export function createPacingCurve(
  state: StoryPacingEngineState,
  curveId: string,
  name: string,
  segmentIds: string[]
): StoryPacingEngineState {
  const segments = segmentIds.map(id => state.segments.get(id)).filter((s): s is PacingSegment => s !== undefined);
  const peakIntensity = segments.length === 0 ? 0 : Math.max(...segments.map(s => s.intensity));
  const averageIntensity = segments.length === 0 ? 0
    : segments.reduce((s, seg) => s + seg.intensity, 0) / segments.length;
  const variability = segments.length === 0 ? 0
    : segments.reduce((s, seg) => s + Math.abs(seg.intensity - averageIntensity), 0) / segments.length;

  const curve: PacingCurve = { curveId, name, segments: segmentIds, peakIntensity, averageIntensity, variability };
  const curves = new Map(state.curves).set(curveId, curve);
  return recomputePacing({ ...state, curves, totalCurves: curves.size });
}

// Get segments by mode
export function getSegmentsByMode(state: StoryPacingEngineState, mode: PacingMode): PacingSegment[] {
  return Array.from(state.segments.values()).filter(s => s.mode === mode);
}

// Get pacing report
export function getPacingReport(state: StoryPacingEngineState): {
  totalSegments: number;
  totalCurves: number;
  averageIntensity: number;
  pacingVariability: number;
  rhythmScore: number;
  pacingEffectiveness: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalSegments === 0) recommendations.push('No segments — add pacing');
  if (state.pacingVariability < 0.1) recommendations.push('Low variability — vary the pace');
  if (state.rhythmScore < 0.5) recommendations.push('Low rhythm — improve rhythm');

  return {
    totalSegments: state.totalSegments,
    totalCurves: state.totalCurves,
    averageIntensity: Math.round(state.averageIntensity * 100) / 100,
    pacingVariability: Math.round(state.pacingVariability * 100) / 100,
    rhythmScore: Math.round(state.rhythmScore * 100) / 100,
    pacingEffectiveness: Math.round(state.pacingEffectiveness * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputePacing(state: StoryPacingEngineState): StoryPacingEngineState {
  const segments = Array.from(state.segments.values());
  const averageIntensity = segments.length === 0 ? 0.5
    : segments.reduce((s, seg) => s + seg.intensity, 0) / segments.length;
  const pacingVariability = segments.length === 0 ? 0
    : segments.reduce((s, seg) => s + Math.abs(seg.intensity - averageIntensity), 0) / segments.length;

  // Rhythm score: balance between intensity and variability
  const rhythmScore = Math.min(1, averageIntensity * 0.5 + Math.min(0.5, pacingVariability));

  // Effectiveness: how well segments transition
  const curves = Array.from(state.curves.values());
  const pacingEffectiveness = curves.length === 0 ? 0.5
    : curves.reduce((s, c) => s + Math.min(1, c.peakIntensity + (1 - c.variability) * 0.5), 0) / curves.length;

  // Phase balance
  const phaseSet = new Set(segments.map(s => s.phase));
  const phaseBalance = Math.min(1, phaseSet.size / 5);

  return { ...state, averageIntensity, pacingVariability, rhythmScore, pacingEffectiveness, phaseBalance };
}

// Reset pacing state
export function resetStoryPacingEngineState(): StoryPacingEngineState {
  return createStoryPacingEngineState();
}