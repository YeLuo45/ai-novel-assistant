/**
 * V672 SceneTransitionEngine — Direction C Iter 4/9 (Round 2)
 * Scene transition engine: cut, dissolve, match-cut, time-jump
 * Sources: thunderbolt pipeline + ruflo hierarchical + nanobot
 */

export type TransitionType = 'cut' | 'dissolve' | 'fade' | 'wipe' | 'match_cut' | 'time_jump' | 'montage';
export type TransitionQuality = 'poor' | 'acceptable' | 'good' | 'excellent';

export interface SceneTransition {
  transitionId: string;
  fromSceneId: string;
  toSceneId: string;
  type: TransitionType;
  duration: number;
  quality: TransitionQuality;
  emotionalContinuity: number;
  thematicEcho: string;
}

export interface SceneTransitionState {
  transitions: Map<string, SceneTransition>;
  totalTransitions: number;
  averageQuality: number;
  averageContinuity: number;
  flowScore: number;
  totalDuration: number;
}

// Factory
export function createSceneTransitionState(): SceneTransitionState {
  return {
    transitions: new Map(),
    totalTransitions: 0,
    averageQuality: 0.6,
    averageContinuity: 0.5,
    flowScore: 0.7,
    totalDuration: 0,
  };
}

// Add transition
export function addTransition(
  state: SceneTransitionState,
  transitionId: string,
  fromSceneId: string,
  toSceneId: string,
  type: TransitionType,
  duration: number,
  thematicEcho: string = ''
): SceneTransitionState {
  const quality = computeQuality(type, duration);
  const emotionalContinuity = computeContinuity(type);

  const transition: SceneTransition = {
    transitionId,
    fromSceneId,
    toSceneId,
    type,
    duration,
    quality,
    emotionalContinuity,
    thematicEcho,
  };

  const transitions = new Map(state.transitions).set(transitionId, transition);
  return recomputeTransitionMetrics({ ...state, transitions, totalTransitions: state.totalTransitions + 1 });
}

function computeQuality(type: TransitionType, duration: number): TransitionQuality {
  if (type === 'match_cut') return 'excellent';
  if (type === 'cut' && duration < 100) return 'good';
  if (type === 'dissolve' && duration >= 500 && duration <= 2000) return 'good';
  if (type === 'time_jump') return 'acceptable';
  return 'acceptable';
}

function computeContinuity(type: TransitionType): number {
  const continuityMap: Record<TransitionType, number> = {
    cut: 0.6,
    dissolve: 0.7,
    fade: 0.65,
    wipe: 0.5,
    match_cut: 0.95,
    time_jump: 0.4,
    montage: 0.7,
  };
  return continuityMap[type];
}

// Get transitions between scenes
export function getTransitionsBetweenScenes(state: SceneTransitionState, fromId: string, toId: string): SceneTransition[] {
  return Array.from(state.transitions.values()).filter(t => t.fromSceneId === fromId && t.toSceneId === toId);
}

// Get transitions by type
export function getTransitionsByType(state: SceneTransitionState, type: TransitionType): SceneTransition[] {
  return Array.from(state.transitions.values()).filter(t => t.type === type);
}

// Get transition flow
export function getTransitionFlow(state: SceneTransitionState): SceneTransition[] {
  return Array.from(state.transitions.values());
}

// Get transition report
export function getTransitionReport(state: SceneTransitionState): {
  totalTransitions: number;
  averageQuality: number;
  averageContinuity: number;
  flowScore: number;
  totalDuration: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.averageQuality < 0.6) recommendations.push('Low quality transitions — refine technique');
  if (state.averageContinuity < 0.5) recommendations.push('Low continuity — improve scene flow');
  if (state.flowScore < 0.6) recommendations.push('Low flow score — review transition choices');
  if (state.totalDuration > 60000) recommendations.push('Long total duration — tighten transitions');

  return {
    totalTransitions: state.totalTransitions,
    averageQuality: Math.round(state.averageQuality * 100) / 100,
    averageContinuity: Math.round(state.averageContinuity * 100) / 100,
    flowScore: Math.round(state.flowScore * 100) / 100,
    totalDuration: state.totalDuration,
    recommendations,
  };
}

// Recompute metrics
function recomputeTransitionMetrics(state: SceneTransitionState): SceneTransitionState {
  const transitions = Array.from(state.transitions.values());
  if (transitions.length === 0) return state;

  const qualityMap: Record<TransitionQuality, number> = {
    poor: 0.25,
    acceptable: 0.5,
    good: 0.75,
    excellent: 1.0,
  };

  const averageQuality = transitions.reduce((s, t) => s + qualityMap[t.quality], 0) / transitions.length;
  const averageContinuity = transitions.reduce((s, t) => s + t.emotionalContinuity, 0) / transitions.length;
  const totalDuration = transitions.reduce((s, t) => s + t.duration, 0);
  const flowScore = (averageQuality + averageContinuity) / 2;

  return {
    ...state,
    averageQuality,
    averageContinuity,
    totalDuration,
    flowScore,
  };
}

// Reset transition state
export function resetSceneTransitionState(): SceneTransitionState {
  return createSceneTransitionState();
}