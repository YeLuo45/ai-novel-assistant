/**
 * V942 NarrativeAbstractionEngine — Direction E Iter 4/15 (Round 4)
 * Narrative abstraction engine: abstraction levels + generalization
 * Sources: ruflo abstraction + nanobot + thunderbolt
 */

export type AbstractionLevel = 'concrete' | 'specific' | 'general' | 'abstract' | 'universal' | 'transcendent';
export type AbstractionProcess = 'lift' | 'generalize' | 'metaphorize' | 'symbolize' | 'universalize' | 'transcend';
export type AbstractionQuality = 'poor' | 'fair' | 'good' | 'excellent' | 'transcendent';

export interface AbstractElement {
  elementId: string;
  name: string;
  level: AbstractionLevel;
  process: AbstractionProcess;
  description: string;
  power: number;
  source: string;
  chapter: number;
}

export interface AbstractionChain {
  chainId: string;
  name: string;
  elementIds: string[];
  coherence: number;
  ascent: number;
}

export interface NarrativeAbstractionEngineState {
  elements: Map<string, AbstractElement>;
  chains: Map<string, AbstractionChain>;
  totalElements: number;
  totalChains: number;
  averagePower: number;
  levelDistribution: Map<AbstractionLevel, number>;
  abstractionMastery: number;
  abstractionDepth: number;
}

// Factory
export function createNarrativeAbstractionEngineState(): NarrativeAbstractionEngineState {
  return {
    elements: new Map(),
    chains: new Map(),
    totalElements: 0,
    totalChains: 0,
    averagePower: 0.5,
    levelDistribution: new Map(),
    abstractionMastery: 0.5,
    abstractionDepth: 0.5,
  };
}

// Add element
export function addAbstractElement(
  state: NarrativeAbstractionEngineState,
  elementId: string,
  name: string,
  level: AbstractionLevel,
  process: AbstractionProcess,
  description: string,
  source: string,
  power: number,
  chapter: number
): NarrativeAbstractionEngineState {
  const element: AbstractElement = { elementId, name, level, process, description, source, power, chapter };
  const elements = new Map(state.elements).set(elementId, element);
  const levelDistribution = new Map(state.levelDistribution);
  levelDistribution.set(level, (levelDistribution.get(level) || 0) + 1);
  return recomputeAbstraction({ ...state, elements, levelDistribution, totalElements: elements.size });
}

// Create chain
export function createAbstractionChain(
  state: NarrativeAbstractionEngineState,
  chainId: string,
  name: string,
  elementIds: string[]
): NarrativeAbstractionEngineState {
  const elements = elementIds.map(id => state.elements.get(id)).filter((e): e is AbstractElement => e !== undefined);
  const levelMap: Record<AbstractionLevel, number> = { concrete: 1, specific: 2, general: 3, abstract: 4, universal: 5, transcendent: 6 };
  const avgLevel = elements.length === 0 ? 0
    : elements.reduce((s, e) => s + levelMap[e.level], 0) / elements.length;
  const coherence = elements.length < 2 ? 1
    : Math.max(0, 1 - Math.abs(elements[0].power - elements[elements.length - 1].power));
  const chain: AbstractionChain = { chainId, name, elementIds, coherence, ascent: avgLevel };
  const chains = new Map(state.chains).set(chainId, chain);
  return recomputeAbstraction({ ...state, chains, totalChains: chains.size });
}

// Get elements by level
export function getElementsByLevel(state: NarrativeAbstractionEngineState, level: AbstractionLevel): AbstractElement[] {
  return Array.from(state.elements.values()).filter(e => e.level === level);
}

// Get abstraction report
export function getAbstractionReport(state: NarrativeAbstractionEngineState): {
  totalElements: number;
  totalChains: number;
  averagePower: number;
  abstractionDepth: number;
  abstractionMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalElements === 0) recommendations.push('No elements — add abstract elements');
  if (state.abstractionDepth < 0.3) recommendations.push('Low depth — deepen abstraction');
  if (state.abstractionMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalElements: state.totalElements,
    totalChains: state.totalChains,
    averagePower: Math.round(state.averagePower * 100) / 100,
    abstractionDepth: Math.round(state.abstractionDepth * 100) / 100,
    abstractionMastery: Math.round(state.abstractionMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAbstraction(state: NarrativeAbstractionEngineState): NarrativeAbstractionEngineState {
  const elements = Array.from(state.elements.values());
  const averagePower = elements.length === 0 ? 0.5
    : elements.reduce((s, e) => s + e.power, 0) / elements.length;

  const levelMap: Record<AbstractionLevel, number> = { concrete: 1, specific: 2, general: 3, abstract: 4, universal: 5, transcendent: 6 };
  const avgLevel = elements.length === 0 ? 0
    : elements.reduce((s, e) => s + levelMap[e.level], 0) / elements.length;
  const abstractionDepth = avgLevel / 6;

  const levelSet = new Set(elements.map(e => e.level));
  const levelCoverage = levelSet.size / 6;
  const abstractionMastery = (averagePower * 0.4 + abstractionDepth * 0.3 + levelCoverage * 0.3);

  return { ...state, averagePower, abstractionDepth, abstractionMastery };
}

// Reset abstraction state
export function resetNarrativeAbstractionEngineState(): NarrativeAbstractionEngineState {
  return createNarrativeAbstractionEngineState();
}