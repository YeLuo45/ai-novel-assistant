/**
 * V950 NarrativeEvaluationEngine — Direction E Iter 8/15 (Round 4)
 * Narrative evaluation engine: evaluate narrative quality + value
 * Sources: thunderbolt evaluation + nanobot + chatdev
 */

export type EvaluationCriterion = 'craft' | 'originality' | 'impact' | 'coherence' | 'resonance' | 'meaning';
export type EvaluationScale = 'poor' | 'fair' | 'good' | 'excellent' | 'masterful';
export type EvaluationMethod = 'rubric' | 'holistic' | 'comparative' | 'analytical' | 'empirical';

export interface Evaluation {
  evaluationId: string;
  criterion: EvaluationCriterion;
  method: EvaluationMethod;
  scale: EvaluationScale;
  score: number;
  notes: string;
  evaluator: string;
  chapter: number;
}

export interface EvaluationProfile {
  profileId: string;
  name: string;
  evaluations: string[];
  overallScore: number;
  strength: string;
  weakness: string;
}

export interface NarrativeEvaluationEngineState {
  evaluations: Map<string, Evaluation>;
  profiles: Map<string, EvaluationProfile>;
  totalEvaluations: number;
  totalProfiles: number;
  averageScore: number;
  criterionCoverage: number;
  evaluationRigor: number;
  evaluationMastery: number;
}

// Factory
export function createNarrativeEvaluationEngineState(): NarrativeEvaluationEngineState {
  return {
    evaluations: new Map(),
    profiles: new Map(),
    totalEvaluations: 0,
    totalProfiles: 0,
    averageScore: 0.5,
    criterionCoverage: 0,
    evaluationRigor: 0.5,
    evaluationMastery: 0.5,
  };
}

// Add evaluation
export function addEvaluation(
  state: NarrativeEvaluationEngineState,
  evaluationId: string,
  criterion: EvaluationCriterion,
  method: EvaluationMethod,
  scale: EvaluationScale,
  score: number,
  notes: string,
  evaluator: string,
  chapter: number
): NarrativeEvaluationEngineState {
  const evaluation: Evaluation = { evaluationId, criterion, method, scale, score, notes, evaluator, chapter };
  const evaluations = new Map(state.evaluations).set(evaluationId, evaluation);
  return recomputeEvaluation({ ...state, evaluations, totalEvaluations: evaluations.size });
}

// Add profile
export function addEvaluationProfile(
  state: NarrativeEvaluationEngineState,
  profileId: string,
  name: string,
  evaluationIds: string[],
  strength: string = '',
  weakness: string = ''
): NarrativeEvaluationEngineState {
  const evaluations = evaluationIds.map(id => state.evaluations.get(id)).filter((e): e is Evaluation => e !== undefined);
  const overallScore = evaluations.length === 0 ? 0.5
    : evaluations.reduce((s, e) => s + e.score, 0) / evaluations.length;
  const profile: EvaluationProfile = { profileId, name, evaluationIds, overallScore, strength, weakness };
  const profiles = new Map(state.profiles).set(profileId, profile);
  return recomputeEvaluation({ ...state, profiles, totalProfiles: profiles.size });
}

// Get evaluations by criterion
export function getEvaluationsByCriterion(state: NarrativeEvaluationEngineState, criterion: EvaluationCriterion): Evaluation[] {
  return Array.from(state.evaluations.values()).filter(e => e.criterion === criterion);
}

// Get evaluation report
export function getEvaluationReport(state: NarrativeEvaluationEngineState): {
  totalEvaluations: number;
  totalProfiles: number;
  averageScore: number;
  criterionCoverage: number;
  evaluationMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEvaluations === 0) recommendations.push('No evaluations — add evaluations');
  if (state.criterionCoverage < 0.3) recommendations.push('Low coverage — diversify');
  if (state.evaluationMastery < 0.5) recommendations.push('Low mastery — improve');

  return {
    totalEvaluations: state.totalEvaluations,
    totalProfiles: state.totalProfiles,
    averageScore: Math.round(state.averageScore * 100) / 100,
    criterionCoverage: Math.round(state.criterionCoverage * 100) / 100,
    evaluationMastery: Math.round(state.evaluationMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeEvaluation(state: NarrativeEvaluationEngineState): NarrativeEvaluationEngineState {
  const evaluations = Array.from(state.evaluations.values());
  const averageScore = evaluations.length === 0 ? 0.5
    : evaluations.reduce((s, e) => s + e.score, 0) / evaluations.length;
  const criterionSet = new Set(evaluations.map(e => e.criterion));
  const criterionCoverage = Math.min(1, criterionSet.size / 5);

  const methodSet = new Set(evaluations.map(e => e.method));
  const methodCoverage = methodSet.size / 5;
  const evaluationRigor = methodCoverage;

  const evaluationMastery = (averageScore * 0.4 + criterionCoverage * 0.3 + evaluationRigor * 0.3);

  return { ...state, averageScore, criterionCoverage, evaluationRigor, evaluationMastery };
}

// Reset evaluation state
export function resetNarrativeEvaluationEngineState(): NarrativeEvaluationEngineState {
  return createNarrativeEvaluationEngineState();
}