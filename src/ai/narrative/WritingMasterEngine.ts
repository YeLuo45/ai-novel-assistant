/**
 * V718 WritingMasterEngine — Direction D Iter 9/9 (Round 2)
 * Writing master engine: integrates all Direction D Round 2 modules
 * Sources: all 6 design systems unified orchestration
 */

import { createNarrativeIterationState } from './NarrativeIterationEngine';
import { createAdaptiveWritingState } from './AdaptiveWritingEngine';
import { createQualityAssessmentState } from './QualityAssessmentEngine';
import { createStyleAdaptationState } from './StyleAdaptationEngine';
import { createRevisionEngineState } from './RevisionEngine';
import { createCritiqueEngineState } from './CritiqueEngine';
import { createEnhancementEngineState } from './EnhancementEngine';
import { createRefinementLoopEngineState } from './RefinementLoopEngine';

export interface WritingMasterState {
  iteration: ReturnType<typeof createNarrativeIterationState>;
  adaptive: ReturnType<typeof createAdaptiveWritingState>;
  quality: ReturnType<typeof createQualityAssessmentState>;
  style: ReturnType<typeof createStyleAdaptationState>;
  revision: ReturnType<typeof createRevisionEngineState>;
  critique: ReturnType<typeof createCritiqueEngineState>;
  enhancement: ReturnType<typeof createEnhancementEngineState>;
  loop: ReturnType<typeof createRefinementLoopEngineState>;
  overallScore: number;
  version: string;
}

export interface WritingMasterReport {
  iterationProgress: number;
  adaptationCoverage: number;
  qualityScore: number;
  styleDiversity: number;
  revisionEfficiency: number;
  constructiveRatio: number;
  enhancementCoverage: number;
  convergenceRate: number;
  overallScore: number;
  recommendations: string[];
}

// Factory
export function createWritingMasterState(): WritingMasterState {
  return {
    iteration: createNarrativeIterationState(),
    adaptive: createAdaptiveWritingState(),
    quality: createQualityAssessmentState(),
    style: createStyleAdaptationState(),
    revision: createRevisionEngineState(),
    critique: createCritiqueEngineState(),
    enhancement: createEnhancementEngineState(),
    loop: createRefinementLoopEngineState(),
    overallScore: 0.5,
    version: '2.0.0',
  };
}

// Run master cycle
export function runWritingMasterCycle(state: WritingMasterState): {
  state: WritingMasterState;
  overallScore: number;
  insights: string[];
} {
  const insights: string[] = [];

  if (state.iteration.totalIterations === 0) insights.push('No iterations — start writing');
  if (state.adaptive.totalContexts === 0) insights.push('No adaptive contexts — define contexts');
  if (state.quality.totalAssessments === 0) insights.push('No quality assessments — assess work');
  if (state.style.totalProfiles === 0) insights.push('No style profiles — create profiles');
  if (state.revision.totalRevisions === 0) insights.push('No revisions — review content');
  if (state.critique.totalCritiques === 0) insights.push('No critiques — start sessions');
  if (state.enhancement.totalEnhancements === 0) insights.push('No enhancements — suggest improvements');
  if (state.loop.totalLoops === 0) insights.push('No loops — start refinement');

  const iterationProgress = state.iteration.improvementRate;
  const adaptationCoverage = state.adaptive.adaptationCoverage;
  const qualityScore = state.quality.averageScore;
  const styleDiversity = state.style.profileDiversity;
  const revisionEfficiency = state.revision.revisionEfficiency;
  const constructiveRatio = state.critique.constructiveRatio;
  const enhancementCoverage = state.enhancement.enhancementCoverage;
  const convergenceRate = state.loop.convergenceRate;

  const overallScore = (
    (Math.max(0, iterationProgress) + 1) / 2 * 0.125 +
    adaptationCoverage * 0.125 +
    qualityScore * 0.125 +
    styleDiversity * 0.125 +
    revisionEfficiency * 0.125 +
    constructiveRatio * 0.125 +
    enhancementCoverage * 0.125 +
    convergenceRate * 0.125
  );

  return {
    state: { ...state, overallScore },
    overallScore: Math.round(overallScore * 100) / 100,
    insights,
  };
}

// Get master report
export function getWritingMasterReport(state: WritingMasterState): WritingMasterReport {
  const insights: string[] = [];
  if (state.iteration.totalIterations < 3) insights.push('Few iterations');
  if (state.quality.averageScore < 0.6) insights.push('Low quality score');
  if (state.enhancement.enhancementCoverage < 0.3) insights.push('Low enhancement coverage');

  return {
    iterationProgress: Math.round(state.iteration.improvementRate * 100) / 100,
    adaptationCoverage: Math.round(state.adaptive.adaptationCoverage * 100) / 100,
    qualityScore: Math.round(state.quality.averageScore * 100) / 100,
    styleDiversity: Math.round(state.style.profileDiversity * 100) / 100,
    revisionEfficiency: Math.round(state.revision.revisionEfficiency * 100) / 100,
    constructiveRatio: Math.round(state.critique.constructiveRatio * 100) / 100,
    enhancementCoverage: Math.round(state.enhancement.enhancementCoverage * 100) / 100,
    convergenceRate: Math.round(state.loop.convergenceRate * 100) / 100,
    overallScore: Math.round(state.overallScore * 100) / 100,
    recommendations: insights,
  };
}

// Reset master state
export function resetWritingMasterState(): WritingMasterState {
  return createWritingMasterState();
}