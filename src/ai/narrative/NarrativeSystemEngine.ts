/**
 * V904 NarrativeSystemEngine — Direction C Iter 15/15 (Round 4)
 * Narrative system engine: integrates all Direction C Round 4 modules
 * Sources: all 6 design systems unified orchestration
 */

import { createNarrativeSemanticsEngineState } from './NarrativeSemanticsEngine';
import { createWorldGeographyEngineState } from './WorldGeographyEngine';
import { createCharacterNetworkEngineState } from './CharacterNetworkEngine';
import { createPlotDynamicsEngineState } from './PlotDynamicsEngine';
import { createNarrativeOntologyEngineState } from './NarrativeOntologyEngine';
import { createWorldSociologyEngineState } from './WorldSociologyEngine';
import { createCharacterPsychologyModelEngineState } from './CharacterPsychologyModelEngine';
import { createPlotTopologyEngineState } from './PlotTopologyEngine';
import { createNarrativeTopologyEngineState } from './NarrativeTopologyEngine';
import { createWorldEcosystemEngineState } from './WorldEcosystemEngine';
import { createCharacterSemanticEngineState } from './CharacterSemanticEngine';
import { createPlotMechanicsEngineState } from './PlotMechanicsEngine';
import { createNarrativeAxiologyEngineState } from './NarrativeAxiologyEngine';
import { createWorldEpistemologyEngineState } from './WorldEpistemologyEngine';

export interface NarrativeSystemEngineState {
  semantics: ReturnType<typeof createNarrativeSemanticsEngineState>;
  geography: ReturnType<typeof createWorldGeographyEngineState>;
  charNetwork: ReturnType<typeof createCharacterNetworkEngineState>;
  plotDyn: ReturnType<typeof createPlotDynamicsEngineState>;
  ontology: ReturnType<typeof createNarrativeOntologyEngineState>;
  sociology: ReturnType<typeof createWorldSociologyEngineState>;
  psychology: ReturnType<typeof createCharacterPsychologyModelEngineState>;
  plotTopo: ReturnType<typeof createPlotTopologyEngineState>;
  narrativeTopo: ReturnType<typeof createNarrativeTopologyEngineState>;
  ecosystem: ReturnType<typeof createWorldEcosystemEngineState>;
  charSem: ReturnType<typeof createCharacterSemanticEngineState>;
  plotMech: ReturnType<typeof createPlotMechanicsEngineState>;
  axiology: ReturnType<typeof createNarrativeAxiologyEngineState>;
  epistemology: ReturnType<typeof createWorldEpistemologyEngineState>;
  overallSystem: number;
  version: string;
}

export interface NarrativeSystemReport {
  semanticRichness: number;
  geographyRichness: number;
  networkComplexity: number;
  plotMomentum: number;
  ontologyRichness: number;
  socialStability: number;
  characterInsight: number;
  plotComplexity: number;
  structuralElegance: number;
  biodiversity: number;
  symbolicRichness: number;
  mechanismElegance: number;
  ethicalRichness: number;
  epistemologicalHealth: number;
  overallSystem: number;
  recommendations: string[];
}

// Factory
export function createNarrativeSystemEngineState(): NarrativeSystemEngineState {
  return {
    semantics: createNarrativeSemanticsEngineState(),
    geography: createWorldGeographyEngineState(),
    charNetwork: createCharacterNetworkEngineState(),
    plotDyn: createPlotDynamicsEngineState(),
    ontology: createNarrativeOntologyEngineState(),
    sociology: createWorldSociologyEngineState(),
    psychology: createCharacterPsychologyModelEngineState(),
    plotTopo: createPlotTopologyEngineState(),
    narrativeTopo: createNarrativeTopologyEngineState(),
    ecosystem: createWorldEcosystemEngineState(),
    charSem: createCharacterSemanticEngineState(),
    plotMech: createPlotMechanicsEngineState(),
    axiology: createNarrativeAxiologyEngineState(),
    epistemology: createWorldEpistemologyEngineState(),
    overallSystem: 0.5,
    version: '4.0.0',
  };
}

