/**
 * V660 NarrativeIntegrationEngine — Direction E Iter 7/9
 * Narrative integration engine: multi-engine integration + state synchronization
 * Sources: chatdev integration + thunderbolt pipeline + nanobot coordination
 */

import { createUnifiedNarrativeState } from './UnifiedNarrativeEngine';
import { createNarrativeReasoningState } from './NarrativeReasoningEngine';
import { createNarrativeMemoryState } from './NarrativeMemoryEngine';
import { createNarrativeKnowledgeState } from './NarrativeKnowledgeEngine';
import { createNarrativePlanningState } from './NarrativePlanningEngine';
import { createNarrativeEvaluationState } from './NarrativeEvaluationEngine';

export interface IntegrationState {
  unified: ReturnType<typeof createUnifiedNarrativeState>;
  reasoning: ReturnType<typeof createNarrativeReasoningState>;
  memory: ReturnType<typeof createNarrativeMemoryState>;
  knowledge: ReturnType<typeof createNarrativeKnowledgeState>;
  planning: ReturnType<typeof createNarrativePlanningState>;
  evaluation: ReturnType<typeof createNarrativeEvaluationState>;
  integrationLevel: number;
  syncErrors: number;
}

export interface IntegrationReport {
  integrationLevel: number;
  componentCount: number;
  syncStatus: string;
  recommendations: string[];
}

// Factory
export function createIntegrationState(): IntegrationState {
  return {
    unified: createUnifiedNarrativeState(),
    reasoning: createNarrativeReasoningState(),
    memory: createNarrativeMemoryState(),
    knowledge: createNarrativeKnowledgeState(),
    planning: createNarrativePlanningState(),
    evaluation: createNarrativeEvaluationState(),
    integrationLevel: 0.5,
    syncErrors: 0,
  };
}

// Sync integration state
export function syncIntegrationState(state: IntegrationState): IntegrationState {
  let syncErrors = 0;

  // Check reasoning state impacts unified understanding
  if (state.reasoning.activeChain && state.unified.semanticNodes.size === 0) {
    syncErrors++;
  }

  // Check memory impacts knowledge
  if (state.memory.totalEntries > 0 && state.knowledge.nodes.size === 0) {
    syncErrors++;
  }

  // Compute integration level
  const activeComponents = [
    state.unified.semanticNodes.size > 0,
    state.reasoning.chainHistory.length > 0,
    state.memory.totalEntries > 0,
    state.knowledge.nodes.size > 0,
    state.planning.totalNodes > 0,
    state.evaluation.evaluationCount > 0,
  ].filter(Boolean).length;

  const integrationLevel = activeComponents / 6;

  return { ...state, syncErrors, integrationLevel };
}

// Get integration report
export function getIntegrationReport(state: IntegrationState): IntegrationReport {
  const recommendations: string[] = [];
  if (state.syncErrors > 0) recommendations.push(`${state.syncErrors} sync errors detected — review component interactions`);
  if (state.integrationLevel < 0.5) recommendations.push('Low integration level — strengthen component connections');
  if (state.reasoning.chainHistory.length === 0) recommendations.push('No reasoning history — start reasoning chains');

  const syncStatus = state.syncErrors === 0 ? 'healthy' : 'errors_detected';

  return {
    integrationLevel: Math.round(state.integrationLevel * 100) / 100,
    componentCount: 6,
    syncStatus,
    recommendations,
  };
}

// Reset integration state
export function resetIntegrationState(): IntegrationState {
  return createIntegrationState();
}