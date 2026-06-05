/**
 * V816 NarrativeComprehensionEngine — Direction E Iter 4/9 (Round 3)
 * Narrative comprehension engine: deep text/narrative understanding
 * Sources: nanobot comprehension + thunderbolt + chatdev
 */

export type ComprehensionLevel = 'literal' | 'inferential' | 'evaluative' | 'appreciative' | 'critical';
export type ComprehensionAspect = 'plot' | 'character' | 'theme' | 'symbolism' | 'context' | 'craft';
export type ComprehensionStatus = 'in_progress' | 'achieved' | 'blocked' | 'deepened';

export interface Comprehension {
  comprehensionId: string;
  aspect: ComprehensionAspect;
  level: ComprehensionLevel;
  status: ComprehensionStatus;
  evidence: string;
  interpretation: string;
  confidence: number;
  chapter: number;
  timestamp: number;
}

export interface ComprehensionQuestion {
  questionId: string;
  question: string;
  expectedAspect: ComprehensionAspect;
  answer: string;
  correct: boolean;
  quality: number;
}

export interface NarrativeComprehensionEngineState {
  comprehensions: Map<string, Comprehension>;
  questions: Map<string, ComprehensionQuestion>;
  totalComprehensions: number;
  totalQuestions: number;
  correctAnswers: number;
  averageConfidence: number;
  averageQuality: number;
  levelDistribution: Map<ComprehensionLevel, number>;
  comprehensionDepth: number;
}

// Factory
export function createNarrativeComprehensionEngineState(): NarrativeComprehensionEngineState {
  return {
    comprehensions: new Map(),
    questions: new Map(),
    totalComprehensions: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    averageConfidence: 0.5,
    averageQuality: 0.5,
    levelDistribution: new Map(),
    comprehensionDepth: 0.5,
  };
}

// Add comprehension
export function addComprehension(
  state: NarrativeComprehensionEngineState,
  comprehensionId: string,
  aspect: ComprehensionAspect,
  level: ComprehensionLevel,
  evidence: string,
  interpretation: string,
  chapter: number,
  confidence: number = 0.5
): NarrativeComprehensionEngineState {
  const comprehension: Comprehension = {
    comprehensionId, aspect, level, status: 'in_progress',
    evidence, interpretation,
    confidence: Math.min(1, Math.max(0, confidence)),
    chapter, timestamp: Date.now(),
  };
  const comprehensions = new Map(state.comprehensions).set(comprehensionId, comprehension);
  const levelDistribution = new Map(state.levelDistribution);
  levelDistribution.set(level, (levelDistribution.get(level) || 0) + 1);
  return recomputeComprehension({ ...state, comprehensions, levelDistribution, totalComprehensions: comprehensions.size });
}

// Mark comprehension status
export function setComprehensionStatus(state: NarrativeComprehensionEngineState, comprehensionId: string, status: ComprehensionStatus): NarrativeComprehensionEngineState {
  const comprehension = state.comprehensions.get(comprehensionId);
  if (!comprehension) return state;

  const updated: Comprehension = { ...comprehension, status };
  const comprehensions = new Map(state.comprehensions).set(comprehensionId, updated);
  return recomputeComprehension({ ...state, comprehensions });
}

// Answer question
export function answerComprehensionQuestion(
  state: NarrativeComprehensionEngineState,
  questionId: string,
  question: string,
  expectedAspect: ComprehensionAspect,
  answer: string,
  quality: number
): NarrativeComprehensionEngineState {
  const correct = quality >= 0.6;
  const q: ComprehensionQuestion = { questionId, question, expectedAspect, answer, correct, quality: Math.min(1, Math.max(0, quality)) };
  const questions = new Map(state.questions).set(questionId, q);
  const correctAnswers = correct ? state.correctAnswers + 1 : state.correctAnswers;
  return recomputeComprehension({ ...state, questions, correctAnswers, totalQuestions: questions.size });
}

// Get comprehensions by aspect
export function getComprehensionsByAspect(state: NarrativeComprehensionEngineState, aspect: ComprehensionAspect): Comprehension[] {
  return Array.from(state.comprehensions.values()).filter(c => c.aspect === aspect);
}

// Get comprehension report
export function getComprehensionReport(state: NarrativeComprehensionEngineState): {
  totalComprehensions: number;
  totalQuestions: number;
  correctAnswers: number;
  averageConfidence: number;
  averageQuality: number;
  comprehensionDepth: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalComprehensions === 0) recommendations.push('No comprehensions — add them');
  if (state.averageConfidence < 0.5) recommendations.push('Low confidence — strengthen');
  if (state.comprehensionDepth < 0.4) recommendations.push('Shallow — go deeper');

  return {
    totalComprehensions: state.totalComprehensions,
    totalQuestions: state.totalQuestions,
    correctAnswers: state.correctAnswers,
    averageConfidence: Math.round(state.averageConfidence * 100) / 100,
    averageQuality: Math.round(state.averageQuality * 100) / 100,
    comprehensionDepth: Math.round(state.comprehensionDepth * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeComprehension(state: NarrativeComprehensionEngineState): NarrativeComprehensionEngineState {
  const comprehensions = Array.from(state.comprehensions.values());
  const averageConfidence = comprehensions.length === 0 ? 0.5
    : comprehensions.reduce((s, c) => s + c.confidence, 0) / comprehensions.length;

  const questions = Array.from(state.questions.values());
  const averageQuality = questions.length === 0 ? 0.5
    : questions.reduce((s, q) => s + q.quality, 0) / questions.length;

  const levelMap: Record<ComprehensionLevel, number> = { literal: 0.2, inferential: 0.4, evaluative: 0.6, appreciative: 0.8, critical: 1.0 };
  const totalLevels = Array.from(state.levelDistribution.entries()).reduce((s, [l, c]) => s + levelMap[l] * c, 0);
  const totalDistribution = Array.from(state.levelDistribution.values()).reduce((s, v) => s + v, 0);
  const avgLevel = totalDistribution === 0 ? 0.5 : totalLevels / totalDistribution;
  const comprehensionDepth = avgLevel;

  return { ...state, averageConfidence, averageQuality, comprehensionDepth };
}

// Reset comprehension state
export function resetNarrativeComprehensionEngineState(): NarrativeComprehensionEngineState {
  return createNarrativeComprehensionEngineState();
}