/**
 * V874 NarrativeCraftCore — Direction B Iter 15/15 (Round 4)
 * Narrative craft core: integrates all Direction B Round 4 modules
 * Sources: all 6 design systems unified orchestration
 */

import { createNarrativeSubtextEngineState } from './NarrativeSubtextEngine';
import { createStoryPacingEngineState } from './StoryPacingEngine';
import { createCharacterMotivationEngineState } from './CharacterMotivationEngine';
import { createSceneArchitectureEngineState } from './SceneArchitectureEngine';
import { createDialogueMasteryEngineState } from './DialogueMasteryEngine';
import { createNarrativeVoiceCoreState } from './NarrativeVoiceCore';
import { createThemeDevelopmentEngineState } from './ThemeDevelopmentEngine';
import { createStoryArcEngineState } from './StoryArcEngine';
import { createWorldBuildingCoreState } from './WorldBuildingCore';
import { createNarrativeStyleEngineState } from './NarrativeStyleEngine';
import { createCharacterDynamicsEngineState } from './CharacterDynamicsEngine';
import { createPlotStructureEngineState } from './PlotStructureEngine';
import { createConflictEngineeringEngineState } from './ConflictEngineeringEngine';
import { createStoryCompositionEngineState } from './StoryCompositionEngine';

export interface NarrativeCraftCoreState {
  subtext: ReturnType<typeof createNarrativeSubtextEngineState>;
  pacing: ReturnType<typeof createStoryPacingEngineState>;
  motivation: ReturnType<typeof createCharacterMotivationEngineState>;
  sceneArch: ReturnType<typeof createSceneArchitectureEngineState>;
  dialogue: ReturnType<typeof createDialogueMasteryEngineState>;
  voice: ReturnType<typeof createNarrativeVoiceCoreState>;
  theme: ReturnType<typeof createThemeDevelopmentEngineState>;
  arc: ReturnType<typeof createStoryArcEngineState>;
  world: ReturnType<typeof createWorldBuildingCoreState>;
  style: ReturnType<typeof createNarrativeStyleEngineState>;
  charDyn: ReturnType<typeof createCharacterDynamicsEngineState>;
  plotStruct: ReturnType<typeof createPlotStructureEngineState>;
  conflict: ReturnType<typeof createConflictEngineeringEngineState>;
  composition: ReturnType<typeof createStoryCompositionEngineState>;
  overallCraft: number;
  version: string;
}

export interface NarrativeCraftReport {
  subtextRichness: number;
  rhythmScore: number;
  characterDrive: number;
  architectureCoherence: number;
  dialogueMastery: number;
  voiceMastery: number;
  thematicDepth: number;
  momentum: number;
  worldRichness: number;
  styleMastery: number;
  dynamicsRichness: number;
  structureMastery: number;
  engineeringQuality: number;
  compositionMastery: number;
  overallCraft: number;
  recommendations: string[];
}

// Factory
export function createNarrativeCraftCoreState(): NarrativeCraftCoreState {
  return {
    subtext: createNarrativeSubtextEngineState(),
    pacing: createStoryPacingEngineState(),
    motivation: createCharacterMotivationEngineState(),
    sceneArch: createSceneArchitectureEngineState(),
    dialogue: createDialogueMasteryEngineState(),
    voice: createNarrativeVoiceCoreState(),
    theme: createThemeDevelopmentEngineState(),
    arc: createStoryArcEngineState(),
    world: createWorldBuildingCoreState(),
    style: createNarrativeStyleEngineState(),
    charDyn: createCharacterDynamicsEngineState(),
    plotStruct: createPlotStructureEngineState(),
    conflict: createConflictEngineeringEngineState(),
    composition: createStoryCompositionEngineState(),
    overallCraft: 0.5,
    version: '4.0.0',
  };
}

