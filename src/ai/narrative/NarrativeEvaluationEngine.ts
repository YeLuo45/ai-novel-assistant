/**
 * V658 NarrativeEvaluationEngine — Direction E Iter 6/9
 * Narrative evaluation engine: quality assessment + feedback integration
 * Sources: thunderbolt evaluation + chatdev quality + nanobot assessment
 */

export type EvaluationMetric = 'coherence' | 'engagement' | 'consistency' | 'originality' | 'emotional_impact';
export type EvaluationLevel = 'surface' | 'structural' | 'semantic' | 'holistic';

export interface MetricScore {
  metric: EvaluationMetric;
  score: number;
  weight: number;
  level: EvaluationLevel;
  reasoning: string;
}

export interface NarrativeEvaluationState {
  scores: MetricScore[];
  overallScore: number;
  evaluationCount: number;
  averageConfidence: number;
  evaluationHistory: MetricScore[][];
}

export interface EvaluationResult {
  overallScore: number;
  dominantMetrics: EvaluationMetric[];
  weakestMetrics: EvaluationMetric[];
  confidence: number;
  recommendations: string[];
}

// Factory
export function createNarrativeEvaluationState(): NarrativeEvaluationState {
  return {
    scores: [],
    overallScore: 0,
    evaluationCount: 0,
    averageConfidence: 0.8,
    evaluationHistory: [],
  };
}

// Add metric score
export function addMetricScore(
  state: NarrativeEvaluationState,
  metric: EvaluationMetric,
  score: number,
  weight: number = 1,
  level: EvaluationLevel = 'surface',
  reasoning: string = ''
): NarrativeEvaluationState {
  const metricScore: MetricScore = { metric, score: Math.min(1, Math.max(0, score)), weight, level, reasoning };
  const scores = [...state.scores, metricScore];
  const overallScore = computeOverallScore(scores);
  return { ...state, scores, overallScore };
}

// Compute overall score
function computeOverallScore(scores: MetricScore[]): number {
  if (scores.length === 0) return 0;
  const totalWeight = scores.reduce((s, m) => s + m.weight, 0);
  return scores.reduce((s, m) => s + m.score * m.weight, 0) / totalWeight;
}

// Evaluate narrative
export function evaluateNarrative(state: NarrativeEvaluationState): EvaluationResult {
  if (state.scores.length === 0) {
    return {
      overallScore: 0,
      dominantMetrics: [],
      weakestMetrics: [],
      confidence: 0,
      recommendations: ['No metrics to evaluate — add scores first'],
    };
  }

  const sorted = [...state.scores].sort((a, b) => b.score - a.score);
  const dominantMetrics = sorted.slice(0, 2).map(s => s.metric);
  const weakestMetrics = sorted.slice(-2).map(s => s.metric);

  const recommendations: string[] = [];
  if (state.overallScore < 0.6) recommendations.push('Overall score low — review narrative structure');
  if (weakestMetrics.includes('coherence')) recommendations.push('Coherence issues — strengthen logical flow');
  if (weakestMetrics.includes('engagement')) recommendations.push('Low engagement — add more compelling elements');

  const confidence = state.averageConfidence;
  return {
    overallScore: Math.round(state.overallScore * 100) / 100,
    dominantMetrics,
    weakestMetrics,
    confidence,
    recommendations,
  };
}

// Record evaluation
export function recordEvaluation(state: NarrativeEvaluationState): NarrativeEvaluationState {
  const evaluationHistory = [...state.evaluationHistory, state.scores];
  return {
    ...state,
    evaluationCount: state.evaluationCount + 1,
    evaluationHistory,
    scores: [],
  };
}

// Get evaluation report
export function getEvaluationReport(state: NarrativeEvaluationState): {
  evaluationCount: number;
  averageOverallScore: number;
  averageConfidence: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.evaluationCount === 0) recommendations.push('No evaluations yet — evaluate narrative');
  if (state.averageConfidence < 0.6) recommendations.push('Low confidence — strengthen evaluation criteria');
  if (state.evaluationHistory.length > 20) recommendations.push('Many evaluations — consider consolidating insights');

  let averageOverallScore = 0;
  if (state.evaluationHistory.length > 0) {
    const totalScore = state.evaluationHistory.reduce((s, scores) => s + computeOverallScore(scores), 0);
    averageOverallScore = totalScore / state.evaluationHistory.length;
  }

  return {
    evaluationCount: state.evaluationCount,
    averageOverallScore: Math.round(averageOverallScore * 100) / 100,
    averageConfidence: Math.round(state.averageConfidence * 100) / 100,
    recommendations,
  };
}

// Reset evaluation state
export function resetNarrativeEvaluationState(): NarrativeEvaluationState {
  return createNarrativeEvaluationState();
}