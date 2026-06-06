/**
 * V930 AdaptiveQualityEngine — Direction D Iter 13/15 (Round 4)
 * Adaptive quality engine: quality assurance that adapts
 * Sources: thunderbolt quality + chatdev + nanobot
 */

export type QualityDimension = 'prose' | 'plot' | 'character' | 'theme' | 'pacing' | 'consistency' | 'voice';
export type QualityStandard = 'acceptable' | 'good' | 'excellent' | 'professional' | 'masterful';
export type QualityTrend = 'improving' | 'stable' | 'declining' | 'volatile' | 'breakthrough';

export interface QualityMetric {
  metricId: string;
  dimension: QualityDimension;
  standard: QualityStandard;
  score: number;
  trend: QualityTrend;
  chapter: number;
}

export interface QualityAction {
  actionId: string;
  metricId: string;
  action: string;
  impact: number;
  success: boolean;
  chapter: number;
}

export interface AdaptiveQualityEngineState {
  metrics: Map<string, QualityMetric>;
  actions: Map<string, QualityAction>;
  totalMetrics: number;
  totalActions: number;
  averageScore: number;
  successfulActions: number;
  qualityTrajectory: QualityTrend;
  adaptiveQuality: number;
  qualityMastery: number;
}

// Factory
export function createAdaptiveQualityEngineState(): AdaptiveQualityEngineState {
  return {
    metrics: new Map(),
    actions: new Map(),
    totalMetrics: 0,
    totalActions: 0,
    averageScore: 0.5,
    successfulActions: 0,
    qualityTrajectory: 'stable',
    adaptiveQuality: 0.5,
    qualityMastery: 0.5,
  };
}

// Add metric
export function addQualityMetric(
  state: AdaptiveQualityEngineState,
  metricId: string,
  dimension: QualityDimension,
  standard: QualityStandard,
  score: number,
  trend: QualityTrend,
  chapter: number
): AdaptiveQualityEngineState {
  const metric: QualityMetric = { metricId, dimension, standard, score, trend, chapter };
  const metrics = new Map(state.metrics).set(metricId, metric);
  return recomputeAdaptQual({ ...state, metrics, totalMetrics: metrics.size });
}

// Add action
export function addQualityAction(
  state: AdaptiveQualityEngineState,
  actionId: string,
  metricId: string,
  action: string,
  impact: number,
  success: boolean,
  chapter: number
): AdaptiveQualityEngineState {
  const qa: QualityAction = { actionId, metricId, action, impact, success, chapter };
  const actions = new Map(state.actions).set(actionId, qa);
  const successfulActions = success ? state.successfulActions + 1 : state.successfulActions;
  return recomputeAdaptQual({ ...state, actions, successfulActions, totalActions: actions.size });
}

// Get metrics by dimension
export function getMetricsByDimension(state: AdaptiveQualityEngineState, dimension: QualityDimension): QualityMetric[] {
  return Array.from(state.metrics.values()).filter(m => m.dimension === dimension);
}

// Get quality report
export function getQualityReport(state: AdaptiveQualityEngineState): {
  totalMetrics: number;
  totalActions: number;
  averageScore: number;
  successfulActions: number;
  adaptiveQuality: number;
  qualityMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalMetrics === 0) recommendations.push('No metrics — add metrics');
  if (state.averageScore < 0.5) recommendations.push('Low score — improve');
  if (state.qualityMastery < 0.5) recommendations.push('Low mastery — improve');

  return {
    totalMetrics: state.totalMetrics,
    totalActions: state.totalActions,
    averageScore: Math.round(state.averageScore * 100) / 100,
    successfulActions: state.successfulActions,
    adaptiveQuality: Math.round(state.adaptiveQuality * 100) / 100,
    qualityMastery: Math.round(state.qualityMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAdaptQual(state: AdaptiveQualityEngineState): AdaptiveQualityEngineState {
  const metrics = Array.from(state.metrics.values());
  const averageScore = metrics.length === 0 ? 0.5
    : metrics.reduce((s, m) => s + m.score, 0) / metrics.length;

  // Trajectory: most common trend
  const trendCounts: Record<string, number> = {};
  metrics.forEach(m => { trendCounts[m.trend] = (trendCounts[m.trend] || 0) + 1; });
  const qualityTrajectory: QualityTrend = (Object.entries(trendCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as QualityTrend) || 'stable';

  const actions = Array.from(state.actions.values());
  const successRate = actions.length === 0 ? 0.5
    : state.successfulActions / actions.length;

  const standardMap: Record<QualityStandard, number> = { acceptable: 0.4, good: 0.6, excellent: 0.8, professional: 0.9, masterful: 1.0 };
  const avgStandard = metrics.length === 0 ? 0.5
    : metrics.reduce((s, m) => s + standardMap[m.standard], 0) / metrics.length;

  const adaptiveQuality = (averageScore * 0.4 + successRate * 0.3 + avgStandard * 0.3);
  const qualityMastery = adaptiveQuality;

  return { ...state, averageScore, qualityTrajectory, adaptiveQuality, qualityMastery };
}

// Reset quality state
export function resetAdaptiveQualityEngineState(): AdaptiveQualityEngineState {
  return createAdaptiveQualityEngineState();
}