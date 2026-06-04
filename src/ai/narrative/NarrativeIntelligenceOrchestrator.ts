/**
 * V664 NarrativeIntelligenceOrchestrator — Direction E Iter 9/9
 * Narrative intelligence orchestrator: integrates all Direction E modules
 * Sources: all 6 design systems unified orchestration
 */

import { createUnifiedNarrativeState } from './UnifiedNarrativeEngine';
import { createNarrativeReasoningState } from './NarrativeReasoningEngine';
import { createNarrativeMemoryState } from './NarrativeMemoryEngine';
import { createNarrativeKnowledgeState } from './NarrativeKnowledgeEngine';
import { createNarrativePlanningState } from './NarrativePlanningEngine';
import { createNarrativeEvaluationState } from './NarrativeEvaluationEngine';
import { createIntegrationState } from './NarrativeIntegrationEngine';
import { createConsensusState } from './NarrativeConsensusEngine';

export interface NarrativeIntelligenceState {
  unified: ReturnType<typeof createUnifiedNarrativeState>;
  reasoning: ReturnType<typeof createNarrativeReasoningState>;
  memory: ReturnType<typeof createNarrativeMemoryState>;
  knowledge: ReturnType<typeof createNarrativeKnowledgeState>;
  planning: ReturnType<typeof createNarrativePlanningState>;
  evaluation: ReturnType<typeof createNarrativeEvaluationState>;
  integration: ReturnType<typeof createIntegrationState>;
  consensus: ReturnType<typeof createConsensusState>;
  overallIntelligence: number;
  version: string;
}

export interface IntelligenceReport {
  unifiedUnderstanding: number;
  reasoningDepth: number;
  memoryCapacity: number;
  knowledgeDensity: number;
  planningProgress: number;
  evaluationScore: number;
  integrationLevel: number;
  consensusLevel: string;
  overallIntelligence: number;
  recommendations: string[];
}

// Factory
export function createNarrativeIntelligenceState(): NarrativeIntelligenceState {
  return {
    unified: createUnifiedNarrativeState(),
    reasoning: createNarrativeReasoningState(),
    memory: createNarrativeMemoryState(),
    knowledge: createNarrativeKnowledgeState(),
    planning: createNarrativePlanningState(),
    evaluation: createNarrativeEvaluationState(),
    integration: createIntegrationState(),
    consensus: createConsensusState(),
    overallIntelligence: 0.6,
    version: '2.0.0',
  };
}

// Run intelligence cycle
export function runIntelligenceCycle(state: NarrativeIntelligenceState): {
  state: NarrativeIntelligenceState;
  overallIntelligence: number;
  insights: string[];
} {
  const insights: string[] = [];

  // Assess unified understanding
  if (state.unified.semanticNodes.size < 3) {
    insights.push('Low semantic nodes — add more for deeper understanding');
  }

  // Assess reasoning
  if (state.reasoning.chainHistory.length === 0) {
    insights.push('No reasoning chains — start logical reasoning');
  }

  // Assess memory
  if (state.memory.totalEntries < 5) {
    insights.push('Memory capacity low — encode more experiences');
  }

  // Assess knowledge
  if (state.knowledge.nodes.size < 5) {
    insights.push('Knowledge graph sparse — add more concepts');
  }

  // Compute overall intelligence
  const unifiedScore = Math.min(1, state.unified.semanticNodes.size / 10);
  const reasoningScore = Math.min(1, state.reasoning.chainHistory.length / 5);
  const memoryScore = Math.min(1, state.memory.totalEntries / 20);
  const knowledgeScore = state.knowledge.knowledgeDensity;
  const planningScore = state.planning.planEfficiency;
  const evaluationScore = state.evaluation.evaluationCount > 0
    ? state.evaluation.evaluationHistory.reduce((s, scores) => {
        const avg = scores.reduce((a, b) => a + b.score, 0) / scores.length;
        return s + avg;
      }, 0) / state.evaluation.evaluationCount
    : 0.5;

  const overallIntelligence = (
    unifiedScore * 0.15 +
    reasoningScore * 0.2 +
    memoryScore * 0.15 +
    knowledgeScore * 0.2 +
    planningScore * 0.15 +
    evaluationScore * 0.15
  );

  return {
    state: { ...state, overallIntelligence },
    overallIntelligence: Math.round(overallIntelligence * 100) / 100,
    insights,
  };
}

// Get intelligence report
export function getIntelligenceReport(state: NarrativeIntelligenceState): IntelligenceReport {
  const insights: string[] = [];
  if (state.unified.semanticNodes.size < 3) insights.push('Low semantic nodes');
  if (state.reasoning.chainHistory.length === 0) insights.push('No reasoning chains');
  if (state.memory.totalEntries < 5) insights.push('Low memory capacity');

  return {
    unifiedUnderstanding: Math.round(state.unified.coherenceScore * 100) / 100,
    reasoningDepth: state.reasoning.depth,
    memoryCapacity: state.memory.totalEntries,
    knowledgeDensity: Math.round(state.knowledge.knowledgeDensity * 100) / 100,
    planningProgress: Math.round(state.planning.planEfficiency * 100) / 100,
    evaluationScore: state.evaluation.evaluationCount > 0
      ? Math.round((state.evaluation.evaluationHistory.reduce((s, scores) => {
          const avg = scores.reduce((a, b) => a + b.score, 0) / scores.length;
          return s + avg;
        }, 0) / state.evaluation.evaluationCount) * 100) / 100
      : 0,
    integrationLevel: Math.round(state.integration.integrationLevel * 100) / 100,
    consensusLevel: state.consensus.consensusLevel,
    overallIntelligence: Math.round(state.overallIntelligence * 100) / 100,
    recommendations: insights,
  };
}

// Reset intelligence state
export function resetNarrativeIntelligenceState(): NarrativeIntelligenceState {
  return createNarrativeIntelligenceState();
}