// Run craft cycle
export function runCraftCycle(state: NarrativeCraftCoreState): {
  state: NarrativeCraftCoreState;
  overallCraft: number;
  insights: string[];
} {
  const insights: string[] = [];

  if (state.subtext.totalElements === 0) insights.push('No subtexts');
  if (state.pacing.totalSegments === 0) insights.push('No pacing segments');
  if (state.motivation.totalMotivations === 0) insights.push('No motivations');
  if (state.sceneArch.totalScenes === 0) insights.push('No scenes');
  if (state.dialogue.totalLines === 0) insights.push('No dialogue');
  if (state.voice.totalProfiles === 0) insights.push('No voice profiles');
  if (state.theme.totalThemes === 0) insights.push('No themes');
  if (state.arc.totalArcs === 0) insights.push('No arcs');
  if (state.world.totalElements === 0) insights.push('No world elements');
  if (state.style.totalSamples === 0) insights.push('No style samples');
  if (state.charDyn.totalGroups === 0) insights.push('No character groups');
  if (state.plotStruct.totalBeats === 0) insights.push('No plot beats');
  if (state.conflict.totalConflicts === 0) insights.push('No conflicts');
  if (state.composition.totalPieces === 0) insights.push('No composition pieces');

  const subtextRichness = state.subtext.subtextRichness;
  const rhythmScore = state.pacing.rhythmScore;
  const characterDrive = state.motivation.characterDrive;
  const architectureCoherence = state.sceneArch.architectureCoherence;
  const dialogueMastery = state.dialogue.dialogueMastery;
  const voiceMastery = state.voice.voiceMastery;
  const thematicDepth = state.theme.thematicDepth;
  const momentum = state.arc.momentum;
  const worldRichness = state.world.worldRichness;
  const styleMastery = state.style.styleMastery;
  const dynamicsRichness = state.charDyn.dynamicsRichness;
  const structureMastery = state.plotStruct.structureMastery;
  const engineeringQuality = state.conflict.engineeringQuality;
  const compositionMastery = state.composition.compositionMastery;

  const overallCraft = (
    subtextRichness * 0.0715 +
    rhythmScore * 0.0715 +
    characterDrive * 0.0715 +
    architectureCoherence * 0.0715 +
    dialogueMastery * 0.0715 +
    voiceMastery * 0.0715 +
    thematicDepth * 0.0715 +
    momentum * 0.0715 +
    worldRichness * 0.0715 +
    styleMastery * 0.0715 +
    dynamicsRichness * 0.0715 +
    structureMastery * 0.0715 +
    engineeringQuality * 0.0715 +
    compositionMastery * 0.0715
  );

  return {
    state: { ...state, overallCraft },
    overallCraft: Math.round(overallCraft * 100) / 100,
    insights,
  };
}

// Get report
export function getNarrativeCraftReport(state: NarrativeCraftCoreState): NarrativeCraftReport {
  const recommendations: string[] = [];
  if (state.overallCraft < 0.5) recommendations.push('Overall craft needs work');

  return {
    subtextRichness: Math.round(state.subtext.subtextRichness * 100) / 100,
    rhythmScore: Math.round(state.pacing.rhythmScore * 100) / 100,
    characterDrive: Math.round(state.motivation.characterDrive * 100) / 100,
    architectureCoherence: Math.round(state.sceneArch.architectureCoherence * 100) / 100,
    dialogueMastery: Math.round(state.dialogue.dialogueMastery * 100) / 100,
    voiceMastery: Math.round(state.voice.voiceMastery * 100) / 100,
    thematicDepth: Math.round(state.theme.thematicDepth * 100) / 100,
    momentum: Math.round(state.arc.momentum * 100) / 100,
    worldRichness: Math.round(state.world.worldRichness * 100) / 100,
    styleMastery: Math.round(state.style.styleMastery * 100) / 100,
    dynamicsRichness: Math.round(state.charDyn.dynamicsRichness * 100) / 100,
    structureMastery: Math.round(state.plotStruct.structureMastery * 100) / 100,
    engineeringQuality: Math.round(state.conflict.engineeringQuality * 100) / 100,
    compositionMastery: Math.round(state.composition.compositionMastery * 100) / 100,
    overallCraft: Math.round(state.overallCraft * 100) / 100,
    recommendations,
  };
}

// Reset
export function resetNarrativeCraftCoreState(): NarrativeCraftCoreState {
  return createNarrativeCraftCoreState();
}