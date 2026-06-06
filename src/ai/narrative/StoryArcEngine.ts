/**
 * V860 StoryArcEngine — Direction B Iter 8/15 (Round 4)
 * Story arc engine: arc tracking + arc development
 * Sources: ruflo arc + thunderbolt + chatdev
 */

export type ArcType = 'character' | 'plot' | 'theme' | 'relationship' | 'world' | 'meta';
export type ArcPhase = 'setup' | 'complication' | 'crisis' | 'climax' | 'resolution' | 'denouement';
export type ArcHealth = 'thriving' | 'stable' | 'strained' | 'broken' | 'transformed';

export interface StoryArc {
  arcId: string;
  type: ArcType;
  name: string;
  currentPhase: ArcPhase;
  health: ArcHealth;
  startChapter: number;
  endChapter: number | null;
  milestones: string[];
  tension: number;
  momentum: number;
}

export interface ArcBeat {
  beatId: string;
  arcId: string;
  description: string;
  chapter: number;
  type: 'setup' | 'turn' | 'crisis' | 'climax' | 'resolution';
  impact: number;
}

export interface StoryArcEngineState {
  arcs: Map<string, StoryArc>;
  beats: Map<string, ArcBeat>;
  totalArcs: number;
  totalBeats: number;
  activeArcs: number;
  completedArcs: number;
  averageTension: number;
  arcComplexity: number;
  arcCoherence: number;
  momentum: number;
}

// Factory
export function createStoryArcEngineState(): StoryArcEngineState {
  return {
    arcs: new Map(),
    beats: new Map(),
    totalArcs: 0,
    totalBeats: 0,
    activeArcs: 0,
    completedArcs: 0,
    averageTension: 0.5,
    arcComplexity: 0.5,
    arcCoherence: 0.5,
    momentum: 0.5,
  };
}

// Create arc
export function createStoryArc(
  state: StoryArcEngineState,
  arcId: string,
  type: ArcType,
  name: string,
  startChapter: number
): StoryArcEngineState {
  const arc: StoryArc = {
    arcId, type, name, currentPhase: 'setup', health: 'stable',
    startChapter, endChapter: null, milestones: [], tension: 0.5, momentum: 0.5,
  };
  const arcs = new Map(state.arcs).set(arcId, arc);
  return recomputeArc({ ...state, arcs, totalArcs: arcs.size, activeArcs: state.activeArcs + 1 });
}

// Advance arc
export function advanceArcPhase(
  state: StoryArcEngineState,
  arcId: string,
  phase: ArcPhase,
  tension: number = 0.5
): StoryArcEngineState {
  const arc = state.arcs.get(arcId);
  if (!arc) return state;

  const updated: StoryArc = { ...arc, currentPhase: phase, tension };
  const arcs = new Map(state.arcs).set(arcId, updated);
  return recomputeArc({ ...state, arcs });
}

// Add beat
export function addArcBeat(
  state: StoryArcEngineState,
  beatId: string,
  arcId: string,
  description: string,
  chapter: number,
  type: ArcBeat['type'],
  impact: number = 0.5
): StoryArcEngineState {
  const beat: ArcBeat = { beatId, arcId, description, chapter, type, impact: Math.min(1, Math.max(0, impact)) };
  const beats = new Map(state.beats).set(beatId, beat);

  // Update arc
  const arc = state.arcs.get(arcId);
  let arcs = state.arcs;
  if (arc) {
    const updated: StoryArc = { ...arc, milestones: [...arc.milestones, description] };
    arcs = new Map(state.arcs).set(arcId, updated);
  }

  return recomputeArc({ ...state, arcs, beats, totalBeats: beats.size });
}

// Complete arc
export function completeStoryArc(state: StoryArcEngineState, arcId: string, endChapter: number): StoryArcEngineState {
  const arc = state.arcs.get(arcId);
  if (!arc) return state;

  const updated: StoryArc = { ...arc, health: 'transformed', endChapter, currentPhase: 'denouement' };
  const arcs = new Map(state.arcs).set(arcId, updated);
  const activeArcs = Math.max(0, state.activeArcs - 1);
  const completedArcs = state.completedArcs + 1;
  return recomputeArc({ ...state, arcs, activeArcs, completedArcs });
}

// Get arcs by type
export function getArcsByType(state: StoryArcEngineState, type: ArcType): StoryArc[] {
  return Array.from(state.arcs.values()).filter(a => a.type === type);
}

// Get story arc report
export function getStoryArcReport(state: StoryArcEngineState): {
  totalArcs: number;
  totalBeats: number;
  activeArcs: number;
  completedArcs: number;
  averageTension: number;
  arcComplexity: number;
  momentum: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalArcs === 0) recommendations.push('No arcs — create arcs');
  if (state.averageTension < 0.4) recommendations.push('Low tension — escalate');
  if (state.momentum < 0.4) recommendations.push('Low momentum — advance arcs');

  return {
    totalArcs: state.totalArcs,
    totalBeats: state.totalBeats,
    activeArcs: state.activeArcs,
    completedArcs: state.completedArcs,
    averageTension: Math.round(state.averageTension * 100) / 100,
    arcComplexity: Math.round(state.arcComplexity * 100) / 100,
    momentum: Math.round(state.momentum * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeArc(state: StoryArcEngineState): StoryArcEngineState {
  const arcs = Array.from(state.arcs.values());
  const averageTension = arcs.length === 0 ? 0.5
    : arcs.reduce((s, a) => s + a.tension, 0) / arcs.length;
  const momentum = arcs.length === 0 ? 0.5
    : arcs.reduce((s, a) => s + a.momentum, 0) / arcs.length;
  const typeSet = new Set(arcs.map(a => a.type));
  const arcComplexity = Math.min(1, typeSet.size / 5);

  const beats = Array.from(state.beats.values());
  const arcCoherence = state.totalArcs === 0 ? 0.5
    : Math.min(1, beats.length / Math.max(1, state.totalArcs * 3));

  return { ...state, averageTension, momentum, arcComplexity, arcCoherence };
}

// Reset story arc state
export function resetStoryArcEngineState(): StoryArcEngineState {
  return createStoryArcEngineState();
}