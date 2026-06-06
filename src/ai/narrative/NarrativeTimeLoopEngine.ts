/**
 * V1198 NarrativeTimeLoopEngine — Direction G Iter 7/20 (Round 5)
 * Time loop engine: loops in time
 * Sources: ruflo loop + nanobot + thunderbolt
 */

export type TimeLoopType = 'groundhog' | 'repetition' | 'cycle' | 'spiral_loop' | 'echo_loop' | 'ouroboros';
export type TimeLoopLength = 'micro' | 'brief' | 'moderate' | 'extended' | 'infinite';
export type TimeLoopAwareness = 'unconscious' | 'partial' | 'emerging' | 'aware' | 'transcendent';

export interface TimeLoop {
  loopId: string;
  type: TimeLoopType;
  length: TimeLoopLength;
  awareness: TimeLoopAwareness;
  description: string;
  resonance: number;
  effect: number;
  chapter: number;
}

export interface TimeLoopCycle {
  cycleId: string,
  loopIds: string[],
  cumulativeResonance: number,
  repetition: number,
}

export interface NarrativeTimeLoopEngineState {
  loops: Map<string, TimeLoop>;
  cycles: Map<string, TimeLoopCycle>;
  totalLoops: number;
  totalCycles: number;
  averageResonance: number;
  averageEffect: number;
  cycleRepetition: number;
  timeLoopMastery: number;
}

// Factory
export function createNarrativeTimeLoopEngineState(): NarrativeTimeLoopEngineState {
  return {
    loops: new Map(),
    cycles: new Map(),
    totalLoops: 0,
    totalCycles: 0,
    averageResonance: 0.5,
    averageEffect: 0.5,
    cycleRepetition: 0.5,
    timeLoopMastery: 0.5,
  };
}

// Add loop
export function addTimeLoop(
  state: NarrativeTimeLoopEngineState,
  loopId: string,
  type: TimeLoopType,
  length: TimeLoopLength,
  awareness: TimeLoopAwareness,
  description: string,
  resonance: number,
  effect: number,
  chapter: number
): NarrativeTimeLoopEngineState {
  const loop: TimeLoop = { loopId, type, length, awareness, description, resonance, effect, chapter };
  const loops = new Map(state.loops).set(loopId, loop);
  return recomputeTimeLoop({ ...state, loops, totalLoops: loops.size });
}

// Add cycle
export function addTimeLoopCycle(
  state: NarrativeTimeLoopEngineState,
  cycleId: string,
  loopIds: string[]
): NarrativeTimeLoopEngineState {
  const loops = loopIds.map(id => state.loops.get(id)).filter((l): l is TimeLoop => l !== undefined);
  const cumulativeResonance = loops.length === 0 ? 0
    : loops.reduce((s, l) => s + l.resonance, 0) / loops.length;
  const typeSet = new Set(loops.map(l => l.type));
  const repetition = Math.min(1, typeSet.size / 6);
  const cycle: TimeLoopCycle = { cycleId, loopIds, cumulativeResonance, repetition };
  const cycles = new Map(state.cycles).set(cycleId, cycle);
  return recomputeTimeLoop({ ...state, cycles, totalCycles: cycles.size });
}

// Get loops by type
export function getTimeLoopsByType(state: NarrativeTimeLoopEngineState, type: TimeLoopType): TimeLoop[] {
  return Array.from(state.loops.values()).filter(l => l.type === type);
}

// Get time loop report
export function getTimeLoopReport(state: NarrativeTimeLoopEngineState): {
  totalLoops: number;
  totalCycles: number;
  averageResonance: number;
  averageEffect: number;
  timeLoopMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalLoops === 0) recommendations.push('No loops — add time loops');
  if (state.averageResonance < 0.5) recommendations.push('Low resonance — strengthen');
  if (state.timeLoopMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalLoops: state.totalLoops,
    totalCycles: state.totalCycles,
    averageResonance: Math.round(state.averageResonance * 100) / 100,
    averageEffect: Math.round(state.averageEffect * 100) / 100,
    timeLoopMastery: Math.round(state.timeLoopMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeTimeLoop(state: NarrativeTimeLoopEngineState): NarrativeTimeLoopEngineState {
  const loops = Array.from(state.loops.values());
  const averageResonance = loops.length === 0 ? 0.5
    : loops.reduce((s, l) => s + l.resonance, 0) / loops.length;
  const averageEffect = loops.length === 0 ? 0.5
    : loops.reduce((s, l) => s + l.effect, 0) / loops.length;

  const cycles = Array.from(state.cycles.values());
  const cycleRepetition = cycles.length === 0 ? 0.5
    : cycles.reduce((s, c) => s + c.repetition, 0) / cycles.length;

  const timeLoopMastery = (averageResonance * 0.4 + averageEffect * 0.3 + cycleRepetition * 0.3);

  return { ...state, averageResonance, averageEffect, cycleRepetition, timeLoopMastery };
}

// Reset
export function resetNarrativeTimeLoopEngineState(): NarrativeTimeLoopEngineState {
  return createNarrativeTimeLoopEngineState();
}