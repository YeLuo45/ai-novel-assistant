/**
 * V682 NarrativeSynthesisEngine — Direction C Iter 9/9 (Round 2)
 * Narrative synthesis engine: integrates all Direction C Round 2 modules
 * Sources: all 6 design systems unified orchestration
 */

import { createNarrativePacingState } from './NarrativePacingEngine';
import { createDialogueOrchestrationState } from './DialogueOrchestrationEngine';
import { createCharacterMotivationState } from './CharacterMotivationEngine';
import { createSceneTransitionState } from './SceneTransitionEngine';
import { createThemeSymbolismState } from './ThemeSymbolismEngine';
import { createConflictResolutionState } from './ConflictResolutionEngine';
import { createNarrativeVoiceState } from './NarrativeVoiceEngine';
import { createReaderEngagementState } from './ReaderEngagementEngine';

export interface NarrativeSynthesisState {
  pacing: ReturnType<typeof createNarrativePacingState>;
  dialogue: ReturnType<typeof createDialogueOrchestrationState>;
  motivation: ReturnType<typeof createCharacterMotivationState>;
  transition: ReturnType<typeof createSceneTransitionState>;
  theme: ReturnType<typeof createThemeSymbolismState>;
  conflict: ReturnType<typeof createConflictResolutionState>;
  voice: ReturnType<typeof createNarrativeVoiceState>;
  engagement: ReturnType<typeof createReaderEngagementState>;
  overallScore: number;
  version: string;
}

export interface SynthesisReport {
  pacingScore: number;
  dialogueDensity: number;
  motivationComplexity: number;
  transitionFlow: number;
  themeCoherence: number;
  conflictResolution: number;
  voiceConsistency: number;
  engagementLevel: string;
  overallScore: number;
  recommendations: string[];
}

// Factory
export function createNarrativeSynthesisState(): NarrativeSynthesisState {
  return {
    pacing: createNarrativePacingState(),
    dialogue: createDialogueOrchestrationState(),
    motivation: createCharacterMotivationState(),
    transition: createSceneTransitionState(),
    theme: createThemeSymbolismState(),
    conflict: createConflictResolutionState(),
    voice: createNarrativeVoiceState(),
    engagement: createReaderEngagementState(),
    overallScore: 0.5,
    version: '2.0.0',
  };
}

// Run synthesis cycle
export function runSynthesisCycle(state: NarrativeSynthesisState): {
  state: NarrativeSynthesisState;
  overallScore: number;
  insights: string[];
} {
  const insights: string[] = [];

  // Assess each subsystem
  if (state.pacing.totalBeats === 0) insights.push('No pacing beats — define rhythm');
  if (state.dialogue.totalLines === 0) insights.push('No dialogue — add character conversations');
  if (state.motivation.totalMotivations === 0) insights.push('No motivations — define character drives');
  if (state.transition.totalTransitions === 0) insights.push('No scene transitions — connect scenes');
  if (state.theme.totalThemes === 0) insights.push('No themes — establish central themes');
  if (state.conflict.totalConflicts === 0) insights.push('No conflicts — add tension');
  if (state.voice.totalProfiles === 0) insights.push('No voice profiles — define narrative style');
  if (state.engagement.totalHooks === 0) insights.push('No engagement hooks — add curiosity');

  // Compute overall score
  const pacingScore = state.pacing.pacingScore;
  const dialogueDensity = state.dialogue.dialogueDensity;
  const motivationComplexity = state.motivation.motivationComplexity;
  const transitionFlow = state.transition.flowScore;
  const themeCoherence = state.theme.themeCoherence;
  const conflictResolution = state.conflict.resolutionEffectiveness;
  const voiceConsistency = state.voice.averageConsistency;
  const engagementScore = state.engagement.averageEngagement;

  const overallScore = (
    pacingScore * 0.125 +
    dialogueDensity * 0.125 +
    motivationComplexity * 0.125 +
    transitionFlow * 0.125 +
    themeCoherence * 0.125 +
    conflictResolution * 0.125 +
    voiceConsistency * 0.125 +
    engagementScore * 0.125
  );

  return {
    state: { ...state, overallScore },
    overallScore: Math.round(overallScore * 100) / 100,
    insights,
  };
}

// Get synthesis report
export function getSynthesisReport(state: NarrativeSynthesisState): SynthesisReport {
  const insights: string[] = [];
  if (state.pacing.totalBeats < 3) insights.push('Pacing underused');
  if (state.dialogue.totalLines < 5) insights.push('Limited dialogue');
  if (state.motivation.totalMotivations < 2) insights.push('Few motivations');
  if (state.theme.totalThemes < 1) insights.push('No themes');
  if (state.conflict.totalConflicts < 1) insights.push('No conflicts');

  return {
    pacingScore: Math.round(state.pacing.pacingScore * 100) / 100,
    dialogueDensity: Math.round(state.dialogue.dialogueDensity * 100) / 100,
    motivationComplexity: Math.round(state.motivation.motivationComplexity * 100) / 100,
    transitionFlow: Math.round(state.transition.flowScore * 100) / 100,
    themeCoherence: Math.round(state.theme.themeCoherence * 100) / 100,
    conflictResolution: Math.round(state.conflict.resolutionEffectiveness * 100) / 100,
    voiceConsistency: Math.round(state.voice.averageConsistency * 100) / 100,
    engagementLevel: state.engagement.averageEngagement >= 0.65 ? 'high' : 'medium',
    overallScore: Math.round(state.overallScore * 100) / 100,
    recommendations: insights,
  };
}

// Reset synthesis state
export function resetNarrativeSynthesisState(): NarrativeSynthesisState {
  return createNarrativeSynthesisState();
}