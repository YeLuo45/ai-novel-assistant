/**
 * V796 QualityOptimizationEngine — Direction D Iter 3/9 (Round 3)
 * Quality optimization engine: quality metrics + optimization strategies
 * Sources: thunderbolt quality + chatdev + generic-agent
 */

export type QualityDimension = 'prose' | 'plot' | 'character' | 'world' | 'theme' | 'pacing';
export type OptimizationStrategy = 'incremental' | 'replacement' | 'restructuring' | 'injection' | 'removal';
export type QualityLevel = 'poor' | 'fair' | 'good' | 'excellent' | 'masterful';

export interface QualityMeasurement {
  measurementId: string;
  dimension: QualityDimension;
  score: number;
  level: QualityLevel;
  timestamp: number;
  chapter: number;
  notes: string;
}

export interface OptimizationAction {
  actionId: string;
  measurementId: string;
  strategy: OptimizationStrategy;
  description: string;
  expectedImprovement: number;
  actualImprovement: number;
  status: 'planned' | 'in_progress' | 'completed' | 'failed';
}

export interface QualityOptimizationEngineState {
  measurements: Map<string, QualityMeasurement>;
  actions: Map<string, OptimizationAction>;
  totalMeasurements: number;
  totalActions: number;
  completedActions: number;
  averageQuality: number;
  qualityByDimension: Map<QualityDimension, number>;
  overallLevel: QualityLevel;
  improvementVelocity: number;
  optimizationEffectiveness: number;
}

// Factory
export function createQualityOptimizationEngineState(): QualityOptimizationEngineState {
  return {
    measurements: new Map(),
    actions: new Map(),
    totalMeasurements: 0,
    totalActions: 0,
    completedActions: 0,
    averageQuality: 0.5,
    qualityByDimension: new Map(),
    overallLevel: 'fair',
    improvementVelocity: 0,
    optimizationEffectiveness: 0.5,
  };
}

// Measure quality
export function measureQuality(
  state: QualityOptimizationEngineState,
  measurementId: string,
  dimension: QualityDimension,
  score: number,
  chapter: number,
  notes: string = ''
): QualityOptimizationEngineState {
  const clampedScore = Math.min(1, Math.max(0, score));
  const level: QualityLevel = clampedScore < 0.3 ? 'poor'
    : clampedScore < 0.5 ? 'fair'
    : clampedScore < 0.7 ? 'good'
    : clampedScore < 0.9 ? 'excellent'
    : 'masterful';

  const measurement: QualityMeasurement = { measurementId, dimension, score: clampedScore, level, timestamp: Date.now(), chapter, notes };
  const measurements = new Map(state.measurements).set(measurementId, measurement);

  const qualityByDimension = new Map(state.qualityByDimension);
  const existingScores = Array.from(measurements.values()).filter(m => m.dimension === dimension);
  const avgScore = existingScores.reduce((s, m) => s + m.score, 0) / existingScores.length;
  qualityByDimension.set(dimension, avgScore);

  return recomputeQualityOpt({ ...state, measurements, qualityByDimension, totalMeasurements: measurements.size });
}

// Plan optimization
export function planOptimization(
  state: QualityOptimizationEngineState,
  actionId: string,
  measurementId: string,
  strategy: OptimizationStrategy,
  description: string,
  expectedImprovement: number
): QualityOptimizationEngineState {
  const action: OptimizationAction = {
    actionId, measurementId, strategy, description,
    expectedImprovement: Math.min(1, Math.max(0, expectedImprovement)),
    actualImprovement: 0,
    status: 'planned',
  };
  const actions = new Map(state.actions).set(actionId, action);
  return recomputeQualityOpt({ ...state, actions, totalActions: actions.size });
}

// Complete optimization
export function completeOptimization(state: QualityOptimizationEngineState, actionId: string, actualImprovement: number): QualityOptimizationEngineState {
  const action = state.actions.get(actionId);
  if (!action) return state;

  const updated: OptimizationAction = {
    ...action,
    actualImprovement: Math.min(1, Math.max(0, actualImprovement)),
    status: actualImprovement >= action.expectedImprovement * 0.8 ? 'completed' : 'failed',
  };
  const actions = new Map(state.actions).set(actionId, updated);
  const completedActions = updated.status === 'completed' ? state.completedActions + 1 : state.completedActions;
  return recomputeQualityOpt({ ...state, actions, completedActions });
}

// Get measurements by dimension
export function getMeasurementsByDimension(state: QualityOptimizationEngineState, dimension: QualityDimension): QualityMeasurement[] {
  return Array.from(state.measurements.values()).filter(m => m.dimension === dimension);
}

// Get actions by status
export function getActionsByStatus(state: QualityOptimizationEngineState, status: OptimizationAction['status']): OptimizationAction[] {
  return Array.from(state.actions.values()).filter(a => a.status === status);
}

// Get quality report
export function getQualityOptimizationReport(state: QualityOptimizationEngineState): {
  totalMeasurements: number;
  totalActions: number;
  completedActions: number;
  averageQuality: number;
  overallLevel: QualityLevel;
  improvementVelocity: number;
  optimizationEffectiveness: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalMeasurements === 0) recommendations.push('No measurements — measure quality');
  if (state.averageQuality < 0.5) recommendations.push('Low average quality — improve');
  if (state.optimizationEffectiveness < 0.5) recommendations.push('Low effectiveness — refine optimizations');

  return {
    totalMeasurements: state.totalMeasurements,
    totalActions: state.totalActions,
    completedActions: state.completedActions,
    averageQuality: Math.round(state.averageQuality * 100) / 100,
    overallLevel: state.overallLevel,
    improvementVelocity: Math.round(state.improvementVelocity * 100) / 100,
    optimizationEffectiveness: Math.round(state.optimizationEffectiveness * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeQualityOpt(state: QualityOptimizationEngineState): QualityOptimizationEngineState {
  const measurements = Array.from(state.measurements.values());
  const averageQuality = measurements.length === 0 ? 0.5
    : measurements.reduce((s, m) => s + m.score, 0) / measurements.length;

  const level: QualityLevel = averageQuality < 0.3 ? 'poor'
    : averageQuality < 0.5 ? 'fair'
    : averageQuality < 0.7 ? 'good'
    : averageQuality < 0.9 ? 'excellent'
    : 'masterful';

  const actions = Array.from(state.actions.values());
  const completedActions = actions.filter(a => a.status === 'completed');
  const totalExpected = actions.reduce((s, a) => s + a.expectedImprovement, 0);
  const totalActual = completedActions.reduce((s, a) => s + a.actualImprovement, 0);
  const optimizationEffectiveness = totalExpected === 0 ? 0.5 : totalActual / totalExpected;
  const improvementVelocity = state.totalActions === 0 ? 0 : completedActions.length / state.totalActions;

  return { ...state, averageQuality, overallLevel: level, optimizationEffectiveness, improvementVelocity };
}

// Reset quality state
export function resetQualityOptimizationEngineState(): QualityOptimizationEngineState {
  return createQualityOptimizationEngineState();
}