// Run system cycle
export function runSystemCycle(state: NarrativeSystemEngineState): {
  state: NarrativeSystemEngineState;
  overallSystem: number;
  insights: string[];
} {
  const insights: string[] = [];

  if (state.semantics.totalUnits === 0) insights.push('No semantic units');
  if (state.geography.totalRegions === 0) insights.push('No geography regions');
  if (state.charNetwork.totalNodes === 0) insights.push('No character network');
  if (state.plotDyn.totalForces === 0) insights.push('No plot forces');
  if (state.ontology.totalEntities === 0) insights.push('No entities');
  if (state.sociology.totalGroups === 0) insights.push('No social groups');
  if (state.psychology.totalProfiles === 0) insights.push('No psychology profiles');
  if (state.plotTopo.totalNodes === 0) insights.push('No plot topology nodes');
  if (state.narrativeTopo.totalLayers === 0) insights.push('No narrative layers');
  if (state.ecosystem.totalSpecies === 0) insights.push('No species');
  if (state.charSem.totalSymbols === 0) insights.push('No character symbols');
  if (state.plotMech.totalMechanisms === 0) insights.push('No plot mechanisms');
  if (state.axiology.totalValues === 0) insights.push('No values');
  if (state.epistemology.totalKnowledge === 0) insights.push('No knowledge');

  const semanticRichness = state.semantics.semanticRichness;
  const geographyRichness = state.geography.geographyRichness;
  const networkComplexity = state.charNetwork.networkComplexity;
  const plotMomentum = state.plotDyn.plotMomentum;
  const ontologyRichness = state.ontology.ontologyRichness;
  const socialStability = state.sociology.socialStability;
  const characterInsight = state.psychology.characterInsight;
  const plotComplexity = state.plotTopo.complexity;
  const structuralElegance = state.narrativeTopo.structuralElegance;
  const biodiversity = state.ecosystem.biodiversity;
  const symbolicRichness = state.charSem.symbolicRichness;
  const mechanismElegance = state.plotMech.mechanismElegance;
  const ethicalRichness = state.axiology.ethicalRichness;
  const epistemologicalHealth = state.epistemology.epistemologicalHealth;

  const overallSystem = (
    semanticRichness * 0.0715 +
    geographyRichness * 0.0715 +
    networkComplexity * 0.0715 +
    plotMomentum * 0.0715 +
    ontologyRichness * 0.0715 +
    socialStability * 0.0715 +
    characterInsight * 0.0715 +
    plotComplexity * 0.0715 +
    structuralElegance * 0.0715 +
    biodiversity * 0.0715 +
    symbolicRichness * 0.0715 +
    mechanismElegance * 0.0715 +
    ethicalRichness * 0.0715 +
    epistemologicalHealth * 0.0715
  );

  return {
    state: { ...state, overallSystem },
    overallSystem: Math.round(overallSystem * 100) / 100,
    insights,
  };
}

// Get report
export function getNarrativeSystemReport(state: NarrativeSystemEngineState): NarrativeSystemReport {
  const recommendations: string[] = [];
  if (state.overallSystem < 0.5) recommendations.push('Overall system needs work');

  return {
    semanticRichness: Math.round(state.semantics.semanticRichness * 100) / 100,
    geographyRichness: Math.round(state.geography.geographyRichness * 100) / 100,
    networkComplexity: Math.round(state.charNetwork.networkComplexity * 100) / 100,
    plotMomentum: Math.round(state.plotDyn.plotMomentum * 100) / 100,
    ontologyRichness: Math.round(state.ontology.ontologyRichness * 100) / 100,
    socialStability: Math.round(state.sociology.socialStability * 100) / 100,
    characterInsight: Math.round(state.psychology.characterInsight * 100) / 100,
    plotComplexity: Math.round(state.plotTopo.complexity * 100) / 100,
    structuralElegance: Math.round(state.narrativeTopo.structuralElegance * 100) / 100,
    biodiversity: Math.round(state.ecosystem.biodiversity * 100) / 100,
    symbolicRichness: Math.round(state.charSem.symbolicRichness * 100) / 100,
    mechanismElegance: Math.round(state.plotMech.mechanismElegance * 100) / 100,
    ethicalRichness: Math.round(state.axiology.ethicalRichness * 100) / 100,
    epistemologicalHealth: Math.round(state.epistemology.epistemologicalHealth * 100) / 100,
    overallSystem: Math.round(state.overallSystem * 100) / 100,
    recommendations,
  };
}

// Reset
export function resetNarrativeSystemEngineState(): NarrativeSystemEngineState {
  return createNarrativeSystemEngineState();
}