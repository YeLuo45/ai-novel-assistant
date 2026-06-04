/**
 * V700 NarrativeMasterEngine — Direction B Iter 9/9 (Round 2)
 * Narrative master engine: integrates all Direction B Round 2 modules
 * Sources: all 6 design systems unified orchestration
 */

import { createNarrativeStructureState } from './NarrativeStructureEngine';
import { createCharacterDevelopmentState } from './CharacterDevelopmentEngine';
import { createPlotProgressionState } from './PlotProgressionEngine';
import { createStoryWorldBuilderState } from './StoryWorldBuilder';
import { createDialogueRefinementState } from './DialogueRefinementEngine';
import { createScenePacingState } from './ScenePacingEngine';
import { createNarrativeEmotionState } from './NarrativeEmotionEngine';
import { createProseStyleState } from './ProseStyleEngine';

export interface NarrativeMasterState {
  structure: ReturnType<typeof createNarrativeStructureState>;
  development: ReturnType<typeof createCharacterDevelopmentState>;
  progression: ReturnType<typeof createPlotProgressionState>;
  world: ReturnType<typeof createStoryWorldBuilderState>;
  dialogue: ReturnType<typeof createDialogueRefinementState>;
  scenePacing: ReturnType<typeof createScenePacingState>;
  emotion: ReturnType<typeof createNarrativeEmotionState>;
  prose: ReturnType<typeof createProseStyleState>;
  overallScore: number;
  version: string;
}

export interface MasterReport {
  structureCompleteness: number;
  developmentProgress: number;
  progressionScore: number;
  worldCoherence: number;
  dialogueQuality: number;
  sceneBalance: number;
  emotionalRange: number;
  proseQuality: number;
  overallScore: number;
  recommendations: string[];
}

// Factory
export function createNarrativeMasterState(): NarrativeMasterState {
  return {
    structure: createNarrativeStructureState(),
    development: createCharacterDevelopmentState(),
    progression: createPlotProgressionState(),
    world: createStoryWorldBuilderState(),
    dialogue: createDialogueRefinementState(),
    scenePacing: createScenePacingState(),
    emotion: createNarrativeEmotionState(),
    prose: createProseStyleState(),
    overallScore: 0.5,
    version: '2.0.0',
  };
}

// Run master cycle
export function runMasterCycle(state: NarrativeMasterState): {
  state: NarrativeMasterState;
  overallScore: number;
  insights: string[];
} {
  const insights: string[] = [];

  if (state.structure.acts.size === 0) insights.push('No structure defined — add acts');
  if (state.development.totalGrowths === 0) insights.push('No character development — add growths');
  if (state.progression.totalBeats === 0) insights.push('No plot progression — add beats');
  if (state.world.totalLocations === 0) insights.push('No world locations — add world');
  if (state.dialogue.characterVoices === 0) insights.push('No character voices — define voices');
  if (state.scenePacing.totalScenes === 0) insights.push('No scenes — add scenes');
  if (state.emotion.totalBeats === 0) insights.push('No emotional content — add beats');
  if (state.prose.totalAnalyses === 0) insights.push('No prose analyzed — analyze text');

  const structureCompleteness = state.structure.structureCompleteness;
  const developmentProgress = state.development.averageProgress;
  const progressionScore = state.progression.progressionScore;
  const worldCoherence = state.world.worldCoherence;
  const dialogueQuality = state.dialogue.averageQualityScore;
  const sceneBalance = state.scenePacing.pacingBalance;
  const emotionalRange = state.emotion.emotionalRange;
  const proseQuality = state.prose.overallQuality;

  const overallScore = (
    structureCompleteness * 0.125 +
    developmentProgress * 0.125 +
    progressionScore * 0.125 +
    worldCoherence * 0.125 +
    dialogueQuality * 0.125 +
    sceneBalance * 0.125 +
    emotionalRange * 0.125 +
    proseQuality * 0.125
  );

  return {
    state: { ...state, overallScore },
    overallScore: Math.round(overallScore * 100) / 100,
    insights,
  };
}

// Get master report
export function getMasterReport(state: NarrativeMasterState): MasterReport {
  const insights: string[] = [];
  if (state.structure.acts.size < 3) insights.push('Structure incomplete');
  if (state.development.totalGrowths < 1) insights.push('No character growths');
  if (state.world.totalLocations < 3) insights.push('Few world locations');
  if (state.prose.overallQuality < 0.6) insights.push('Prose quality low');

  return {
    structureCompleteness: Math.round(state.structure.structureCompleteness * 100) / 100,
    developmentProgress: Math.round(state.development.averageProgress * 100) / 100,
    progressionScore: Math.round(state.progression.progressionScore * 100) / 100,
    worldCoherence: Math.round(state.world.worldCoherence * 100) / 100,
    dialogueQuality: Math.round(state.dialogue.averageQualityScore * 100) / 100,
    sceneBalance: Math.round(state.scenePacing.pacingBalance * 100) / 100,
    emotionalRange: Math.round(state.emotion.emotionalRange * 100) / 100,
    proseQuality: Math.round(state.prose.overallQuality * 100) / 100,
    overallScore: Math.round(state.overallScore * 100) / 100,
    recommendations: insights,
  };
}

// Reset master state
export function resetNarrativeMasterState(): NarrativeMasterState {
  return createNarrativeMasterState();
}