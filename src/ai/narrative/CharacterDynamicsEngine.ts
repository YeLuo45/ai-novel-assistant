/**
 * V1028 CharacterDynamicsEngine — Direction C Iter 2/20 (Round 5)
 * Character dynamics engine: dynamic character interactions + change
 * Sources: thunderbolt dynamics + nanobot + chatdev
 */

export type DynamicType = 'rivalry' | 'alliance' | 'romance' | 'mentor' | 'familial' | 'adversarial';
export type DynamicIntensity = 'subtle' | 'moderate' | 'strong' | 'intense' | 'transformative';
export type DynamicPhase = 'forming' | 'developing' | 'climaxing' | 'transforming' | 'resolving';

export interface CharacterDynamic {
  dynamicId: string;
  type: DynamicType;
  intensity: DynamicIntensity;
  phase: DynamicPhase;
  character1Id: string;
  character2Id: string;
  tension: number;
  growth: number;
  chapter: number;
}

export interface DynamicEvolution {
  evolutionId: string,
  dynamicId: string,
  fromPhase: DynamicPhase,
  toPhase: DynamicPhase,
  transformationDepth: number,
}

export interface CharacterDynamicsEngineState {
  dynamics: Map<string, CharacterDynamic>;
  evolutions: Map<string, DynamicEvolution>;
  totalDynamics: number;
  totalEvolutions: number;
  averageTension: number;
  averageGrowth: number;
  evolutionDepth: number;
  dynamicsMastery: number;
}

// Factory
export function createCharacterDynamicsEngineState(): CharacterDynamicsEngineState {
  return {
    dynamics: new Map(),
    evolutions: new Map(),
    totalDynamics: 0,
    totalEvolutions: 0,
    averageTension: 0.5,
    averageGrowth: 0.5,
    evolutionDepth: 0.5,
    dynamicsMastery: 0.5,
  };
}

// Add dynamic
export function addCharacterDynamic(
  state: CharacterDynamicsEngineState,
  dynamicId: string,
  type: DynamicType,
  intensity: DynamicIntensity,
  phase: DynamicPhase,
  character1Id: string,
  character2Id: string,
  tension: number,
  growth: number,
  chapter: number
): CharacterDynamicsEngineState {
  const dynamic: CharacterDynamic = { dynamicId, type, intensity, phase, character1Id, character2Id, tension, growth, chapter };
  const dynamics = new Map(state.dynamics).set(dynamicId, dynamic);
  return recomputeDynamics({ ...state, dynamics, totalDynamics: dynamics.size });
}

// Add evolution
export function addDynamicEvolution(
  state: CharacterDynamicsEngineState,
  evolutionId: string,
  dynamicId: string,
  fromPhase: DynamicPhase,
  toPhase: DynamicPhase
): CharacterDynamicsEngineState {
  const phaseOrder: DynamicPhase[] = ['forming', 'developing', 'climaxing', 'transforming', 'resolving'];
  const fromIdx = phaseOrder.indexOf(fromPhase);
  const toIdx = phaseOrder.indexOf(toPhase);
  const transformationDepth = Math.abs(toIdx - fromIdx) / phaseOrder.length;
  const evolution: DynamicEvolution = { evolutionId, dynamicId, fromPhase, toPhase, transformationDepth };
  const evolutions = new Map(state.evolutions).set(evolutionId, evolution);
  return recomputeDynamics({ ...state, evolutions, totalEvolutions: evolutions.size });
}

// Get dynamics by type
export function getDynamicsByType(state: CharacterDynamicsEngineState, type: DynamicType): CharacterDynamic[] {
  return Array.from(state.dynamics.values()).filter(d => d.type === type);
}

// Get dynamics report
export function getDynamicsReport(state: CharacterDynamicsEngineState): {
  totalDynamics: number;
  totalEvolutions: number;
  averageTension: number;
  averageGrowth: number;
  dynamicsMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalDynamics === 0) recommendations.push('No dynamics — add character dynamics');
  if (state.averageGrowth < 0.3) recommendations.push('Low growth — develop');
  if (state.dynamicsMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalDynamics: state.totalDynamics,
    totalEvolutions: state.totalEvolutions,
    averageTension: Math.round(state.averageTension * 100) / 100,
    averageGrowth: Math.round(state.averageGrowth * 100) / 100,
    dynamicsMastery: Math.round(state.dynamicsMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeDynamics(state: CharacterDynamicsEngineState): CharacterDynamicsEngineState {
  const dynamics = Array.from(state.dynamics.values());
  const averageTension = dynamics.length === 0 ? 0.5
    : dynamics.reduce((s, d) => s + d.tension, 0) / dynamics.length;
  const averageGrowth = dynamics.length === 0 ? 0.5
    : dynamics.reduce((s, d) => s + d.growth, 0) / dynamics.length;

  const evolutions = Array.from(state.evolutions.values());
  const evolutionDepth = evolutions.length === 0 ? 0.5
    : evolutions.reduce((s, e) => s + e.transformationDepth, 0) / evolutions.length;

  const dynamicsMastery = (averageTension * 0.3 + averageGrowth * 0.4 + evolutionDepth * 0.3);

  return { ...state, averageTension, averageGrowth, evolutionDepth, dynamicsMastery };
}

// Reset
export function resetCharacterDynamicsEngineState(): CharacterDynamicsEngineState {
  return createCharacterDynamicsEngineState();
}