/**
 * V706 QualityAssessmentEngine — Direction D Iter 3/9 (Round 2)
 * Quality assessment engine: multi-dimensional quality scoring
 * Sources: thunderbolt evaluation + chatdev + nanobot
 */

export type QualityDimension = 'originality' | 'craft' | 'engagement' | 'meaning' | 'emotion' | 'style';
export type QualityGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface QualityCriterion {
  dimension: QualityDimension;
  score: number;
  weight: number;
  notes: string;
}

export interface Assessment {
  assessmentId: string;
  workId: string;
  criteria: QualityCriterion[];
  overallScore: number;
  grade: QualityGrade;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  timestamp: number;
}

export interface QualityAssessmentState {
  assessments: Map<string, Assessment>;
  totalAssessments: number;
  averageScore: number;
  gradeDistribution: Map<QualityGrade, number>;
  lastAssessmentAt: number | null;
  improvementTrend: number;
}

// Factory
export function createQualityAssessmentState(): QualityAssessmentState {
  return {
    assessments: new Map(),
    totalAssessments: 0,
    averageScore: 0,
    gradeDistribution: new Map(),
    lastAssessmentAt: null,
    improvementTrend: 0,
  };
}

// Create assessment
export function createAssessment(
  state: QualityAssessmentState,
  assessmentId: string,
  workId: string,
  criteria: QualityCriterion[]
): QualityAssessmentState {
  const overallScore = computeOverallScore(criteria);
  const grade = scoreToGrade(overallScore);
  const strengths = identifyStrengths(criteria);
  const weaknesses = identifyWeaknesses(criteria);
  const recommendations = generateRecommendations(weaknesses);

  const assessment: Assessment = {
    assessmentId,
    workId,
    criteria,
    overallScore,
    grade,
    strengths,
    weaknesses,
    recommendations,
    timestamp: Date.now(),
  };

  const assessments = new Map(state.assessments).set(assessmentId, assessment);
  const gradeDistribution = new Map(state.gradeDistribution);
  gradeDistribution.set(grade, (gradeDistribution.get(grade) || 0) + 1);

  return recomputeQuality({
    ...state,
    assessments,
    gradeDistribution,
    totalAssessments: assessments.size,
    lastAssessmentAt: Date.now(),
  });
}

// Add criterion to assessment
export function addCriterion(
  state: QualityAssessmentState,
  assessmentId: string,
  dimension: QualityDimension,
  score: number,
  weight: number = 1,
  notes: string = ''
): QualityAssessmentState {
  const assessment = state.assessments.get(assessmentId);
  if (!assessment) return state;

  const criterion: QualityCriterion = {
    dimension,
    score: Math.min(1, Math.max(0, score)),
    weight,
    notes,
  };
  const updated: Assessment = { ...assessment, criteria: [...assessment.criteria, criterion] };
  updated.overallScore = computeOverallScore(updated.criteria);
  updated.grade = scoreToGrade(updated.overallScore);
  updated.strengths = identifyStrengths(updated.criteria);
  updated.weaknesses = identifyWeaknesses(updated.criteria);
  updated.recommendations = generateRecommendations(updated.weaknesses);

  const assessments = new Map(state.assessments).set(assessmentId, updated);
  const gradeDistribution = new Map(state.gradeDistribution);
  gradeDistribution.set(updated.grade, (gradeDistribution.get(updated.grade) || 0) + 1);

  return recomputeQuality({ ...state, assessments, gradeDistribution });
}

// Get assessment by work
export function getAssessmentByWork(state: QualityAssessmentState, workId: string): Assessment[] {
  return Array.from(state.assessments.values()).filter(a => a.workId === workId);
}

// Get assessments by grade
export function getAssessmentsByGrade(state: QualityAssessmentState, grade: QualityGrade): Assessment[] {
  return Array.from(state.assessments.values()).filter(a => a.grade === grade);
}

// Compute overall score
function computeOverallScore(criteria: QualityCriterion[]): number {
  if (criteria.length === 0) return 0;
  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);
  return criteria.reduce((s, c) => s + c.score * c.weight, 0) / totalWeight;
}

// Score to grade
function scoreToGrade(score: number): QualityGrade {
  if (score >= 0.9) return 'A';
  if (score >= 0.8) return 'B';
  if (score >= 0.7) return 'C';
  if (score >= 0.6) return 'D';
  return 'F';
}

// Identify strengths
function identifyStrengths(criteria: QualityCriterion[]): string[] {
  return criteria
    .filter(c => c.score >= 0.8)
    .map(c => `Strong ${c.dimension}: ${c.notes || 'high score'}`);
}

// Identify weaknesses
function identifyWeaknesses(criteria: QualityCriterion[]): string[] {
  return criteria
    .filter(c => c.score < 0.6)
    .map(c => `Weak ${c.dimension}: ${c.notes || 'low score'}`);
}

// Generate recommendations
function generateRecommendations(weaknesses: string[]): string[] {
  return weaknesses.map(w => `Improve: ${w}`);
}

// Get quality report
export function getQualityReport(state: QualityAssessmentState): {
  totalAssessments: number;
  averageScore: number;
  gradeDistribution: Record<string, number>;
  improvementTrend: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalAssessments === 0) recommendations.push('No assessments yet — assess works');
  if (state.averageScore < 0.7) recommendations.push('Average quality below 70% — focus on improvements');

  const gradeDistribution: Record<string, number> = {};
  state.gradeDistribution.forEach((count, grade) => {
    gradeDistribution[grade] = count;
  });

  return {
    totalAssessments: state.totalAssessments,
    averageScore: Math.round(state.averageScore * 100) / 100,
    gradeDistribution,
    improvementTrend: Math.round(state.improvementTrend * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeQuality(state: QualityAssessmentState): QualityAssessmentState {
  const assessments = Array.from(state.assessments.values());
  const averageScore = assessments.length > 0
    ? assessments.reduce((s, a) => s + a.overallScore, 0) / assessments.length
    : 0;

  let improvementTrend = 0;
  if (assessments.length > 1) {
    const sorted = assessments.sort((a, b) => a.timestamp - b.timestamp);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    if (first && last) {
      improvementTrend = last.overallScore - first.overallScore;
    }
  }

  return { ...state, averageScore, improvementTrend };
}

// Reset quality state
export function resetQualityAssessmentState(): QualityAssessmentState {
  return createQualityAssessmentState();
}