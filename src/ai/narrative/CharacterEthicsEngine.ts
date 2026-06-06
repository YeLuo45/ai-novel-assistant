/**
 * V1044 CharacterEthicsEngine — Direction C Iter 10/20 (Round 5)
 * Character ethics engine: moral framework + ethical choices
 * Sources: nanobot ethics + thunderbolt + chatdev
 */

export type EthicalFramework = 'virtue' | 'deontological' | 'consequentialist' | 'care' | 'natural_law' | 'divine_command';
export type EthicalDilemma = 'trolley' | 'truth_vs_loyalty' | 'individual_vs_collective' | 'means_vs_ends' | 'short_vs_long_term' | 'mercy_vs_justice';
export type EthicalStance = 'rigid' | 'principled' | 'flexible' | 'pragmatic' | 'conflicted' | 'evolving';

export interface CharacterEthics {
  ethicsId: string;
  framework: EthicalFramework;
  dilemma: EthicalDilemma;
  stance: EthicalStance;
  characterId: string;
  description: string;
  integrity: number;
  complexity: number;
  chapter: number;
}

export interface EthicalArc {
  arcId: string,
  characterId: string,
  ethicsIds: string[],
  evolution: number,
  consistency: number,
}

export interface CharacterEthicsEngineState {
  ethics: Map<string, CharacterEthics>;
  arcs: Map<string, EthicalArc>;
  totalEthics: number;
  totalArcs: number;
  averageIntegrity: number;
  averageComplexity: number;
  arcEvolution: number;
  ethicsMastery: number;
}

// Factory
export function createCharacterEthicsEngineState(): CharacterEthicsEngineState {
  return {
    ethics: new Map(),
    arcs: new Map(),
    totalEthics: 0,
    totalArcs: 0,
    averageIntegrity: 0.5,
    averageComplexity: 0.5,
    arcEvolution: 0.5,
    ethicsMastery: 0.5,
  };
}

// Add ethics
export function addCharacterEthics(
  state: CharacterEthicsEngineState,
  ethicsId: string,
  framework: EthicalFramework,
  dilemma: EthicalDilemma,
  stance: EthicalStance,
  characterId: string,
  description: string,
  integrity: number,
  complexity: number,
  chapter: number
): CharacterEthicsEngineState {
  const ethics: CharacterEthics = { ethicsId, framework, dilemma, stance, characterId, description, integrity, complexity, chapter };
  const ethics_ = new Map(state.ethics).set(ethicsId, ethics);
  return recomputeEthics({ ...state, ethics: ethics_, totalEthics: ethics_.size });
}

// Add arc
export function addEthicalArc(
  state: CharacterEthicsEngineState,
  arcId: string,
  characterId: string,
  ethicsIds: string[]
): CharacterEthicsEngineState {
  const ethics = ethicsIds.map(id => state.ethics.get(id)).filter((e): e is CharacterEthics => e !== undefined);
  // Evolution: change in framework or stance
  const frameworkSet = new Set(ethics.map(e => e.framework));
  const stanceSet = new Set(ethics.map(e => e.stance));
  const evolution = Math.min(1, (frameworkSet.size + stanceSet.size) / 12);
  const consistency = ethics.length < 2 ? 0.5
    : 1 - Math.abs(ethics[0].integrity - ethics[ethics.length - 1].integrity);
  const arc: EthicalArc = { arcId, characterId, ethicsIds, evolution, consistency };
  const arcs = new Map(state.arcs).set(arcId, arc);
  return recomputeEthics({ ...state, arcs, totalArcs: arcs.size });
}

// Get ethics by framework
export function getEthicsByFramework(state: CharacterEthicsEngineState, framework: EthicalFramework): CharacterEthics[] {
  return Array.from(state.ethics.values()).filter(e => e.framework === framework);
}

// Get ethics report
export function getEthicsReport(state: CharacterEthicsEngineState): {
  totalEthics: number;
  totalArcs: number;
  averageIntegrity: number;
  averageComplexity: number;
  ethicsMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEthics === 0) recommendations.push('No ethics — add character ethics');
  if (state.averageIntegrity < 0.5) recommendations.push('Low integrity — strengthen');
  if (state.ethicsMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEthics: state.totalEthics,
    totalArcs: state.totalArcs,
    averageIntegrity: Math.round(state.averageIntegrity * 100) / 100,
    averageComplexity: Math.round(state.averageComplexity * 100) / 100,
    ethicsMastery: Math.round(state.ethicsMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeEthics(state: CharacterEthicsEngineState): CharacterEthicsEngineState {
  const ethics = Array.from(state.ethics.values());
  const averageIntegrity = ethics.length === 0 ? 0.5
    : ethics.reduce((s, e) => s + e.integrity, 0) / ethics.length;
  const averageComplexity = ethics.length === 0 ? 0.5
    : ethics.reduce((s, e) => s + e.complexity, 0) / ethics.length;

  const arcs = Array.from(state.arcs.values());
  const arcEvolution = arcs.length === 0 ? 0.5
    : arcs.reduce((s, a) => s + a.evolution, 0) / arcs.length;

  const ethicsMastery = (averageIntegrity * 0.3 + averageComplexity * 0.4 + arcEvolution * 0.3);

  return { ...state, averageIntegrity, averageComplexity, arcEvolution, ethicsMastery };
}

// Reset
export function resetCharacterEthicsEngineState(): CharacterEthicsEngineState {
  return createCharacterEthicsEngineState();
}