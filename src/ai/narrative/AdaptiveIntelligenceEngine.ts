/**
 * V844 AdaptiveIntelligenceEngine — Direction A Iter 9/9 (Round 4)
 * Adaptive intelligence engine: integrates all Direction A Round 4 modules
 * Sources: all 6 design systems unified orchestration
 */

import { createNarrativeSelfRegulationCoreState } from './NarrativeSelfRegulationCore';
import { createHierarchicalPlanningEngineState } from './HierarchicalPlanningEngine';
import { createFeedbackIntegrationEngineState } from './FeedbackIntegrationEngine';
import { createRefinementLoopCoreState } from './RefinementLoopCore';
import { createAdaptiveBehaviorEngineState } from './AdaptiveBehaviorEngine';
import { createAgentCommunicationCoreState } from './AgentCommunicationCore';
import { createContextualReasoningEngineState } from './ContextualReasoningEngine';
import { createSelfAwarenessCoreState } from './SelfAwarenessCore';

export interface AdaptiveIntelligenceEngineState {
  regulation: ReturnType<typeof createNarrativeSelfRegulationCoreState>;
  planning: ReturnType<typeof createHierarchicalPlanningEngineState>;
  feedback: ReturnType<typeof createFeedbackIntegrationEngineState>;
  refinement: ReturnType<typeof createRefinementLoopCoreState>;
  behavior: ReturnType<typeof createAdaptiveBehaviorEngineState>;
  communication: ReturnType<typeof createAgentCommunicationCoreState>;
  reasoning: ReturnType<typeof createContextualReasoningEngineState>;
  selfAwareness: ReturnType<typeof createSelfAwarenessCoreState>;
  overallIntelligence: number;
  version: string;
}

export interface AdaptiveIntelligenceReport {
  overallStability: number;
  planCoherence: number;
  integrationRate: number;
  refinementEfficiency: number;
  averageEffectiveness: number;
  communicationEfficiency: number;
  decisionQuality: number;
  overallSelfAwareness: number;
  overallIntelligence: number;
  recommendations: string[];
}

// Factory
export function createAdaptiveIntelligenceEngineState(): AdaptiveIntelligenceEngineState {
  return {
    regulation: createNarrativeSelfRegulationCoreState(),
    planning: createHierarchicalPlanningEngineState(),
    feedback: createFeedbackIntegrationEngineState(),
    refinement: createRefinementLoopCoreState(),
    behavior: createAdaptiveBehaviorEngineState(),
    communication: createAgentCommunicationCoreState(),
    reasoning: createContextualReasoningEngineState(),
    selfAwareness: createSelfAwarenessCoreState(),
    overallIntelligence: 0.5,
    version: '4.0.0',
  };
}

// Run intelligence cycle
export function runIntelligenceCycle(state: AdaptiveIntelligenceEngineState): {
  state: AdaptiveIntelligenceEngineState;
  overallIntelligence: number;
  insights: string[];
} {
  const insights: string[] = [];

  if (state.regulation.totalLoops === 0) insights.push('No regulation loops — create them');
  if (state.planning.totalNodes === 0) insights.push('No plans — create them');
  if (state.feedback.totalFeedback === 0) insights.push('No feedback — gather it');
  if (state.refinement.totalCycles === 0) insights.push('No refinement cycles — start them');
  if (state.behavior.totalBehaviors === 0) insights.push('No behaviors — add them');
  if (state.communication.totalMessages === 0) insights.push('No communication — start messaging');
  if (state.reasoning.totalSteps === 0) insights.push('No reasoning — reason');
  if (state.selfAwareness.totalModels === 0) insights.push('No self-models — create them');

  const overallStability = state.regulation.overallStability;
  const planCoherence = state.planning.planCoherence;
  const integrationRate = state.feedback.integrationRate;
  const refinementEfficiency = state.refinement.refinementEfficiency;
  const averageEffectiveness = state.behavior.averageEffectiveness;
  const communicationEfficiency = state.communication.communicationEfficiency;
  const decisionQuality = state.reasoning.decisionQuality;
  const overallSelfAwareness = state.selfAwareness.overallSelfAwareness;

  const overallIntelligence = (
    overallStability * 0.125 +
    planCoherence * 0.125 +
    integrationRate * 0.125 +
    refinementEfficiency * 0.125 +
    averageEffectiveness * 0.125 +
    communicationEfficiency * 0.125 +
    decisionQuality * 0.125 +
    overallSelfAwareness * 0.125
  );

  return {
    state: { ...state, overallIntelligence },
    overallIntelligence: Math.round(overallIntelligence * 100) / 100,
    insights,
  };
}

// Get report
export function getAdaptiveIntelligenceReport(state: AdaptiveIntelligenceEngineState): AdaptiveIntelligenceReport {
  const recommendations: string[] = [];
  if (state.regulation.overallStability < 0.5) recommendations.push('Low stability');
  if (state.communication.communicationEfficiency < 0.5) recommendations.push('Low communication efficiency');
  if (state.reasoning.decisionQuality < 0.5) recommendations.push('Low decision quality');

  return {
    overallStability: Math.round(state.regulation.overallStability * 100) / 100,
    planCoherence: Math.round(state.planning.planCoherence * 100) / 100,
    integrationRate: Math.round(state.feedback.integrationRate * 100) / 100,
    refinementEfficiency: Math.round(state.refinement.refinementEfficiency * 100) / 100,
    averageEffectiveness: Math.round(state.behavior.averageEffectiveness * 100) / 100,
    communicationEfficiency: Math.round(state.communication.communicationEfficiency * 100) / 100,
    decisionQuality: Math.round(state.reasoning.decisionQuality * 100) / 100,
    overallSelfAwareness: Math.round(state.selfAwareness.overallSelfAwareness * 100) / 100,
    overallIntelligence: Math.round(state.overallIntelligence * 100) / 100,
    recommendations,
  };
}

// Reset
export function resetAdaptiveIntelligenceEngineState(): AdaptiveIntelligenceEngineState {
  return createAdaptiveIntelligenceEngineState();
}