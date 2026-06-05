/**
 * V842 SelfAwarenessCore — Direction A Iter 8/9 (Round 4)
 * Self-awareness core: self-modeling + self-monitoring
 * Sources: nanobot self + generic-agent + ruflo
 */

export type AwarenessAspect = 'capability' | 'limitation' | 'state' | 'goal' | 'value' | 'identity';
export type AwarenessLevel = 'unconscious' | 'aware' | 'reflective' | 'meta_aware' | 'self_actualized';
export type AwarenessState = 'developing' | 'stable' | 'expanding' | 'integrating';

export interface SelfModel {
  modelId: string;
  aspect: AwarenessAspect;
  level: AwarenessLevel;
  state: AwarenessState;
  description: string;
  accuracy: number;
  stability: number;
  lastUpdated: number;
}

export interface SelfObservation {
  observationId: string;
  modelId: string;
  aspect: AwarenessAspect;
  observation: string;
  insight: string;
  impact: number;
  timestamp: number;
}

export interface SelfAwarenessCoreState {
  models: Map<string, SelfModel>;
  observations: Map<string, SelfObservation>;
  totalModels: number;
  totalObservations: number;
  averageAccuracy: number;
  averageStability: number;
  levelDistribution: Map<AwarenessLevel, number>;
  selfInsight: number;
  overallSelfAwareness: number;
}

// Factory
export function createSelfAwarenessCoreState(): SelfAwarenessCoreState {
  return {
    models: new Map(),
    observations: new Map(),
    totalModels: 0,
    totalObservations: 0,
    averageAccuracy: 0.5,
    averageStability: 0.5,
    levelDistribution: new Map(),
    selfInsight: 0.5,
    overallSelfAwareness: 0.5,
  };
}

// Create self model
export function createSelfModel(
  state: SelfAwarenessCoreState,
  modelId: string,
  aspect: AwarenessAspect,
  description: string,
  level: AwarenessLevel = 'aware',
  accuracy: number = 0.5
): SelfAwarenessCoreState {
  const model: SelfModel = {
    modelId, aspect, level, state: 'developing', description,
    accuracy: Math.min(1, Math.max(0, accuracy)),
    stability: 0.5, lastUpdated: Date.now(),
  };
  const models = new Map(state.models).set(modelId, model);
  const levelDistribution = new Map(state.levelDistribution);
  levelDistribution.set(level, (levelDistribution.get(level) || 0) + 1);
  return recomputeSelfAware({ ...state, models, levelDistribution, totalModels: models.size });
}

// Update stability
export function updateStability(state: SelfAwarenessCoreState, modelId: string, stability: number): SelfAwarenessCoreState {
  const model = state.models.get(modelId);
  if (!model) return state;

  const newStability = Math.min(1, Math.max(0, stability));
  const newState: AwarenessState = newStability >= 0.8 ? 'stable' : newStability >= 0.5 ? 'expanding' : 'developing';
  const updated: SelfModel = { ...model, stability: newStability, state: newState, lastUpdated: Date.now() };
  const models = new Map(state.models).set(modelId, updated);
  return recomputeSelfAware({ ...state, models });
}

// Record observation
export function recordSelfObservation(
  state: SelfAwarenessCoreState,
  observationId: string,
  modelId: string,
  observation: string,
  insight: string,
  impact: number = 0.5
): SelfAwarenessCoreState {
  const obs: SelfObservation = { observationId, modelId, aspect: 'state', observation, insight, impact: Math.min(1, Math.max(0, impact)), timestamp: Date.now() };
  const observations = new Map(state.observations).set(observationId, obs);
  return recomputeSelfAware({ ...state, observations, totalObservations: observations.size });
}

// Get models by aspect
export function getModelsByAspect(state: SelfAwarenessCoreState, aspect: AwarenessAspect): SelfModel[] {
  return Array.from(state.models.values()).filter(m => m.aspect === aspect);
}

// Get self-awareness report
export function getSelfAwarenessReport(state: SelfAwarenessCoreState): {
  totalModels: number;
  totalObservations: number;
  averageAccuracy: number;
  averageStability: number;
  selfInsight: number;
  overallSelfAwareness: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalModels === 0) recommendations.push('No models — create self models');
  if (state.averageAccuracy < 0.5) recommendations.push('Low accuracy — refine models');
  if (state.overallSelfAwareness < 0.5) recommendations.push('Low awareness — develop more');

  return {
    totalModels: state.totalModels,
    totalObservations: state.totalObservations,
    averageAccuracy: Math.round(state.averageAccuracy * 100) / 100,
    averageStability: Math.round(state.averageStability * 100) / 100,
    selfInsight: Math.round(state.selfInsight * 100) / 100,
    overallSelfAwareness: Math.round(state.overallSelfAwareness * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeSelfAware(state: SelfAwarenessCoreState): SelfAwarenessCoreState {
  const models = Array.from(state.models.values());
  const averageAccuracy = models.length === 0 ? 0.5
    : models.reduce((s, m) => s + m.accuracy, 0) / models.length;
  const averageStability = models.length === 0 ? 0.5
    : models.reduce((s, m) => s + m.stability, 0) / models.length;

  const observations = Array.from(state.observations.values());
  const selfInsight = observations.length === 0 ? 0.5
    : observations.reduce((s, o) => s + o.impact, 0) / observations.length;

  const levelMap: Record<AwarenessLevel, number> = { unconscious: 0.1, aware: 0.3, reflective: 0.5, meta_aware: 0.7, self_actualized: 1.0 };
  const totalLevels = Array.from(state.levelDistribution.entries()).reduce((s, [l, c]) => s + levelMap[l] * c, 0);
  const totalCount = Array.from(state.levelDistribution.values()).reduce((s, v) => s + v, 0);
  const avgLevel = totalCount === 0 ? 0.5 : totalLevels / totalCount;
  const overallSelfAwareness = avgLevel;

  return { ...state, averageAccuracy, averageStability, selfInsight, overallSelfAwareness };
}

// Reset self-awareness state
export function resetSelfAwarenessCoreState(): SelfAwarenessCoreState {
  return createSelfAwarenessCoreState();
}