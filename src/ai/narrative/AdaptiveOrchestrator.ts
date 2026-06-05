/**
 * V754 AdaptiveOrchestrator — Direction A Iter 9/9 (Round 3)
 * Adaptive orchestrator: integrates all Direction A Round 3 modules
 * Sources: all 6 design systems unified orchestration
 */

import { createNarrativeAdaptationCoreState } from './NarrativeAdaptationCore';
import { createContextualIntelligenceEngineState } from './ContextualIntelligenceEngine';
import { createGoalDrivenEngineState } from './GoalDrivenEngine';
import { createSelfImprovementEngineState } from './SelfImprovementEngine';
import { createAdaptiveLearningEngineState } from './AdaptiveLearningEngine';
import { createMultiAgentCoreState } from './MultiAgentCore';
import { createAutonomousCoreState } from './AutonomousCore';
import { createContextAwarenessEngineState } from './ContextAwarenessEngine';

export interface AdaptiveOrchestratorState {
  adaptation: ReturnType<typeof createNarrativeAdaptationCoreState>;
  contextual: ReturnType<typeof createContextualIntelligenceEngineState>;
  goals: ReturnType<typeof createGoalDrivenEngineState>;
  improvement: ReturnType<typeof createSelfImprovementEngineState>;
  learning: ReturnType<typeof createAdaptiveLearningEngineState>;
  multiAgent: ReturnType<typeof createMultiAgentCoreState>;
  autonomous: ReturnType<typeof createAutonomousCoreState>;
  awareness: ReturnType<typeof createContextAwarenessEngineState>;
  overallAdaptivity: number;
  version: string;
}

export interface AdaptiveOrchestratorReport {
  adaptationRate: number;
  contextualConfidence: number;
  goalAchievement: number;
  improvementGain: number;
  learningAccuracy: number;
  agentCoordination: number;
  autonomyScore: number;
  awarenessScore: number;
  overallAdaptivity: number;
  recommendations: string[];
}

// Factory
export function createAdaptiveOrchestratorState(): AdaptiveOrchestratorState {
  return {
    adaptation: createNarrativeAdaptationCoreState(),
    contextual: createContextualIntelligenceEngineState(),
    goals: createGoalDrivenEngineState(),
    improvement: createSelfImprovementEngineState(),
    learning: createAdaptiveLearningEngineState(),
    multiAgent: createMultiAgentCoreState(),
    autonomous: createAutonomousCoreState(),
    awareness: createContextAwarenessEngineState(),
    overallAdaptivity: 0.5,
    version: '3.0.0',
  };
}

// Run adaptivity cycle
export function runAdaptivityCycle(state: AdaptiveOrchestratorState): {
  state: AdaptiveOrchestratorState;
  overallAdaptivity: number;
  insights: string[];
} {
  const insights: string[] = [];

  if (state.adaptation.totalRules === 0) insights.push('No adaptation rules — define rules');
  if (state.contextual.totalSnapshots === 0) insights.push('No context — capture context');
  if (state.goals.totalGoals === 0) insights.push('No goals — define goals');
  if (state.improvement.totalImprovements === 0) insights.push('No improvements — identify areas');
  if (state.learning.totalExperiences === 0) insights.push('No learning — record experiences');
  if (state.multiAgent.totalAgents === 0) insights.push('No agents — register agents');
  if (state.autonomous.totalActions === 0) insights.push('No autonomous actions — take actions');
  if (state.awareness.totalSignals === 0) insights.push('No awareness signals — capture signals');

  const adaptationRate = state.adaptation.adaptationRate;
  const contextualConfidence = state.contextual.averageConfidence;
  const goalAchievement = state.goals.goalAchievementRate;
  const improvementGain = Math.max(0, state.improvement.averageGain) * 0.5;
  const learningAccuracy = state.learning.averageAccuracy;
  const agentCoordination = Math.min(1, state.multiAgent.averageSuccessRate);
  const autonomyScore = state.autonomous.autonomyScore;
  const awarenessScore = state.awareness.awarenessScore;

  const overallAdaptivity = (
    adaptationRate * 0.125 +
    contextualConfidence * 0.125 +
    goalAchievement * 0.125 +
    improvementGain * 0.125 +
    learningAccuracy * 0.125 +
    agentCoordination * 0.125 +
    autonomyScore * 0.125 +
    awarenessScore * 0.125
  );

  return {
    state: { ...state, overallAdaptivity },
    overallAdaptivity: Math.round(overallAdaptivity * 100) / 100,
    insights,
  };
}

// Get report
export function getAdaptiveOrchestratorReport(state: AdaptiveOrchestratorState): AdaptiveOrchestratorReport {
  const recommendations: string[] = [];
  if (state.adaptation.adaptationRate < 0.5) recommendations.push('Low adaptation rate');
  if (state.goals.goalAchievementRate < 0.5) recommendations.push('Low goal achievement');
  if (state.learning.averageAccuracy < 0.5) recommendations.push('Low learning accuracy');

  return {
    adaptationRate: Math.round(state.adaptation.adaptationRate * 100) / 100,
    contextualConfidence: Math.round(state.contextual.averageConfidence * 100) / 100,
    goalAchievement: Math.round(state.goals.goalAchievementRate * 100) / 100,
    improvementGain: Math.round(Math.max(0, state.improvement.averageGain) * 100) / 100,
    learningAccuracy: Math.round(state.learning.averageAccuracy * 100) / 100,
    agentCoordination: Math.round(state.multiAgent.averageSuccessRate * 100) / 100,
    autonomyScore: Math.round(state.autonomous.autonomyScore * 100) / 100,
    awarenessScore: Math.round(state.awareness.awarenessScore * 100) / 100,
    overallAdaptivity: Math.round(state.overallAdaptivity * 100) / 100,
    recommendations,
  };
}

// Reset
export function resetAdaptiveOrchestratorState(): AdaptiveOrchestratorState {
  return createAdaptiveOrchestratorState();
}