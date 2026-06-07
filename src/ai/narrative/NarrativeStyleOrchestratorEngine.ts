/**
 * V1604 NarrativeStyleOrchestratorEngine — Direction N Iter 30/30 (Round 5)
 * Style orchestrator: orchestrates all style engines
 * Sources: thunderbolt + nanobot + ruflo + chatdev + generic-agent
 */
import type { NarrativeStyleVoiceEngineState } from './NarrativeStyleVoiceEngine';
import type { NarrativeStyleToneEngineState } from './NarrativeStyleToneEngine';
import type { NarrativeStyleMoodEngineState } from './NarrativeStyleMoodEngine';
import type { NarrativeStyleImageryEngineState } from './NarrativeStyleImageryEngine';
import type { NarrativeStyleMetaphorEngineState } from './NarrativeStyleMetaphorEngine';
import type { NarrativeStyleGenreEngineState } from './NarrativeStyleGenreEngine';
import type { NarrativeStylePOVEngineState } from './NarrativeStylePOVEngine';
import type { NarrativeStyleTenseEngineState } from './NarrativeStyleTenseEngine';

export interface StyleOrchestratorSnapshot {
  voice: number;
  tone: number;
  mood: number;
  imagery: number;
  metaphor: number;
  genre: number;
  pov: number;
  tense: number;
}

export interface NarrativeStyleOrchestratorEngineState {
  snapshot: StyleOrchestratorSnapshot;
  totalStyles: number;
  harmonyIndex: number;
  tensionIndex: number;
  consistencyIndex: number;
  narrativeStyle: number;
}

export function createNarrativeStyleOrchestratorEngineState(): NarrativeStyleOrchestratorEngineState {
  return {
    snapshot: { voice: 0.5, tone: 0.5, mood: 0.5, imagery: 0.5, metaphor: 0.5, genre: 0.5, pov: 0.5, tense: 0.5 },
    totalStyles: 8,
    harmonyIndex: 0.5,
    tensionIndex: 0.5,
    consistencyIndex: 0.5,
    narrativeStyle: 0.5,
  };
}

export function orchestrateStyles(
  voice: NarrativeStyleVoiceEngineState,
  tone: NarrativeStyleToneEngineState,
  mood: NarrativeStyleMoodEngineState,
  imagery: NarrativeStyleImageryEngineState,
  metaphor: NarrativeStyleMetaphorEngineState,
  genre: NarrativeStyleGenreEngineState,
  pov: NarrativeStylePOVEngineState,
  tense: NarrativeStyleTenseEngineState
): NarrativeStyleOrchestratorEngineState {
  const snapshot: StyleOrchestratorSnapshot = {
    voice: voice.voiceMastery,
    tone: tone.toneMastery,
    mood: mood.moodMastery,
    imagery: imagery.imageryMastery,
    metaphor: metaphor.metaphorMastery,
    genre: genre.genreMastery,
    pov: pov.povMastery,
    tense: tense.tenseMastery,
  };
  const values = Object.values(snapshot);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const harmonyIndex = Math.max(0, 1 - variance);
  const tensionIndex = Math.min(1, variance * 2);
  const consistencyIndex = mean;
  const narrativeStyle = (harmonyIndex * 0.4 + consistencyIndex * 0.6);
  return {
    snapshot,
    totalStyles: 8,
    harmonyIndex: Math.round(harmonyIndex * 100) / 100,
    tensionIndex: Math.round(tensionIndex * 100) / 100,
    consistencyIndex: Math.round(consistencyIndex * 100) / 100,
    narrativeStyle: Math.round(narrativeStyle * 100) / 100,
  };
}

export function getStyleOrchestratorReport(state: NarrativeStyleOrchestratorEngineState) {
  const recommendations: string[] = [];
  if (state.narrativeStyle < 0.5) recommendations.push('Low style — orchestrate styles more');
  if (state.tensionIndex > 0.7) recommendations.push('High tension — resolve');
  if (state.harmonyIndex < 0.4) recommendations.push('Low harmony — balance styles');
  return {
    totalStyles: state.totalStyles,
    harmonyIndex: state.harmonyIndex,
    tensionIndex: state.tensionIndex,
    consistencyIndex: state.consistencyIndex,
    narrativeStyle: state.narrativeStyle,
    recommendations,
  };
}

export function resetNarrativeStyleOrchestratorEngineState(): NarrativeStyleOrchestratorEngineState {
  return createNarrativeStyleOrchestratorEngineState();
}