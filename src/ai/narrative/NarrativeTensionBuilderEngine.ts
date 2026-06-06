/**
 * V1004 NarrativeTensionBuilderEngine — Direction B Iter 5/15 (Round 5)
 * Tension builder engine: building + managing tension
 * Sources: thunderbolt tension + nanobot + chatdev
 */

export type TensionType = 'dramatic' | 'suspense' | 'romantic' | 'moral' | 'existential' | 'physical';
export type TensionBuildTechnique = 'foreshadow' | 'deadline' | 'incompleteness' | 'stakes' | 'dilemma' | 'cliffhanger';
export type TensionCurve = 'steady_rise' | 'saw_tooth' | 'plateau_then_spike' | 'mountain' | 'valley' | 'wave';

export interface TensionEvent {
  eventId: string;
  type: TensionType;
  technique: TensionBuildTechnique;
  description: string;
  before: number;
  peak: number;
  release: number;
  chapter: number;
}

export interface TensionCurveData {
  curveId: string,
  eventId: string,
  shape: TensionCurve,
  peakPosition: number,
  releasePosition: number,
}

export interface NarrativeTensionBuilderEngineState {
  events: Map<string, TensionEvent>;
  curves: Map<string, TensionCurveData>;
  totalEvents: number;
  totalCurves: number;
  averageBuild: number;
  releaseEffectiveness: number;
  curveQuality: number;
  tensionMastery: number;
}

// Factory
export function createNarrativeTensionBuilderEngineState(): NarrativeTensionBuilderEngineState {
  return {
    events: new Map(),
    curves: new Map(),
    totalEvents: 0,
    totalCurves: 0,
    averageBuild: 0.5,
    releaseEffectiveness: 0.5,
    curveQuality: 0.5,
    tensionMastery: 0.5,
  };
}

// Add event
export function addTensionEvent(
  state: NarrativeTensionBuilderEngineState,
  eventId: string,
  type: TensionType,
  technique: TensionBuildTechnique,
  description: string,
  before: number,
  peak: number,
  release: number,
  chapter: number
): NarrativeTensionBuilderEngineState {
  const event: TensionEvent = { eventId, type, technique, description, before, peak, release, chapter };
  const events = new Map(state.events).set(eventId, event);
  return recomputeTension({ ...state, events, totalEvents: events.size });
}

// Add curve
export function addTensionCurve(
  state: NarrativeTensionBuilderEngineState,
  curveId: string,
  eventId: string,
  shape: TensionCurve,
  peakPosition: number,
  releasePosition: number
): NarrativeTensionBuilderEngineState {
  const curve: TensionCurveData = { curveId, eventId, shape, peakPosition, releasePosition };
  const curves = new Map(state.curves).set(curveId, curve);
  return recomputeTension({ ...state, curves, totalCurves: curves.size });
}

// Get events by type
export function getTensionEventsByType(state: NarrativeTensionBuilderEngineState, type: TensionType): TensionEvent[] {
  return Array.from(state.events.values()).filter(e => e.type === type);
}

// Get tension report
export function getTensionReport(state: NarrativeTensionBuilderEngineState): {
  totalEvents: number;
  totalCurves: number;
  averageBuild: number;
  releaseEffectiveness: number;
  tensionMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEvents === 0) recommendations.push('No events — add tension events');
  if (state.averageBuild < 0.3) recommendations.push('Low build — strengthen tension');
  if (state.tensionMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEvents: state.totalEvents,
    totalCurves: state.totalCurves,
    averageBuild: Math.round(state.averageBuild * 100) / 100,
    releaseEffectiveness: Math.round(state.releaseEffectiveness * 100) / 100,
    tensionMastery: Math.round(state.tensionMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeTension(state: NarrativeTensionBuilderEngineState): NarrativeTensionBuilderEngineState {
  const events = Array.from(state.events.values());
  const averageBuild = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + (e.peak - e.before), 0) / events.length;

  // Release effectiveness: how much release drops below peak
  const releaseEffectiveness = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + Math.max(0, e.peak - e.release), 0) / events.length;

  const curves = Array.from(state.curves.values());
  const curveQuality = curves.length === 0 ? 0.5
    : curves.reduce((s, c) => s + (c.releasePosition > c.peakPosition ? 1 : 0.5), 0) / curves.length;

  const tensionMastery = (averageBuild * 0.4 + releaseEffectiveness * 0.3 + curveQuality * 0.3);

  return { ...state, averageBuild, releaseEffectiveness, curveQuality, tensionMastery };
}

// Reset
export function resetNarrativeTensionBuilderEngineState(): NarrativeTensionBuilderEngineState {
  return createNarrativeTensionBuilderEngineState();
}