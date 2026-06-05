/**
 * V828 NarrativeSelfRegulationCore — Direction A Iter 1/9 (Round 4)
 * Self-regulation core: self-monitoring + self-control mechanisms
 * Sources: ruflo self-reg + nanobot + generic-agent
 */

export type RegulationMode = 'automatic' | 'controlled' | 'reflective' | 'adaptive';
export type RegulationState = 'stable' | 'adjusting' | 'struggling' | 'recovering' | 'optimal';
export type RegulationTarget = 'output' | 'process' | 'strategy' | 'attention' | 'emotion';

export interface RegulationLoop {
  loopId: string;
  target: RegulationTarget;
  mode: RegulationMode;
  state: RegulationState;
  baseline: number;
  current: number;
  threshold: number;
  adjustments: number;
  timestamp: number;
}

export interface RegulationEvent {
  eventId: string;
  loopId: string;
  description: string;
  deviation: number;
  intervention: string;
  effectiveness: number;
  timestamp: number;
}

export interface NarrativeSelfRegulationCoreState {
  loops: Map<string, RegulationLoop>;
  events: Map<string, RegulationEvent>;
  totalLoops: number;
  totalEvents: number;
  optimalLoops: number;
  strugglingLoops: number;
  averageDeviation: number;
  regulationEffectiveness: number;
  overallStability: number;
}

// Factory
export function createNarrativeSelfRegulationCoreState(): NarrativeSelfRegulationCoreState {
  return {
    loops: new Map(),
    events: new Map(),
    totalLoops: 0,
    totalEvents: 0,
    optimalLoops: 0,
    strugglingLoops: 0,
    averageDeviation: 0,
    regulationEffectiveness: 0.5,
    overallStability: 0.5,
  };
}

// Create regulation loop
export function createRegulationLoop(
  state: NarrativeSelfRegulationCoreState,
  loopId: string,
  target: RegulationTarget,
  baseline: number,
  threshold: number = 0.2,
  mode: RegulationMode = 'automatic'
): NarrativeSelfRegulationCoreState {
  const loop: RegulationLoop = {
    loopId, target, mode, state: 'stable',
    baseline, current: baseline, threshold, adjustments: 0, timestamp: Date.now(),
  };
  const loops = new Map(state.loops).set(loopId, loop);
  return recomputeSelfReg({ ...state, loops, totalLoops: loops.size });
}

// Monitor and adjust
export function monitorAndAdjust(
  state: NarrativeSelfRegulationCoreState,
  loopId: string,
  currentValue: number,
  intervention: string = ''
): NarrativeSelfRegulationCoreState {
  const loop = state.loops.get(loopId);
  if (!loop) return state;

  const deviation = Math.abs(currentValue - loop.baseline);
  const regulationState: RegulationState = deviation < 0.1 ? 'optimal'
    : deviation < 0.2 ? 'stable'
    : deviation < 0.4 ? 'adjusting'
    : deviation < 0.6 ? 'struggling'
    : 'recovering';

  const updated: RegulationLoop = { ...loop, current: currentValue, state: regulationState, adjustments: loop.adjustments + 1, timestamp: Date.now() };
  const loops = new Map(state.loops).set(loopId, updated);

  // Record event if intervention was used
  let events = state.events;
  if (intervention && deviation > loop.threshold) {
    const eventId = `e_${loopId}_${Date.now()}`;
    const event: RegulationEvent = {
      eventId, loopId, description: `Deviation ${deviation.toFixed(2)}`,
      deviation, intervention,
      effectiveness: 1 - Math.min(1, deviation),
      timestamp: Date.now(),
    };
    events = new Map(state.events).set(eventId, event);
  }

  return recomputeSelfReg({ ...state, loops, events, totalEvents: events.size });
}

// Get loops by target
export function getLoopsByTarget(state: NarrativeSelfRegulationCoreState, target: RegulationTarget): RegulationLoop[] {
  return Array.from(state.loops.values()).filter(l => l.target === target);
}

// Get self-regulation report
export function getSelfRegulationReport(state: NarrativeSelfRegulationCoreState): {
  totalLoops: number;
  totalEvents: number;
  optimalLoops: number;
  strugglingLoops: number;
  averageDeviation: number;
  regulationEffectiveness: number;
  overallStability: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalLoops === 0) recommendations.push('No loops — create regulation loops');
  if (state.strugglingLoops > 0) recommendations.push(`${state.strugglingLoops} struggling loops — address them`);
  if (state.regulationEffectiveness < 0.5) recommendations.push('Low effectiveness — strengthen interventions');

  return {
    totalLoops: state.totalLoops,
    totalEvents: state.totalEvents,
    optimalLoops: state.optimalLoops,
    strugglingLoops: state.strugglingLoops,
    averageDeviation: Math.round(state.averageDeviation * 100) / 100,
    regulationEffectiveness: Math.round(state.regulationEffectiveness * 100) / 100,
    overallStability: Math.round(state.overallStability * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeSelfReg(state: NarrativeSelfRegulationCoreState): NarrativeSelfRegulationCoreState {
  const loops = Array.from(state.loops.values());
  const optimalLoops = loops.filter(l => l.state === 'optimal').length;
  const strugglingLoops = loops.filter(l => l.state === 'struggling' || l.state === 'recovering').length;
  const averageDeviation = loops.length === 0 ? 0
    : loops.reduce((s, l) => s + Math.abs(l.current - l.baseline), 0) / loops.length;

  const events = Array.from(state.events.values());
  const regulationEffectiveness = events.length === 0 ? 0.5
    : events.reduce((s, e) => s + e.effectiveness, 0) / events.length;

  const overallStability = Math.max(0, 1 - averageDeviation * 2);

  return { ...state, optimalLoops, strugglingLoops, averageDeviation, regulationEffectiveness, overallStability };
}

// Reset self-regulation state
export function resetNarrativeSelfRegulationCoreState(): NarrativeSelfRegulationCoreState {
  return createNarrativeSelfRegulationCoreState();
}