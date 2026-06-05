/**
 * V808 WritingExcellenceEngine — Direction D Iter 9/9 (Round 3)
 * Writing excellence engine: integrates all Direction D Round 3 modules
 * Sources: all 6 design systems unified orchestration
 */

import { createWritingFlowCoreState } from './WritingFlowCore';
import { createIterativeWritingEngineState } from './IterativeWritingEngine';
import { createQualityOptimizationEngineState } from './QualityOptimizationEngine';
import { createStyleRefinementEngineState } from './StyleRefinementEngine';
import { createTensionBalanceEngineState } from './TensionBalanceEngine';
import { createContentEnhancementEngineState } from './ContentEnhancementEngine';
import { createCritiqueIntegrationEngineState } from './CritiqueIntegrationEngine';
import { createRevisionMasterEngineState } from './RevisionMasterEngine';

export interface WritingExcellenceEngineState {
  flow: ReturnType<typeof createWritingFlowCoreState>;
  iterative: ReturnType<typeof createIterativeWritingEngineState>;
  quality: ReturnType<typeof createQualityOptimizationEngineState>;
  style: ReturnType<typeof createStyleRefinementEngineState>;
  tension: ReturnType<typeof createTensionBalanceEngineState>;
  enhancement: ReturnType<typeof createContentEnhancementEngineState>;
  critique: ReturnType<typeof createCritiqueIntegrationEngineState>;
  revision: ReturnType<typeof createRevisionMasterEngineState>;
  overallExcellence: number;
  version: string;
}

export interface WritingExcellenceReport {
  flowConsistency: number;
  iterationVelocity: number;
  averageQuality: number;
  styleCoherence: number;
  tensionBalance: number;
  completionRate: number;
  averageRating: number;
  revisionCompleteness: number;
  overallExcellence: number;
  recommendations: string[];
}

// Factory
export function createWritingExcellenceEngineState(): WritingExcellenceEngineState {
  return {
    flow: createWritingFlowCoreState(),
    iterative: createIterativeWritingEngineState(),
    quality: createQualityOptimizationEngineState(),
    style: createStyleRefinementEngineState(),
    tension: createTensionBalanceEngineState(),
    enhancement: createContentEnhancementEngineState(),
    critique: createCritiqueIntegrationEngineState(),
    revision: createRevisionMasterEngineState(),
    overallExcellence: 0.5,
    version: '3.0.0',
  };
}

// Run excellence cycle
export function runExcellenceCycle(state: WritingExcellenceEngineState): {
  state: WritingExcellenceEngineState;
  overallExcellence: number;
  insights: string[];
} {
  const insights: string[] = [];

  if (state.flow.totalSessions === 0) insights.push('No flow sessions — start writing');
  if (state.iterative.totalIterations === 0) insights.push('No iterations — start iterating');
  if (state.quality.totalMeasurements === 0) insights.push('No quality measurements — measure quality');
  if (state.style.totalProfiles === 0) insights.push('No style profiles — create style profiles');
  if (state.tension.totalPoints === 0) insights.push('No tension points — add tension');
  if (state.enhancement.totalOpportunities === 0) insights.push('No enhancement opportunities — identify them');
  if (state.critique.totalCritiques === 0) insights.push('No critiques — gather feedback');
  if (state.revision.totalTasks === 0) insights.push('No revision tasks — plan revisions');

  const flowConsistency = state.flow.flowConsistency;
  const iterationVelocity = state.iterative.iterationVelocity;
  const averageQuality = state.quality.averageQuality;
  const styleCoherence = state.style.averageCoherence;
  const tensionBalance = state.tension.balanceScore;
  const completionRate = state.enhancement.completionRate;
  const averageRating = state.critique.averageRating;
  const revisionCompleteness = state.revision.revisionCompleteness;

  const overallExcellence = (
    flowConsistency * 0.125 +
    iterationVelocity * 0.125 +
    averageQuality * 0.125 +
    styleCoherence * 0.125 +
    tensionBalance * 0.125 +
    completionRate * 0.125 +
    averageRating * 0.125 +
    revisionCompleteness * 0.125
  );

  return {
    state: { ...state, overallExcellence },
    overallExcellence: Math.round(overallExcellence * 100) / 100,
    insights,
  };
}

// Get report
export function getWritingExcellenceReport(state: WritingExcellenceEngineState): WritingExcellenceReport {
  const recommendations: string[] = [];
  if (state.flow.flowConsistency < 0.5) recommendations.push('Low flow consistency');
  if (state.quality.averageQuality < 0.5) recommendations.push('Low average quality');
  if (state.critique.averageRating < 0.5) recommendations.push('Low average rating');

  return {
    flowConsistency: Math.round(state.flow.flowConsistency * 100) / 100,
    iterationVelocity: Math.round(state.iterative.iterationVelocity * 100) / 100,
    averageQuality: Math.round(state.quality.averageQuality * 100) / 100,
    styleCoherence: Math.round(state.style.averageCoherence * 100) / 100,
    tensionBalance: Math.round(state.tension.balanceScore * 100) / 100,
    completionRate: Math.round(state.enhancement.completionRate * 100) / 100,
    averageRating: Math.round(state.critique.averageRating * 100) / 100,
    revisionCompleteness: Math.round(state.revision.revisionCompleteness * 100) / 100,
    overallExcellence: Math.round(state.overallExcellence * 100) / 100,
    recommendations,
  };
}

// Reset
export function resetWritingExcellenceEngineState(): WritingExcellenceEngineState {
  return createWritingExcellenceEngineState();
}