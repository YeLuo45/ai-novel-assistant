/**
 * V924 IterativeLearningEngine — Direction D Iter 10/15 (Round 4)
 * Iterative learning engine: iterative learning from experience
 * Sources: generic-agent learning + thunderbolt + nanobot
 */

export type LearningType = 'supervised' | 'unsupervised' | 'reinforcement' | 'transfer' | 'meta' | 'self_supervised';
export type LearningPhase = 'observe' | 'hypothesize' | 'experiment' | 'evaluate' | 'consolidate' | 'apply';
export type LearningRetention = 'fleeting' | 'short_term' | 'working' | 'long_term' | 'permanent';

export interface LearningExperience {
  experienceId: string;
  type: LearningType;
  phase: LearningPhase;
  retention: LearningRetention;
  insight: string;
  impact: number;
  retention_score: number;
  chapter: number;
}

export interface KnowledgeItem {
  itemId: string;
  content: string;
  source: string;
  confidence: number;
  retention: LearningRetention;
  applicationCount: number;
}

export interface IterativeLearningEngineState {
  experiences: Map<string, LearningExperience>;
  knowledge: Map<string, KnowledgeItem>;
  totalExperiences: number;
  totalKnowledge: number;
  appliedKnowledge: number;
  averageImpact: number;
  learningVelocity: number;
  learningMastery: number;
}

// Factory
export function createIterativeLearningEngineState(): IterativeLearningEngineState {
  return {
    experiences: new Map(),
    knowledge: new Map(),
    totalExperiences: 0,
    totalKnowledge: 0,
    appliedKnowledge: 0,
    averageImpact: 0.5,
    learningVelocity: 0.5,
    learningMastery: 0.5,
  };
}

// Add experience
export function addLearningExperience(
  state: IterativeLearningEngineState,
  experienceId: string,
  type: LearningType,
  phase: LearningPhase,
  insight: string,
  impact: number,
  chapter: number,
  retention: LearningRetention = 'long_term',
  retentionScore: number = 0.5
): IterativeLearningEngineState {
  const experience: LearningExperience = {
    experienceId, type, phase, retention, insight,
    impact: Math.min(1, Math.max(0, impact)),
    retention_score: Math.min(1, Math.max(0, retentionScore)),
    chapter,
  };
  const experiences = new Map(state.experiences).set(experienceId, experience);
  return recomputeIterLearn({ ...state, experiences, totalExperiences: experiences.size });
}

// Add knowledge
export function addKnowledgeItem(
  state: IterativeLearningEngineState,
  itemId: string,
  content: string,
  source: string,
  confidence: number = 0.5,
  retention: LearningRetention = 'long_term'
): IterativeLearningEngineState {
  const item: KnowledgeItem = { itemId, content, source, confidence, retention, applicationCount: 0 };
  const knowledge = new Map(state.knowledge).set(itemId, item);
  return recomputeIterLearn({ ...state, knowledge, totalKnowledge: knowledge.size });
}

// Apply knowledge
export function applyKnowledgeItem(state: IterativeLearningEngineState, itemId: string): IterativeLearningEngineState {
  const item = state.knowledge.get(itemId);
  if (!item) return state;

  const updated: KnowledgeItem = { ...item, applicationCount: item.applicationCount + 1 };
  const knowledge = new Map(state.knowledge).set(itemId, updated);
  const appliedKnowledge = state.appliedKnowledge + 1;
  return recomputeIterLearn({ ...state, knowledge, appliedKnowledge });
}

// Get experiences by type
export function getExperiencesByType(state: IterativeLearningEngineState, type: LearningType): LearningExperience[] {
  return Array.from(state.experiences.values()).filter(e => e.type === type);
}

// Get learning report
export function getLearningReport(state: IterativeLearningEngineState): {
  totalExperiences: number;
  totalKnowledge: number;
  appliedKnowledge: number;
  averageImpact: number;
  learningVelocity: number;
  learningMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalExperiences === 0) recommendations.push('No experiences — add experiences');
  if (state.averageImpact < 0.5) recommendations.push('Low impact — improve');
  if (state.learningVelocity < 0.4) recommendations.push('Low velocity — accelerate');

  return {
    totalExperiences: state.totalExperiences,
    totalKnowledge: state.totalKnowledge,
    appliedKnowledge: state.appliedKnowledge,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    learningVelocity: Math.round(state.learningVelocity * 100) / 100,
    learningMastery: Math.round(state.learningMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeIterLearn(state: IterativeLearningEngineState): IterativeLearningEngineState {
  const experiences = Array.from(state.experiences.values());
  const averageImpact = experiences.length === 0 ? 0.5
    : experiences.reduce((s, e) => s + e.impact, 0) / experiences.length;

  const knowledge = Array.from(state.knowledge.values());
  const appliedRatio = knowledge.length === 0 ? 0
    : state.appliedKnowledge / knowledge.length;

  // Velocity: experiences per knowledge
  const learningVelocity = knowledge.length === 0 ? 0.5
    : Math.min(1, experiences.length / Math.max(1, knowledge.length * 2));

  const retentionMap: Record<LearningRetention, number> = { fleeting: 0.1, short_term: 0.3, working: 0.5, long_term: 0.8, permanent: 1.0 };
  const avgRetention = knowledge.length === 0 ? 0.5
    : knowledge.reduce((s, k) => s + retentionMap[k.retention], 0) / knowledge.length;

  const learningMastery = (averageImpact * 0.3 + appliedRatio * 0.4 + avgRetention * 0.3);

  return { ...state, averageImpact, learningVelocity, learningMastery };
}

// Reset learning state
export function resetIterativeLearningEngineState(): IterativeLearningEngineState {
  return createIterativeLearningEngineState();
}