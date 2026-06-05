/**
 * V790 WorldOrchestratorCore — Direction C Iter 9/9 (Round 3)
 * World orchestrator core: integrates all Direction C Round 3 modules
 * Sources: all 6 design systems unified orchestration
 */

import { createNarrativeRealityEngineState } from './NarrativeRealityEngine';
import { createWorldPhysicsEngineState } from './WorldPhysicsEngine';
import { createCharacterDynamicsCoreState } from './CharacterDynamicsCore';
import { createPlotCausalityEngineState } from './PlotCausalityEngine';
import { createNarrativeDepthEngineState } from './NarrativeDepthEngine';
import { createWorldConsistencyEngineState } from './WorldConsistencyEngine';
import { createCharacterEvolutionEngineState } from './CharacterEvolutionEngine';
import { createNarrativeRulesEngineState } from './NarrativeRulesEngine';

export interface WorldOrchestratorCoreState {
  reality: ReturnType<typeof createNarrativeRealityEngineState>;
  physics: ReturnType<typeof createWorldPhysicsEngineState>;
  dynamics: ReturnType<typeof createCharacterDynamicsCoreState>;
  causality: ReturnType<typeof createPlotCausalityEngineState>;
  depth: ReturnType<typeof createNarrativeDepthEngineState>;
  consistency: ReturnType<typeof createWorldConsistencyEngineState>;
  evolution: ReturnType<typeof createCharacterEvolutionEngineState>;
  rules: ReturnType<typeof createNarrativeRulesEngineState>;
  overallWorldHealth: number;
  version: string;
}

export interface WorldOrchestratorReport {
  realityConsistency: number;
  physicsComplexity: number;
  dynamicsComplexity: number;
  causalConsistency: number;
  depthScore: number;
  overallConsistency: number;
  evolutionMomentum: number;
  ruleHealth: number;
  overallWorldHealth: number;
  recommendations: string[];
}

// Factory
export function createWorldOrchestratorCoreState(): WorldOrchestratorCoreState {
  return {
    reality: createNarrativeRealityEngineState(),
    physics: createWorldPhysicsEngineState(),
    dynamics: createCharacterDynamicsCoreState(),
    causality: createPlotCausalityEngineState(),
    depth: createNarrativeDepthEngineState(),
    consistency: createWorldConsistencyEngineState(),
    evolution: createCharacterEvolutionEngineState(),
    rules: createNarrativeRulesEngineState(),
    overallWorldHealth: 0.5,
    version: '3.0.0',
  };
}

// Run world cycle
export function runWorldCycle(state: WorldOrchestratorCoreState): {
  state: WorldOrchestratorCoreState;
  overallWorldHealth: number;
  insights: string[];
} {
  const insights: string[] = [];

  if (state.reality.totalRules === 0) insights.push('No reality rules — add rules');
  if (state.physics.totalMechanics === 0) insights.push('No physics mechanics — add mechanics');
  if (state.dynamics.totalRelationships === 0) insights.push('No relationships — create relationships');
  if (state.causality.totalEvents === 0) insights.push('No causal events — add events');
  if (state.depth.totalMarkers === 0) insights.push('No depth markers — add markers');
  if (state.consistency.totalChecks === 0) insights.push('No consistency checks — perform checks');
  if (state.evolution.totalCharacters === 0) insights.push('No character evolutions — create evolutions');
  if (state.rules.totalRules === 0) insights.push('No narrative rules — add rules');

  const realityConsistency = state.reality.realityConsistency;
  const physicsComplexity = state.physics.physicsComplexity;
  const dynamicsComplexity = state.dynamics.dynamicsComplexity;
  const causalConsistency = state.causality.causalConsistency;
  const depthScore = state.depth.depthScore;
  const overallConsistency = state.consistency.overallConsistency;
  const evolutionMomentum = state.evolution.evolutionMomentum;
  const ruleHealth = state.rules.ruleHealth;

  const overallWorldHealth = (
    realityConsistency * 0.125 +
    physicsComplexity * 0.125 +
    dynamicsComplexity * 0.125 +
    causalConsistency * 0.125 +
    depthScore * 0.125 +
    overallConsistency * 0.125 +
    evolutionMomentum * 0.125 +
    ruleHealth * 0.125
  );

  return {
    state: { ...state, overallWorldHealth },
    overallWorldHealth: Math.round(overallWorldHealth * 100) / 100,
    insights,
  };
}

// Get report
export function getWorldOrchestratorReport(state: WorldOrchestratorCoreState): WorldOrchestratorReport {
  const recommendations: string[] = [];
  if (state.reality.realityConsistency < 0.6) recommendations.push('Low reality consistency');
  if (state.causality.causalConsistency < 0.6) recommendations.push('Low causal consistency');
  if (state.rules.ruleHealth < 0.6) recommendations.push('Low rule health');

  return {
    realityConsistency: Math.round(state.reality.realityConsistency * 100) / 100,
    physicsComplexity: Math.round(state.physics.physicsComplexity * 100) / 100,
    dynamicsComplexity: Math.round(state.dynamics.dynamicsComplexity * 100) / 100,
    causalConsistency: Math.round(state.causality.causalConsistency * 100) / 100,
    depthScore: Math.round(state.depth.depthScore * 100) / 100,
    overallConsistency: Math.round(state.consistency.overallConsistency * 100) / 100,
    evolutionMomentum: Math.round(state.evolution.evolutionMomentum * 100) / 100,
    ruleHealth: Math.round(state.rules.ruleHealth * 100) / 100,
    overallWorldHealth: Math.round(state.overallWorldHealth * 100) / 100,
    recommendations,
  };
}

// Reset
export function resetWorldOrchestratorCoreState(): WorldOrchestratorCoreState {
  return createWorldOrchestratorCoreState();
}