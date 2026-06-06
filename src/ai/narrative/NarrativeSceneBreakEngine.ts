/**
 * V1012 NarrativeSceneBreakEngine — Direction B Iter 9/15 (Round 5)
 * Scene break engine: scene transitions + breaks
 * Sources: thunderbolt scene + nanobot + chatdev
 */

export type BreakType = 'hard_break' | 'soft_break' | 'time_skip' | 'location_shift' | 'pov_shift' | 'flashback';
export type BreakClarity = 'abrupt' | 'clear' | 'subtle' | 'elegant' | 'invisible';
export type BreakPurpose = 'pacing' | 'perspective' | 'time' | 'place' | 'mood' | 'tension';

export interface SceneBreak {
  breakId: string;
  type: BreakType;
  clarity: BreakClarity;
  purpose: BreakPurpose;
  description: string;
  effectiveness: number;
  elegance: number;
  chapter: number;
}

export interface SceneTransition {
  transitionId: string,
  fromBreakId: string,
  toBreakId: string,
  smoothness: number,
  coherence: number,
}

export interface NarrativeSceneBreakEngineState {
  breaks: Map<string, SceneBreak>;
  transitions: Map<string, SceneTransition>;
  totalBreaks: number;
  totalTransitions: number;
  averageEffectiveness: number;
  averageElegance: number;
  transitionSmoothness: number;
  sceneBreakMastery: number;
}

// Factory
export function createNarrativeSceneBreakEngineState(): NarrativeSceneBreakEngineState {
  return {
    breaks: new Map(),
    transitions: new Map(),
    totalBreaks: 0,
    totalTransitions: 0,
    averageEffectiveness: 0.5,
    averageElegance: 0.5,
    transitionSmoothness: 0.5,
    sceneBreakMastery: 0.5,
  };
}

// Add break
export function addSceneBreak(
  state: NarrativeSceneBreakEngineState,
  breakId: string,
  type: BreakType,
  clarity: BreakClarity,
  purpose: BreakPurpose,
  description: string,
  effectiveness: number,
  elegance: number,
  chapter: number
): NarrativeSceneBreakEngineState {
  const sceneBreak: SceneBreak = { breakId, type, clarity, purpose, description, effectiveness, elegance, chapter };
  const breaks = new Map(state.breaks).set(breakId, sceneBreak);
  return recomputeSceneBreak({ ...state, breaks, totalBreaks: breaks.size });
}

// Add transition
export function addSceneTransition(
  state: NarrativeSceneBreakEngineState,
  transitionId: string,
  fromBreakId: string,
  toBreakId: string,
  smoothness: number,
  coherence: number
): NarrativeSceneBreakEngineState {
  const transition: SceneTransition = { transitionId, fromBreakId, toBreakId, smoothness, coherence };
  const transitions = new Map(state.transitions).set(transitionId, transition);
  return recomputeSceneBreak({ ...state, transitions, totalTransitions: transitions.size });
}

// Get breaks by type
export function getSceneBreaksByType(state: NarrativeSceneBreakEngineState, type: BreakType): SceneBreak[] {
  return Array.from(state.breaks.values()).filter(b => b.type === type);
}

// Get scene break report
export function getSceneBreakReport(state: NarrativeSceneBreakEngineState): {
  totalBreaks: number;
  totalTransitions: number;
  averageEffectiveness: number;
  transitionSmoothness: number;
  sceneBreakMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalBreaks === 0) recommendations.push('No breaks — add scene breaks');
  if (state.averageEffectiveness < 0.5) recommendations.push('Low effectiveness — improve');
  if (state.sceneBreakMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalBreaks: state.totalBreaks,
    totalTransitions: state.totalTransitions,
    averageEffectiveness: Math.round(state.averageEffectiveness * 100) / 100,
    transitionSmoothness: Math.round(state.transitionSmoothness * 100) / 100,
    sceneBreakMastery: Math.round(state.sceneBreakMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeSceneBreak(state: NarrativeSceneBreakEngineState): NarrativeSceneBreakEngineState {
  const breaks = Array.from(state.breaks.values());
  const averageEffectiveness = breaks.length === 0 ? 0.5
    : breaks.reduce((s, b) => s + b.effectiveness, 0) / breaks.length;
  const averageElegance = breaks.length === 0 ? 0.5
    : breaks.reduce((s, b) => s + b.elegance, 0) / breaks.length;

  const transitions = Array.from(state.transitions.values());
  const transitionSmoothness = transitions.length === 0 ? 0.5
    : transitions.reduce((s, t) => s + t.smoothness, 0) / transitions.length;

  const sceneBreakMastery = (averageEffectiveness * 0.4 + averageElegance * 0.3 + transitionSmoothness * 0.3);

  return { ...state, averageEffectiveness, averageElegance, transitionSmoothness, sceneBreakMastery };
}

// Reset
export function resetNarrativeSceneBreakEngineState(): NarrativeSceneBreakEngineState {
  return createNarrativeSceneBreakEngineState();
}