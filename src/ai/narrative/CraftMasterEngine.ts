/**
 * V772 CraftMasterEngine — Direction B Iter 9/9 (Round 3)
 * Craft master engine: integrates all Direction B Round 3 modules
 * Sources: all 6 design systems unified orchestration
 */

import { createNarrativeCraftingEngineState } from './NarrativeCraftingEngine';
import { createStoryWeavingEngineState } from './StoryWeavingEngine';
import { createCharacterPsychologyEngineState } from './CharacterPsychologyEngine';
import { createNarrativeTensionEngineState } from './NarrativeTensionEngine';
import { createPlotTwistEngineState } from './PlotTwistEngine';
import { createAtmosphereEngineState } from './AtmosphereEngine';
import { createWorldLoreEngineState } from './WorldLoreEngine';
import { createDialogueDynamicsEngineState } from './DialogueDynamicsEngine';

export interface CraftMasterEngineState {
  crafting: ReturnType<typeof createNarrativeCraftingEngineState>;
  weaving: ReturnType<typeof createStoryWeavingEngineState>;
  psychology: ReturnType<typeof createCharacterPsychologyEngineState>;
  tension: ReturnType<typeof createNarrativeTensionEngineState>;
  twist: ReturnType<typeof createPlotTwistEngineState>;
  atmosphere: ReturnType<typeof createAtmosphereEngineState>;
  lore: ReturnType<typeof createWorldLoreEngineState>;
  dialogue: ReturnType<typeof createDialogueDynamicsEngineState>;
  overallCraft: number;
  version: string;
}

export interface CraftMasterReport {
  craftQuality: number;
  weavingComplexity: number;
  psychologicalDepth: number;
  tensionIntensity: number;
  twistSatisfaction: number;
  atmosphereBalance: number;
  loreDepth: number;
  dialogueDynamics: number;
  overallCraft: number;
  recommendations: string[];
}

// Factory
export function createCraftMasterEngineState(): CraftMasterEngineState {
  return {
    crafting: createNarrativeCraftingEngineState(),
    weaving: createStoryWeavingEngineState(),
    psychology: createCharacterPsychologyEngineState(),
    tension: createNarrativeTensionEngineState(),
    twist: createPlotTwistEngineState(),
    atmosphere: createAtmosphereEngineState(),
    lore: createWorldLoreEngineState(),
    dialogue: createDialogueDynamicsEngineState(),
    overallCraft: 0.5,
    version: '3.0.0',
  };
}

// Run craft cycle
export function runCraftCycle(state: CraftMasterEngineState): {
  state: CraftMasterEngineState;
  overallCraft: number;
  insights: string[];
} {
  const insights: string[] = [];

  if (state.crafting.totalPractices === 0) insights.push('No craft practices — start practicing');
  if (state.weaving.totalThreads === 0) insights.push('No story threads — add threads');
  if (state.psychology.totalCharacters === 0) insights.push('No character psychology — create characters');
  if (state.tension.totalTensions === 0) insights.push('No tension points — create tensions');
  if (state.twist.totalTwists === 0) insights.push('No plot twists — design twists');
  if (state.atmosphere.totalSensoryDetails === 0) insights.push('No atmosphere — add sensory details');
  if (state.lore.totalEntries === 0) insights.push('No world lore — add lore entries');
  if (state.dialogue.totalLines === 0) insights.push('No dialogue — add dialogue lines');

  const craftQuality = state.crafting.averageQuality;
  const weavingComplexity = state.weaving.weavingComplexity;
  const psychologicalDepth = state.psychology.averageDepth;
  const tensionIntensity = state.tension.averageIntensity;
  const twistSatisfaction = state.twist.averageSatisfaction;
  const atmosphereBalance = state.atmosphere.sensoryBalance;
  const loreDepth = state.lore.loreDepth;
  const dialogueDynamics = state.dialogue.dynamicScore;

  const overallCraft = (
    craftQuality * 0.125 +
    weavingComplexity * 0.125 +
    psychologicalDepth * 0.125 +
    tensionIntensity * 0.125 +
    twistSatisfaction * 0.125 +
    atmosphereBalance * 0.125 +
    loreDepth * 0.125 +
    dialogueDynamics * 0.125
  );

  return {
    state: { ...state, overallCraft },
    overallCraft: Math.round(overallCraft * 100) / 100,
    insights,
  };
}

// Get report
export function getCraftMasterReport(state: CraftMasterEngineState): CraftMasterReport {
  const recommendations: string[] = [];
  if (state.crafting.averageQuality < 0.5) recommendations.push('Low craft quality');
  if (state.psychology.averageDepth < 0.5) recommendations.push('Low psychological depth');
  if (state.atmosphere.sensoryBalance < 0.5) recommendations.push('Imbalanced atmosphere');

  return {
    craftQuality: Math.round(state.crafting.averageQuality * 100) / 100,
    weavingComplexity: Math.round(state.weaving.weavingComplexity * 100) / 100,
    psychologicalDepth: Math.round(state.psychology.averageDepth * 100) / 100,
    tensionIntensity: Math.round(state.tension.averageIntensity * 100) / 100,
    twistSatisfaction: Math.round(state.twist.averageSatisfaction * 100) / 100,
    atmosphereBalance: Math.round(state.atmosphere.sensoryBalance * 100) / 100,
    loreDepth: Math.round(state.lore.loreDepth * 100) / 100,
    dialogueDynamics: Math.round(state.dialogue.dynamicScore * 100) / 100,
    overallCraft: Math.round(state.overallCraft * 100) / 100,
    recommendations,
  };
}

// Reset
export function resetCraftMasterEngineState(): CraftMasterEngineState {
  return createCraftMasterEngineState();
}