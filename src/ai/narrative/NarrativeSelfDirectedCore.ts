/**
 * V984 NarrativeSelfDirectedCore — Direction A Iter 10/15 (Round 5)
 * Self-directed core: self-directed narrative learning + exploration
 * Sources: generic-agent self-directed + thunderbolt + nanobot
 */

export type ExplorationStrategy = 'greedy' | 'epsilon_greedy' | 'ucb' | 'thompson' | 'random' | 'systematic';
export type LearningSource = 'self' | 'environment' | 'teacher' | 'peer' | 'literature' | 'experiment';
export type CuriosityLevel = 'low' | 'moderate' | 'high' | 'intense' | 'insatiable';

export interface ExplorationStep {
  stepId: string;
  strategy: ExplorationStrategy;
  source: LearningSource;
  curiosity: CuriosityLevel;
  state: string;
  action: string;
  outcome: string;
  reward: number;
  novelty: number;
  chapter: number;
}

export interface KnowledgeItemSD {
  itemId: string,
  content: string,
  confidence: number,
  utility: number,
  applications: number,
}

export interface NarrativeSelfDirectedCoreState {
  steps: Map<string, ExplorationStep>;
  knowledge: Map<string, KnowledgeItemSD>;
  totalSteps: number;
  totalKnowledge: number;
  totalReward: number;
  averageNovelty: number;
  explorationCoverage: number;
  selfDirectedMastery: number;
}

// Factory
export function createNarrativeSelfDirectedCoreState(): NarrativeSelfDirectedCoreState {
  return {
    steps: new Map(),
    knowledge: new Map(),
    totalSteps: 0,
    totalKnowledge: 0,
    totalReward: 0,
    averageNovelty: 0.5,
    explorationCoverage: 0,
    selfDirectedMastery: 0.5,
  };
}

// Add step
export function addExplorationStep(
  state: NarrativeSelfDirectedCoreState,
  stepId: string,
  strategy: ExplorationStrategy,
  source: LearningSource,
  curiosity: CuriosityLevel,
  stateValue: string,
  action: string,
  outcome: string,
  reward: number,
  novelty: number,
  chapter: number
): NarrativeSelfDirectedCoreState {
  const step: ExplorationStep = { stepId, strategy, source, curiosity, state: stateValue, action, outcome, reward, novelty, chapter };
  const steps = new Map(state.steps).set(stepId, step);
  const totalReward = state.totalReward + reward;
  return recomputeSelfDirected({ ...state, steps, totalReward, totalSteps: steps.size });
}

// Add knowledge
export function addKnowledgeItemSD(
  state: NarrativeSelfDirectedCoreState,
  itemId: string,
  content: string,
  confidence: number,
  utility: number
): NarrativeSelfDirectedCoreState {
  const item: KnowledgeItemSD = { itemId, content, confidence, utility, applications: 0 };
  const knowledge = new Map(state.knowledge).set(itemId, item);
  return recomputeSelfDirected({ ...state, knowledge, totalKnowledge: knowledge.size });
}

// Apply knowledge
export function applyKnowledgeSD(state: NarrativeSelfDirectedCoreState, itemId: string): NarrativeSelfDirectedCoreState {
  const item = state.knowledge.get(itemId);
  if (!item) return state;

  const updated: KnowledgeItemSD = { ...item, applications: item.applications + 1 };
  const knowledge = new Map(state.knowledge).set(itemId, updated);
  return recomputeSelfDirected({ ...state, knowledge });
}

// Get steps by strategy
export function getStepsByStrategy(state: NarrativeSelfDirectedCoreState, strategy: ExplorationStrategy): ExplorationStep[] {
  return Array.from(state.steps.values()).filter(s => s.strategy === strategy);
}

// Get self-directed report
export function getSelfDirectedReport(state: NarrativeSelfDirectedCoreState): {
  totalSteps: number;
  totalKnowledge: number;
  totalReward: number;
  averageNovelty: number;
  selfDirectedMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalSteps === 0) recommendations.push('No steps — add exploration steps');
  if (state.averageNovelty < 0.3) recommendations.push('Low novelty — explore more');
  if (state.selfDirectedMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalSteps: state.totalSteps,
    totalKnowledge: state.totalKnowledge,
    totalReward: Math.round(state.totalReward * 100) / 100,
    averageNovelty: Math.round(state.averageNovelty * 100) / 100,
    selfDirectedMastery: Math.round(state.selfDirectedMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeSelfDirected(state: NarrativeSelfDirectedCoreState): NarrativeSelfDirectedCoreState {
  const steps = Array.from(state.steps.values());
  const averageNovelty = steps.length === 0 ? 0.5
    : steps.reduce((s, st) => s + st.novelty, 0) / steps.length;

  const strategySet = new Set(steps.map(s => s.strategy));
  const explorationCoverage = Math.min(1, strategySet.size / 5);

  const knowledge = Array.from(state.knowledge.values());
  const knowledgeUtility = knowledge.length === 0 ? 0
    : knowledge.reduce((s, k) => s + k.utility, 0) / knowledge.length;
  const avgApplicationRate = knowledge.length === 0 ? 0
    : knowledge.reduce((s, k) => s + k.applications, 0) / knowledge.length;

  const selfDirectedMastery = (averageNovelty * 0.4 + explorationCoverage * 0.3 + Math.min(1, knowledgeUtility) * 0.3);

  return { ...state, averageNovelty, explorationCoverage, selfDirectedMastery };
}

// Reset
export function resetNarrativeSelfDirectedCoreState(): NarrativeSelfDirectedCoreState {
  return createNarrativeSelfDirectedCoreState();
}