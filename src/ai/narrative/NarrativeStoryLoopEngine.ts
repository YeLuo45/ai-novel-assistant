/**
 * V1290 NarrativeStoryLoopEngine — Direction I Iter 13/20 (Round 5)
 * Story loop engine: loops in story
 * Sources: nanobot loop + thunderbolt + ruflo
 */

export type StoryLoopType = 'causal' | 'thematic' | 'symbolic' | 'structural' | 'emotional' | 'narrative';
export type StoryLoopClosure = 'open' | 'partial' | 'closed' | 'perfect' | 'transcendent';
export type StoryLoopIteration = 'first' | 'second' | 'third' | 'fourth' | 'infinite';

export interface StoryLoopNode {
  loopId: string;
  type: StoryLoopType;
  closure: StoryLoopClosure;
  iteration: StoryLoopIteration;
  description: string;
  completion: number;
  resonance: number;
  chapter: number;
}

export interface StoryLoopCycle {
  cycleId: string,
  loopIds: string[],
  cumulativeCompletion: number,
  harmony: number,
}

export interface NarrativeStoryLoopEngineState {
  loops: Map<string, StoryLoopNode>;
  cycles: Map<string, StoryLoopCycle>;
  totalLoops: number;
  totalCycles: number;
  averageCompletion: number;
  averageResonance: number;
  cycleHarmony: number;
  storyLoopMastery: number;
}

// Factory
export function createNarrativeStoryLoopEngineState(): NarrativeStoryLoopEngineState {
  return {
    loops: new Map(),
    cycles: new Map(),
    totalLoops: 0,
    totalCycles: 0,
    averageCompletion: 0.5,
    averageResonance: 0.5,
    cycleHarmony: 0.5,
    storyLoopMastery: 0.5,
  };
}

// Add loop
export function addStoryLoopNode(
  state: NarrativeStoryLoopEngineState,
  loopId: string,
  type: StoryLoopType,
  closure: StoryLoopClosure,
  iteration: StoryLoopIteration,
  description: string,
  completion: number,
  resonance: number,
  chapter: number
): NarrativeStoryLoopEngineState {
  const loop: StoryLoopNode = { loopId, type, closure, iteration, description, completion, resonance, chapter };
  const loops = new Map(state.loops).set(loopId, loop);
  return recomputeStoryLoop({ ...state, loops, totalLoops: loops.size });
}

// Add cycle
export function addStoryLoopCycle(
  state: NarrativeStoryLoopEngineState,
  cycleId: string,
  loopIds: string[]
): NarrativeStoryLoopEngineState {
  const loops = loopIds.map(id => state.loops.get(id)).filter((l): l is StoryLoopNode => l !== undefined);
  const cumulativeCompletion = loops.length === 0 ? 0
    : loops.reduce((s, l) => s + l.completion, 0) / loops.length;
  const typeSet = new Set(loops.map(l => l.type));
  const harmony = Math.min(1, typeSet.size / 6);
  const cycle: StoryLoopCycle = { cycleId, loopIds, cumulativeCompletion, harmony };
  const cycles = new Map(state.cycles).set(cycleId, cycle);
  return recomputeStoryLoop({ ...state, cycles, totalCycles: cycles.size });
}

// Get loops by type
export function getStoryLoopNodesByType(state: NarrativeStoryLoopEngineState, type: StoryLoopType): StoryLoopNode[] {
  return Array.from(state.loops.values()).filter(l => l.type === type);
}

// Get story loop report
export function getStoryLoopReport(state: NarrativeStoryLoopEngineState): {
  totalLoops: number;
  totalCycles: number;
  averageCompletion: number;
  averageResonance: number;
  storyLoopMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalLoops === 0) recommendations.push('No loops — add story loop nodes');
  if (state.averageCompletion < 0.5) recommendations.push('Low completion — strengthen');
  if (state.storyLoopMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalLoops: state.totalLoops,
    totalCycles: state.totalCycles,
    averageCompletion: Math.round(state.averageCompletion * 100) / 100,
    averageResonance: Math.round(state.averageResonance * 100) / 100,
    storyLoopMastery: Math.round(state.storyLoopMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeStoryLoop(state: NarrativeStoryLoopEngineState): NarrativeStoryLoopEngineState {
  const loops = Array.from(state.loops.values());
  const averageCompletion = loops.length === 0 ? 0.5
    : loops.reduce((s, l) => s + l.completion, 0) / loops.length;
  const averageResonance = loops.length === 0 ? 0.5
    : loops.reduce((s, l) => s + l.resonance, 0) / loops.length;

  const cycles = Array.from(state.cycles.values());
  const cycleHarmony = cycles.length === 0 ? 0.5
    : cycles.reduce((s, c) => s + c.harmony, 0) / cycles.length;

  const storyLoopMastery = (averageCompletion * 0.4 + averageResonance * 0.3 + cycleHarmony * 0.3);

  return { ...state, averageCompletion, averageResonance, cycleHarmony, storyLoopMastery };
}

// Reset
export function resetNarrativeStoryLoopEngineState(): NarrativeStoryLoopEngineState {
  return createNarrativeStoryLoopEngineState();
}